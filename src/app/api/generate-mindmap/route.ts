import { NextRequest, NextResponse } from 'next/server'
import { openai, OPENAI_MODEL } from '@/lib/ai/client'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { createAdminClient } from '@/lib/supabase/server'
import { cleanupSource } from '@/lib/processing/cleanup'
import { mindmapLimiter } from '@/lib/rate-limit'

// Define the schema for Mind Map data
const MindMapNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['root', 'branch', 'leaf']),
  parentId: z.string().nullable()
})

const MindMapSchema = z.object({
  title: z.string(),
  nodes: z.array(MindMapNodeSchema),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string()
  }))
})

export async function POST(req: NextRequest) {
  try {
    const { sourceId, folderId, mapTitle, specialtyTag } = await req.json()

    if (!sourceId) {
      return NextResponse.json({ error: 'No sourceId provided' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // 1.1 Rate Limiting (P0.3)
    const { success } = await mindmapLimiter.limit(user.id)
    if (!success) {
      return NextResponse.json({ 
        error: 'Limite de gerações atingido (15/hora). Nosso cérebro digital também precisa de um descanso! Tente novamente em alguns minutos.' 
      }, { status: 429 })
    }

    // 1.2 Credit Check (Monetization)
    const { consumeCredit } = await import('@/lib/credits')
    const creditResult = await consumeCredit(user.id)
    if (!creditResult.allowed) {
      return NextResponse.json({
        error: 'Seus créditos gratuitos acabaram este mês. Faça upgrade para o plano Pro para gerações ilimitadas!',
        code: 'CREDITS_EXHAUSTED',
        remaining: 0,
      }, { status: 403 })
    }

    // 1. Read source (including multimodal URLs)
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('sources')
      .select('raw_content, title, specialty_tag, image_urls')
      .eq('id', sourceId)
      .single()

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Fonte não encontrada' }, { status: 404 })
    }

    // 2. Create record with 'generating' status
    const { data: mindMap, error: mmError } = await supabaseAdmin
      .from('mind_maps')
      .insert({
        user_id: user.id,
        source_id: sourceId,
        folder_id: folderId || null,
        title: mapTitle || `Mapa Mental: ${source.title}`,
        specialty_tag: specialtyTag || source.specialty_tag || 'Geral',
        status: 'generating'
      })
      .select()
      .single()

    if (mmError) throw mmError

    // 3. AI Generation (Multimodal Vision)
    const text = source.raw_content
    const imageUrls = (source.image_urls as string[]) || []

    const userMessageContent: any[] = [
      {
        type: 'text',
        text: `Crie um mapa mental estratégico baseado no texto e nas imagens fornecidas. Capture a hierarquia correta (root -> branch -> leaf).
        
CONTEÚDO TEXTUAL:
${text.substring(0, 50000)}`
      }
    ]

    imageUrls.forEach(url => {
      userMessageContent.push({
        type: 'image_url',
        image_url: { url }
      })
    })

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em educação médica e design instrucional. Sua tarefa é criar um MAPA MENTAL estruturado para um estudante de medicina baseado no texto e imagens fornecidas. Português do Brasil.`
        },
        {
          role: 'user',
          content: userMessageContent
        }
      ],
      response_format: zodResponseFormat(MindMapSchema, 'mind_map'),
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('AI falhou em gerar mapa mental')
    
    const generatedData = JSON.parse(content)

    // 4. Update record to ready
    const { error: updateError } = await supabaseAdmin
      .from('mind_maps')
      .update({
        data_json: generatedData,
        status: 'ready'
      })
      .eq('id', mindMap.id)

    if (updateError) throw updateError

    // 5. Cleanup ephemeral source
    await cleanupSource(sourceId)

    return NextResponse.json({ success: true, mindMapId: mindMap.id })

  } catch (error: any) {
    console.error('Mind Map Generation Error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao gerar mapa mental' }, { status: 500 })
  }
}
