import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { passwordResetTemplate } from '@/lib/email/templates/password-reset'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório.' },
        { status: 400 }
      )
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const redirectTo = `${origin}/reset-password`

    // Generate reset link via Admin API (does NOT send email)
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo,
      },
    })

    if (error) {
      console.error('Generate link error:', error)
      // Don't reveal if email exists or not
      return NextResponse.json({
        message: 'Se esse email estiver cadastrado, você receberá um link de recuperação.',
      })
    }

    // Build the actual reset URL from the generated link
    const resetUrl = data.properties?.action_link || redirectTo

    // Send ONLY via Resend
    await sendEmail({
      to: email,
      subject: 'Redefinir sua senha — Axoniq',
      html: passwordResetTemplate(resetUrl),
    })

    return NextResponse.json({
      message: 'Se esse email estiver cadastrado, você receberá um link de recuperação.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
