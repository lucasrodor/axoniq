import { createAdminClient } from '@/lib/supabase/server'

const FREE_CREDITS_LIMIT = 10

/**
 * Check if a user has remaining credits and consume one if allowed.
 * Premium users bypass this entirely.
 * Returns { allowed, remaining } to inform the caller.
 */
export async function consumeCredit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createAdminClient()

  // 1. Check if user is premium (admin, whitelisted, or active subscription)
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_whitelisted')
    .eq('id', userId)
    .single()

  if (profile?.is_admin || profile?.is_whitelisted) {
    return { allowed: true, remaining: 999 }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .single()

  if (subscription?.status === 'active' || subscription?.status === 'trialing') {
    return { allowed: true, remaining: 999 }
  }

  // 2. Free user — check credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('credits_used, credits_limit, period_start')
    .eq('user_id', userId)
    .single()

  if (!credits) {
    // Auto-create credits row if missing
    await supabase.from('user_credits').upsert({
      user_id: userId,
      credits_used: 1,
      credits_limit: FREE_CREDITS_LIMIT,
      period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    })
    return { allowed: true, remaining: FREE_CREDITS_LIMIT - 1 }
  }

  // 3. Check if period needs reset (new month)
  const periodStart = new Date(credits.period_start)
  const now = new Date()
  const isNewPeriod = periodStart.getMonth() !== now.getMonth() || periodStart.getFullYear() !== now.getFullYear()

  if (isNewPeriod) {
    await supabase
      .from('user_credits')
      .update({
        credits_used: 1,
        period_start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)

    return { allowed: true, remaining: credits.credits_limit - 1 }
  }

  // 4. Check remaining credits
  const remaining = credits.credits_limit - credits.credits_used
  if (remaining <= 0) {
    return { allowed: false, remaining: 0 }
  }

  // 5. Consume 1 credit atomically using RPC
  const { error: rpcError } = await supabase.rpc('increment_credits', { 
    target_user_id: userId 
  })

  if (rpcError) {
    console.error('RPC Credit error:', rpcError)
    // Fallback if RPC fails
    await supabase
      .from('user_credits')
      .update({
        credits_used: credits.credits_used + 1,
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
  }

  return { allowed: true, remaining: remaining - 1 }
}

/**
 * Get credit info for display purposes (no side effects)
 */
export async function getCreditsInfo(userId: string): Promise<{
  used: number
  limit: number
  remaining: number
  periodStart: string
  isPro?: boolean
}> {
  const supabase = createAdminClient()

  // Check if user is premium
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_whitelisted')
    .eq('id', userId)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .single()

  const isPro = !!(profile?.is_admin || profile?.is_whitelisted || subscription?.status === 'active' || subscription?.status === 'trialing')

  if (isPro) {
    return { used: 0, limit: 999, remaining: 999, periodStart: new Date().toISOString(), isPro: true }
  }

  const { data: credits } = await supabase
    .from('user_credits')
    .select('credits_used, credits_limit, period_start')
    .eq('user_id', userId)
    .single()

  if (!credits) {
    return { used: 0, limit: FREE_CREDITS_LIMIT, remaining: FREE_CREDITS_LIMIT, periodStart: new Date().toISOString() }
  }

  // Check if period needs reset display
  const periodStart = new Date(credits.period_start)
  const now = new Date()
  const isNewPeriod = periodStart.getMonth() !== now.getMonth() || periodStart.getFullYear() !== now.getFullYear()

  if (isNewPeriod) {
    return { used: 0, limit: credits.credits_limit, remaining: credits.credits_limit, periodStart: now.toISOString() }
  }

  return {
    used: credits.credits_used,
    limit: credits.credits_limit,
    remaining: Math.max(0, credits.credits_limit - credits.credits_used),
    periodStart: credits.period_start,
  }
}

/**
 * Refund a credit if generation fails
 */
export async function refundCredit(userId: string): Promise<void> {
  const supabase = createAdminClient()

  // 1. Check if user is premium (don't need to refund)
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_whitelisted')
    .eq('id', userId)
    .single()

  if (profile?.is_admin || profile?.is_whitelisted) return

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .single()

  if (subscription?.status === 'active' || subscription?.status === 'trialing') return

  // 2. Decrement credits_used atomically
  const { error } = await supabase.rpc('decrement_credits', {
    target_user_id: userId
  })

  if (error) {
    console.error('Error refunding credit:', error)
    // Fallback: manually decrement if RPC fails (risky but better than nothing)
    const { data: credits } = await supabase
      .from('user_credits')
      .select('credits_used')
      .eq('user_id', userId)
      .single()
    
    if (credits && credits.credits_used > 0) {
      await supabase
        .from('user_credits')
        .update({ credits_used: credits.credits_used - 1 })
        .eq('user_id', userId)
    }
  }
}
