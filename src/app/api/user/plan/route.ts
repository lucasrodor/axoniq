import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCreditsInfo } from '@/lib/credits'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, trial_ends_at, is_admin, is_whitelisted')
      .eq('id', user.id)
      .single()

    // Fetch subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, plan_interval, current_period_end, cancel_at_period_end')
      .eq('user_id', user.id)
      .single()

    // Fetch credits
    const credits = await getCreditsInfo(user.id)

    const isAdmin = profile?.is_admin || false
    const isWhitelisted = profile?.is_whitelisted || false
    const subscriptionStatus = subscription?.status || null
    const isSubscriptionActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'
    
    const now = new Date()
    const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
    const isTrialActive = trialEndsAt !== null && trialEndsAt > now

    const isPremium = isAdmin || isWhitelisted || isSubscriptionActive || isTrialActive

    return NextResponse.json({
      isPremium,
      isAdmin,
      isWhitelisted,
      plan: isPremium ? 'pro' : 'free',
      subscription: subscription ? {
        status: subscription.status,
        interval: subscription.plan_interval,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      } : null,
      credits,
      trial: isTrialActive ? {
        endsAt: trialEndsAt?.toISOString(),
        daysRemaining: trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      } : null,
    })
  } catch (error: any) {
    console.error('User Plan Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
