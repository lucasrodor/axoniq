import { supabase } from '@/lib/supabase/client'

export type PlanType = 'free' | 'pro'

export interface UserPlan {
  plan: PlanType
  trialEndsAt: Date | null
  hasFullAccess: boolean
  daysRemaining: number | null
  isTrialActive: boolean
  isAdmin: boolean
  isWhitelisted: boolean
  subscriptionStatus: string | null
  planInterval: string | null
  credits: {
    used: number
    limit: number
    remaining: number
  }
}

/**
 * Verifica o plano do usuário e se ele tem acesso total.
 * Acesso total = is_admin OR is_whitelisted OR subscription active/trialing OR trial ativo
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  // 1. Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, trial_ends_at, is_admin, is_whitelisted')
    .eq('id', userId)
    .single()

  const plan = (profile?.plan || 'free') as PlanType
  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isAdmin = profile?.is_admin || false
  const isWhitelisted = profile?.is_whitelisted || false

  // 2. Fetch subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, plan_interval')
    .eq('user_id', userId)
    .single()

  const subscriptionStatus = subscription?.status || null
  const planInterval = subscription?.plan_interval || null

  // 3. Fetch credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('credits_used, credits_limit, period_start')
    .eq('user_id', userId)
    .single()

  // Auto-reset if new month
  let creditsUsed = credits?.credits_used || 0
  const creditsLimit = credits?.credits_limit || 10
  if (credits?.period_start) {
    const periodStart = new Date(credits.period_start)
    const now = new Date()
    if (periodStart.getMonth() !== now.getMonth() || periodStart.getFullYear() !== now.getFullYear()) {
      creditsUsed = 0
    }
  }

  // 4. Determine access
  const now = new Date()
  const isTrialActive = trialEndsAt !== null && trialEndsAt > now
  const isSubscriptionActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'
  const hasFullAccess = isAdmin || isWhitelisted || isSubscriptionActive || isTrialActive

  let daysRemaining: number | null = null
  if (isTrialActive && trialEndsAt) {
    daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return {
    plan: hasFullAccess ? 'pro' : 'free',
    trialEndsAt,
    hasFullAccess,
    daysRemaining,
    isTrialActive,
    isAdmin,
    isWhitelisted,
    subscriptionStatus,
    planInterval,
    credits: {
      used: creditsUsed,
      limit: creditsLimit,
      remaining: Math.max(0, creditsLimit - creditsUsed),
    },
  }
}

/**
 * Limites por tipo de acesso
 */
export const PLAN_LIMITS = {
  free: {
    creditsPerMonth: 10,
    canGenerateReport: false,
    canAccessRetention: false,
    canUseAudio: true,
  },
  full: {
    creditsPerMonth: 999,
    canGenerateReport: true,
    canAccessRetention: true,
    canUseAudio: true,
  },
} as const

/**
 * Retorna os limites aplicáveis ao usuário
 */
export function getLimits(hasFullAccess: boolean) {
  return hasFullAccess ? PLAN_LIMITS.full : PLAN_LIMITS.free
}
