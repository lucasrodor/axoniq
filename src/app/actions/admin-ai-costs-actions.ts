'use server'

import { createAdminClient } from '@/lib/supabase/server'

// --- Pricing Constants ---
const USD_TO_BRL = 5.20

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-5-mini':    { input: 0.25,  output: 2.00  },
  'gpt-5-nano':    { input: 0.05,  output: 0.40  },
  'gpt-4o-mini':   { input: 0.15,  output: 0.60  },
  'gpt-4.1-mini':  { input: 0.40,  output: 1.60  },
  'gpt-4.1':       { input: 2.00,  output: 8.00  },
  'whisper-1':     { input: 0,     output: 0     }, // billed per minute, not tokens
}

function calcCostUsd(modelName: string, inputTokens: number, outputTokens: number): number {
  // Match model name with or without date suffix (e.g. gpt-5-nano-2025-08-07 → gpt-5-nano)
  let pricing = MODEL_PRICING[modelName]
  if (!pricing) {
    const baseModel = Object.keys(MODEL_PRICING).find(key => modelName.startsWith(key))
    if (baseModel) pricing = MODEL_PRICING[baseModel]
  }
  if (!pricing) return 0
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output
}

// --- Types ---
export interface AiCostUser {
  userId: string
  email: string
  fullName: string
  plan: string
  createdAt: string
  quizzes: number
  mindmaps: number
  flashcards: number
  reports: number
  documentProcess: number
  tagging: number
  totalActions: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
  costBrl: number
  status: 'normal' | 'attention' | 'high' | 'critical'
  lastActivity: string
  byModel: Record<string, { input: number; output: number; total: number; cost: number }>
  byAction: Record<string, { count: number; input: number; output: number; total: number; cost: number }>
}

export interface AiCostsSummary {
  totalCostBrl: number
  totalCostUsd: number
  avgCostPerUser: number
  topUserName: string
  topUserCost: number
  totalTokens: number
  totalQuizzes: number
  totalMindmaps: number
  totalFlashcards: number
  totalActions: number
  criticalCount: number
}

export interface AiCostsResponse {
  success: boolean
  error?: string
  users: AiCostUser[]
  summary: AiCostsSummary
  totalCount: number
  totalPages: number
}

function getStatus(costBrl: number): 'normal' | 'attention' | 'high' | 'critical' {
  if (costBrl >= 10) return 'critical'
  if (costBrl >= 7) return 'high'
  if (costBrl >= 3) return 'attention'
  return 'normal'
}

