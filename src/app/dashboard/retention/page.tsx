'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { type RetentionStats } from '@/lib/study/retention-service'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend
} from 'recharts'
import {
  Brain, Target, Calendar, Zap, ChevronLeft,
  Activity, Heart, Microscope, AlertCircle, Crown, X,
  Baby, Stethoscope, Scissors, Syringe, Eye, Ear, Bone,
  Thermometer, Pill, Dna, Users, Scale, Radiation, Apple,
  Trophy, Droplet, Smile, Shield, Flame, Maximize2
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
const specialtyIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  // Ciclo Básico
  "Anatomia Humana": Microscope,
  "Anatomia Radiológica": Radiation,
  "Citologia": Microscope,
  "Histologia": Microscope,
  "Embriologia": Baby,
  "Fisiologia": Target,
  "Bioquímica": Microscope,
  "Biologia Celular e Molecular": Dna,
  "Genética Médica": Dna,
  "Genética Clínica": Dna,
  "Microbiologia": Microscope,
  "Parasitologia": Microscope,
  "Imunologia": Shield,
  "Alergologia e Imunologia Clínica": Shield,
  "Farmacologia": Pill,
  "Patologia": Microscope,
  "Biofísica": Zap,

  // Ciclo Clínico / Cirúrgico
  "Cardiologia": Heart,
  "Neurologia": Brain,
  "Pneumologia / Respiratório": Activity,
  "Gastroenterologia": Activity,
  "Endoscopia Digestiva": Activity,
  "Nefrologia": Activity,
  "Endocrinologia": Activity,
  "Hematologia": Droplet,
  "Hematologia Clínica": Droplet,
  "Reumatologia": Bone,
  "Infectologia": Thermometer,
  "Dermatologia": Flame,
  "Psiquiatria": Smile,
  "Saúde Mental": Smile,
  "Pediatria": Baby,
  "Neonatologia": Baby,
  "Ginecologia e Obstetrícia": Heart,
  "Mastologia": Heart,
  "Ortopedia e Traumatologia": Bone,
  "Oftalmologia": Eye,
  "Otorrinolaringologia": Ear,
  "Urologia": Target,
  "Proctologia / Coloproctologia": Activity,
  "Cirurgia Geral": Scissors,
  "Cirurgia Vascular": Scissors,
  "Cirurgia Pediátrica": Scissors,
  "Cirurgia Plástica": Scissors,

  // Geral e Saúde Coletiva
  "Semiologia": Stethoscope,
  "Clínica Médica": Stethoscope,
  "Medicina de Família e Comunidade": Users,
  "Saúde Pública e Coletiva": Users,
  "Medicina Preventiva": Shield,
  "Epidemiologia": Activity,
  "Radiologia e Diagnóstico por Imagem": Radiation,
  "Anestesiologia": Syringe,
  "Emergência e Urgência": Zap,
  "Medicina Intensiva (UTI)": Activity,
  "Medicina Esportiva": Trophy,
  "Nutrologia": Apple,
  "Medicina Legal": Scale,
  "Toxicologia": AlertCircle,
  "Outros": Zap
}

