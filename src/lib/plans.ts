import { supabase } from '@/lib/supabase/client'

export type PlanType = 'free' | 'pro'

export interface UserPlan {
  plan: PlanType
  trialEndsAt: Date | null
  hasFullAccess: boolean
  daysRemaining: number | null
  isTrialActive: boolean
}

/**
 * Verifica o plano do usuário e se ele tem acesso total.
 * Acesso total = plan 'pro' OU trial ativo (trial_ends_at > agora)
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, trial_ends_at')
    .eq('id', userId)
    .single()

  const plan = (profile?.plan || 'free') as PlanType
  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null

  const now = new Date()
  const isTrialActive = trialEndsAt !== null && trialEndsAt > now
  const hasFullAccess = plan === 'pro' || isTrialActive

  let daysRemaining: number | null = null
  if (isTrialActive && trialEndsAt) {
    daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return {
    plan,
    trialEndsAt,
    hasFullAccess,
    daysRemaining,
    isTrialActive,
  }
}

/**
 * Limites por tipo de acesso
 */
export const PLAN_LIMITS = {
  free: {
    maxSourcesPerMonth: 3,
    maxFlashcardsPerGeneration: 15,
    maxQuizQuestionsPerGeneration: 10,
    canUseMindmap: false,
    canUseAudio: false,
    maxFolders: 3,
  },
  full: {
    maxSourcesPerMonth: 999,
    maxFlashcardsPerGeneration: 50,
    maxQuizQuestionsPerGeneration: 30,
    canUseMindmap: true,
    canUseAudio: true,
    maxFolders: 999,
  },
} as const

/**
 * Retorna os limites aplicáveis ao usuário
 */
export function getLimits(hasFullAccess: boolean) {
  return hasFullAccess ? PLAN_LIMITS.full : PLAN_LIMITS.free
}
