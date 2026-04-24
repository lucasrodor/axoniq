'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUsersList(page: number = 1, limit: number = 10, search: string = '') {
  try {
    const supabase = createAdminClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
 
    let query = supabase
      .from('profiles')
      .select('id, full_name, plan, is_admin, is_whitelisted, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,id.ilike.%${search}%`)
    }

    const { data: profiles, error, count } = await query

    if (error) throw error

    // Fetch emails from auth only for these IDs to be super fast
    const userIds = profiles?.map(p => p.id) || []
    
    // Fallback: list all if we can't filter admin.listUsers (it doesn't support filter by IDs easily in one go)
    // But we fetch only 10, so it's already much faster
    const { data: authData } = await supabase.auth.admin.listUsers()
    const emailMap = new Map(authData?.users?.map(u => [u.id, u.email]) || [])

    // Fetch subscription status for these IDs
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('user_id, status, plan_interval')
      .in('user_id', userIds)

    const subMap = new Map(subscriptions?.map(s => [s.user_id, { status: s.status, interval: s.plan_interval }]) || [])

    const users = (profiles || []).map(p => ({
      id: p.id,
      fullName: p.full_name || 'Sem nome',
      email: emailMap.get(p.id) || 'N/A',
      plan: p.plan || 'free',
      isAdmin: p.is_admin || false,
      isWhitelisted: p.is_whitelisted || false,
      subscription: subMap.get(p.id) || null,
    }))

    return { 
      success: true, 
      data: users,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (err: any) {
    console.error('Error in getUsersList:', err)
    return { success: false, error: err.message }
  }
}

export async function toggleWhitelist(userId: string, currentValue: boolean) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_whitelisted: !currentValue, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true, newValue: !currentValue }
  } catch (err: any) {
    console.error('Error in toggleWhitelist:', err)
    return { success: false, error: err.message }
  }
}
