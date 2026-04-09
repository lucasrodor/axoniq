'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAdminMetrics() {
  try {
    const supabase = createAdminClient()

    // 1. Fetch Waitlist
    // We assume the table is waitlist_leads based on earlier landing page inspection
    const { data: waitlist, error: waitlistError } = await supabase
      .from('waitlist_leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (waitlistError) {
      console.warn('Waitlist fetch error or table missing:', waitlistError.message)
    }

    // 2. Fetch Profiles for Plan distribution
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, plan, updated_at')

    if (profilesError) throw profilesError

    // 3. Fetch Auth Users for "Total Accounts" vs "Active Profiles"
    // listUsers requires admin role
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) throw authError

    const totalAuthUsers = authData.users.length
    const freeUsers = profiles?.filter(p => p.plan === 'free').length || 0
    // Extrapolating plan types
    const proUsers = profiles?.filter(p => p.plan && p.plan !== 'free').length || 0
    
    // Closed accounts estimate (Users in Auth but without a Profile)
    const closedEstimate = Math.max(0, totalAuthUsers - (profiles?.length || 0))

    return {
      success: true,
      data: {
        metrics: {
          totalUsers: totalAuthUsers,
          activeProfiles: profiles?.length || 0,
          freeUsers,
          proUsers,
          closedEstimate,
          waitlistCount: waitlist?.length || 0
        },
        waitlist: waitlist || []
      }
    }
  } catch (err: any) {
    console.error('Error in getAdminMetrics:', err)
    return { success: false, error: err.message }
  }
}

export async function deleteWaitlistLead(id: string) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('waitlist_leads')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
