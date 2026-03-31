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
    <div className="min-h-screen bg-[var(--background)] p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-10">
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
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
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
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-blue-100 dark:border-blue-900/30">
              <Sparkles size={12} />
              Análise Gerada por IA
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] leading-none">
              {report.title}
            </h1>
            <p className="text-lg text-[var(--muted-foreground)] mt-4 max-w-2xl leading-relaxed">
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
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative bg-white dark:bg-zinc-900 border border-[var(--border)] p-8 md:p-10 rounded-3xl shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                <BarChart3 size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Resumo Executivo</h2>
            </div>
            
            <div className="prose prose-blue dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-black prose-li:my-2">
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
          className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Temas para Revisão Imediata</h3>
                <div className="flex flex-wrap gap-2">
                  {report.analysis_json.recommended_topics.map((topic, i) => (
                    <div key={i} className="bg-white/10 dark:bg-zinc-100 px-4 py-2 rounded-xl border border-white/10 dark:border-zinc-200 text-sm font-medium flex items-center gap-2">
                      <ArrowRight size={14} className="text-blue-400" />
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Conselho do Especialista</h3>
                <p className="text-lg font-medium leading-relaxed italic border-l-4 border-blue-500 pl-6 py-2">
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
    emerald: "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/5",
    orange: "border-orange-100 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/5",
    blue: "border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/5",
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={cn("p-8 rounded-3xl border transition-all hover:shadow-lg", colors[color])}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">{icon}</div>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className={cn("w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0", color === 'emerald' ? 'bg-emerald-500' : 'bg-orange-500')} />
            <span className="text-sm leading-relaxed text-[var(--foreground)] font-medium">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
