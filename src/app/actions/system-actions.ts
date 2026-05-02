'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getMonetizationStatus() {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'is_monetization_active')
      .maybeSingle()

    if (error) {
      console.error('❌ DB Error fetching status:', error)
      return true // Fallback to active
    }

    console.log('📖 [DB Read] monetization_active is:', data?.value)
    // Se for nulo ou não definido, padrão é TRUE
    return data?.value !== false
  } catch (err) {
    console.error('❌ System error in getMonetizationStatus:', err)
    return true // Fallback to active
  }
}

export async function toggleMonetization(currentStatus: boolean) {
  try {
    const nextStatus = !currentStatus
    console.log(`🔄 [DB Write] Changing status to: ${nextStatus}`)
    
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .upsert({ 
        key: 'is_monetization_active', 
        value: nextStatus,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'key' })
      .select()

    if (error) {
      console.error('❌ DB Error toggling status:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [DB Write Success] New data:', data)
    revalidatePath('/admin')
    revalidatePath('/dashboard')
    return { success: true, newValue: nextStatus }
  } catch (err: any) {
    console.error('❌ System error in toggleMonetization:', err)
    return { success: false, error: err.message }
  }
}
