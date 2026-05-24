import { supabase } from '@/lib/supabase/client'
import { subDays, format, isSameDay } from 'date-fns'
import { getCardStage } from '@/lib/study/spaced-repetition'

export interface RetentionStats {
  globalRetention: number // 0-100
  totalCards: number
  totalReviews: number
  masteryBySpecialty: {
    specialty: string;
    score: number; // Flashcard weighted score
    quizScore: number | null; // Quiz average (0-100) or null
    totalQuestions: number;
    count: number;
    stages: {
      new: number;
      learning: number;
      review: number;
      mastered: number;
    };
  }[]
  futureWorkload: { day: string; count: number }[]
  heatmapData: { date: string; count: number }[]
  dailyActivity: {
    cards: { date: string; total: number; again: number; hard: number; good: number; easy: number }[]
    quizzes: { date: string; totalQuestions: number; correctQuestions: number }[]
  }
}

/**
 * Service to aggregate medical retention statistics
 */
export async function getRetentionStats(userId: string): Promise<RetentionStats> {
  // 1. Fetch all flashcards for user with their specialty (via Deck)
  const { data: flashcards, error: flashcardsError } = await supabase
    .from('flashcards')
    .select(`
      id,
      repetition,
      interval,
      due_date,
      ease_factor,
      deck:decks!inner (
        user_id,
        specialty_tag
      )
    `)
    .eq('decks.user_id', userId)

  if (flashcardsError) throw flashcardsError

  // 2. Fetch Quiz Attempts (for application mastery)
  const { data: quizAttempts, error: quizError } = await supabase
    .from('quiz_attempts')
    .select(`
      score,
      total_questions,
      completed_at,
      quizzes (
        specialty_tag
      )
    `)
    .eq('user_id', userId)

  if (quizError) throw quizError

  // 3. Fetch study history for the heatmap (last 90 days)
  const ninetyDaysAgo = subDays(new Date(), 90).toISOString()
  const { data: reviews, error: reviewsError } = await supabase
    .from('flashcard_reviews')
    .select('created_at, quality')
    .eq('user_id', userId)
    .gte('created_at', ninetyDaysAgo)

  if (reviewsError) throw reviewsError

  // --- PROCESSING LOGIC ---

  // Global Score: Weighted by stage (New=0, Learning=0.25, Review=0.5, Mastered=1.0)
  let totalGlobalWeight = 0
  let earnedGlobalWeight = 0

  // Specialty Mastery aggregation
  const specialtyMap: Record<string, {
    totalCards: number;
    earnedWeight: number;
    count: number;
    stages: {
      new: number;
      learning: number;
      review: number;
      mastered: number;
    };
    quizPoints: number;
    quizTotal: number;
    quizCount: number;
  }> = {}

  flashcards?.forEach(card => {
    const stage = getCardStage(card as unknown as Parameters<typeof getCardStage>[0])

    let weight = 0
    if (stage === 'learning') weight = 0.25
    else if (stage === 'review') weight = 0.50
    else if (stage === 'mastered') weight = 1.0

    totalGlobalWeight += 1 // Max possible weight is 1.0 per card
    earnedGlobalWeight += weight

    const specialty = (card.deck as unknown as { specialty_tag: string | null })?.specialty_tag || 'Outros'
    if (!specialtyMap[specialty]) {
      specialtyMap[specialty] = {
        totalCards: 0,
        earnedWeight: 0,
        count: 0,
        stages: { new: 0, learning: 0, review: 0, mastered: 0 },
        quizPoints: 0,
        quizTotal: 0,
        quizCount: 0
      }
    }
    specialtyMap[specialty].totalCards++
    specialtyMap[specialty].count++
    specialtyMap[specialty].stages[stage]++
    specialtyMap[specialty].earnedWeight += weight
  })

  // Process Quiz Attempts into specialties
  quizAttempts?.forEach(attempt => {
    const specialty = (attempt.quizzes as unknown as { specialty_tag: string | null })?.specialty_tag || 'Outros'
    if (!specialtyMap[specialty]) {
      specialtyMap[specialty] = {
        totalCards: 0,
        earnedWeight: 0,
        count: 0,
        stages: { new: 0, learning: 0, review: 0, mastered: 0 },
        quizPoints: 0,
        quizTotal: 0,
        quizCount: 0
      }
    }
    specialtyMap[specialty].quizPoints += attempt.score || 0
    specialtyMap[specialty].quizTotal += attempt.total_questions || 0
    specialtyMap[specialty].quizCount++
  })

  const globalRetention = totalGlobalWeight > 0
    ? Math.round((earnedGlobalWeight / totalGlobalWeight) * 100)
    : 0

  const masteryBySpecialty = Object.entries(specialtyMap).map(([specialty, stats]) => ({
    specialty,
    count: stats.count,
    score: stats.totalCards > 0 ? Math.round((stats.earnedWeight / stats.totalCards) * 100) : 0,
    quizScore: stats.quizTotal > 0 ? Math.round((stats.quizPoints / stats.quizTotal) * 100) : null,
    totalQuestions: stats.quizTotal,
    stages: stats.stages
  })).sort((a, b) => {
    // Sort by a composite score for the ranking
    const scoreA = a.quizScore !== null ? (a.score + a.quizScore) / 2 : a.score
    const scoreB = b.quizScore !== null ? (b.score + b.quizScore) / 2 : b.score
    return scoreB - scoreA
  })

  // Future Workload (Next 7 days)
  const now = new Date()
  const workloadDays: { day: string; count: number }[] = []
  for (let i = 0; i < 7; i++) {
    const day = subDays(now, -i)
    let count = 0
    if (i === 0) {
      // "Hoje" deve incluir os cards que vencem hoje e TODOS os atrasados (passado)
      const endOfToday = new Date()
      endOfToday.setHours(23, 59, 59, 999)
      count = flashcards?.filter(c => new Date(c.due_date) <= endOfToday).length || 0
    } else {
      // Dias futuros devem contar exatamente os cards daquele dia
      count = flashcards?.filter(c => isSameDay(new Date(c.due_date), day)).length || 0
    }

    workloadDays.push({
      day: i === 0 ? 'Hoje' : format(day, 'dd/MM'),
      count
    })
  }

  // Heatmap Data (Usage intensity)
  const heatmapMap: Record<string, number> = {}
  reviews?.forEach(review => {
    const rDate = format(new Date(review.created_at), 'yyyy-MM-dd')
    heatmapMap[rDate] = (heatmapMap[rDate] || 0) + 1
  })

  const heatmapData = Object.entries(heatmapMap).map(([date, count]) => ({
    date,
    count
  }))

  // Generate daily activity for the last 30 days
  const dailyActivityCards: Record<string, { total: number; again: number; hard: number; good: number; easy: number }> = {}
  const dailyActivityQuizzes: Record<string, { totalQuestions: number; correctQuestions: number }> = {}

  // Initialize the last 30 days with 0s
  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i)
    const dStr = format(d, 'yyyy-MM-dd')
    dailyActivityCards[dStr] = { total: 0, again: 0, hard: 0, good: 0, easy: 0 }
    dailyActivityQuizzes[dStr] = { totalQuestions: 0, correctQuestions: 0 }
  }

  // Populate cards activity
  reviews?.forEach(review => {
    const rDate = format(new Date(review.created_at), 'yyyy-MM-dd')
    if (dailyActivityCards[rDate]) {
      dailyActivityCards[rDate].total++
      const q = review.quality
      if (q === 1) dailyActivityCards[rDate].again++
      else if (q === 3) dailyActivityCards[rDate].hard++
      else if (q === 4) dailyActivityCards[rDate].good++
      else if (q === 5) dailyActivityCards[rDate].easy++
    }
  })

  // Populate quizzes activity
  quizAttempts?.forEach(attempt => {
    if (!attempt.completed_at) return
    const qDate = format(new Date(attempt.completed_at), 'yyyy-MM-dd')
    if (dailyActivityQuizzes[qDate]) {
      dailyActivityQuizzes[qDate].totalQuestions += attempt.total_questions || 0
      dailyActivityQuizzes[qDate].correctQuestions += attempt.score || 0
    }
  })

  const dailyActivity = {
    cards: Object.entries(dailyActivityCards).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date)),
    quizzes: Object.entries(dailyActivityQuizzes).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date))
  }



  return {
    globalRetention,
    totalCards: flashcards?.length || 0,
    totalReviews: reviews?.length || 0,
    masteryBySpecialty,
    futureWorkload: workloadDays,
    heatmapData,
    dailyActivity
  }
}
