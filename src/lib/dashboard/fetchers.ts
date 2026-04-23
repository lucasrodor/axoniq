import { supabase } from '@/lib/supabase/client'
import { getRetentionStats } from '@/lib/study/retention-service'

export const dashboardFetcher = async (key: string) => {
  const [table, userId] = key.split(':')
  
  switch (table) {
    case 'decks':
      const { data: decks } = await supabase
        .from('deck_stats_view')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return decks || []
      
    case 'quizzes':
      const { data: quizzes } = await supabase
        .from('quiz_stats_view')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return quizzes || []

    case 'folders':
      const { data: folders } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      return folders || []

    case 'mind_maps':
      const { data: mm } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return mm || []

    case 'reports':
      const { data: reports } = await supabase
        .from('performance_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return reports || []

    case 'summary':
      const { data: summary } = await supabase.rpc('get_user_progress_summary', { p_user_id: userId })
      return summary
      
    case 'profile':
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
      return profile

    case 'documents':
      const { data: docs } = await supabase.from('documents').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
      return docs || []

    case 'retention':
      return await getRetentionStats(userId)

    default:
      return []
  }
}
