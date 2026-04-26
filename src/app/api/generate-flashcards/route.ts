import { NextRequest, NextResponse } from 'next/server'
import { openai, OPENAI_MODEL } from '@/lib/ai/client'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { createAdminClient } from '@/lib/supabase/server'
import { cleanupSource } from '@/lib/processing/cleanup'
import { flashcardLimiter } from '@/lib/rate-limit'

// Define the output structure strictly
const FlashcardSchema = z.object({
  front: z.string().describe('The question or concept on the front of the card'),
  back: z.string().describe('The answer or explanation on the back of the card'),
  type: z.enum(['standard', 'cloze']).describe('Card type: standard for Q&A, cloze for fill-in-the-blank'),
})

const FlashcardListSchema = z.object({
  flashcards: z.array(FlashcardSchema),
})

export async function POST(req: NextRequest) {
  try {
    const { sourceId, quantity = 20, folderId, deckTitle, specialtyTag } = await req.json()

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

    // 1.1 Rate Limiting (P0.3)
    const { success } = await flashcardLimiter.limit(user.id)
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

    // Read source content from DB
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('sources')
      .select('raw_content, title, specialty_tag, image_urls')
      .eq('id', sourceId)
      .single()

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Fonte não encontrada' }, { status: 404 })
    }

    const text = source.raw_content
    const imageUrls = (source.image_urls as string[]) || []
    const clozeRatio = Math.round(quantity * 0.2) // ~20% cloze cards
    const standardCount = quantity - clozeRatio

    // Prepare message content (Text + Images)
    const userMessageContent: any[] = [
      {
        type: 'text',
        text: `Generate ${quantity} flashcards based strictly on the following text and images provided. If there are images, analyze them to extract relevant medical concepts, labels, or visual findings.
        
TEXT CONTENT:
${text.substring(0, 50000)}` // Limit text for safety
      }
    ]

    // Add images if present
    imageUrls.forEach(url => {
      userMessageContent.push({
        type: 'image_url',
        image_url: { url }
      })
    })

    let completion
    try {
      completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content creator specialized in medical education. Your task is to extract key concepts from the provided text and images and turn them into flashcards.
            
  STRICT RULES:
  1. Generate exactly ${quantity} flashcards (${standardCount} standard + ${clozeRatio} cloze).
  2. Generate flashcards ONLY based on the provided text and images.
  3. For "standard" cards: front = question, back = answer.
  4. For "cloze" cards: front = sentence with blanks using "___", back = complete sentence.
  5. Focus on identifying anatomical structures, clinical findings in images (if any), and core medical concepts.
  6. Language: Portuguese.
  7. Set the "type" field to "standard" or "cloze" accordingly.`
          },
          {
            role: 'user',
            content: userMessageContent
          }
        ],
        response_format: zodResponseFormat(FlashcardListSchema, 'flashcard_list'),
      })
    } catch (apiError: any) {
      console.warn('⚠️ OpenAI Image Error, retrying with text only:', apiError.message)
      
      // Fallback: Retry with text only if images fail
      if (apiError.message.includes('image') || apiError.message.includes('download') || apiError.message.includes('timeout')) {
        completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are an expert educational content creator specialized in medical education. Your task is to extract key concepts from the provided text and turn them into flashcards.`
            },
            {
              role: 'user',
              content: `Generate ${quantity} flashcards based strictly on the following text: \n\n ${text.substring(0, 50000)}`
            }
          ],
          response_format: zodResponseFormat(FlashcardListSchema, 'flashcard_list'),
        })
      } else {
        throw apiError // Re-throw if it's another type of error
      }
    }

    const content = completion.choices[0].message.content || ''
    let flashcards: { front: string; back: string; type: string }[] = []

    try {
      const parsed = JSON.parse(content)
      flashcards = parsed.flashcards || []
    } catch {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          flashcards = parsed.flashcards || []
        } catch { /* give up */ }
      }
    }

    // Create deck
    const finalTitle = deckTitle || source.title
    const { data: deck, error: deckError } = await supabaseAdmin
      .from('decks')
      .insert({
        user_id: user.id,
        title: finalTitle,
        description: `Gerado dia ${new Date().toLocaleDateString('pt-BR')}`,
        source_id: sourceId,
        specialty_tag: specialtyTag || source.specialty_tag || 'Outros',
        ...(folderId ? { folder_id: folderId } : {}),
      })
      .select()
      .single()

    if (deckError) {
      console.error('Deck creation error:', deckError)
      return NextResponse.json({ error: 'Erro ao criar deck' }, { status: 500 })
    }

    // Insert flashcards
    const cardsToInsert = flashcards.map(card => ({
      deck_id: deck.id,
      front: card.front,
      back: card.back,
      type: card.type || 'standard',
    }))

    const { error: cardsError } = await supabaseAdmin
      .from('flashcards')
      .insert(cardsToInsert)

    if (cardsError) {
      console.error('Cards insert error:', cardsError)
    }

    // Update document history
    await supabaseAdmin
      .from('documents')
      .update({ status: 'ready', num_flashcards: flashcards.length })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    // Finalize generation and cleanup ephemeral source
    await cleanupSource(sourceId)

    return NextResponse.json({
      success: true,
      deckId: deck.id,
      flashcardsCount: flashcards.length,
      model: OPENAI_MODEL,
    })

  } catch (error) {
    console.error('AI Generation error:', error)
    
    // Attempt refund if we have a user
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

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate flashcards' },
      { status: 500 }
    )
  }
}
