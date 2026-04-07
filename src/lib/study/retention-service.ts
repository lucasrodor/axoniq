import { supabase } from '@/lib/supabase/client'
import { startOfDay, subDays, format, isSameDay } from 'date-fns'

export interface RetentionStats {
  globalRetention: number // 0-100
  totalCards: number
  totalReviews: number
  masteryBySpecialty: { specialty: string; score: number; count: number }[]
  futureWorkload: { day: string; count: number }[]
  heatmapData: { date: string; count: number }[]
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
      deck:decks!inner (
        user_id,
        specialty_tag
      )
    `)
    .eq('decks.user_id', userId)

  if (flashcardsError) throw flashcardsError

  // 2. Fetch study history for the heatmap (last 90 days)
  const ninetyDaysAgo = subDays(new Date(), 90).toISOString()
  const { data: reviews, error: reviewsError } = await supabase
    .from('flashcard_reviews')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', ninetyDaysAgo)

  if (reviewsError) throw reviewsError

  // --- PROCESSING LOGIC ---

  // Global Retention: % of cards where interval > 0 and not overdue
  const now = new Date()
  const retainedCards = flashcards?.filter(c => 
    c.repetition > 0 && new Date(c.due_date) > now
  ).length || 0
  const globalRetention = flashcards?.length ? Math.round((retainedCards / flashcards.length) * 100) : 0

  // Specialty Mastery aggregation
  const specialtyMap: Record<string, { total: number; retained: number; count: number }> = {}
  flashcards?.forEach(card => {
    const specialty = (card.deck as any)?.specialty_tag || 'Outros'
    if (!specialtyMap[specialty]) {
      specialtyMap[specialty] = { total: 0, retained: 0, count: 0 }
    }
    specialtyMap[specialty].count++
    if (card.repetition > 0) {
      specialtyMap[specialty].total += 1
      if (new Date(card.due_date) > now) {
        specialtyMap[specialty].retained += 1
      }
    }
  })

  const masteryBySpecialty = Object.entries(specialtyMap).map(([specialty, stats]) => ({
    specialty,
    count: stats.count,
    score: stats.total > 0 ? Math.round((stats.retained / stats.total) * 100) : 0
  })).sort((a, b) => b.score - a.score)

  // Future Workload (Next 7 days)
  const workloadDays: { day: string; count: number }[] = []
  for (let i = 0; i < 7; i++) {
    const day = subDays(now, -i)
    const count = flashcards?.filter(c => isSameDay(new Date(c.due_date), day)).length || 0
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

  return {
    globalRetention,
    totalCards: flashcards?.length || 0,
    totalReviews: reviews?.length || 0,
    masteryBySpecialty,
    futureWorkload: workloadDays,
    heatmapData
  }
}
