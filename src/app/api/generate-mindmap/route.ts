import { NextRequest, NextResponse } from 'next/server'
import { openai, MODEL_FAST } from '@/lib/ai/client'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { createAdminClient } from '@/lib/supabase/server'
import { cleanupSource } from '@/lib/processing/cleanup'
import { mindmapLimiter } from '@/lib/rate-limit'

// Define the schema for Mind Map data
const MindMapNodeSchema = z.object({
  id: z.string(),
  label: z.string().min(2).max(80, 'Labels muito longas comprometem a leitura visual'),
  type: z.enum(['root', 'branch', 'leaf']),
  parentId: z.string().nullable()
})

const MindMapSchema = z.object({
  title: z.string().min(3),
  nodes: z.array(MindMapNodeSchema)
    .min(8, 'Mapa muito raso — mínimo 8 nodes')
    .max(40, 'Mapa muito denso — máximo 40 nodes para manter legibilidade'),
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

    const systemPrompt = `Você é um especialista em educação médica e neurociência cognitiva, especializado em criar mapas mentais que aceleram a memorização e a conexão entre conceitos clínicos.

## OBJETIVO
Criar um mapa mental hierárquico estruturado em 3 níveis para um estudante de medicina brasileiro, baseado APENAS no conteúdo fornecido.

## ESTRUTURA OBRIGATÓRIA

### Nível 1 — ROOT (1 node)
- O conceito central do material (ex: "Insuficiência Cardíaca", "Diabetes Mellitus tipo 2", "Cetoacidose Diabética")
- Apenas 1 node do tipo "root", com parentId: null
- Label curta e direta (máximo 50 caracteres)

### Nível 2 — BRANCHES (4 a 7 nodes)
- Grandes categorias clínicas que fazem sentido para o tema
- Para doenças, sempre tente cobrir: Etiologia, Fisiopatologia, Quadro Clínico, Diagnóstico, Tratamento, Complicações (use apenas as relevantes ao material)
- Para fármacos: Mecanismo de Ação, Indicações, Posologia, Efeitos Adversos, Contraindicações
- Para procedimentos: Indicações, Técnica, Contraindicações, Complicações
- Cada branch tem parentId apontando para o root

### Nível 3 — LEAVES (2 a 6 por branch)
- Detalhes específicos, achados clínicos, valores de referência, drogas específicas, sinais semiológicos
- Cada leaf tem parentId apontando para uma branch
- Labels curtas e objetivas (máximo 80 caracteres)

## REGRAS DE QUALIDADE

1. **Hierarquia limpa**: nunca crie leaves apontando para outros leaves. Apenas root → branch → leaf.

2. **Conteúdo específico**: priorize informações memoráveis e clinicamente relevantes (ex: "Sinal de Kussmaul" ao invés de "Sinais respiratórios"; "Metformina 500mg 2x/dia" ao invés de "Tratamento medicamentoso").

3. **Sem redundância**: cada conceito aparece em apenas 1 node. Não duplique informações entre branches.

4. **Fidelidade ao material**: use APENAS o que está no texto/imagem fornecido. Não invente fatos clínicos.

5. **Português médico brasileiro**: termos clínicos em português (ex: "insuficiência cardíaca" e não "heart failure").

6. **Edges**: para cada relação parent-child, crie uma edge correspondente.

## EXEMPLO DE ESTRUTURA CORRETA

Para um material sobre Insuficiência Cardíaca:

ROOT: "Insuficiência Cardíaca"
├── BRANCH: "Etiologia"
│   ├── LEAF: "Doença coronariana (causa mais comum)"
│   ├── LEAF: "Hipertensão arterial sistêmica"
│   └── LEAF: "Cardiomiopatia dilatada"
├── BRANCH: "Fisiopatologia"
│   ├── LEAF: "Disfunção sistólica vs diastólica"
│   ├── LEAF: "Ativação neuro-hormonal (SRAA, SNS)"
│   └── LEAF: "Remodelamento ventricular"
├── BRANCH: "Quadro Clínico"
│   ├── LEAF: "Dispneia aos esforços / ortopneia"
│   ├── LEAF: "Edema de MMII"
│   └── LEAF: "Estertores crepitantes pulmonares"
├── BRANCH: "Diagnóstico"
│   ├── LEAF: "BNP/NT-proBNP elevado"
│   ├── LEAF: "ECO com FE < 40% (IC com FE reduzida)"
│   └── LEAF: "Critérios de Framingham"
└── BRANCH: "Tratamento"
    ├── LEAF: "iECA/BRA (primeira linha)"
    ├── LEAF: "Betabloqueadores (carvedilol, bisoprolol)"
    ├── LEAF: "iSGLT2 (dapagliflozina)"
    └── LEAF: "Diuréticos (sintomáticos)"

Total: 1 root + 5 branches + 14 leaves = 20 nodes

## NÃO FAÇA

❌ Mapas com menos de 8 nodes (raso demais)
❌ Mapas com mais de 40 nodes (poluído)
❌ Branches genéricas sem conteúdo específico nas leaves
❌ Inventar dados clínicos não presentes no material
❌ Misturar idiomas
❌ Hierarquia inconsistente (leaf apontando para leaf)`

    let completion
    try {
      completion = await openai.chat.completions.create({
        model: MODEL_FAST,
        temperature: 0.3,
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
          model: MODEL_FAST,
          temperature: 0.3,
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
      const jsonMatch = content.match(/\`\`\`json\\n([\\s\\S]*?)\\n\`\`\`/)
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

    // Verifica se todas as branches apontam para o root
    const rootId = roots[0].id
    const orphanBranches = branches.filter((b: any) => b.parentId !== rootId)
    if (orphanBranches.length > 0) {
      await supabaseAdmin.from('mind_maps').update({ status: 'error' }).eq('id', mindMap.id)
      throw new Error('Mapa com branches órfãs detectadas')
    }

    // Verifica se todas as leaves apontam para uma branch válida
    const branchIds = new Set(branches.map((b: any) => b.id))
    const orphanLeaves = leaves.filter((l: any) => !l.parentId || !branchIds.has(l.parentId))
    if (orphanLeaves.length > 0) {
      await supabaseAdmin.from('mind_maps').update({ status: 'error' }).eq('id', mindMap.id)
      throw new Error('Mapa com leaves órfãs detectadas')
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
