import { NextRequest, NextResponse } from 'next/server'
import { openai, OPENAI_MODEL } from '@/lib/ai/client'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { createAdminClient } from '@/lib/supabase/server'

// Define the schema for Mind Map data
// Using a flat array of nodes and edges is easier for ReactFlow
const MindMapNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['root', 'branch', 'leaf']),
  parentId: z.string().nullable() // To help with auto-layout if needed
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

    // Read source
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('sources')
      .select('raw_content, title, specialty_tag')
      .eq('id', sourceId)
      .single()

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Fonte não encontrada' }, { status: 404 })
    }

    // Create record with 'generating' status
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

    // AI Generation
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em educação médica e design instrucional.
Sua tarefa é criar um MAPA MENTAL estruturado para um estudante de medicina baseado no texto fornecido.

ESTRUTURA:
1. 'root': O tema central do texto (apenas 1).
2. 'branch': As grandes divisões ou tópicos principais (ex: Fisiopatologia, Diagnóstico, Tratamento).
3. 'leaf': Detalhes específicos, sinais clínicos, nomes de drogas, etc.

REGRAS:
- IDs devem ser curtos e únicos (ex: 'root', 'b1', 'l1').
- Crie conexões LÓGICAS entre parent e child nos 'edges'.
- Use Português do Brasil com terminologia médica correta.
- O mapa deve ser abrangente mas não poluído visualmente (aprox. 15-25 nós no total).`
        },
        {
          role: 'user',
          content: `Gere um mapa mental estratégico para o seguinte conteúdo:\n\n${source.raw_content.substring(0, 100000)}`
        }
      ],
      response_format: zodResponseFormat(MindMapSchema, 'mind_map'),
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('AI falhou em gerar mapa mental')
    
    const generatedData = JSON.parse(content)

    // Update record
    const { error: updateError } = await supabaseAdmin
      .from('mind_maps')
      .update({
        data_json: generatedData,
        status: 'ready'
      })
      .eq('id', mindMap.id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, mindMapId: mindMap.id })

  } catch (error: any) {
    console.error('Mind Map Generation Error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao gerar mapa mental' }, { status: 500 })
  }
}
