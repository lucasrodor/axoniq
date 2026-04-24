'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'

interface SubscriptionData {
  isPremium: boolean
  isAdmin: boolean
  isWhitelisted: boolean
  plan: 'free' | 'pro'
  subscription: {
    status: string
    interval: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
  credits: {
    used: number
    limit: number
    remaining: number
    periodStart: string
  }
  trial: {
    endsAt: string
    daysRemaining: number
  } | null
}

async function planFetcher(): Promise<SubscriptionData> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch('/api/user/plan', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch plan')
  return res.json()
}

export function useSubscription() {
  const { user } = useAuth()

  const { data, error, isLoading, mutate } = useSWR<SubscriptionData>(
    user ? 'user-plan' : null,
    planFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  )

  return {
    isPremium: data?.isPremium ?? false,
    isAdmin: data?.isAdmin ?? false,
    isWhitelisted: data?.isWhitelisted ?? false,
    plan: data?.plan ?? 'free',
    subscription: data?.subscription ?? null,
    credits: data?.credits ?? { used: 0, limit: 10, remaining: 10, periodStart: '' },
    trial: data?.trial ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}
