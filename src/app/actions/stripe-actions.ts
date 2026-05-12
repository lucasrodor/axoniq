'use server'

import { getStripe } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function createCheckoutSession(planType: 'monthly' | 'semiannual' | 'annual') {
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

  let existingCustomerId = ''
  
  if (!user) {
    // Se não estiver logado, redireciona para o checkout normal
  } else {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subscription?.stripe_customer_id) {
      existingCustomerId = subscription.stripe_customer_id
    }

    if ((subscription?.status === 'active' || subscription?.status === 'trialing') && existingCustomerId) {
      const stripe = getStripe()
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: existingCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/account`,
      })
      return { url: portalSession.url }
    }
  }

  try {
    const stripe = getStripe()
    
    // Buscar o ID do preço do ENV de acordo com o plano
    let priceId = ''
    if (planType === 'monthly') priceId = process.env.STRIPE_PRICE_MONTHLY || ''
    else if (planType === 'semiannual') priceId = process.env.STRIPE_PRICE_SEMIANNUAL || ''
    else if (planType === 'annual') priceId = process.env.STRIPE_PRICE_ANNUAL || ''

    if (!priceId) {
      return { error: `Configuração do plano ${planType} não encontrada (STRIPE_PRICE_${planType.toUpperCase()})` }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
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
      allow_promotion_codes: true,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}${!user ? '&new_user=true' : ''}`,
      cancel_url: `${siteUrl}/teste-planos`,
      metadata: {
        supabase_user_id: user?.id || '',
        plan_interval: planType,
      },
    }

    if (user) {
      sessionConfig.client_reference_id = user.id
      sessionConfig.metadata.supabase_user_id = user.id
      
      if (existingCustomerId) {
        sessionConfig.customer = existingCustomerId
      } else {
        sessionConfig.customer_email = user.email
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    if (!session.url) {
      return { error: 'Falha ao criar sessão de checkout.' }
    }

    return { url: session.url }
  } catch (err: any) {
    console.error('❌ [Stripe Checkout Error]:', err)
    return { error: err.message || 'Ocorreu um erro ao processar seu pagamento.' }
  }
}