interface GetAiCostsParams {
  search?: string
  status?: string
  plan?: string
  actionType?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export async function getAiCosts(params: GetAiCostsParams = {}): Promise<AiCostsResponse> {
  const {
    search = '',
    status = '',
    plan = '',
    actionType = '',
    startDate,
    endDate,
    page = 1,
    pageSize = 25,
    sortBy = 'costBrl',
    sortDirection = 'desc',
  } = params

  try {
    const supabase = createAdminClient()

    // 1. Fetch all AI usage logs for the period
    let logsQuery = supabase
      .from('ai_usage_logs')
      .select('*')

    if (startDate) {
      logsQuery = logsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      logsQuery = logsQuery.lte('created_at', endDate)
    }
    if (actionType) {
      logsQuery = logsQuery.eq('action_type', actionType)
    }

    const { data: logs, error: logsError } = await logsQuery

    if (logsError) throw logsError

    // 2. Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, plan, updated_at')

    if (profilesError) throw profilesError

    // 3. Get auth users for emails
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) throw authError

    const emailMap = new Map<string, string>()
    authData.users.forEach(u => emailMap.set(u.id, u.email || ''))

    const profileMap = new Map<string, { fullName: string; plan: string; createdAt: string }>()
    profiles?.forEach(p => profileMap.set(p.id, {
      fullName: p.full_name || '',
      plan: p.plan || 'free',
      createdAt: p.updated_at || '',
    }))

    // 4. Get subscription data
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('user_id, status')

    const subMap = new Map<string, string>()
    subs?.forEach(s => subMap.set(s.user_id, s.status))

    // 5. Aggregate by user
    const userAgg = new Map<string, {
      inputTokens: number
      outputTokens: number
      totalTokens: number
      costUsd: number
      actions: Record<string, number>
      lastActivity: string
      byModel: Record<string, { input: number; output: number; total: number; cost: number }>
      byAction: Record<string, { count: number; input: number; output: number; total: number; cost: number }>
    }>()

    for (const log of (logs || [])) {
      const uid = log.user_id
      if (!userAgg.has(uid)) {
        userAgg.set(uid, {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          costUsd: 0,
          actions: {},
          lastActivity: '',
          byModel: {},
          byAction: {},
        })
      }
      const agg = userAgg.get(uid)!

      const input = log.prompt_tokens || 0
      const output = log.completion_tokens || 0
      const total = log.total_tokens || 0
      const cost = calcCostUsd(log.model_name, input, output)

      agg.inputTokens += input
      agg.outputTokens += output
      agg.totalTokens += total
      agg.costUsd += cost

      // Count by action type
      agg.actions[log.action_type] = (agg.actions[log.action_type] || 0) + 1

      // By model
      if (!agg.byModel[log.model_name]) {
        agg.byModel[log.model_name] = { input: 0, output: 0, total: 0, cost: 0 }
      }
      agg.byModel[log.model_name].input += input
      agg.byModel[log.model_name].output += output
      agg.byModel[log.model_name].total += total
      agg.byModel[log.model_name].cost += cost

      // By action
      if (!agg.byAction[log.action_type]) {
        agg.byAction[log.action_type] = { count: 0, input: 0, output: 0, total: 0, cost: 0 }
      }
      agg.byAction[log.action_type].count += 1
      agg.byAction[log.action_type].input += input
      agg.byAction[log.action_type].output += output
      agg.byAction[log.action_type].total += total
      agg.byAction[log.action_type].cost += cost

      // Track last activity
      if (!agg.lastActivity || log.created_at > agg.lastActivity) {
        agg.lastActivity = log.created_at
      }
    }

    // 6. Build user array
    let users: AiCostUser[] = Array.from(userAgg.entries()).map(([userId, agg]) => {
      const profile = profileMap.get(userId)
      const email = emailMap.get(userId) || ''
      const subStatus = subMap.get(userId)
      const costBrl = agg.costUsd * USD_TO_BRL

      let userPlan = profile?.plan || 'free'
      if (subStatus === 'active') userPlan = 'pro'
      else if (subStatus === 'trialing') userPlan = 'trial'

      return {
        userId,
        email,
        fullName: profile?.fullName || '',
        plan: userPlan,
        createdAt: profile?.createdAt || '',
        quizzes: agg.actions['quiz'] || 0,
        mindmaps: agg.actions['mindmap'] || 0,
        flashcards: agg.actions['flashcards'] || 0,
        reports: agg.actions['report'] || 0,
        documentProcess: (agg.actions['document_process'] || 0) + (agg.actions['audio_process'] || 0),
        tagging: agg.actions['tagging'] || 0,
        totalActions: Object.values(agg.actions).reduce((a, b) => a + b, 0),
        inputTokens: agg.inputTokens,
        outputTokens: agg.outputTokens,
        totalTokens: agg.totalTokens,
        costUsd: agg.costUsd,
        costBrl,
        status: getStatus(costBrl),
        lastActivity: agg.lastActivity,
        byModel: agg.byModel,
        byAction: agg.byAction,
      }
    })

    // 7. Apply filters
    if (search) {
      const s = search.toLowerCase()
      users = users.filter(u =>
        u.email.toLowerCase().includes(s) ||
        u.fullName.toLowerCase().includes(s) ||
        u.userId.toLowerCase().includes(s)
      )
    }
    if (status) {
      users = users.filter(u => u.status === status)
    }
    if (plan) {
      users = users.filter(u => u.plan === plan)
    }

    // 8. Summary (before pagination)
    const summary: AiCostsSummary = {
      totalCostUsd: users.reduce((s, u) => s + u.costUsd, 0),
      totalCostBrl: users.reduce((s, u) => s + u.costBrl, 0),
      avgCostPerUser: users.length > 0 ? users.reduce((s, u) => s + u.costBrl, 0) / users.length : 0,
      topUserName: '',
      topUserCost: 0,
      totalTokens: users.reduce((s, u) => s + u.totalTokens, 0),
      totalQuizzes: users.reduce((s, u) => s + u.quizzes, 0),
      totalMindmaps: users.reduce((s, u) => s + u.mindmaps, 0),
      totalFlashcards: users.reduce((s, u) => s + u.flashcards, 0),
      totalActions: users.reduce((s, u) => s + u.totalActions, 0),
      criticalCount: users.filter(u => u.status === 'critical').length,
    }

    if (users.length > 0) {
      const top = users.reduce((max, u) => u.costBrl > max.costBrl ? u : max, users[0])
      summary.topUserName = top.fullName || top.email || top.userId
      summary.topUserCost = top.costBrl
    }

    // 9. Sort
    const sortKey = sortBy as keyof AiCostUser
    users.sort((a, b) => {
      const aVal = a[sortKey] ?? 0
      const bVal = b[sortKey] ?? 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal
      }
      return sortDirection === 'desc'
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal))
    })

    // 10. Paginate
    const totalCount = users.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const from = (page - 1) * pageSize
    const paginatedUsers = users.slice(from, from + pageSize)

    return {
      success: true,
      users: paginatedUsers,
      summary,
      totalCount,
      totalPages,
    }
  } catch (err: any) {
    console.error('[Admin AI Costs Error]', err)
    return {
      success: false,
      error: err.message,
      users: [],
      summary: {
        totalCostBrl: 0, totalCostUsd: 0, avgCostPerUser: 0,
        topUserName: '', topUserCost: 0, totalTokens: 0,
        totalQuizzes: 0, totalMindmaps: 0, totalFlashcards: 0,
        totalActions: 0, criticalCount: 0,
      },
      totalCount: 0,
      totalPages: 0,
    }
  }
}

// --- User Detail ---
export interface AiCostLogEntry {
  id: string
  actionType: string
  modelName: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
  costBrl: number
  createdAt: string
}

export async function getUserAiLogs(userId: string, limit = 50): Promise<{ success: boolean; logs: AiCostLogEntry[]; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    const logs: AiCostLogEntry[] = (data || []).map(log => {
      const input = log.prompt_tokens || 0
      const output = log.completion_tokens || 0
      const costUsd = calcCostUsd(log.model_name, input, output)

      return {
        id: log.id,
        actionType: log.action_type,
        modelName: log.model_name,
        inputTokens: input,
        outputTokens: output,
        totalTokens: log.total_tokens || 0,
        costUsd,
        costBrl: costUsd * USD_TO_BRL,
        createdAt: log.created_at,
      }
    })

    return { success: true, logs }
  } catch (err: any) {
    console.error('[User AI Logs Error]', err)
    return { success: false, logs: [], error: err.message }
  }
}
