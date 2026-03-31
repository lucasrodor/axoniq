import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromBuffer } from '@/lib/processing/text-extractor'
import { createAdminClient } from '@/lib/supabase/server'
import { openai, OPENAI_MODEL } from '@/lib/ai/client'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const textData = formData.get('text') as string | null
    const titleData = formData.get('title') as string | null

    if (!file && !textData) {
      return NextResponse.json({ error: 'Nenhum arquivo ou texto fornecido.' }, { status: 400 })
    }

    // 1. Identify User (via Authorization header token)
    const supabaseAdmin = createAdminClient()
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // 2. Extract Text or Use Raw Text
    let safeText = ''
    let sourceFileName = 'Texto Colado.txt'
    let sourceFileType = 'text/plain'

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const text = await extractTextFromBuffer(buffer, file.type)
      safeText = String(text ?? '')
      sourceFileName = file.name
      sourceFileType = file.type
    } else if (textData && textData.trim().length > 0) {
      safeText = textData.trim()
      if (titleData && titleData.trim() !== '') {
        sourceFileName = `${titleData.trim()}.txt`
      }
    }

    if (!safeText || safeText.length < 50) {
      return NextResponse.json({ error: 'Conteúdo insuficiente para processar. Forneça pelo menos 50 caracteres.' }, { status: 400 })
    }

    // 3. Detect Specialty Tag via AI
    let specialtyTag = 'Outros'
    try {
      const tagCompletion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a content classifier for a medical study platform. Analyze the text and determine if it belongs to a medical specialty. 
            
If the content is medical, respond with EXACTLY ONE of these specialty names:
Anatomia, Fisiologia, Bioquímica, Farmacologia, Patologia, Microbiologia, Imunologia, Parasitologia, Histologia, Embriologia, Genética, Cardiologia, Neurologia, Pneumologia, Gastroenterologia, Nefrologia, Endocrinologia, Hematologia, Reumatologia, Infectologia, Dermatologia, Oftalmologia, Otorrinolaringologia, Urologia, Ortopedia, Ginecologia, Obstetrícia, Pediatria, Psiquiatria, Cirurgia Geral, Clínica Médica, Medicina de Emergência, Radiologia, Saúde Pública, Epidemiologia, Medicina Legal

If the content is NOT medical (e.g., engineering, law, programming, etc.), respond with exactly: Outros

Respond with ONLY the specialty name, nothing else.`
          },
          {
            role: 'user',
            content: `Classify this content:\n\n${safeText.substring(0, 3000)}`
          }
        ],
        max_tokens: 30,
        temperature: 0,
      })

      const detectedTag = tagCompletion.choices[0].message.content?.trim()
      if (detectedTag) {
        specialtyTag = detectedTag
      }
    } catch (tagError) {
      console.error('Tag detection error (non-fatal):', tagError)
      // Keep default 'Outros' if classification fails
    }

    // 4. Save Source to DB
    const title = sourceFileName.split('.').slice(0, -1).join('.') || sourceFileName

    const { data: source, error: sourceError } = await supabaseAdmin
      .from('sources')
      .insert({
        user_id: user.id,
        title,
        raw_content: safeText,
        file_name: sourceFileName,
        file_type: sourceFileType,
        specialty_tag: specialtyTag,
        status: 'extracted',
      })
      .select()
      .single()

    if (sourceError) {
      console.error('Source save error:', sourceError)
      return NextResponse.json({ error: 'Erro ao salvar fonte.' }, { status: 500 })
    }

    // 5. Also create document record for history (backwards compat)
    await supabaseAdmin
      .from('documents')
      .insert({
        user_id: user.id,
        name: sourceFileName,
        status: 'processing',
        num_flashcards: 0
      })

    return NextResponse.json({
      success: true,
      sourceId: source.id,
      title: source.title,
      specialtyTag,
      textLength: safeText.length,
      preview: safeText.length > 300 ? safeText.slice(0, 300) + '...' : safeText,
    })

  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
