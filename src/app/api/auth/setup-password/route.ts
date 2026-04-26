import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, password } = await req.json()

    if (!sessionId || !password) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // 1. Validar a sessão no Stripe
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Sessão de pagamento inválida ou não paga' }, { status: 400 })
    }

    const email = session.customer_details?.email
    if (!email) {
      return NextResponse.json({ error: 'Email não encontrado na sessão' }, { status: 400 })
    }

    // 2. Localizar o usuário no Supabase
    const supabase = createAdminClient()
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    const user = userData?.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado. O webhook pode estar processando.' }, { status: 404 })
    }

    // 3. Definir a senha do usuário
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, email })
  } catch (error: any) {
    console.error('Setup Password Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
