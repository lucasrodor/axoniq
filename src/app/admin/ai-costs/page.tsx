'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAiCosts, getUserAiLogs, type AiCostUser, type AiCostsSummary, type AiCostLogEntry } from '@/app/actions/admin-ai-costs-actions'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  ChevronLeft, RefreshCcw, Search, DollarSign, Cpu, Users,
  Brain, HelpCircle, BookOpen, FileText, Zap, AlertTriangle,
  ChevronDown, X, ArrowUpDown, ChevronRight
} from 'lucide-react'

const STATUS_CONFIG = {
  normal:    { label: 'Normal',   bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  attention: { label: 'Atenção',  bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  high:      { label: 'Alto',     bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20' },
  critical:  { label: 'Crítico',  bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20' },
} as const

const ACTION_LABELS: Record<string, string> = {
  quiz: 'Quiz', mindmap: 'Mapa Mental', flashcards: 'Flashcards',
  report: 'Relatório', document_process: 'Documento', tagging: 'Tagging',
}

function fmt(n: number, decimals = 2) { return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) }
function fmtInt(n: number) { return n.toLocaleString('pt-BR') }

function getPeriodDates(period: string): { startDate?: string; endDate?: string } {
  const now = new Date()
  if (period === 'current_month') {
    return { startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() }
  }
  if (period === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }
  if (period === 'last_7') {
    const d = new Date(now); d.setDate(d.getDate() - 7)
    return { startDate: d.toISOString() }
  }
  if (period === 'last_30') {
    const d = new Date(now); d.setDate(d.getDate() - 30)
    return { startDate: d.toISOString() }
  }
  return {}
}

// --- Stat Card ---
function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-20 h-20 ${color} blur-3xl rounded-full -mr-10 -mt-10 opacity-40`} />
      <Icon className={`w-5 h-5 mb-3 ${color.replace('bg-', 'text-').replace('/10', '')}`} />
      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
      {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}

// --- User Detail Modal ---
function UserDetailModal({ user, onClose }: { user: AiCostUser; onClose: () => void }) {
  const [logs, setLogs] = useState<AiCostLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserAiLogs(user.userId).then(r => { if (r.success) setLogs(r.logs); setLoading(false) })
  }, [user.userId])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold">{user.fullName || user.email}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{user.email} · {user.userId.slice(0, 8)}...</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Custo Total</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">R$ {fmt(user.costBrl)}</p>
              <p className="text-[10px] text-zinc-600">US$ {fmt(user.costUsd, 4)}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Tokens Total</p>
              <p className="text-xl font-bold mt-1">{fmtInt(user.totalTokens)}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ações</p>
              <p className="text-xl font-bold mt-1">{user.totalActions}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Status</p>
              <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-bold mt-1', STATUS_CONFIG[user.status].bg, STATUS_CONFIG[user.status].text, STATUS_CONFIG[user.status].border, 'border')}>
                {STATUS_CONFIG[user.status].label}
              </span>
            </div>
          </div>

          {/* By Model */}
          <div>
            <h4 className="text-sm font-bold mb-3 text-zinc-300">Consumo por Modelo</h4>
            <div className="space-y-2">
              {Object.entries(user.byModel).map(([model, data]) => (
                <div key={model} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
                  <span className="text-sm font-mono text-zinc-300">{model}</span>
                  <div className="flex items-center gap-6 text-xs text-zinc-500">
                    <span>In: {fmtInt(data.input)}</span>
                    <span>Out: {fmtInt(data.output)}</span>
                    <span className="text-zinc-300 font-bold">R$ {fmt(data.cost * 5.20)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Action */}
          <div>
            <h4 className="text-sm font-bold mb-3 text-zinc-300">Consumo por Ação</h4>
            <div className="space-y-2">
              {Object.entries(user.byAction).map(([action, data]) => (
                <div key={action} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
                  <span className="text-sm text-zinc-300">{ACTION_LABELS[action] || action} <span className="text-zinc-600">×{data.count}</span></span>
                  <div className="flex items-center gap-6 text-xs text-zinc-500">
                    <span>{fmtInt(data.total)} tokens</span>
                    <span className="text-zinc-300 font-bold">R$ {fmt(data.cost * 5.20)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Logs */}
          <div>
            <h4 className="text-sm font-bold mb-3 text-zinc-300">Últimas Gerações</h4>
            {loading ? (
              <div className="flex items-center justify-center py-8"><RefreshCcw className="w-5 h-5 text-blue-500 animate-spin" /></div>
            ) : logs.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-8">Nenhum log encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                    <th className="px-3 py-2">Data</th><th className="px-3 py-2">Ação</th><th className="px-3 py-2">Modelo</th>
                    <th className="px-3 py-2 text-right">Input</th><th className="px-3 py-2 text-right">Output</th>
                    <th className="px-3 py-2 text-right">Custo</th>
                  </tr></thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-zinc-800/20">
                        <td className="px-3 py-2.5 text-zinc-400 text-xs">{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                        <td className="px-3 py-2.5 text-zinc-300">{ACTION_LABELS[log.actionType] || log.actionType}</td>
                        <td className="px-3 py-2.5 font-mono text-zinc-500 text-xs">{log.modelName}</td>
                        <td className="px-3 py-2.5 text-right text-zinc-400">{fmtInt(log.inputTokens)}</td>
                        <td className="px-3 py-2.5 text-right text-zinc-400">{fmtInt(log.outputTokens)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-zinc-200">R$ {fmt(log.costBrl, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// --- Main Page ---
export default function AiCostsPage() {
  const [users, setUsers] = useState<AiCostUser[]>([])
  const [summary, setSummary] = useState<AiCostsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [period, setPeriod] = useState('current_month')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sortBy, setSortBy] = useState('costBrl')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Detail modal
  const [selectedUser, setSelectedUser] = useState<AiCostUser | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const dates = getPeriodDates(period)
    const result = await getAiCosts({
      search, status: statusFilter, plan: planFilter,
      ...dates, page, pageSize, sortBy, sortDirection: sortDir,
    })
    if (result.success) {
      setUsers(result.users)
      setSummary(result.summary)
      setTotalPages(result.totalPages)
      setTotalCount(result.totalCount)
    }
    setLoading(false)
  }, [search, statusFilter, planFilter, period, page, pageSize, sortBy, sortDir])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadData() }, 400)
    return () => clearTimeout(t)
  }, [search])

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const SortHeader = ({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) => (
    <th onClick={() => handleSort(col)}
      className={cn("px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors select-none", className)}>
      <span className="flex items-center gap-1">{children}
        {sortBy === col && <ArrowUpDown size={10} className="text-blue-500" />}
      </span>
    </th>
  )

  const periodLabel: Record<string, string> = {
    current_month: 'Mês Atual', last_month: 'Mês Anterior', last_7: 'Últimos 7 dias', last_30: 'Últimos 30 dias', all: 'Tudo',
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-zinc-100 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-[1400px] mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Monitoramento de IA</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Custos de IA</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => { setPeriod(e.target.value); setPage(1) }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50">
            {Object.entries(periodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={loadData} disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all disabled:opacity-50">
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard icon={DollarSign} label="Custo Total (BRL)" value={`R$ ${fmt(summary?.totalCostBrl || 0)}`} sub={`US$ ${fmt(summary?.totalCostUsd || 0, 4)}`} color="bg-emerald-500/10" />
          <StatCard icon={Users} label="Custo Médio/Usuário" value={`R$ ${fmt(summary?.avgCostPerUser || 0)}`} color="bg-blue-500/10" />
          <StatCard icon={Cpu} label="Total Tokens" value={fmtInt(summary?.totalTokens || 0)} color="bg-cyan-500/10" />
          <StatCard icon={Zap} label="Ações de IA" value={fmtInt(summary?.totalActions || 0)}
            sub={`${summary?.totalQuizzes || 0}Q · ${summary?.totalFlashcards || 0}D · ${summary?.totalMindmaps || 0}M · ${(summary?.totalActions || 0) - (summary?.totalQuizzes || 0) - (summary?.totalFlashcards || 0) - (summary?.totalMindmaps || 0)} Outros`} color="bg-amber-500/10" />
          <StatCard icon={AlertTriangle} label="Usuários Críticos" value={String(summary?.criticalCount || 0)}
            sub={summary?.topUserName ? `Top: ${summary.topUserName}` : ''} color="bg-red-500/10" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Buscar por email, nome ou ID..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none">
            <option value="">Todos Status</option>
            <option value="normal">Normal</option><option value="attention">Atenção</option>
            <option value="high">Alto</option><option value="critical">Crítico</option>
          </select>
          <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1) }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none">
            <option value="">Todos Planos</option>
            <option value="free">Free</option><option value="pro">Pro</option><option value="trial">Trial</option>
          </select>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none">
            <option value={10}>10/pág</option><option value={25}>25/pág</option><option value={50}>50/pág</option>
          </select>
        </div>

        {/* Table */}
        <section className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto relative">
            {loading && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-20 flex items-center justify-center">
                <RefreshCcw className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            )}
            <table className="w-full text-left">
              <thead><tr className="bg-zinc-950/50">
                <SortHeader col="fullName">Usuário</SortHeader>
                <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Plano</th>
                <SortHeader col="quizzes" className="text-center">Quiz</SortHeader>
                <SortHeader col="mindmaps" className="text-center">Mapas</SortHeader>
                <SortHeader col="flashcards" className="text-center">Decks</SortHeader>
                <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Outros</th>
                <SortHeader col="totalActions" className="text-center">Total</SortHeader>
                <SortHeader col="inputTokens" className="text-right">Input</SortHeader>
                <SortHeader col="outputTokens" className="text-right">Output</SortHeader>
                <SortHeader col="totalTokens" className="text-right">Tokens</SortHeader>
                <SortHeader col="costBrl" className="text-right">Custo BRL</SortHeader>
                <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Status</th>
                <SortHeader col="lastActivity" className="text-right">Última</SortHeader>
              </tr></thead>
              <tbody className="divide-y divide-zinc-800/50">
                {users.map(u => (
                  <tr key={u.userId} onClick={() => setSelectedUser(u)}
                    className="group hover:bg-zinc-800/20 transition-colors cursor-pointer">
                    <td className="px-4 py-4">
                      <div className="font-bold text-zinc-100 text-sm">{u.fullName || '—'}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border',
                        u.plan === 'pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        u.plan === 'trial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
                      )}>{u.plan}</span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-zinc-300">{u.quizzes}</td>
                    <td className="px-4 py-4 text-center text-sm text-zinc-300">{u.mindmaps}</td>
                    <td className="px-4 py-4 text-center text-sm text-zinc-300">{u.flashcards}</td>
                    <td className="px-4 py-4 text-center text-sm text-zinc-500">
                      {(u.reports || 0) + (u.documentProcess || 0) + (u.tagging || 0)}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-zinc-200">{u.totalActions}</td>
                    <td className="px-4 py-4 text-right text-xs text-zinc-400 font-mono">{fmtInt(u.inputTokens)}</td>
                    <td className="px-4 py-4 text-right text-xs text-zinc-400 font-mono">{fmtInt(u.outputTokens)}</td>
                    <td className="px-4 py-4 text-right text-sm font-bold text-zinc-200 font-mono">{fmtInt(u.totalTokens)}</td>
                    <td className="px-4 py-4 text-right text-sm font-bold text-emerald-400">R$ {fmt(u.costBrl)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn('inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border',
                        STATUS_CONFIG[u.status].bg, STATUS_CONFIG[u.status].text, STATUS_CONFIG[u.status].border
                      )}>{STATUS_CONFIG[u.status].label}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-[10px] text-zinc-500">
                      {u.lastActivity ? new Date(u.lastActivity).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr><td colSpan={12} className="px-8 py-20 text-center">
                    <Cpu className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                    <p className="text-zinc-500">Nenhum dado de uso de IA encontrado para este período.</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/30">
            <span className="text-xs text-zinc-500">{totalCount} usuários · Pág {page}/{totalPages || 1}</span>
            <div className="flex gap-2">
              <button disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:text-white disabled:opacity-30 transition-all">Anterior</button>
              <button disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:text-white disabled:opacity-30 transition-all">Próximo</button>
            </div>
          </div>
        </section>
      </main>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
      </AnimatePresence>
    </div>
  )
}
