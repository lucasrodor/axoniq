import { supabase } from '@/lib/supabase/client'
import { startOfDay, subDays, format, isSameDay } from 'date-fns'
import { getCardStage } from '@/lib/study/spaced-repetition'

export interface RetentionStats {
  globalRetention: number // 0-100
  totalCards: number
  totalReviews: number
  masteryBySpecialty: { 
    specialty: string; 
    score: number; 
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

  // 2. Fetch study history for the heatmap (last 90 days)
  const ninetyDaysAgo = subDays(new Date(), 90).toISOString()
  const { data: reviews, error: reviewsError } = await supabase
    .from('flashcard_reviews')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', ninetyDaysAgo)

  if (reviewsError) throw reviewsError

  // --- PROCESSING LOGIC ---

  // Global Score: Weighted by stage (New=0, Learning=0.25, Review=0.5, Mastered=1.0)
  let totalGlobalWeight = 0
  let earnedGlobalWeight = 0

  // Specialty Mastery aggregation
  const specialtyMap: Record<string, { totalCards: number; earnedWeight: number; count: number; stages: any }> = {}
  
  flashcards?.forEach(card => {
    const stage = getCardStage(card as any)
    
    let weight = 0
    if (stage === 'learning') weight = 0.25
    else if (stage === 'review') weight = 0.50
    else if (stage === 'mastered') weight = 1.0

    totalGlobalWeight += 1 // Max possible weight is 1.0 per card
    earnedGlobalWeight += weight

    const specialty = (card.deck as any)?.specialty_tag || 'Outros'
    if (!specialtyMap[specialty]) {
      specialtyMap[specialty] = { 
        totalCards: 0, 
        earnedWeight: 0, 
        count: 0,
        stages: { new: 0, learning: 0, review: 0, mastered: 0 }
      }
    }
    specialtyMap[specialty].totalCards++
    specialtyMap[specialty].count++
    specialtyMap[specialty].stages[stage]++
    specialtyMap[specialty].earnedWeight += weight
  })

  const globalRetention = totalGlobalWeight > 0 
    ? Math.round((earnedGlobalWeight / totalGlobalWeight) * 100) 
    : 0

  const masteryBySpecialty = Object.entries(specialtyMap).map(([specialty, stats]) => ({
    specialty,
    count: stats.count,
    score: stats.totalCards > 0 ? Math.round((stats.earnedWeight / stats.totalCards) * 100) : 0,
    stages: stats.stages
  })).sort((a, b) => b.score - a.score)

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

  return {
    globalRetention,
    totalCards: flashcards?.length || 0,
    totalReviews: reviews?.length || 0,
    masteryBySpecialty,
    futureWorkload: workloadDays,
    heatmapData
  }
}
