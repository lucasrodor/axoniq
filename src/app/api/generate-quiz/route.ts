import { NextRequest, NextResponse } from 'next/server'
import { openai, OPENAI_MODEL } from '@/lib/ai/client'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { createAdminClient } from '@/lib/supabase/server'
import { cleanupSource } from '@/lib/processing/cleanup'

// Define quiz question structure
const QuizQuestionSchema = z.object({
  question: z.string().describe('The question text. For cloze type, use ___ for blanks.'),
  type: z.enum(['multiple_choice', 'cloze', 'true_false']).describe('Question type'),
  options: z.array(z.string()).describe('Answer options (5 for multiple_choice, 2 for true_false, 4-5 for cloze)'),
  correct_answer: z.number().describe('Zero-based index of the correct option in the options array'),
  explanation: z.string().describe('Explanation of why the correct answer is right and others are wrong'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('Difficulty level'),
})

const QuizListSchema = z.object({
  questions: z.array(QuizQuestionSchema),
})

export async function POST(req: NextRequest) {
  try {
    const { sourceId, quantity = 20, folderId, quizTitle, specialtyTag } = await req.json()

    if (!sourceId) {
      return NextResponse.json({ error: 'No sourceId provided' }, { status: 400 })
    }

    // Identify User (via Authorization header token)
    const supabaseAdmin = createAdminClient()
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Read source content from DB
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('sources')
      .select('raw_content, title, specialty_tag, image_urls')
      .eq('id', sourceId)
      .single()

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Fonte não encontrada' }, { status: 404 })
    }

    // Create quiz record first (with 'generating' status)
    const finalTitle = quizTitle || source.title
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        user_id: user.id,
        source_id: sourceId,
        title: finalTitle,
        specialty_tag: specialtyTag || source.specialty_tag || 'Outros',
        status: 'generating',
        ...(folderId ? { folder_id: folderId } : {}),
      })
      .select()
      .single()

    if (quizError || !quiz) {
      console.error('Quiz creation error:', quizError)
      return NextResponse.json({ error: 'Erro ao criar quiz' }, { status: 500 })
    }

    // Calculate question distribution
    const multipleChoiceCount = Math.round(quantity * 0.7)
    const clozeCount = Math.round(quantity * 0.2)
    const trueFalseCount = quantity - multipleChoiceCount - clozeCount

    const text = source.raw_content
    const imageUrls = (source.image_urls as string[]) || []

    // Prepare message content (Text + Images)
    const userMessageContent: any[] = [
      {
        type: 'text',
        text: `Generate ${quantity} quiz questions based on the following text and images. Analyze identifying features in images and text to create high-quality residency-style questions.
        
TEXT CONTENT:
${text.substring(0, 50000)}`
      }
    ]

    // Add images if present
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
          content: `You are an expert medical exam question creator, specialized in creating questions similar to Brazilian medical residency exams (provas de residência médica).
 
Your task is to generate ${quantity} quiz questions based on the provided text and images.
 
STRICT RULES:
1. Generate questions ONLY based on the provided text and images.
2. For multiple_choice: 5 options (A-E). EXACTLY ONE correct answer.
3. For cloze: Use ___ in the question. 4-5 options.
4. For true_false: Options are ["Verdadeiro", "Falso"].
5. Language: Portuguese.
6. Provide detailed explanations justifying the correct answer based on the visual or textual evidence.`
        },
        {
          role: 'user',
          content: userMessageContent
        }
      ],
      response_format: zodResponseFormat(QuizListSchema, 'quiz_list'),
    })

    const content = completion.choices[0].message.content || ''
    let questions: z.infer<typeof QuizQuestionSchema>[] = []

    try {
      const parsed = JSON.parse(content)
      questions = parsed.questions || []
    } catch {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          questions = parsed.questions || []
        } catch { /* give up */ }
      }
    }

    if (questions.length === 0) {
      // Mark quiz as error
      await supabaseAdmin
        .from('quizzes')
        .update({ status: 'error' })
        .eq('id', quiz.id)

      return NextResponse.json({ error: 'Não foi possível gerar questões' }, { status: 500 })
    }

    // Insert questions
    const questionsToInsert = questions.map(q => ({
      quiz_id: quiz.id,
      question: q.question,
      type: q.type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
    }))

    const { error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .insert(questionsToInsert)

    if (questionsError) {
      console.error('Questions insert error:', questionsError)
      await supabaseAdmin
        .from('quizzes')
        .update({ status: 'error' })
        .eq('id', quiz.id)
      return NextResponse.json({ error: 'Erro ao salvar questões' }, { status: 500 })
    }

    // Update quiz status to ready
    await supabaseAdmin
      .from('quizzes')
      .update({ status: 'ready' })
      .eq('id', quiz.id)

    // Finalize generation and cleanup ephemeral source
    await cleanupSource(sourceId)

    return NextResponse.json({
      success: true,
      quizId: quiz.id,
      questionsCount: questions.length,
      model: OPENAI_MODEL,
    })

  } catch (error) {
    console.error('Quiz Generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}
