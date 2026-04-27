import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    console.log('Webhook Kirvano Recebido:', JSON.stringify(payload, null, 2))

    // Validar token se configurado (Opcional, mas recomendado se a Kirvano enviar)
    // if (req.headers.get('x-kirvano-token') !== process.env.KIRVANO_WEBHOOK_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const event = payload.event
    
    // O tracking src é passado na URL do checkout: &src={USER_ID}
    // A Kirvano normalmente manda isso em tracking.src, src, ou metadata.src dependendo da configuração
    const src = payload.tracking?.src || payload.src || payload.customer?.src || payload.metadata?.src
    const kirvanoCustomerId = payload.customer?.id || payload.buyer?.id || ''
    const kirvanoSubscriptionId = payload.subscription?.id || payload.transaction?.id || ''
    const email = payload.customer?.email || payload.buyer?.email || ''
    
    // Identificar plano pelo nome da oferta/produto
    const offerName = (payload.offer?.name || payload.product?.name || '').toLowerCase()
    let planInterval = 'semiannual'
    if (offerName.includes('anual')) {
      planInterval = 'annual'
    } else if (offerName.includes('semestral')) {
      planInterval = 'semiannual'
    }

    let userId = src

    // Fallback: Se a pessoa comprou direto na landing page sem estar logada
    if (!userId && email) {
      console.log(`👤 Webhook Kirvano: Tentando localizar ou criar usuário para o email ${email}`)
      const { data: userData } = await supabase.auth.admin.listUsers()
      const foundUser = userData.users.find((u: any) => u.email === email)
      
      if (foundUser) {
        userId = foundUser.id
      } else {
        // Criar usuário novo
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true,
          user_metadata: { full_name: payload.customer?.name || payload.buyer?.name || 'Aluno AxonIQ' }
        })

        if (createError) {
          console.error('❌ Erro ao criar usuário automático pela Kirvano:', createError)
        } else {
          userId = newUser.user.id
          console.log(`✅ Novo usuário criado via webhook Kirvano: ${userId}`)
        }
      }
    }

    if (!userId) {
      console.warn('⚠️ Webhook Kirvano: Falha ao resolver userId para o email:', email)
      return NextResponse.json({ received: true, warning: 'User ID tracking missing and could not create' })
    }

    if (event === 'PAYMENT_APPROVED' || event === 'SUBSCRIPTION_ACTIVE' || event === 'SALE_APPROVED') {
      
      // 1. Cancelar Stripe se o usuário tiver feito upgrade do mensal para anual na Kirvano
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()
        
      if (existingSub?.stripe_subscription_id && existingSub.payment_gateway === 'stripe') {
        try {
          console.log(`Cancelando Stripe Sub antiga para usuário ${userId}...`)
          await getStripe().subscriptions.cancel(existingSub.stripe_subscription_id)
        } catch (e) {
          console.error('Erro ao cancelar Stripe antiga (pode já estar cancelada):', e)
        }
      }
      
      // 2. Atualizar tabela subscriptions para a Kirvano
      console.log(`✅ Webhook Update: User=${userId}, Gateway=kirvano, Interval=${planInterval}`)
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        status: 'active',
        payment_gateway: 'kirvano',
        kirvano_customer_id: kirvanoCustomerId,
        kirvano_subscription_id: kirvanoSubscriptionId,
        plan_interval: planInterval,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      
      if (error) {
        console.error('Erro ao atualizar Supabase:', error)
        throw error
      }
    } 
    else if (event === 'SUBSCRIPTION_CANCELED' || event === 'PAYMENT_REFUNDED' || event === 'REFUNDED' || event === 'SUBSCRIPTION_SUSPENDED') {
      console.log(`❌ Webhook Canceled: Cancelando acesso de ${userId}`)
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('payment_gateway', 'kirvano')
        
      if (error) throw error
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Kirvano Webhook Error:', err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}
