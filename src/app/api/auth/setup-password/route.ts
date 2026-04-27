import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, password, email: reqEmail } = await req.json()

    if (!password || (!sessionId && !reqEmail)) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    let targetEmail = reqEmail

    // 1. Validar a sessão no Stripe se sessionId for passado
    if (sessionId) {
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      
      if (!session || session.payment_status !== 'paid') {
        return NextResponse.json({ error: 'Sessão de pagamento inválida ou não paga' }, { status: 400 })
      }

      targetEmail = session.customer_details?.email
      if (!targetEmail) {
        return NextResponse.json({ error: 'Email não encontrado na sessão' }, { status: 400 })
      }
    }

    // 2. Localizar o usuário no Supabase
    const supabaseAdmin = createAdminClient()
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers()
    const user = userData?.users.find((u: any) => u.email === targetEmail)

    if (!user) {
      return NextResponse.json({ error: 'Sua conta ainda não foi processada. Aguarde alguns instantes e tente novamente (o sistema pode levar até 20 segundos para registrar seu pagamento).' }, { status: 404 })
    }

    // Validação de Segurança Exclusiva para Fluxo Kirvano (sem Session ID da Stripe)
    if (!sessionId) {
      // Se não veio do stripe via session_id, só permitimos resetar se o usuário for recém-criado 
      // e nunca tiver logado, OU via subscription ativa da Kirvano (opcional). 
      // Por segurança, se ele já logou alguma vez, não pode usar essa página para resetar a senha de forma anônima.
      if (user.last_sign_in_at) {
        return NextResponse.json({ error: 'Sua conta já possui uma senha. Por favor, acesse a tela de Login e clique em "Esqueci minha senha" se necessário.' }, { status: 403 })
      }
    }

    // 3. Definir a senha do usuário
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, email: targetEmail })
  } catch (error: any) {
    console.error('Setup Password Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
