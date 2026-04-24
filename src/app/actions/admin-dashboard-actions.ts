'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAdminMetrics() {
  try {
    const supabase = createAdminClient()

    // 1. Fetch Waitlist Count only (fast)
    const { count: waitlistCount, error: waitlistError } = await supabase
      .from('waitlist_leads')
      .select('*', { count: 'exact', head: true })

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
          waitlistCount: waitlistCount || 0
        }
      }
    }
  } catch (err: any) {
    console.error('Error in getAdminMetrics:', err)
    return { success: false, error: err.message }
  }
}

export async function getWaitlistLeads(page: number = 1, limit: number = 10) {
  try {
    const supabase = createAdminClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('waitlist_leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return { 
      success: true, 
      data: data || [], 
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (err: any) {
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
