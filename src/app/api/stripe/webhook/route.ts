import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getPlanIntervalFromPriceId } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        let userId = session.metadata?.supabase_user_id
        const planInterval = session.metadata?.plan_interval
        const customerEmail = session.customer_details?.email
        
        // Se não tiver userId, tentamos criar o usuário pelo email
        if (!userId && customerEmail) {
          console.log(`👤 Webhook: Criando novo usuário para o email ${customerEmail}`)
          
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: customerEmail,
            email_confirm: true,
            user_metadata: { full_name: session.customer_details?.name || '' }
          })

          if (createError) {
            console.error('❌ Erro ao criar usuário automático:', createError)
            // Se o erro for que o usuário já existe, buscamos ele pelo email
            const { data: userData } = await supabase.auth.admin.listUsers()
            const foundUser = userData.users.find(u => u.email === customerEmail)
            if (foundUser) userId = foundUser.id
          } else {
            userId = newUser.user.id
          }
        }

        if (!userId) break

        // Get subscription details
        const subscriptionId = session.subscription as string
        const subscriptionRes = await getStripe().subscriptions.retrieve(subscriptionId)
        const subscription = subscriptionRes as any

        const currentStart = subscription.current_period_start 
          ? new Date(subscription.current_period_start * 1000).toISOString() 
          : new Date().toISOString()
        
        const currentEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString() 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const { error: upsertError } = await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          status: subscription.status,
          plan_interval: planInterval || 'monthly',
          price_id: subscription.items.data[0]?.price.id,
          current_period_start: currentStart,
          current_period_end: currentEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        if (upsertError) console.error('❌ Upsert Error:', upsertError)

        // Update profile plan and customer id
        await supabase
          .from('profiles')
          .update({ 
            plan: 'pro', 
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString() 
          })
          .eq('id', userId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        let userId = subscription.metadata?.supabase_user_id

        // Se não tiver userId no metadata, buscamos no banco pelo customer_id
        if (!userId) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', subscription.customer as string)
            .maybeSingle()
          
          if (subData) userId = subData.user_id
        }

        // Se ainda não tiver userId, buscamos pelo email do cliente no Stripe
        if (!userId) {
          const customer = await getStripe().customers.retrieve(subscription.customer as string)
          const email = (customer as any).email
          if (email) {
            const { data: userData } = await supabase.auth.admin.listUsers()
            const foundUser = userData.users.find(u => u.email === email)
            if (foundUser) userId = foundUser.id
          }
        }

        if (!userId) {
          console.warn('⚠️ Webhook: Usuário não localizado para a assinatura', subscription.id)
          break
        }

        const priceId = subscription.items.data[0]?.price.id
        const planInterval = getPlanIntervalFromPriceId(priceId || '')
        
        console.log(`✅ Webhook Update: User=${userId}, Price=${priceId}, Interval=${planInterval}`)

        const currentStart = subscription.current_period_start 
          ? new Date(subscription.current_period_start * 1000).toISOString() 
          : new Date().toISOString()
        
        const currentEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString() 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const { error: upsertError } = await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          plan_interval: planInterval || 'monthly',
          price_id: priceId,
          current_period_start: currentStart,
          current_period_end: currentEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        if (upsertError) console.error('❌ Upsert Error:', upsertError)

        // Update profile plan and customer id based on status
        const isPro = subscription.status === 'active' || subscription.status === 'trialing'
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            plan: isPro ? 'pro' : 'free', 
            stripe_customer_id: subscription.customer as string,
            updated_at: new Date().toISOString() 
          })
          .eq('id', userId)

        if (profileError) console.error('❌ Profile Update Error:', profileError)

        console.log(`🎉 Webhook Finalizado com Sucesso para ${userId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const userId = subscription.metadata?.supabase_user_id

        if (!userId) break

        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('user_id', userId)

        await supabase
          .from('profiles')
          .update({ plan: 'free', updated_at: new Date().toISOString() })
          .eq('id', userId)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string
        
        if (!subscriptionId) break

        const subscriptionRes2 = await getStripe().subscriptions.retrieve(subscriptionId)
        const subscription = subscriptionRes2 as any
        const userId = subscription.metadata?.supabase_user_id
        
        if (!userId) break

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('user_id', userId)

        break
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
