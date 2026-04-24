import { NextRequest, NextResponse } from 'next/server'
import { openai, OPENAI_MODEL } from '@/lib/ai/client'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { createAdminClient } from '@/lib/supabase/server'
import { reportLimiter } from '@/lib/rate-limit'

// Define the schema for AI analysis
const PerformanceAnalysisSchema = z.object({
  overall_performance: z.string().describe('A one-sentence expert summary of the overall performance level'),
  strengths: z.array(z.string()).describe('List of specialty areas or topics where the student is performing well'),
  weaknesses: z.array(z.string()).describe('List of specialty areas or topics where the student needs improvement'),
  tags_performance: z.array(z.object({
    tag: z.string(),
    score: z.number()
  })).describe('List of specialty tags and their average performance score (0-100)'),
  summary: z.string().describe('A motivating and professional summary in Portuguese (Markdown) analyzing errors and proposing a focus for study'),
  recommended_topics: z.array(z.string()).describe('Specific topics the user should review based on recent errors'),
  error_patterns: z.string().describe('Analysis of why the student is missing questions (e.g., misreading, lack of base knowledge)')
})

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient()
    
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })

    // 1.1 Rate Limiting (P0.3)
    const { success } = await reportLimiter.limit(user.id)
    if (!success) {
      return NextResponse.json({ 
        error: 'Limite de relatórios atingido (15/hora). Tente novamente em breve!' 
      }, { status: 429 })
    }

    // 1.2 Premium Gate (Monetization) — Reports are Premium only
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, is_whitelisted')
      .eq('id', user.id)
      .single()

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single()

    const isPremium = profile?.is_admin || profile?.is_whitelisted || 
                      subscription?.status === 'active' || subscription?.status === 'trialing'
    
    if (!isPremium) {
      return NextResponse.json({
        error: 'Relatórios de desempenho são exclusivos do plano Pro. Faça upgrade para acessar análises avançadas!',
        code: 'PREMIUM_REQUIRED',
      }, { status: 403 })
    }

    // 1. Fetch Quiz Attempts
    const { data: quizAttempts, error: quizError } = await supabaseAdmin
      .from('quiz_attempts')
      .select(`
        score,
        total_questions,
        completed_at,
        quizzes (
          title,
          specialty_tag
        )
      `)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(30)

    if (quizError) {
      console.error('Quiz Fetch Error:', quizError)
      throw new Error('Erro ao buscar dados de quiz')
    }

    // 2. Fetch Flashcard Review Stats (Aggregated by Tag)
    // We use !inner to ensure we're filtering flashcards that belong to the user's decks
    const { data: cardStats, error: cardError } = await supabaseAdmin
      .from('flashcards')
      .select(`
        ease_factor,
        interval,
        repetition,
        decks!inner (
          specialty_tag,
          user_id
        )
      `)
      .eq('decks.user_id', user.id)

    if (cardError) {
      console.error('Card Fetch Error:', cardError)
      // Don't throw if just cards are missing, but log it
    }

    // Prepare data for AI
    const quizData = quizAttempts?.map(a => ({
      quiz: (a.quizzes as any)?.title,
      tag: (a.quizzes as any)?.specialty_tag,
      score: `${a.score}/${a.total_questions}`,
      date: a.completed_at
    })) || []

    // Simple aggregation for cards
    const cardPerformance: Record<string, { total: number, good: number }> = {}
    cardStats?.forEach(c => {
      const tag = (c.decks as any)?.specialty_tag || 'Geral'
      if (!cardPerformance[tag]) cardPerformance[tag] = { total: 0, good: 0 }
      cardPerformance[tag].total++
      // Consider card "good" if repetition > 2 or interval > 3
      if (c.repetition > 2 || c.interval > 3) cardPerformance[tag].good++
    })

    const flashcardData = Object.entries(cardPerformance).map(([tag, stats]) => ({
      tag,
      mastery: `${Math.round((stats.good / stats.total) * 100)}%`,
      card_count: stats.total
    }))

    // 3. AI Analysis
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `Você é um mentor acadêmico de medicina especializado em análise de desempenho para provas de residência.
Sua tarefa é analisar o histórico de estudos do aluno e gerar um relatório motivador, profissional e profundamente analítico.

Analise os dados de Quizzes e Flashcards fornecidos.
Identifique padrões de erro por especialidade (Tags).
Crie um resumo em Markdown que destaque o progresso e aponte EXATAMENTE o que precisa de mais atenção.
Seja específico e use terminologia médica adequada em Português.`
        },
        {
          role: 'user',
          content: `Aqui estão os dados de desempenho (recentes):

DADOS DE QUIZ (Últimas 30 tentativas):
${JSON.stringify(quizData, null, 2)}

DOMÍNIO DE FLASHCARDS POR ÁREA:
${JSON.stringify(flashcardData, null, 2)}

Gere uma análise completa seguindo o formato JSON solicitado. Foque em fornecer conselhos práticos.`
        }
      ],
      response_format: zodResponseFormat(PerformanceAnalysisSchema, 'performance_analysis'),
    })

    const analysisContent = completion.choices[0].message.content
    if (!analysisContent) throw new Error('AI falhou em gerar conteúdo')
    
    const analysis = JSON.parse(analysisContent) as z.infer<typeof PerformanceAnalysisSchema>

    // 4. Save report to DB
    const { data: report, error: saveError } = await supabaseAdmin
      .from('performance_reports')
      .insert({
        user_id: user.id,
        title: `Análise de Desempenho - ${new Date().toLocaleDateString('pt-BR')}`,
        analysis_json: analysis,
        summary_markdown: analysis.summary
      })
      .select()
      .single()

    if (saveError) {
      console.error('Report Save Error:', saveError)
      throw new Error('Erro ao salvar o relatório no banco de dados')
    }

    return NextResponse.json({ success: true, reportId: report.id })

  } catch (error: any) {
    console.error('Report Generation Error Details:', error)
    return NextResponse.json({ 
      error: error.message || 'Erro interno ao gerar relatório',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 })
  }
}
