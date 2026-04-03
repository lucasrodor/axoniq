'use client'

import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Lightbulb,
  Clock,
  Calendar,
  Sparkles,
  BarChart3,
  ArrowRight
} from 'lucide-react'
import MarkdownDisplay from '@/components/ui/markdown-display'
import { motion } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface PerformanceReport {
  id: string
  title: string
  analysis_json: {
    overall_performance: string
    strengths: string[]
    weaknesses: string[]
    recommended_topics: string[]
    error_patterns?: string
  }
  summary_markdown: string
  created_at: string
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReport() {
      if (!params.id) return

      const { data, error } = await supabase
        .from('performance_reports')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error loading report:', error)
      } else {
        setReport(data)
      }
      setLoading(false)
    }

    loadReport()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)] animate-pulse">Carregando análise...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">Relatório não encontrado</h1>
          <p className="text-[var(--muted-foreground)]">O relatório que você está procurando não existe ou você não tem permissão para vê-lo.</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090B] p-6 md:p-12 relative clinical-grid overflow-hidden">
      {/* Decorative Aurora Backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
        {/* Navigation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between"
        >
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="group">
            <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </Button>
          <div className="flex items-center gap-3 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] bg-zinc-950 border border-zinc-800/50 px-6 py-3 rounded-md shadow-xl backdrop-blur-md">
            <Clock size={14} className="text-blue-500" />
            {new Date(report.created_at).toLocaleDateString('pt-BR')} às {new Date(report.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </motion.div>

        {/* Hero Section */}
        <header className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Sparkles size={12} className="animate-pulse" />
              SÍNTESE ANALÍTICA IA
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-100 leading-none">
              {report.title}
            </h1>
            <p className="text-lg text-zinc-400 mt-6 max-w-2xl leading-relaxed font-medium">
              Consolidamos seus dados de estudos recentes para fornecer uma visão estratégica do seu desempenho acadêmico.
            </p>
          </motion.div>
        </header>

        {/* Summary Card (AI Insight) */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group h-full"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative glass-panel border-zinc-800/80 p-10 md:p-14 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-2xl bg-zinc-950/50">
            <div className="flex items-center gap-5 mb-12">
              <div className="p-4 bg-blue-600/20 text-blue-500 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <BarChart3 size={32} />
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-zinc-100 uppercase tracking-[0.05em]">SÍNTESE EXECUTIVA</h2>
            </div>
            
            <div className="prose prose-invert max-w-none prose-p:text-zinc-300 prose-p:leading-[1.8] prose-p:text-lg prose-headings:font-black prose-headings:text-white prose-strong:text-blue-400 prose-li:text-zinc-300">
              <MarkdownDisplay content={report.summary_markdown} />
            </div>
          </div>
        </motion.section>

        {/* Detailed Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <InsightCard 
            title="Pontos Fortes" 
            items={report.analysis_json.strengths} 
            icon={<CheckCircle2 className="text-emerald-500" />} 
            color="emerald"
            delay={0.3}
          />
          {/* Weaknesses */}
          <InsightCard 
            title="Pontos de Atenção" 
            items={report.analysis_json.weaknesses} 
            icon={<AlertCircle className="text-orange-500" />} 
            color="orange"
            delay={0.4}
          />
        </div>

        {/* Recommendations */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel border-blue-500/20 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-xl"
        >
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Lightbulb size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-500 text-white rounded-xl">
                <Target size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Estratégia Recomendada</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/60">Temas para Revisão Imediata</h3>
                <div className="flex flex-wrap gap-3">
                  {report.analysis_json.recommended_topics.map((topic, i) => (
                    <div key={i} className="bg-zinc-950 px-8 py-5 rounded-lg border border-zinc-800 text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-4 text-zinc-100 hover:border-blue-500/30 transition-all hover:bg-zinc-900 group">
                      <ArrowRight size={14} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60">Conselho do Especialista</h3>
                <p className="text-xl font-bold leading-relaxed italic border-l-4 border-emerald-500/50 pl-8 py-4 text-zinc-100 bg-emerald-500/5 rounded-r-2xl">
                  "{report.analysis_json.overall_performance}"
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="pt-10 border-t border-[var(--border)] text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Relatório gerado em parceria com Axoniq AI para auxiliar seu alto desempenho acadêmico.
          </p>
        </footer>
      </div>
    </div>
  )
}

function InsightCard({ title, items, icon, color, delay }: { title: string, items: string[], icon: any, color: string, delay: number }) {
  const colors: any = {
    emerald: "border-emerald-500/20 bg-emerald-500/5",
    orange: "border-orange-500/20 bg-orange-500/5",
    blue: "border-blue-500/20 bg-blue-500/5",
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={cn("p-12 rounded-2xl border transition-all hover:shadow-2xl hover:-translate-y-1 duration-500", colors[color])}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-zinc-950 rounded-2xl shadow-inner border border-zinc-800">{icon}</div>
        <h3 className="font-black text-xl tracking-tight text-white">{title}</h3>
      </div>
      <ul className="space-y-5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-4">
            <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0 shadow-[0_0_10px_currentColor]", color === 'emerald' ? 'bg-emerald-500 text-emerald-500' : 'bg-orange-500 text-orange-500')} />
            <span className="text-sm leading-relaxed text-zinc-100 font-bold">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
