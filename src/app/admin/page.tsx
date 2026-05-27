'use client'

import { useEffect, useState } from 'react'
import { getAdminMetrics, deleteWaitlistLead, getWaitlistLeads } from '@/app/actions/admin-dashboard-actions'
import { createAlphaUser } from '@/app/actions/admin-actions'
import { getUsersList, toggleWhitelist } from '@/app/actions/admin-user-actions'
import { getMonetizationStatus, toggleMonetization } from '@/app/actions/system-actions'
import { getPixelMetrics } from '@/app/actions/pixel-actions'
import {
  Users,
  UserPlus,
  UserMinus,
  Clock,
  CheckCircle2,
  Trash2,
  Mail,
  RefreshCcw,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  Search,
  Zap,
  ArrowUpRight,
  Activity,
  Calendar,
  ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { CustomSelect } from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'

interface AdminStats {
  totalUsers: number
  activeProfiles: number
  freeUsers: number
  proUsers: number
  closedEstimate: number
  waitlistCount: number
}

interface WaitlistLead {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [waitlist, setWaitlist] = useState<WaitlistLead[]>(null as any)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const { toast } = useToast()

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'primary',
  })

  // Pagination States
  const [waitlistPage, setWaitlistPage] = useState(1)
  const [waitlistTotalPages, setWaitlistTotalPages] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [isMonetizationActive, setIsMonetizationActive] = useState(true)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  
  const periodOptions = [
    { value: 'all', label: 'Todo o Período' },
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: '7days', label: 'Últimos 7 dias' },
    { value: '30days', label: 'Últimos 30 dias' },
    { value: 'this_month', label: 'Este Mês' },
    { value: 'custom', label: 'Personalizado' },
  ]

  const [pixelMetrics, setPixelMetrics] = useState<any[]>([])
  const [pixelLoading, setPixelLoading] = useState(false)
  const [pixelPeriod, setPixelPeriod] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'custom'>('all')
  const [pixelStartDate, setPixelStartDate] = useState('')
  const [pixelEndDate, setPixelEndDate] = useState('')

  async function loadMetrics() {
    setLoading(true)
    const result = await getAdminMetrics()
    if (result.success && result.data) {
      setStats(result.data.metrics)
    } else {
      toast(result.error || 'Não foi possível buscar as métricas.', 'error')
    }
    setLoading(false)
  }

  async function loadPixelMetrics() {
    setPixelLoading(true)
    const result = await getPixelMetrics()
    if (result.success && result.data) {
      setPixelMetrics(result.data)
    }
    setPixelLoading(false)
  }

  async function loadWaitlist(page: number) {
    setWaitlistLoading(true)
    const result = await getWaitlistLeads(page)
    if (result.success && result.data) {
      setWaitlist(result.data as WaitlistLead[])
      setWaitlistTotalPages(result.totalPages || 1)
    }
    setWaitlistLoading(false)
  }

  async function loadUsers(page: number, search: string = '') {
    setUsersLoading(true)
    const result = await getUsersList(page, 10, search)
    if (result.success && result.data) {
      setUsers(result.data)
      setUsersTotalPages(result.totalPages || 1)
    }
    setUsersLoading(false)
  }

  async function loadSettings() {
    const active = await getMonetizationStatus()
    setIsMonetizationActive(active)
  }

  useEffect(() => {
    loadMetrics()
    loadWaitlist(1)
    loadUsers(1)
    loadSettings()
    loadPixelMetrics()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1, userSearchTerm)
      setUsersPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [userSearchTerm])

  const handleApprove = async (lead: WaitlistLead) => {
    setConfirmModal({
      isOpen: true,
      title: 'Aprovar Lead Alpha',
      message: `Deseja aprovar e enviar convite Alpha para ${lead.email}?`,
      type: 'primary',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        setProcessingId(lead.id)
        const result = await createAlphaUser(lead.email)
        
        if (result.success) {
          toast(`Convite enviado para ${lead.email}`, 'success')
          await deleteWaitlistLead(lead.id)
          loadMetrics()
          loadWaitlist(waitlistPage)
        } else {
          toast(result.error || 'Erro ao convidar lead.', 'error')
        }
        setProcessingId(null)
      }
    })
  }

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remover Lead',
      message: 'Tem certeza que deseja remover este lead da lista? Esta ação não pode ser desfeita.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        setProcessingId(id)
        const result = await deleteWaitlistLead(id)
        if (result.success) {
          toast('Lead removido com sucesso!', 'success')
          loadMetrics()
          loadWaitlist(waitlistPage)
        } else {
          toast(result.error || 'Erro ao remover lead.', 'error')
        }
        setProcessingId(null)
      }
    })
  }

  // Group pixel metrics by date
  const groupedMetrics = (pixelMetrics || []).reduce((acc: any, item: any) => {
    const dateStr = item.event_date
    if (!acc[dateStr]) {
      acc[dateStr] = {}
    }
    acc[dateStr][item.event_name] = item.count
    return acc
  }, {})

  const sortedDates = Object.keys(groupedMetrics).sort((a, b) => b.localeCompare(a))

  // Filter dates based on active period
  const getFilteredDates = () => {
    const todayObj = new Date()
    const formatDate = (date: Date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
    
    const todayStr = formatDate(todayObj)
    
    const yesterdayObj = new Date()
    yesterdayObj.setDate(todayObj.getDate() - 1)
    const yesterdayStr = formatDate(yesterdayObj)
    
    const sevenDaysAgoObj = new Date()
    sevenDaysAgoObj.setDate(todayObj.getDate() - 7)
    const sevenDaysAgoStr = formatDate(sevenDaysAgoObj)
    
    const thirtyDaysAgoObj = new Date()
    thirtyDaysAgoObj.setDate(todayObj.getDate() - 30)
    const thirtyDaysAgoStr = formatDate(thirtyDaysAgoObj)
    
    const startOfMonthStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-01`

    return sortedDates.filter((dateStr) => {
      if (pixelPeriod === 'today') return dateStr === todayStr
      if (pixelPeriod === 'yesterday') return dateStr === yesterdayStr
      if (pixelPeriod === '7days') return dateStr >= sevenDaysAgoStr && dateStr <= todayStr
      if (pixelPeriod === '30days') return dateStr >= thirtyDaysAgoStr && dateStr <= todayStr
      if (pixelPeriod === 'this_month') return dateStr >= startOfMonthStr && dateStr <= todayStr
      if (pixelPeriod === 'custom') {
        let matches = true
        if (pixelStartDate) matches = matches && dateStr >= pixelStartDate
        if (pixelEndDate) matches = matches && dateStr <= pixelEndDate
        return matches
      }
      return true // 'all'
    })
  }

  const filteredDates = getFilteredDates()

  // Compute totals for the filtered dates
  const totals = filteredDates.reduce((acc: any, dateStr: string) => {
    const dateMetrics = groupedMetrics[dateStr]
    Object.keys(dateMetrics).forEach((eventName) => {
      acc[eventName] = (acc[eventName] || 0) + dateMetrics[eventName]
    })
    return acc
  }, { PageView: 0, ViewContent: 0, Lead: 0, CompleteRegistration: 0, InitiateCheckout: 0, Purchase: 0 })

  const filteredWaitlist = (waitlist || []).filter((lead: any) => 
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-zinc-100 p-6 md:p-10">
      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${confirmModal.type === 'danger' ? 'bg-red-500/10' : 'bg-blue-500/10'} blur-3xl -mr-16 -mt-16`} />
              
              <h3 className="text-xl font-bold mb-2 relative z-10">{confirmModal.title}</h3>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed relative z-10">
                {confirmModal.message}
              </p>

              <div className="flex items-center gap-3 relative z-10">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-black/20 ${
                    confirmModal.type === 'danger' 
                      ? 'bg-red-600 hover:bg-red-500 text-white' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Painel do Administrador</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Axoniq Command Center</h1>
        </div>

        {/* Launch Control Switch */}
        <div className="flex items-center gap-6 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-3 px-6 rounded-3xl shadow-2xl ring-1 ring-white/5 order-last md:order-none w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-0.5">Configuração de Cobrança</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isMonetizationActive ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
              <span className={cn(
                "text-xs font-black uppercase tracking-tight",
                isMonetizationActive ? "text-emerald-500" : "text-red-500"
              )}>
                {isMonetizationActive ? "Status: Cobrança Ativa" : "Status: Modo Gratuito"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 border-l border-zinc-800 pl-6">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Desativar Cobrança</span>
            <button
              onClick={async () => {
                setIsUpdatingSettings(true)
                const result = await toggleMonetization(isMonetizationActive)
                if (result.success) {
                  setIsMonetizationActive(result.newValue!)
                  toast(`Sistema: ${result.newValue ? 'Cobrança Ativada' : 'Modo Gratuito Ativado'}`, result.newValue ? 'success' : 'warning')
                }
                setIsUpdatingSettings(false)
              }}
              disabled={isUpdatingSettings}
              className={cn(
                "w-14 h-7 rounded-full relative transition-all duration-500 p-1",
                !isMonetizationActive ? "bg-red-600/20 ring-1 ring-red-500/50" : "bg-zinc-800 ring-1 ring-zinc-700"
              )}
            >
              <motion.div
                animate={{ x: !isMonetizationActive ? 28 : 0 }}
                className={cn(
                  "w-5 h-5 rounded-full shadow-lg transition-colors flex items-center justify-center",
                  !isMonetizationActive ? "bg-red-500" : "bg-zinc-600"
                )}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {!isMonetizationActive && <Zap size={10} className="text-white" />}
              </motion.div>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/admin/ai-costs" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            💰 Custos de IA
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
            Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
          <button 
            onClick={() => {
              loadMetrics()
              loadWaitlist(1)
              loadUsers(1)
              loadSettings()
              loadPixelMetrics()
              setWaitlistPage(1)
              setUsersPage(1)
            }}
            disabled={loading || waitlistLoading || usersLoading || pixelLoading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all disabled:opacity-50"
          >
            <RefreshCcw className={`w-5 h-5 ${loading || waitlistLoading || usersLoading || pixelLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Usuários', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Perfis Ativos', value: stats?.activeProfiles || 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Planos Gratuitos', value: stats?.freeUsers || 0, icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Lista de Espera', value: stats?.waitlistCount || 0, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} blur-3xl rounded-full -mr-12 -mt-12 opacity-50 transition-transform group-hover:scale-110`} />
              <card.icon className={`w-8 h-8 ${card.color} mb-4`} />
              <div>
                <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider">{card.label}</p>
                <h3 className="text-4xl font-bold mt-1">
                  {loading ? '...' : card.value}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-10">
          {/* Secondary Stats - User Management */}
          <section className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Gestão de Usuários</h2>
                <p className="text-sm text-zinc-500 mt-1">Gerencie planos e whitelist dos usuários registrados.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Buscar por email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto relative">
              {usersLoading && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-20 flex items-center justify-center">
                  <RefreshCcw className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              )}
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-950/50">
                    <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Usuário</th>
                    <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Plano</th>
                    <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">Whitelist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {(users || []).map((u: any) => (
                    <tr key={u.id} className="group hover:bg-zinc-800/20 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-bold text-zinc-100 text-sm">{u.fullName}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{u.email}</div>
                        <div className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-wider">Inscrito em {new Date(u.created_at).toLocaleDateString('pt-BR')}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                          u.isAdmin 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : u.isWhitelisted || u.subscription?.status === 'active' || u.subscription?.status === 'trialing'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50'
                        }`}>
                          {u.isAdmin ? 'ADMIN' : u.isWhitelisted ? 'WHITELIST' : u.subscription?.status === 'active' ? 'PRO' : u.subscription?.status === 'trialing' ? 'TRIAL' : 'FREE'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        {!u.isAdmin && (
                          <button
                            onClick={async () => {
                              const result = await toggleWhitelist(u.id, u.isWhitelisted)
                              if (result.success) {
                                setUsers(prev => prev.map((p: any) => p.id === u.id ? { ...p, isWhitelisted: result.newValue } : p))
                                toast(`Whitelist ${result.newValue ? 'ativada' : 'removida'} para ${u.email}`, 'success')
                              } else {
                                toast(result.error || 'Erro ao atualizar whitelist.', 'error')
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              u.isWhitelisted
                                ? 'bg-blue-600 text-white hover:bg-blue-500'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700/50'
                            }`}
                          >
                            {u.isWhitelisted ? '✓ Ativo' : 'Ativar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!users || users.length === 0) && !usersLoading && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                        <p className="text-zinc-500">Nenhum usuário encontrado.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Users Pagination */}
            <div className="px-8 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/30">
              <span className="text-xs text-zinc-500">Página {usersPage} de {usersTotalPages}</span>
              <div className="flex gap-2">
                <button 
                  disabled={usersPage === 1 || usersLoading}
                  onClick={() => {
                    const newPage = usersPage - 1
                    setUsersPage(newPage)
                    loadUsers(newPage, userSearchTerm)
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:text-white disabled:opacity-30 transition-all"
                >
                  Anterior
                </button>
                <button 
                  disabled={usersPage >= usersTotalPages || usersLoading}
                  onClick={() => {
                    const newPage = usersPage + 1
                    setUsersPage(newPage)
                    loadUsers(newPage, userSearchTerm)
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:text-white disabled:opacity-30 transition-all"
                >
                  Próximo
                </button>
              </div>
            </div>
          </section>

          {/* Pixel Events Metrics Section */}
          <section className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl relative z-20">
            <div className="p-8 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" /> Rastreamento do Pixel (Meta)
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Quantidade de eventos do Pixel disparados e registrados no banco de dados.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Period Selector */}
                <div className="w-56">
                  <CustomSelect
                    value={pixelPeriod}
                    onChange={(val) => setPixelPeriod(val as any)}
                    options={periodOptions}
                    icon={<Calendar className="w-4 h-4" />}
                  />
                </div>

                {/* Custom Dates Inputs */}
                {pixelPeriod === 'custom' && (
                  <div className="w-72 animate-in fade-in slide-in-from-right-1 duration-200">
                    <DateRangePicker
                      startDate={pixelStartDate}
                      endDate={pixelEndDate}
                      onChange={(start, end) => {
                        setPixelStartDate(start)
                        setPixelEndDate(end)
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-8">
              {pixelLoading ? (
                <div className="py-12 flex justify-center items-center">
                  <RefreshCcw className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : sortedDates.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  Nenhum evento do Pixel registrado até o momento.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary of totals for selected period */}
                  {filteredDates.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8 bg-zinc-950/20 p-6 rounded-2xl border border-zinc-800/40">
                      {[
                        { label: 'PageViews', value: totals.PageView || 0, color: 'text-zinc-400' },
                        { label: 'ViewContents', value: totals.ViewContent || 0, color: 'text-zinc-400' },
                        { label: 'Leads', value: totals.Lead || 0, color: 'text-blue-400' },
                        { label: 'Completes', value: totals.CompleteRegistration || 0, color: 'text-purple-400' },
                        { label: 'InitCheckouts', value: totals.InitiateCheckout || 0, color: 'text-amber-400' },
                        { label: 'Purchases', value: totals.Purchase || 0, color: 'text-emerald-400' },
                      ].map((t) => (
                        <div key={t.label} className="text-center md:text-left bg-zinc-900/10 p-3 rounded-xl border border-zinc-800/20">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">{t.label}</span>
                          <span className={cn("text-2xl font-black block mt-1", t.color)}>{t.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredDates.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500">
                      Nenhum evento do Pixel encontrado para o filtro selecionado.
                    </div>
                  ) : (
                    <>
                      {/* Grid Header */}
                      <div className="hidden md:grid grid-cols-7 gap-4 px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest bg-zinc-950/30 rounded-xl">
                        <div>Data</div>
                        <div className="text-center">PageView</div>
                        <div className="text-center">ViewContent</div>
                        <div className="text-center">Lead</div>
                        <div className="text-center">CompleteReg</div>
                        <div className="text-center">InitCheckout</div>
                        <div className="text-center">Purchase</div>
                      </div>

                      {/* List of dates */}
                      {filteredDates.map((dateStr) => {
                        const dateMetrics = groupedMetrics[dateStr]
                        const parts = dateStr.split('-')
                        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr

                        return (
                          <div key={dateStr} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center p-4 bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/50 rounded-2xl transition-all">
                            <div className="flex items-center gap-2 font-bold text-zinc-300">
                              <Calendar className="w-4 h-4 text-zinc-500 md:hidden" />
                              {formattedDate}
                            </div>
                            
                            {/* PageView */}
                            <div className="flex justify-between md:justify-center items-center gap-2">
                              <span className="text-xs text-zinc-500 md:hidden">PageView:</span>
                              <span className="px-2.5 py-1 bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300">
                                {dateMetrics['PageView'] || 0}
                              </span>
                            </div>

                            {/* ViewContent */}
                            <div className="flex justify-between md:justify-center items-center gap-2">
                              <span className="text-xs text-zinc-500 md:hidden">ViewContent:</span>
                              <span className="px-2.5 py-1 bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300">
                                {dateMetrics['ViewContent'] || 0}
                              </span>
                            </div>

                            {/* Lead */}
                            <div className="flex justify-between md:justify-center items-center gap-2">
                              <span className="text-xs text-zinc-500 md:hidden">Lead:</span>
                              <span className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-semibold",
                                dateMetrics['Lead'] ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-zinc-800 text-zinc-500"
                              )}>
                                {dateMetrics['Lead'] || 0}
                              </span>
                            </div>

                            {/* CompleteRegistration */}
                            <div className="flex justify-between md:justify-center items-center gap-2">
                              <span className="text-xs text-zinc-500 md:hidden">CompleteRegistration:</span>
                              <span className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-semibold",
                                dateMetrics['CompleteRegistration'] ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-zinc-800 text-zinc-500"
                              )}>
                                {dateMetrics['CompleteRegistration'] || 0}
                              </span>
                            </div>

                            {/* InitiateCheckout */}
                            <div className="flex justify-between md:justify-center items-center gap-2">
                              <span className="text-xs text-zinc-500 md:hidden">InitiateCheckout:</span>
                              <span className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-semibold",
                                dateMetrics['InitiateCheckout'] ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-zinc-800 text-zinc-500"
                              )}>
                                {dateMetrics['InitiateCheckout'] || 0}
                              </span>
                            </div>

                            {/* Purchase */}
                            <div className="flex justify-between md:justify-center items-center gap-2">
                              <span className="text-xs text-zinc-500 md:hidden">Purchase:</span>
                              <span className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-bold",
                                dateMetrics['Purchase'] ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 animate-pulse" : "bg-zinc-800 text-zinc-500"
                              )}>
                                {dateMetrics['Purchase'] || 0}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Waitlist Table */}
          <section className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Leads na Lista de Espera</h2>
                <p className="text-sm text-zinc-500 mt-1">Usuários aguardando aprovação para a fase Alpha.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Buscar lead..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto relative">
              {waitlistLoading && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-20 flex items-center justify-center">
                  <RefreshCcw className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              )}
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-950/50">
                    <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome</th>
                    <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Contato</th>
                    <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  <AnimatePresence>
                    {(waitlist || []).filter((lead: any) => lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || lead.name.toLowerCase().includes(searchTerm.toLowerCase())).map((lead) => (
                      <motion.tr 
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-zinc-800/20 transition-colors"
                      >
                        <td className="px-8 py-5">
                          <div className="font-bold text-zinc-100">{lead.name}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">INSCRITO EM {new Date(lead.created_at).toLocaleDateString('pt-BR')}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Mail className="w-3.5 h-3.5 text-zinc-600" />
                            <span className="text-sm">{lead.email}</span>
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">{lead.phone}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApprove(lead)}
                              disabled={processingId === lead.id}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                              {processingId === lead.id ? (
                                <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>Aprovar Alpha <ArrowUpRight className="w-3.5 h-3.5" /></>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(lead.id)}
                              disabled={processingId === lead.id}
                              className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  
                  {(!waitlist || waitlist.length === 0) && !waitlistLoading && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="w-10 h-10 text-zinc-800" />
                          <p className="text-zinc-500">Nenhum lead encontrado.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Waitlist Pagination */}
            <div className="px-8 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/30">
              <span className="text-xs text-zinc-500">Página {waitlistPage} de {waitlistTotalPages}</span>
              <div className="flex gap-2">
                <button 
                  disabled={waitlistPage === 1 || waitlistLoading}
                  onClick={() => {
                    const newPage = waitlistPage - 1
                    setWaitlistPage(newPage)
                    loadWaitlist(newPage)
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:text-white disabled:opacity-30 transition-all"
                >
                  Anterior
                </button>
                <button 
                  disabled={waitlistPage >= waitlistTotalPages || waitlistLoading}
                  onClick={() => {
                    const newPage = waitlistPage + 1
                    setWaitlistPage(newPage)
                    loadWaitlist(newPage)
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:text-white disabled:opacity-30 transition-all"
                >
                  Próximo
                </button>
              </div>
            </div>
          </section>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <UserMinus className="w-5 h-5 text-red-500" /> Estimativa de Contas Fechadas
              </h3>
              <div className="flex items-end gap-4">
                <span className="text-5xl font-bold">{stats?.closedEstimate || 0}</span>
                <span className="text-sm text-zinc-500 mb-2">usuários cadastrados sem atividade/perfil</span>
              </div>
              <p className="text-xs text-zinc-600 mt-4 leading-relaxed">
                Essa métrica reflete o número de registros no Supabase Auth que não possuem um registro correspondente na tabela de perfis (ou seja, usuários que criaram a conta mas não completaram o onboarding).
              </p>
            </section>

            <section className="bg-gradient-to-br from-blue-900/20 to-zinc-900 border border-blue-500/20 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Acesso Alpha</h3>
                <p className="text-sm text-zinc-400">Total de usuários com acesso privilegiado.</p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
                  <UserPlus className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-right">
                  <span className="text-5xl font-bold text-blue-500">{stats?.proUsers || 0}</span>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Alphas Ativos</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
