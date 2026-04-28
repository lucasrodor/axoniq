import { NextRequest, NextResponse } from 'next/server'
import { openai, MODEL_SMART } from '@/lib/ai/client'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { createAdminClient } from '@/lib/supabase/server'
import { cleanupSource } from '@/lib/processing/cleanup'
import { mindmapLimiter } from '@/lib/rate-limit'

// Define the schema for Mind Map data
const MindMapNodeSchema = z.object({
  id: z.string(),
  label: z.string().min(2).max(150, 'Labels muito longas comprometem a leitura visual'),
  type: z.enum(['root', 'branch', 'leaf']),
  parentId: z.string().nullable()
})

const MindMapSchema = z.object({
  title: z.string().min(3),
  nodes: z.array(MindMapNodeSchema)
    .min(8, 'Mapa muito raso — mínimo 8 nodes')
    .max(150, 'Mapa muito denso — máximo 150 nodes para manter a profundidade sem perder a estrutura'),
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

    const systemPrompt = `## OBJETIVO
Criar um mapa mental hierárquico profundo e estratégico para um estudante de medicina brasileiro, baseado integralmente no conteúdo fornecido. Priorize a densidade de informações e a organização em múltiplos níveis.

## ESTRUTURA HIERÁRQUICA (MÚLTIPLOS NÍVEIS)
Sua estrutura DEVE se aprofundar organicamente. Não jogue toda a informação no mesmo nível final. Se um tópico tiver mais de 4 ou 5 detalhes, crie uma subcategoria!

### Nível 1 — ROOT (1 node)
- O conceito central do material.
- Label curta e direta (máximo 50 caracteres).

### Níveis Intermediários — BRANCHES
- Você pode (e deve) criar múltiplas camadas de 'branches' (ex: root -> branch -> branch -> branch).
- Desça até 4, 5 ou 6 níveis de profundidade se o conteúdo exigir, para que uma informação leve logicamente à outra.
- Use 'branches' para categorizar antes de listar detalhes. (Ex: em vez de listar 10 sintomas soltos na "Laringe", crie Laringe -> "Sintomas Iniciais" -> ... e Laringe -> "Sintomas Tardios" -> ...).

### Nível Final — LEAVES
- Detalhes específicos finais, valores de referência, doses, sinais semiológicos curtos.
- As leaves representam a ponta final da árvore de conhecimento.

## REGRAS DE OURO (QUALIDADE MÁXIMA)
1. **Poder de Síntese**: O texto de cada nó (label) DEVE ser resumido! Use no máximo de 5 a 10 palavras por nó. JAMAIS copie frases inteiras do texto. Use palavras-chave, setas (->) e abreviações médicas comuns.
2. **Profundidade em Cascata**: A informação deve fluir de forma organizada. Use branches filhas de branches para manter o mapa limpo e escalável.
3. **Hierarquia Lógica**: Root → Branch → Branch (opcional) → Leaf.
4. **Conteúdo Específico**: Evite termos genéricos. Use termos técnicos e dados precisos (ex: "Sinal de Murphy" vs "Dor abdominal").
5. **Fidelidade Multimodal**: Analise tanto o texto quanto os detalhes das imagens/tabelas fornecidas.
6. **Linguagem**: Português médico brasileiro técnico.

## NÃO FAÇA
❌ Escrever parágrafos ou frases muito longas em um único nó (máximo estrito de ~100 caracteres por nó).
❌ Mapas rasos limitados a apenas 2 ou 3 níveis de profundidade.
❌ Agrupar 10 'leaves' no mesmo 'branch' pai sem criar subcategorias.
❌ Omitir detalhes clínicos relevantes do material original.`

    let completion
    try {
      completion = await openai.chat.completions.create({
        model: MODEL_SMART,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessageContent }
        ],
        response_format: zodResponseFormat(MindMapSchema, 'mind_map'),
      })
    } catch (apiError: any) {
      console.warn('⚠️ OpenAI Mindmap Image Error, retrying with text only:', apiError.message)
      
      if (apiError.message.includes('image') || apiError.message.includes('download') || apiError.message.includes('timeout')) {
        completion = await openai.chat.completions.create({
          model: MODEL_SMART,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Crie o mapa mental baseado apenas no texto a seguir:\n\n${text.substring(0, 50000)}` }
          ],
          response_format: zodResponseFormat(MindMapSchema, 'mind_map'),
        })
      } else {
        throw apiError
      }
    }

    const content = completion.choices[0].message.content
    if (!content) throw new Error('AI falhou em gerar mapa mental')
    
    let generatedData;
    try {
      generatedData = JSON.parse(content)
    } catch {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        try {
          generatedData = JSON.parse(jsonMatch[1])
        } catch { 
          await supabaseAdmin.from('mind_maps').update({ status: 'error' }).eq('id', mindMap.id)
          throw new Error('Falha ao processar mapa mental gerado pela IA') 
        }
      } else {
        await supabaseAdmin.from('mind_maps').update({ status: 'error' }).eq('id', mindMap.id)
        throw new Error('Falha ao processar mapa mental gerado pela IA')
      }
    }

    // Validações estruturais
    const roots = generatedData.nodes.filter((n: any) => n.type === 'root')
    const branches = generatedData.nodes.filter((n: any) => n.type === 'branch')
    const leaves = generatedData.nodes.filter((n: any) => n.type === 'leaf')

    if (roots.length !== 1) {
      await supabaseAdmin.from('mind_maps').update({ status: 'error' }).eq('id', mindMap.id)
      throw new Error('Mapa mental inválido: deve ter exatamente 1 root')
    }

    if (branches.length < 3) {
      await supabaseAdmin.from('mind_maps').update({ status: 'error' }).eq('id', mindMap.id)
      throw new Error('Mapa mental muito raso: precisa de pelo menos 3 branches')
    }

    // Verifica se todos os nós (exceto o root) têm um parentId válido que existe no mapa
    const allNodeIds = new Set(generatedData.nodes.map((n: any) => n.id))
    const orphanNodes = generatedData.nodes.filter((n: any) => n.type !== 'root' && (!n.parentId || !allNodeIds.has(n.parentId)))
    
    if (orphanNodes.length > 0) {
      await supabaseAdmin.from('mind_maps').update({ status: 'error' }).eq('id', mindMap.id)
      throw new Error('Mapa com nós órfãos detectados')
    }

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
    
    // Refund credit (igual ao quiz faz)
    try {
      const supabaseAdmin = createAdminClient()
      const token = req.headers.get('Authorization')?.replace('Bearer ', '')
      if (token) {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)
        if (user) {
          const { refundCredit } = await import('@/lib/credits')
          await refundCredit(user.id)
        }
      }
    } catch (refundErr) {
      console.error('Failed to refund credit:', refundErr)
    }
    
    return NextResponse.json({ error: error.message || 'Erro ao gerar mapa mental' }, { status: 500 })
  }
}
