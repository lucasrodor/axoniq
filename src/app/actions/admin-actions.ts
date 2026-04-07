'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email/resend'
import { alphaInviteTemplate } from '@/lib/email/templates/invitation'

const ADMIN_EMAIL = 'lucasrodor@gmail.com'

export async function createAlphaUser(email: string) {
  try {
    const supabase = createAdminClient()
    
    // 1. Gerar senha temporária segura
    const tempPassword = `Axoniq#Alpha${Math.floor(1000 + Math.random() * 9000)}`
    
    // 2. Criar usuário diretamente via Admin API (Já confirmado)
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Alpha Guest',
        is_alpha: true
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return { success: false, error: createError.message }
    }

    // 3. Configurar perfil com privilégios Alpha (Fase 1)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userData.user.id,
        plan: 'free',
        trial_ends_at: '2026-12-31T23:59:59+00',
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('Error creating alpha profile:', profileError)
    }

    // 4. Enviar Email VIP via Resend
    try {
      await sendEmail({
        to: email,
        subject: 'Bem-vindo ao Axoniq: Suas credenciais de acesso Alpha',
        html: alphaInviteTemplate(email, tempPassword),
      })
      
      console.log('ALPHA INVITE EMAIL SENT SUCCESSFULLY TO:', email)
    } catch (emailErr) {
      console.error('CRITICAL RESEND ERROR IN ALPHA INVITE:', emailErr)
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error in createAlphaUser:', err)
    return { success: false, error: 'Ocorreu um erro inesperado ao criar o acesso.' }
  }
}
