import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe, getPlanIntervalFromPriceId } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Initialize Supabase Admin client (to bypass RLS during webhook)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = (await headers()).get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing stripe-signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const { type, data } = event

  console.log(`🔔 Received Stripe webhook event: ${type}`)

  try {
    switch (type) {
      case 'checkout.session.completed': {
        const session = data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        
        if (!userId) {
          console.error('❌ No client_reference_id found in checkout session')
          break
        }

        const subscription = await getStripe().subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0].price.id
        const interval = getPlanIntervalFromPriceId(priceId)

        // Update database
        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          status: 'active',
          plan_interval: interval,
          price_id: priceId,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })

        // Give unlimited credits or update plan in profile
        await supabaseAdmin.from('profiles').update({ plan: 'pro' }).eq('id', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = data.object as Stripe.Subscription
        const priceId = subscription.items.data[0].price.id
        const interval = getPlanIntervalFromPriceId(priceId)
        
        // Find user by stripe_customer_id
        const { data: subData } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (subData) {
          await supabaseAdmin.from('subscriptions').update({
            status: subscription.status,
            plan_interval: interval,
            price_id: priceId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          }).eq('user_id', subData.user_id)

          // Update profile plan if active
          const isPro = ['active', 'trialing'].includes(subscription.status)
          await supabaseAdmin.from('profiles').update({ plan: isPro ? 'pro' : 'free' }).eq('id', subData.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = data.object as Stripe.Subscription
        
        const { data: subData } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (subData) {
          await supabaseAdmin.from('subscriptions').update({
            status: 'canceled',
          }).eq('user_id', subData.user_id)

          await supabaseAdmin.from('profiles').update({ plan: 'free' }).eq('id', subData.user_id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error(`❌ Error processing webhook: ${error.message}`)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
