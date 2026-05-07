'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { getRetentionStats, type RetentionStats } from '@/lib/study/retention-service'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, Cell
} from 'recharts'
import { 
  Brain, Target, Calendar, Zap, ChevronLeft, 
  Award, Activity, Heart, Microscope, AlertCircle, Crown, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardEmptyState } from '@/components/dashboard/empty-state'
import useSWR from 'swr'
import { dashboardFetcher } from '@/lib/dashboard/fetchers'
import { RetentionSkeleton } from '@/components/dashboard/skeleton'
import { useSubscription } from '@/hooks/useSubscription'
import { UpgradeGate } from '@/components/dashboard/upgrade-gate'

// Specialty Icons Mapping
const specialtyIcons: Record<string, any> = {
  Cardiologia: Heart,
  Neurologia: Brain,
  Pneumologia: Activity,
  Gastroenterologia: Activity,
  Nefrologia: Activity,
  Endocrinologia: Activity,
  Hematologia: Activity,
  Reumatologia: Activity,
  Infectologia: Microscope,
  Anatomia: Microscope,
  Fisiologia: Target,
  Bioquímica: Microscope,
  Farmacologia: Zap,
  Patologia: Microscope,
  Outros: Zap
}

export default function RetentionDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  
  const { data: stats, isLoading, mutate: mutateStats } = useSWR<RetentionStats>(user ? `retention:${user.id}` : null, dashboardFetcher)
  const { isPremium, isAdmin, isLoading: planLoading } = useSubscription()
  const [selectedSpecialty, setSelectedSpecialty] = useState<any | null>(null)
  
  // Listen for refresh events (e.g. after a study session)
  useEffect(() => {
    const handleRefresh = () => {
      if (user?.id) mutateStats()
    }
    window.addEventListener('refresh-dashboard', handleRefresh)
    return () => window.removeEventListener('refresh-dashboard', handleRefresh)
  }, [user?.id, mutateStats])

  // Para teste do Lucas: Se quisermos ver o bloqueio mesmo sendo admin,
  // podemos forçar a verificação de quem NÃO é Pro de fato.
  const loading = (isLoading && !stats) || planLoading

  // Se você quiser testar o bloqueio sendo admin, mude para: !isPremium || isAdmin
  const shouldBlock = !isPremium

  // Custom colors for specialties
  const getSpecialtyColor = (score: number) => {
    if (score >= 80) return '#10B981' // Emerald
    if (score >= 50) return '#3B82F6' // Blue
    return '#EF4444' // Red
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <RetentionSkeleton />
        </div>
      </div>
    )
  }

  if (shouldBlock) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <Link href="/dashboard" className="flex items-center text-zinc-400 hover:text-white transition-colors mb-8 group">
            <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Painel
          </Link>
          <UpgradeGate
            feature="Análise de Desempenho Neural"
            description="Acesse gráficos avançados de retenção, mapeamento por especialidade, heatmaps de estudo e previsão de carga. Exclusivo para assinantes Pro."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center text-zinc-400 hover:text-white transition-colors mb-4 group">
            <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Painel
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Análise de Desempenho Neural</h1>
          <p className="text-zinc-400 text-lg">Mapeamento analítico da sua retenção e esforço de estudo.</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800/80 px-6 py-4 rounded-2xl backdrop-blur-xl flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-xl">
             <Brain className="text-blue-500" size={28} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Progresso Global</p>
            <p className="text-2xl font-bold text-blue-500">{stats?.globalRetention}%</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* STATS OVERVIEW */}
        {!stats || stats.totalCards === 0 ? (
          <div className="md:col-span-12">
            <DashboardEmptyState
              title="Análise Neural Indisponível"
              description="Ainda não há dados suficientes para mapear seu desempenho. Comece a criar e revisar seus flashcards para visualizar suas estatísticas de retenção e maestria."
              icon={Brain}
              actionLabel="CRIAR PRIMEIRO DECK"
              onAction={() => router.push('/dashboard/new')}
              color="blue"
              className="py-20"
            />
          </div>
        ) : (
          <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            <StatMiniCard 
              label="Especialidade Dominante" 
              value={stats?.masteryBySpecialty.length > 0 ? `${stats.masteryBySpecialty[0].score}%` : '0%'} 
              icon={Crown} 
              color="emerald" 
              subLabel={stats?.masteryBySpecialty.length > 0 ? stats.masteryBySpecialty[0].specialty : 'Nenhuma'}
            />
            <StatMiniCard 
              label="Revisões Concluídas" 
              value={stats?.totalReviews || 0} 
              icon={Zap} 
              color="blue" 
              subLabel="Esforço vitalício"
            />
            <StatMiniCard 
              label="Foco Recomendado" 
              value={stats?.masteryBySpecialty.length > 0 ? `${[...stats.masteryBySpecialty].sort((a,b) => a.score - b.score)[0].score}%` : '0%'} 
              icon={AlertCircle} 
              color="red" 
              subLabel={stats?.masteryBySpecialty.length > 0 ? [...stats.masteryBySpecialty].sort((a,b) => a.score - b.score)[0].specialty : 'Nenhuma'}
            />
            <StatMiniCard 
              label="Pico Diário" 
              value={Math.max(0, ...(stats?.heatmapData.map((d: any) => d.count) || []))} 
              icon={Activity} 
              color="amber" 
              subLabel="Máximo em 1 dia"
            />
          </div>
        )}

        {stats && stats.totalCards > 0 && (
          <>
            {/* WORKLOAD FORECAST */}
        <div className="md:col-span-8 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 lg:p-8 backdrop-blur-xl relative shadow-2xl shadow-black/50">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
             <Calendar size={140} />
          </div>
          <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-zinc-100">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar size={20} className="text-blue-500" />
            </div>
            Cronograma de Revisões (Próximos 7 Dias)
          </h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.futureWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717A', fontSize: 12, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#52525B', fontSize: 11 }}
                  tickFormatter={(val) => val === 0 ? '' : val}
                />
                <Tooltip 
                  cursor={{ fill: '#27272A', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#3B82F6' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#barGradient)" 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MASTERY GAUGE */}
        <div className="md:col-span-4 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60 border border-zinc-800/50 rounded-3xl p-6 lg:p-8 flex flex-col items-center justify-center text-center shadow-2xl shadow-black/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5 blur-[80px] pointer-events-none" />
            <h2 className="text-xl font-black mb-2 text-zinc-100 z-10">Mapeamento Neural</h2>
            <p className="text-xs text-zinc-400 mb-6 z-10">Radar de maestria por especialidade</p>
            <div className="h-[260px] w-full z-10">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="75%" data={stats?.masteryBySpecialty.slice(0, 6)}>
                   <PolarGrid stroke="#27272A" strokeDasharray="3 3" />
                   <PolarAngleAxis dataKey="specialty" tick={{ fill: '#A1A1AA', fontSize: 11, fontWeight: 600 }} />
                   <Radar
                     name="Domínio"
                     dataKey="score"
                     stroke="#10B981"
                     strokeWidth={2}
                     fill="#10B981"
                     fillOpacity={0.3}
                   />
                 </RadarChart>
               </ResponsiveContainer>
            </div>
        </div>

        {/* SPECIALTY BREAKDOWN */}
        <div className="md:col-span-12 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 lg:p-8 backdrop-blur-xl">
           <h2 className="text-xl font-black mb-2 text-zinc-100 flex items-center gap-3">
             <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target size={20} className="text-blue-500" />
             </div>
             Maestria Detalhada
           </h2>
           <p className="text-sm text-zinc-400 mb-8 ml-11">Clique em uma especialidade para ver mais detalhes do seu desempenho.</p>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats?.masteryBySpecialty.map((item: any, idx: number) => {
                const Icon = specialtyIcons[item.specialty] || Zap
                const color = getSpecialtyColor(item.score)
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={item.specialty} 
                    onClick={() => setSelectedSpecialty(item)}
                    className="group bg-zinc-950/50 border border-zinc-800/50 p-6 rounded-2xl hover:border-zinc-700/80 hover:bg-zinc-900/50 transition-all duration-300 relative overflow-hidden shadow-lg cursor-pointer hover:-translate-y-1"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full opacity-50" style={{ backgroundColor: color }} />
                    <div className="flex items-center justify-between mb-5">
                       <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border border-zinc-800`} style={{ backgroundColor: `${color}10`, color }}>
                             <Icon size={20} />
                          </div>
                          <span className="font-bold text-zinc-200 text-lg">{item.specialty}</span>
                       </div>
                       <span className="text-xl font-black" style={{ color }}>{item.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${item.score}%` }}
                         transition={{ duration: 1, delay: 0.5 }}
                         className="h-full rounded-full relative" 
                         style={{ backgroundColor: color }}
                       >
                         <div className="absolute inset-0 bg-white/20 w-full h-full" />
                       </motion.div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                       <p className="text-xs font-medium text-zinc-500">Cartões Gerados</p>
                       <p className="text-xs font-black text-zinc-300 bg-zinc-800/50 px-2 py-0.5 rounded-md">{item.count}</p>
                    </div>
                  </motion.div>
                )
              })}
           </div>
        </div>

        {/* ACTIVITY HEATMAP */}
        <div className="md:col-span-12 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 lg:p-8 overflow-hidden backdrop-blur-xl shadow-lg">
            <h2 className="text-xl font-black mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-zinc-100">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Activity size={20} className="text-blue-500" />
                 </div>
                 Frequência de Estudo
              </div>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800/80">Últimos 90 dias</span>
            </h2>
            <div className="flex flex-wrap gap-2 w-full">
               <HeatmapGrid data={stats?.heatmapData || []} />
            </div>
            <div className="mt-8 flex items-center justify-end gap-4 text-xs font-bold text-zinc-500">
               <span>Pouco</span>
               <div className="flex gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-zinc-800/40 border border-zinc-800" />
                  <div className="w-3.5 h-3.5 rounded bg-blue-900/40 border border-blue-900/50" />
                  <div className="w-3.5 h-3.5 rounded bg-blue-700/60 border border-blue-700/50" />
                  <div className="w-3.5 h-3.5 rounded bg-blue-500/80 border border-blue-500/50" />
                  <div className="w-3.5 h-3.5 rounded bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)] border border-blue-300" />
               </div>
               <span>Muito</span>
            </div>
        </div>
          </>
        )}

      </div>
      
      {/* MODAL DETALHADO DA ESPECIALIDADE */}
      <AnimatePresence>
        {selectedSpecialty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSpecialty(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-2xl"
            >
              <button 
                onClick={() => setSelectedSpecialty(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div 
                  className="p-3 rounded-xl border border-zinc-800" 
                  style={{ 
                    backgroundColor: `${getSpecialtyColor(selectedSpecialty.score)}15`,
                    color: getSpecialtyColor(selectedSpecialty.score)
                  }}
                >
                  {(() => {
                    const ModalIcon = specialtyIcons[selectedSpecialty.specialty] || Zap
                    return <ModalIcon size={28} />
                  })()}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{selectedSpecialty.specialty}</h3>
                  <p className="text-zinc-400 text-sm">{selectedSpecialty.count} flashcards gerados no total</p>
                </div>
              </div>

              <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50 mb-8">
                <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-2">Progresso de Domínio</p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black" style={{ color: getSpecialtyColor(selectedSpecialty.score) }}>
                    {selectedSpecialty.score}%
                  </span>
                  <span className="text-zinc-500 mb-1 font-medium">de toda a matéria gerada</span>
                </div>
              </div>

              <h4 className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-4">Mapeamento de Estágios</h4>
              
              <div className="space-y-3">
                <StageRow 
                  label="Novo" 
                  count={selectedSpecialty.stages?.new || 0} 
                  total={selectedSpecialty.count} 
                  color="bg-blue-500" 
                  textColor="text-blue-500"
                />
                <StageRow 
                  label="Aprendendo" 
                  count={selectedSpecialty.stages?.learning || 0} 
                  total={selectedSpecialty.count} 
                  color="bg-orange-500" 
                  textColor="text-orange-500"
                />
                <StageRow 
                  label="Revisão" 
                  count={selectedSpecialty.stages?.review || 0} 
                  total={selectedSpecialty.count} 
                  color="bg-green-500" 
                  textColor="text-green-500"
                />
                <StageRow 
                  label="Dominado" 
                  count={selectedSpecialty.stages?.mastered || 0} 
                  total={selectedSpecialty.count} 
                  color="bg-emerald-500" 
                  textColor="text-emerald-500"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StageRow({ label, count, total, color, textColor }: { label: string, count: number, total: number, color: string, textColor: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  
  return (
    <div className="flex items-center gap-4">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-zinc-300 font-medium w-28">{label}</span>
      <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1 }}
          className={`h-full rounded-full ${color}`} 
        />
      </div>
      <span className={`font-bold w-12 text-right ${textColor}`}>{count}</span>
    </div>
  )
}

function StatMiniCard({ label, value, icon: Icon, color, subLabel }: any) {
  const colors: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    red: 'text-red-500 bg-red-500/10',
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-950/80 border border-zinc-800/50 p-6 rounded-3xl hover:border-zinc-700/80 transition-all duration-300 flex flex-col justify-between h-full shadow-lg hover:shadow-xl hover:-translate-y-1 group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/5 group-hover:scale-110 transition-transform ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{label}</p>
        <p className="text-3xl sm:text-4xl font-black text-zinc-100 mt-2 tracking-tight">{value}</p>
        <p className="text-zinc-500 text-sm mt-2 font-medium bg-zinc-900/80 inline-block px-2 py-0.5 rounded-md border border-zinc-800/50">{subLabel}</p>
      </div>
    </div>
  )
}

function HeatmapGrid({ data }: { data: { date: string, count: number }[] }) {
  // Simple Mock/Logic for 90 days
  const days = Array.from({ length: 91 }, (_, i: number) => {
    const date = new Date()
    date.setDate(date.getDate() - (90 - i))
    // Use local date string YYYY-MM-DD for comparison
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const count = data.find((d: any) => d.date === dateStr)?.count || 0
    return { date, count }
  })

  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-full overflow-x-auto pb-4 custom-scrollbar">
       {days.map((day, i) => {
         let bg = 'bg-zinc-800/40 border border-zinc-800/50'
         if (day.count > 0) bg = 'bg-blue-900/40 border border-blue-900/50'
         if (day.count > 10) bg = 'bg-blue-700/60 border border-blue-700/50'
         if (day.count > 30) bg = 'bg-blue-500/80 border border-blue-500/50'
         if (day.count > 50) bg = 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)] border border-blue-300'
         
         const formattedDate = new Intl.DateTimeFormat('pt-BR', { month: 'short', day: 'numeric' }).format(day.date)
         
         return (
           <div 
             key={i} 
             title={`${day.count} cards em ${formattedDate}`}
             className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] cursor-pointer hover:scale-125 transition-transform ${bg}`} 
           />
         )
       })}
    </div>
  )
}
