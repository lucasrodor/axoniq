import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromBuffer } from '@/lib/processing/text-extractor'
import { createAdminClient } from '@/lib/supabase/server'
import { openai, OPENAI_MODEL } from '@/lib/ai/client'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const textData = formData.get('text') as string | null
    const titleData = formData.get('title') as string | null

    if (files.length === 0 && !textData) {
      return NextResponse.json({ error: 'Nenhum arquivo ou texto fornecido.' }, { status: 400 })
    }

    // 1. Identify User
    const supabaseAdmin = createAdminClient()
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // 2. Process Files (Loop)
    let combinedText = ''
    const imageUrls: string[] = []
    const processedMetadata: any[] = []
    let primaryFileName = titleData || 'Coleção de Materiais'

    // Handle uploaded files
    for (const file of files) {
      if (file.size === 0) continue

      const isImage = file.type.startsWith('image/')
      
      if (isImage) {
        // Upload image to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const { data, error: uploadError } = await supabaseAdmin
          .storage
          .from('sources')
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false
          })

        if (uploadError) {
          console.error(`Upload error for ${file.name}:`, uploadError)
          continue
        }

        // Generate Public URL
        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('sources')
          .getPublicUrl(fileName)

        imageUrls.push(publicUrl)
        processedMetadata.push({
          name: file.name,
          type: file.type,
          size: file.size,
          url: publicUrl,
          category: 'image'
        })
      } else {
        // Extract text from document
        try {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const text = await extractTextFromBuffer(buffer, file.type)
          const extractedText = String(text ?? '')
          
          combinedText += `\n\n--- INÍCIO DO ARQUIVO: ${file.name} ---\n${extractedText}\n--- FIM DO ARQUIVO: ${file.name} ---\n`
          
          processedMetadata.push({
            name: file.name,
            type: file.type,
            size: file.size,
            category: 'document',
            textLength: extractedText.length
          })

          if (primaryFileName === 'Coleção de Materiais' || primaryFileName === 'Texto Colado') {
            primaryFileName = file.name
          }
        } catch (err) {
          console.error(`Extraction error for ${file.name}:`, err)
        }
      }
    }

    // Handle raw text input if provided
    if (textData && textData.trim().length > 0) {
      combinedText += `\n\n--- TEXTO COLADO ---\n${textData.trim()}\n`
      processedMetadata.push({
        name: titleData || 'Texto Colado',
        type: 'text/plain',
        size: textData.length,
        category: 'raw_text'
      })
    }

    const safeText = combinedText.trim()

    // Validate that we have SOMETHING
    if (!safeText && imageUrls.length === 0) {
      return NextResponse.json({ error: 'Nenhum conteúdo válido extraído dos arquivos.' }, { status: 400 })
    }

    // 3. Detect Specialty Tag via AI (using a sample of combined text)
    let specialtyTag = 'Outros'
    if (safeText) {
      try {
        const tagCompletion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a content classifier for a medical study platform. Analyze the text and determine if it belongs to a medical specialty. 
Respond with EXACTLY ONE of the specialized medical specialty names or 'Outros'.`
            },
            {
              role: 'user',
              content: `Classify this content:\n\n${safeText.substring(0, 3000)}`
            }
          ],
          max_tokens: 30,
          temperature: 0,
        })
        specialtyTag = tagCompletion.choices[0].message.content?.trim() || 'Outros'
      } catch (tagError) {
        console.error('Tag detection error:', tagError)
      }
    }

    // 4. Save Source to DB
    const finalTitle = (primaryFileName.includes('.') ? primaryFileName.split('.').slice(0, -1).join('.') : primaryFileName) || 'Novo Material'

    const { data: source, error: sourceError } = await supabaseAdmin
      .from('sources')
      .insert({
        user_id: user.id,
        title: files.length > 1 ? `${finalTitle} (+${files.length - 1} itens)` : finalTitle,
        raw_content: safeText,
        file_name: files.length === 1 ? files[0].name : 'Múltiplos Arquivos',
        file_type: files.length === 1 ? files[0].type : 'mixed/collection',
        specialty_tag: specialtyTag,
        status: 'extracted',
        metadata: processedMetadata,
        image_urls: imageUrls
      })
      .select()
      .single()

    if (sourceError) {
      console.error('Source save error:', sourceError)
      return NextResponse.json({ error: 'Erro ao salvar fonte no banco de dados.' }, { status: 500 })
    }

    // 5. Backwards compat record for history
    await supabaseAdmin
      .from('documents')
      .insert({
        user_id: user.id,
        name: source.title,
        status: 'processing',
        num_flashcards: 0
      })

    return NextResponse.json({
      success: true,
      sourceId: source.id,
      title: source.title,
      specialtyTag,
      textLength: safeText.length,
      imageCount: imageUrls.length,
      preview: safeText.length > 300 ? safeText.slice(0, 300) + '...' : safeText,
    })

  } catch (error) {
    console.error('API Processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno no processamento' },
      { status: 500 }
    )
  }
}
