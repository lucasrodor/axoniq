'use server'

import { createAdminClient } from '@/lib/supabase/server'

/**
 * Increments the client-side pixel event count for today in the database.
 * This is executed server-side via a Server Action for security.
 */
export async function logPixelEvent(eventName: string) {
  try {
    const supabase = createAdminClient()
    
    // Call the RPC function to increment the event count
    const { error } = await supabase.rpc('increment_pixel_event', {
      event_name_param: eventName,
    })

    if (error) {
      console.error(`❌ [logPixelEvent] Error for ${eventName}:`, error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error(`❌ [logPixelEvent] Unexpected error for ${eventName}:`, err)
    return { success: false, error: err.message || 'Unexpected error' }
  }
}

/**
 * Retrieves pixel metrics aggregated by date and event type.
 * Intended for the Admin Dashboard.
 */
export async function getPixelMetrics() {
  try {
    const supabase = createAdminClient()

    // Fetch the metrics ordered by date descending
    const { data, error } = await supabase
      .from('pixel_events_metrics')
      .select('*')
      .order('event_date', { ascending: false })
      .order('count', { ascending: false })

    if (error) {
      console.error('❌ [getPixelMetrics] Error:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('❌ [getPixelMetrics] Unexpected error:', err)
    return { success: false, error: err.message || 'Unexpected error' }
  }
}
