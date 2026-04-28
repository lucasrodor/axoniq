'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  X, 
  CheckCircle2, 
  Loader2,
  BookOpen,
  HelpCircle,
  Network,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { useGeneration } from '@/providers/GenerationProvider'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function BackgroundGenerationWidget() {
  const { generations, removeGeneration, toggleMinimize } = useGeneration()
  const router = useRouter()

  if (generations.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence>
        {generations.map((gen) => (
          <motion.div
            key={gen.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "pointer-events-auto bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300",
              gen.isMinimized ? "w-64" : "w-80"
            )}
          >
            {/* Header */}
            <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1.5 bg-blue-600/10 rounded-lg text-blue-500">
                  <Brain size={16} />
                </div>
                <span className="text-xs font-bold text-zinc-100 truncate">{gen.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => toggleMinimize(gen.id)}
                  className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 transition-colors"
                >
                  {gen.isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button 
                  onClick={() => removeGeneration(gen.id)}
                  className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded-md text-zinc-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            {!gen.isMinimized && (
              <div className="p-4 space-y-3">
                <StatusRow 
                  icon={<Sparkles size={14} />} 
                  label="Extração" 
                  status={gen.status.source} 
                />
                {gen.config.generateFlashcards && (
                  <StatusRow 
                    icon={<BookOpen size={14} />} 
                    label="Flashcards" 
                    status={gen.status.flashcards}
                    link={gen.status.deckId ? `/dashboard/deck/${gen.status.deckId}` : undefined}
                  />
                )}
                {gen.config.generateQuiz && (
                  <StatusRow 
                    icon={<HelpCircle size={14} />} 
                    label="Quiz" 
                    status={gen.status.quiz}
                    link={gen.status.quizId ? `/dashboard/quiz/${gen.status.quizId}` : undefined}
                  />
                )}
                {gen.config.generateMindMap && (
                  <StatusRow 
                    icon={<Network size={14} />} 
                    label="Mapa Mental" 
                    status={gen.status.mindmap}
                    link={gen.status.mindmapId ? `/dashboard/mindmap/${gen.status.mindmapId}` : undefined}
                  />
                )}

                {/* Completion Action */}
                {Object.values(gen.status).every(s => s === 'done' || s === 'waiting' || typeof s === 'string') && (
                  <div className="pt-2">
                    <button 
                      onClick={() => removeGeneration(gen.id)}
                      className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-500/20 transition-all"
                    >
                      Dispensar Notificação
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Progress Bar (Visible even when minimized) */}
            <div className="h-1 w-full bg-zinc-800">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${calculateProgress(gen)}%` }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function StatusRow({ icon, label, status, link }: { icon: React.ReactNode, label: string, status: any, link?: string }) {
  const router = useRouter()
  
  return (
    <div className="flex items-center justify-between gap-3 group">
      <div className="flex items-center gap-2">
        <div className={cn(
          "p-1.5 rounded-md",
          status === 'done' ? "bg-emerald-500/10 text-emerald-500" : 
          status === 'loading' ? "bg-blue-500/10 text-blue-500" : "bg-zinc-800 text-zinc-500"
        )}>
          {icon}
        </div>
        <span className="text-[11px] font-bold text-zinc-300">{label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {status === 'loading' && <Loader2 size={12} className="animate-spin text-blue-500" />}
        {status === 'done' && (
          link ? (
            <button 
              onClick={() => router.push(link)}
              className="p-1 bg-emerald-500/10 text-emerald-500 rounded-md hover:bg-emerald-500/20 transition-all flex items-center gap-1 group/btn"
            >
              <span className="text-[9px] font-black uppercase tracking-tighter hidden group-hover:block animate-in fade-in slide-in-from-right-1">Abrir</span>
              <ArrowRight size={10} />
            </button>
          ) : (
            <CheckCircle2 size={12} className="text-emerald-500" />
          )
        )}
        {status === 'error' && <span className="text-[10px] text-red-500 font-bold">Erro</span>}
        {status === 'waiting' && <div className="w-2 h-2 rounded-full bg-zinc-800" />}
      </div>
    </div>
  )
}

function calculateProgress(gen: any) {
  const tasks = [
    { s: gen.status.source, weight: 1 },
    gen.config.generateFlashcards && { s: gen.status.flashcards, weight: 1 },
    gen.config.generateQuiz && { s: gen.status.quiz, weight: 1 },
    gen.config.generateMindMap && { s: gen.status.mindmap, weight: 1 }
  ].filter(Boolean) as { s: string, weight: number }[]

  const completed = tasks.filter(t => t.s === 'done').length
  const loading = tasks.filter(t => t.s === 'loading').length
  
  return ((completed + (loading * 0.5)) / tasks.length) * 100
}
