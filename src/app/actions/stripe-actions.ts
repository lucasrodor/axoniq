'use server'

import { getStripe } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function createCheckoutSession(priceId: string) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Se não estiver logado, redireciona para o checkout normal (o webhook criará a conta)
  } else {
    // 1. Verificar se o usuário já tem uma assinatura ativa
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    // 2. Se já for Pro (ativo ou em triagem), manda para o portal de gerenciamento em vez de novo checkout
    if (subscription?.status === 'active' || subscription?.status === 'trialing') {
      const stripe = getStripe()
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id!,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/account`,
      })
      redirect(portalSession.url)
    }
  }

  const stripe = getStripe()
  
  const sessionConfig: any = {
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 7,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}${!user ? '&new_user=true' : ''}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/teste-planos`,
    metadata: {
      supabase_user_id: user?.id || '',
      plan_interval: 'monthly', // Padrão para o teste
    },
  }

  // Se o usuário estiver logado, vinculamos o ID dele
  if (user) {
    sessionConfig.client_reference_id = user.id
    sessionConfig.customer_email = user.email
    sessionConfig.metadata.supabase_user_id = user.id
  }

  const session = await stripe.checkout.sessions.create(sessionConfig)

  if (!session.url) {
    throw new Error('Falha ao criar sessão de checkout.')
  }

  redirect(session.url)
}
