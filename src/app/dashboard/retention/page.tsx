'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { getRetentionStats, type RetentionStats } from '@/lib/study/retention-service'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, PieChart, Pie
} from 'recharts'
import { 
  Brain, Target, TrendingUp, Calendar, Zap, 
  ChevronLeft, Award, Activity, Heart, Microscope
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardEmptyState } from '@/components/dashboard/empty-state'

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
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<RetentionStats | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return
      try {
        const data = await getRetentionStats(user.id)
        setStats(data)
      } catch (error) {
        console.error('Error loading retention stats:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user?.id])

  // Custom colors for specialties
  const getSpecialtyColor = (score: number) => {
    if (score >= 80) return '#10B981' // Emerald
    if (score >= 50) return '#3B82F6' // Blue
    return '#EF4444' // Red
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-zinc-400 font-medium animate-pulse">Sincronizando Banco de Memória...</p>
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
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Health Memory Score</p>
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
              label="Conteúdo Total" 
              value={stats?.totalCards || 0} 
              icon={Target} 
              color="blue" 
              subLabel="Cards Gerados"
            />
            <StatMiniCard 
              label="Revisões Concluídas" 
              value={stats?.totalReviews || 0} 
              icon={Zap} 
              color="emerald" 
              subLabel="Total na Vida"
            />
            <StatMiniCard 
              label="Domínio Atual" 
              value={stats?.masteryBySpecialty.filter(s => s.score > 70).length || 0} 
              icon={Award} 
              color="amber" 
              subLabel="Especialidades Pro"
            />
            <StatMiniCard 
              label="Pico de Estudo" 
              value={Math.max(...(stats?.heatmapData.map(d => d.count) || [0]))} 
              icon={Activity} 
              color="red" 
              subLabel="Máx Revisões/Dia"
            />
          </div>
        )}

        {stats && stats.totalCards > 0 && (
          <>
            {/* WORKLOAD FORECAST */}
        <div className="md:col-span-8 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 lg:p-8 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Calendar size={120} />
          </div>
          <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Previsão de Carga Próximos 7 Dias
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.futureWorkload}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717A', fontSize: 12 }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '12px' }}
                  itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MASTERY GAUGE */}
        <div className="md:col-span-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 lg:p-8 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-bold mb-6">Mastery Radar</h2>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats?.masteryBySpecialty.slice(0, 6)}>
                   <PolarGrid stroke="#27272A" />
                   <PolarAngleAxis dataKey="specialty" tick={{ fill: '#A1A1AA', fontSize: 10 }} />
                   <Radar
                     name="Domínio"
                     dataKey="score"
                     stroke="#3B82F6"
                     fill="#3B82F6"
                     fillOpacity={0.4}
                   />
                 </RadarChart>
               </ResponsiveContainer>
            </div>
            <p className="text-sm text-zinc-500 mt-4">Nível de retenção por campo médico consolidado.</p>
        </div>

        {/* SPECIALTY BREAKDOWN */}
        <div className="md:col-span-12 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-8">
           <h2 className="text-xl font-bold mb-8">Especialidades e Retenção</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats?.masteryBySpecialty.map((item, idx) => {
                const Icon = specialtyIcons[item.specialty] || Zap
                const color = getSpecialtyColor(item.score)
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={item.specialty} 
                    className="group bg-zinc-950/40 border border-zinc-800/30 p-5 rounded-2xl hover:border-zinc-700/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}15`, color }}>
                             <Icon size={20} />
                          </div>
                          <span className="font-bold text-zinc-200">{item.specialty}</span>
                       </div>
                       <span className="text-sm font-bold" style={{ color }}>{item.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${item.score}%` }}
                         transition={{ duration: 1, delay: 0.5 }}
                         className="h-full rounded-full" 
                         style={{ backgroundColor: color }}
                       />
                    </div>
                    <p className="text-xs text-zinc-500 mt-3">{item.count} Cards no total.</p>
                  </motion.div>
                )
              })}
           </div>
        </div>

        {/* ACTIVITY HEATMAP */}
        <div className="md:col-span-12 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-8 overflow-hidden">
            <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
              Intensidade de Estudo (Volume Diário)
              <span className="text-xs text-zinc-500 font-normal">Últimos 90 dias</span>
            </h2>
            <div className="flex flex-wrap gap-2">
               <HeatmapGrid data={stats?.heatmapData || []} />
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-zinc-500">
               <span>Pouco</span>
               <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-zinc-900" />
                  <div className="w-3 h-3 rounded-sm bg-blue-900/40" />
                  <div className="w-3 h-3 rounded-sm bg-blue-700/60" />
                  <div className="w-3 h-3 rounded-sm bg-blue-500/80" />
                  <div className="w-3 h-3 rounded-sm bg-blue-400" />
               </div>
               <span>Muito</span>
            </div>
        </div>
          </>
        )}

      </div>
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
    <div className="bg-zinc-950/40 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700/50 transition-all flex flex-col justify-between h-full">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-bold text-zinc-100 mt-1">{value}</p>
        <p className="text-zinc-500 text-xs mt-1">{subLabel}</p>
      </div>
    </div>
  )
}

function HeatmapGrid({ data }: { data: { date: string, count: number }[] }) {
  // Simple Mock/Logic for 90 days
  const days = Array.from({ length: 91 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (90 - i))
    const dateStr = date.toISOString().split('T')[0]
    const count = data.find(d => d.date === dateStr)?.count || 0
    return { date, count }
  })

  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-full overflow-x-auto pb-4 scrollbar-none">
       {days.map((day, i) => {
         let bg = 'bg-zinc-900'
         if (day.count > 0) bg = 'bg-blue-900/40'
         if (day.count > 10) bg = 'bg-blue-700/60'
         if (day.count > 30) bg = 'bg-blue-500/80'
         if (day.count > 50) bg = 'bg-blue-400'
         
         return (
           <div 
             key={i} 
             title={`${day.date.toLocaleDateString()}: ${day.count} revisões`}
             className={`w-3 h-3 lg:w-4 lg:h-4 rounded-sm ${bg} transition-colors hover:ring-2 hover:ring-white/20`}
           />
         )
       })}
    </div>
  )
}
