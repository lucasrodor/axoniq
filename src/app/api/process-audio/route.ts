import { NextRequest, NextResponse } from 'next/server'
import { openai, OPENAI_MODEL } from '@/lib/ai/client'
import { createAdminClient } from '@/lib/supabase/server'
import { Readable } from 'stream'

// OpenAI Whisper limit is 25MB. We use 24MB to be safe.
const MAX_FILE_SIZE = 24 * 1024 * 1024 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo de áudio fornecido.' }, { status: 400 })
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

    // 2. Transcription Process
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    let fullTranscription = ''
    
    // Chunking logic for large files (>24MB)
    if (buffer.length > MAX_FILE_SIZE) {
      const chunks: Buffer[] = []
      for (let i = 0; i < buffer.length; i += MAX_FILE_SIZE) {
        chunks.push(buffer.slice(i, i + MAX_FILE_SIZE))
      }

      console.log(`Audio file is large (${(buffer.length/1024/1024).toFixed(2)}MB). Splitting into ${chunks.length} chunks.`)

      for (let i = 0; i < chunks.length; i++) {
        // Limit to 6 chunks to avoid serverless timeout (approx 150MB)
        if (i >= 6) break; 
        
        const chunk = chunks[i];
        
        // Convert Buffer to File-like object for OpenAI
        const chunkFile = new File([chunk as any], `chunk_${i}.mp3`, { type: file.type })
        
        const transcription = await openai.audio.transcriptions.create({
          file: chunkFile,
          model: 'whisper-1',
          language: 'pt', // Force Portuguese for medical precision
        })
        
        fullTranscription += transcription.text + ' '
      }
    } else {
      // Single file transcription
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'pt',
      })
      fullTranscription = transcription.text
    }

    if (!fullTranscription || fullTranscription.length < 50) {
      return NextResponse.json({ error: 'Transcrição muito curta ou vazia.' }, { status: 400 })
    }

    // 3. Detect Specialty Tag (Reusing specialty detection logic)
    let specialtyTag = 'Outros'
    try {
      const tagCompletion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a medical content classifier. Determine the specialty based on this lecture transcript.
Respond with ONLY the name (e.g. Cardiologia, Anatomia, Outros).`
          },
          {
            role: 'user',
            content: fullTranscription.substring(0, 3000)
          }
        ],
        max_tokens: 20
      })
      specialtyTag = tagCompletion.choices[0].message.content?.trim() || 'Outros'
    } catch (e) {
      console.error('Tag detection error:', e)
    }

    // 4. Save Source to DB
    const title = file.name.split('.').slice(0, -1).join('.') || 'Aula Transcrevida'
    
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('sources')
      .insert({
        user_id: user.id,
        title,
        raw_content: fullTranscription,
        file_name: file.name,
        file_type: 'audio/transcript',
        specialty_tag: specialtyTag,
        status: 'extracted',
      })
      .select()
      .single()

    if (sourceError) {
      throw new Error('Erro ao salvar transcrição: ' + sourceError.message)
    }

    // 5. Create document record for backwards compatibility
    await supabaseAdmin
      .from('documents')
      .insert({
        user_id: user.id,
        name: title,
        status: 'processing',
        num_flashcards: 0
      })

    return NextResponse.json({
      success: true,
      sourceId: source.id,
      title: source.title,
      specialtyTag,
      preview: fullTranscription.substring(0, 300) + '...'
    })

  } catch (error) {
    console.error('Audio processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro no processamento do áudio' },
      { status: 500 }
    )
  }
}
