/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak.
 * Calculates the next review date based on user's self-assessed quality.
 *
 * Quality scale:
 *   0-1 = Complete blackout / wrong
 *   2   = Wrong but recognized after seeing answer
 *   3   = Correct with difficulty
 *   4   = Correct with hesitation
 *   5   = Perfect recall
 */

export interface CardState {
  ease_factor: number  // EF >= 1.3, default 2.5
  interval: number     // Days until next review
  repetition: number   // Successful repetitions in a row
}

export interface ReviewResult extends CardState {
  due_date: string     // ISO timestamp for next review
}

/**
 * Quality ratings mapped to user-facing buttons
 */
export type Quality = 1 | 3 | 4 | 5

export const QUALITY_MAP = {
  again: 1 as Quality,    // "Errei"       — complete fail
  hard: 3 as Quality,     // "Difícil"     — correct but hard
  good: 4 as Quality,     // "Acertei"     — correct
  easy: 5 as Quality,     // "Fácil"       — perfect
} as const

export type QualityLabel = keyof typeof QUALITY_MAP

/**
 * Calculate next review state using SM-2 algorithm.
 *
 * @param current - Current card state (ease_factor, interval, repetition)
 * @param quality - Quality of recall (1, 3, 4, 5)
 * @returns New card state with calculated due_date
 */
export function calculateNextReview(
  current: CardState,
  quality: Quality
): ReviewResult {
  let { ease_factor, interval, repetition } = current

  if (quality < 3) {
    // Failed: reset to beginning
    repetition = 0
    interval = 0
  } else {
    // Passed: advance schedule
    if (repetition === 0) {
      interval = 1 // First success: review tomorrow
    } else if (repetition === 1) {
      interval = 6 // Second success: review in 6 days
    } else {
      interval = Math.round(interval * ease_factor)
    }
    repetition += 1
  }

  // Update ease factor (EF)
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  ease_factor =
    ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  // EF must never go below 1.3
  if (ease_factor < 1.3) ease_factor = 1.3

  // Calculate due date
  const now = new Date()
  const due = new Date(now)

  if (interval === 0) {
    // Failed cards: review again in 1 minute (re-appear in same session)
    due.setMinutes(due.getMinutes() + 1)
  } else {
    due.setDate(due.getDate() + interval)
  }

  return {
    ease_factor: Math.round(ease_factor * 100) / 100, // Round to 2 decimals
    interval,
    repetition,
    due_date: due.toISOString(),
  }
}

/**
 * Classify a card's learning stage based on its state.
 */
export type CardStage = 'new' | 'learning' | 'review' | 'mastered'

export function getCardStage(card: CardState): CardStage {
  if (card.repetition === 0 && card.interval === 0) return 'new'
  if (card.interval < 7) return 'learning'
  if (card.interval >= 21) return 'mastered'
  return 'review'
}

/**
 * Get color for card stage badge.
 */
export function getStageColor(stage: CardStage): string {
  const colors: Record<CardStage, string> = {
    new: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    learning: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    review: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    mastered: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  }
  return colors[stage]
}

/**
 * Get label for card stage.
 */
export function getStageLabel(stage: CardStage): string {
  const labels: Record<CardStage, string> = {
    new: 'Novo',
    learning: 'Aprendendo',
    review: 'Revisão',
    mastered: 'Dominado',
  }
  return labels[stage]
}
