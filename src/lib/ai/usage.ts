import { createAdminClient } from '@/lib/supabase/server'

export type AiActionType = 
  | 'flashcards' 
  | 'quiz' 
  | 'mindmap' 
  | 'report' 
  | 'audio_process' 
  | 'document_process'
  | 'tagging'

interface LogUsageParams {
  userId: string
  actionType: AiActionType
  modelName: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Logs AI token usage to the database.
 * This is designed to be called asynchronously without blocking the main response.
 */
export async function logAiUsage({ userId, actionType, modelName, usage }: LogUsageParams) {
  if (!usage) return

  try {
    const supabase = createAdminClient()
    
    const { error } = await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      action_type: actionType,
      model_name: modelName,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
    })

    if (error) {
      console.error(`[AI Usage Log Error] Action: ${actionType}, User: ${userId}`, error)
    } else {
      console.log(`[AI Usage Log] Action: ${actionType}, Total Tokens: ${usage.total_tokens}`)
    }
  } catch (err) {
    console.error(`[AI Usage Log Exception] Action: ${actionType}`, err)
  }
}