export default function RetentionDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const { data: stats, isLoading, mutate: mutateStats } = useSWR<RetentionStats>(user ? `retention:${user.id}` : null, dashboardFetcher)
  const { isPremium, isLoading: planLoading } = useSubscription()
  const [selectedSpecialty, setSelectedSpecialty] = useState<RetentionStats['masteryBySpecialty'][number] | null>(null)
  const [isRadarZoomed, setIsRadarZoomed] = useState(false)
  const [activityType, setActivityType] = useState<'cards' | 'quizzes'>('cards')

  const formattedCardsData = (() => {
    if (!stats?.dailyActivity?.cards) return []
    return stats.dailyActivity.cards.map(item => {
      const [, month, day] = item.date.split('-')
      return {
        ...item,
        dateFormatted: `${day}/${month}`
      }
    })
  })()

  const formattedQuizzesData = (() => {
    if (!stats?.dailyActivity?.quizzes) return []
    return stats.dailyActivity.quizzes.map(item => {
      const [, month, day] = item.date.split('-')
      return {
        ...item,
        dateFormatted: `${day}/${month}`
      }
    })
  })()

  // Listen for refresh events (e.g. after a study session)
  useEffect(() => {
    const handleRefresh = () => {
      if (user?.id) mutateStats()
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSpecialty(null)
        setIsRadarZoomed(false)
      }
    }
    window.addEventListener('refresh-dashboard', handleRefresh)
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('refresh-dashboard', handleRefresh)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [user?.id, mutateStats])

  const loading = (isLoading && !stats) || planLoading
  const shouldBlock = !isPremium

  // Custom colors for specialties
  const getSpecialtyColor = (score: number) => {
    if (score >= 80) return '#10B981' // Emerald
    if (score >= 50) return '#3B82F6' // Blue
    return '#EF4444' // Red
  }

  const radarData = (() => {
    if (!stats?.masteryBySpecialty) return []
    // Se tiver poucas, mostra todas. Se tiver muitas, limita no card mas mostra todas no zoom.
    return stats.masteryBySpecialty.map(item => ({
      ...item,
      unifiedScore: item.quizScore !== null
        ? Math.round((item.score + item.quizScore) / 2)
        : item.score
    }))
  })()

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
              value={stats?.masteryBySpecialty.length > 0 ? `${[...stats.masteryBySpecialty].sort((a, b) => a.score - b.score)[0].score}%` : '0%'}
              icon={AlertCircle}
              color="red"
              subLabel={stats?.masteryBySpecialty.length > 0 ? [...stats.masteryBySpecialty].sort((a, b) => a.score - b.score)[0].specialty : 'Nenhuma'}
            />
            <StatMiniCard
              label="Pico Diário"
              value={Math.max(0, ...(stats?.heatmapData.map((d: { count: number }) => d.count) || []))}
              icon={Activity}
              color="amber"
              subLabel="Máximo em 1 dia"
            />
          </div>
        )}

        {stats && stats.totalCards > 0 && (
          <>
            {/* WORKLOAD FORECAST */}
            <div className="md:col-span-12 lg:col-span-8 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 lg:p-8 backdrop-blur-xl relative shadow-2xl shadow-black/50">
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
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0.2} />
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
            <div className="md:col-span-12 lg:col-span-4 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60 border border-zinc-800/50 rounded-3xl p-6 lg:p-8 flex flex-col shadow-2xl shadow-black/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 blur-[80px] pointer-events-none" />

              <div className="flex items-start justify-between mb-6 z-10">
                <div className="text-left">
                  <h2 className="text-xl font-black text-zinc-100 tracking-tight">Mapeamento Neural</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Radar de Maestria</p>
                </div>
                <button
                  onClick={() => setIsRadarZoomed(true)}
                  className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-lg"
                  title="Expandir Mapeamento"
                >
                  <Maximize2 size={20} />
                </button>
              </div>

              <div className="h-[260px] w-full z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData.slice(0, 6)}>
                    <PolarGrid stroke="#27272A" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="specialty" tick={{ fill: '#A1A1AA', fontSize: 10, fontWeight: 600 }} />
                    <PolarRadiusAxis domain={[0, 100]} axisLine={false} tick={false} />
                    <Radar
                      name="Domínio"
                      dataKey="unifiedScore"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="#10B981"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DAILY ACTIVITY CHART */}
            <div className="md:col-span-12 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 lg:p-8 backdrop-blur-xl relative shadow-2xl shadow-black/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <h2 className="text-xl font-black flex items-center gap-3 text-zinc-100">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Activity size={20} className="text-blue-500" />
                  </div>
                  Histórico de Atividade (Últimos 30 Dias)
                </h2>
                
                <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 w-fit shrink-0">
                  <button
                    onClick={() => setActivityType('cards')}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                      activityType === 'cards'
                        ? 'bg-zinc-800 text-zinc-100 shadow-md'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Flashcards
                  </button>
                  <button
                    onClick={() => setActivityType('quizzes')}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                      activityType === 'quizzes'
                        ? 'bg-zinc-800 text-zinc-100 shadow-md'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Questões
                  </button>
                </div>
              </div>

              <div className="h-[320px] w-full min-w-0 relative">
                <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                  {activityType === 'cards' ? (
                    <LineChart data={formattedCardsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="dateFormatted"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717A', fontSize: 11, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#52525B', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '12px', color: '#fff' }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
                      />
                      <Line
                        type="monotone"
                        name="Total Resolvido"
                        dataKey="total"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4, stroke: '#3B82F6', strokeWidth: 1, fill: '#18181B' }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        name="Fácil"
                        dataKey="easy"
                        stroke="#10B981"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        name="Bom"
                        dataKey="good"
                        stroke="#3B82F6"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        name="Difícil"
                        dataKey="hard"
                        stroke="#F59E0B"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        name="Errei"
                        dataKey="again"
                        stroke="#EF4444"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </LineChart>
                  ) : (
                    <LineChart data={formattedQuizzesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="dateFormatted"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717A', fontSize: 11, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#52525B', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '12px', color: '#fff' }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
                      />
                      <Line
                        type="monotone"
                        name="Total de Questões"
                        dataKey="totalQuestions"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4, stroke: '#3B82F6', strokeWidth: 1, fill: '#18181B' }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        name="Acertos"
                        dataKey="correctQuestions"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ r: 3, stroke: '#10B981', strokeWidth: 1, fill: '#18181B' }}
                      />
                    </LineChart>
                  )}
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
                {stats?.masteryBySpecialty.map((item: RetentionStats['masteryBySpecialty'][number], idx: number) => {
                  const Icon = specialtyIcons[item.specialty] || Zap

                  // Cálculo unificado idêntico ao do modal
                  const displayScore = item.quizScore !== null
                    ? Math.round((item.score + item.quizScore) / 2)
                    : item.score;
                  const displayColor = getSpecialtyColor(displayScore);

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={item.specialty}
                      onClick={() => setSelectedSpecialty(item)}
                      className="group bg-zinc-950/50 border border-zinc-800/50 p-6 rounded-2xl hover:border-zinc-700/80 hover:bg-zinc-900/50 transition-all duration-300 relative overflow-hidden shadow-lg cursor-pointer hover:-translate-y-1"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full opacity-50" style={{ backgroundColor: displayColor }} />
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border border-zinc-800`} style={{ backgroundColor: `${displayColor}10`, color: displayColor }}>
                            <Icon size={20} />
                          </div>
                          <span className="font-bold text-zinc-200 text-lg">{item.specialty}</span>
                        </div>
                        <span className="text-xl font-black" style={{ color: displayColor }}>{displayScore}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${displayScore}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full rounded-full relative"
                          style={{ backgroundColor: displayColor }}
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
              className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 lg:p-10 shadow-2xl overflow-y-auto custom-scrollbar"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-violet-600 opacity-50" />

              <button
                onClick={() => setSelectedSpecialty(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white transition-all z-30 shadow-xl"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-10 pr-12 sm:pr-0">
                <div
                  className="w-16 h-16 rounded-2xl border border-white/5 flex items-center justify-center shadow-2xl"
                  style={{
                    backgroundColor: `${getSpecialtyColor(selectedSpecialty.score)}15`,
                    color: getSpecialtyColor(selectedSpecialty.score)
                  }}
                >
                  {(() => {
                    const ModalIcon = specialtyIcons[selectedSpecialty.specialty] || Zap
                    return <ModalIcon size={32} />
                  })()}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight">{selectedSpecialty.specialty}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                      {selectedSpecialty.count} flashcards
                    </span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                      {selectedSpecialty.totalQuestions || 0} questões
                    </span>
                  </div>
                </div>
              </div>

              {/* OVERALL PERFORMANCE */}
              <div className="bg-gradient-to-br from-zinc-900/40 to-zinc-950/60 rounded-3xl p-8 border border-zinc-800/50 mb-8 relative group overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Desempenho de Prontidão</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{
                        backgroundColor: getSpecialtyColor(
                          selectedSpecialty.quizScore !== null
                            ? Math.round((selectedSpecialty.score + selectedSpecialty.quizScore) / 2)
                            : selectedSpecialty.score
                        )
                      }} />
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Mastery Level</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-4">
                    <span className="text-6xl font-black leading-none tracking-tighter" style={{
                      color: getSpecialtyColor(
                        selectedSpecialty.quizScore !== null
                          ? Math.round((selectedSpecialty.score + selectedSpecialty.quizScore) / 2)
                          : selectedSpecialty.score
                      )
                    }}>
                      {selectedSpecialty.quizScore !== null
                        ? Math.round((selectedSpecialty.score + selectedSpecialty.quizScore) / 2)
                        : selectedSpecialty.score}%
                    </span>
                    <div className="mb-1 space-y-1">
                      <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Consolidado</p>
                      <div className="h-1 w-24 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-current transition-all duration-1000" style={{
                          width: `${selectedSpecialty.quizScore !== null
                            ? Math.round((selectedSpecialty.score + selectedSpecialty.quizScore) / 2)
                            : selectedSpecialty.score}%`,
                          color: getSpecialtyColor(
                            selectedSpecialty.quizScore !== null
                              ? Math.round((selectedSpecialty.score + selectedSpecialty.quizScore) / 2)
                              : selectedSpecialty.score
                          )
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TWO COLUMN ANALYSIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Column: Flashcards */}
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-3 px-1">
                    <Brain size={16} className="text-blue-500" />
                    <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Retenção Neural</h4>
                  </div>

                  <div className="flex-1 bg-zinc-900/30 rounded-2xl p-6 border border-zinc-800/30 flex flex-col">
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-2xl font-black text-zinc-100">{selectedSpecialty.score}%</span>
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Memória</span>
                    </div>

                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                      <StageRow label="Novo" count={selectedSpecialty.stages?.new || 0} total={selectedSpecialty.count} color="bg-blue-500" textColor="text-blue-500" />
                      <StageRow label="Aprendendo" count={selectedSpecialty.stages?.learning || 0} total={selectedSpecialty.count} color="bg-orange-500" textColor="text-orange-500" />
                      <StageRow label="Revisão" count={selectedSpecialty.stages?.review || 0} total={selectedSpecialty.count} color="bg-green-500" textColor="text-green-500" />
                      <StageRow label="Dominado" count={selectedSpecialty.stages?.mastered || 0} total={selectedSpecialty.count} color="bg-emerald-500" textColor="text-emerald-500" />
                    </div>
                  </div>
                </div>

                {/* Column: Quizzes */}
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-3 px-1">
                    <Target size={16} className="text-emerald-500" />
                    <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Aplicação Prática</h4>
                  </div>

                  {selectedSpecialty.quizScore !== null ? (
                    <div className="flex-1 bg-zinc-900/30 rounded-2xl p-6 border border-zinc-800/30 flex flex-col">
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-2xl font-black text-zinc-100">{selectedSpecialty.quizScore}%</span>
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Acerto</span>
                      </div>

                      <div className="space-y-5 flex-1 flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Questões</span>
                          <span className="text-sm font-black text-zinc-200">{selectedSpecialty.totalQuestions}</span>
                        </div>
                        <div className="h-px bg-zinc-800/50" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</span>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${selectedSpecialty.quizScore > 70 ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'}`}>
                            {selectedSpecialty.quizScore > 70 ? 'Consolidado' : 'Em Evolução'}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-2">
                          Sua performance clínica em {selectedSpecialty.specialty} indica um nível {selectedSpecialty.quizScore > 75 ? 'Excelente' : 'Médio'} de resolução.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 bg-zinc-950 border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center group/quiz min-h-[220px]">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover/quiz:scale-110 transition-transform">
                        <Zap size={20} className="text-zinc-600" />
                      </div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sem Simulados</p>
                      <p className="text-[10px] text-zinc-600 mt-2 max-w-[180px] leading-relaxed">Responda questões para validar sua aplicação prática.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX DO RADAR */}
      <AnimatePresence>
        {isRadarZoomed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRadarZoomed(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-[3rem] p-6 sm:p-8 md:p-12 shadow-2xl overflow-y-auto custom-scrollbar"
            >
              <div className="absolute inset-0 bg-blue-500/5 blur-[120px] pointer-events-none" />

              <button
                onClick={() => setIsRadarZoomed(false)}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all z-30 shadow-xl"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-10 px-8 sm:px-12">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">Mapeamento Neural Completo</h3>
                <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">Visão panorâmica da maestria por especialidade</p>
              </div>

              <div className="h-[300px] sm:h-[400px] md:h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#27272A" />
                    <PolarAngleAxis
                      dataKey="specialty"
                      tick={{ fill: '#A1A1AA', fontSize: 12, fontWeight: 800 }}
                    />
                    <PolarRadiusAxis domain={[0, 100]} axisLine={false} tick={false} />
                    <Radar
                      name="Domínio"
                      dataKey="unifiedScore"
                      stroke="#10B981"
                      strokeWidth={3}
                      fill="#10B981"
                      fillOpacity={0.4}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                              <p className="text-sm font-black text-white mb-1 uppercase tracking-wider">{data.specialty}</p>
                              <p className="text-2xl font-black text-emerald-500">{data.unifiedScore}%</p>
                              <div className="mt-2 flex gap-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{data.count} cards</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-10 flex justify-center">
                <Button
                  onClick={() => setIsRadarZoomed(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl px-12 h-14 font-black uppercase tracking-widest text-xs"
                >
                  Fechar Visualização
                </Button>
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

interface StatMiniCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: 'blue' | 'emerald' | 'amber' | 'red'
  subLabel?: string
}

function StatMiniCard({ label, value, icon: Icon, color, subLabel }: StatMiniCardProps) {
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
  const days = Array.from({ length: 91 }, (_, i: number) => {
    const date = new Date()
    date.setDate(date.getDate() - (90 - i))
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const count = data.find((d: { date: string; count: number }) => d.date === dateStr)?.count || 0
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
