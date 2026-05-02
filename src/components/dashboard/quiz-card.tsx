'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Tilt } from './tilt'
import { 
  Heart, 
  Brain as BrainIcon, 
  Baby, 
  Activity, 
  Stethoscope, 
  CircleDot,
  HelpCircle,
  Trophy
} from 'lucide-react'
import { CardKebabMenu } from './deck-card'

interface Quiz {
  id: string
  title: string
  source_id: string | null
  folder_id: string | null
  specialty_tag: string
  status: 'generating' | 'ready' | 'error'
  created_at: string
  quiz_questions?: { count: number }[]
  totalQuestions: number
  lastScoreHit?: number
  lastScoreTotal?: number
}

const getSpecialtyIcon = (tag: string) => {
  const t = tag?.toLowerCase() || ''
  if (t.includes('cardio')) return <Heart size={14} className="text-red-400" />
  if (t.includes('neuro')) return <BrainIcon size={14} className="text-purple-400" />
  if (t.includes('pediat')) return <Baby size={14} className="text-blue-300" />
  if (t.includes('emerg')) return <Activity size={14} className="text-orange-400" />
  if (t.includes('cirur')) return <Stethoscope size={14} className="text-emerald-400" />
  return <CircleDot size={14} className="text-emerald-400" />
}

export function QuizCard({ 
  quiz, 
  onRename, 
  onDelete 
}: { 
  quiz: Quiz, 
  onRename?: (id: string, title: string) => void, 
  onDelete?: (id: string, title: string) => void 
}) {
  const glowColor = 'rgba(16, 185, 129, 0.2)'
  const isGenerating = quiz.status === 'generating'

  return (
    <Tilt glowColor={glowColor} className="h-full w-full">
      <div className="group/card h-full glass-panel p-3 sm:p-5 rounded-2xl aurora-border-emerald transition-all duration-500 relative min-w-0">
        {/* Background Clipping Container for internal glows */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          {/* Secondary Glow */}
          <div className="absolute -top-12 -right-12 w-24 h-24 blur-[40px] opacity-10 bg-emerald-500 transition-all duration-700 group-hover/card:scale-150 group-hover/card:opacity-20" />
        </div>

        <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-40 w-full min-w-0">
          <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover/card:bg-emerald-500/20 group-hover/card:text-emerald-400 Transition-all duration-500">
            <HelpCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {isGenerating && (
              <span className="text-[9px] sm:text-[10px] font-black text-blue-400 bg-blue-500/5 px-2 py-1 rounded-lg uppercase tracking-wider animate-pulse border border-blue-500/20">
                Sintetizando
              </span>
            )}
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 bg-zinc-950 px-2 py-1.5 rounded-lg uppercase tracking-widest border border-zinc-800 shrink-0">
              {quiz.totalQuestions} Qs
            </span>
            {onRename && onDelete && (
              <CardKebabMenu
                onRename={() => onRename(quiz.id, quiz.title)}
                onDelete={() => onDelete(quiz.id, quiz.title)}
              />
            )}
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-zinc-100 line-clamp-2 mb-4 group-hover/card:text-emerald-400 transition-colors relative z-10 tracking-tight">
          {quiz.title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-2 mb-6 relative z-10">
          <span className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-widest leading-none">
            {getSpecialtyIcon(quiz.specialty_tag)}
            {quiz.specialty_tag || 'Protocolo Geral'}
          </span>
          {quiz.lastScoreHit !== undefined && quiz.lastScoreTotal !== undefined && (
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 uppercase tracking-widest leading-none">
              <Trophy size={10} /> {quiz.lastScoreHit}/{quiz.lastScoreTotal} Acertos
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-auto text-[9px] font-bold text-zinc-600 tracking-widest uppercase relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Criado em {new Date(quiz.created_at).toLocaleDateString()}</span>
          </div>
          <motion.span 
             animate={{ x: [0, 3, 0] }}
             transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="text-emerald-500 opacity-0 group-hover/card:opacity-100 transition-opacity"
          >
            Iniciar Simulação →
          </motion.span>
        </div>
      </div>
    </Tilt>
  )
}

export function DraggableQuiz({ quiz, onRename, onDelete }: { quiz: Quiz, onRename?: (id: string, title: string) => void, onDelete?: (id: string, title: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `quiz-${quiz.id}` })
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 200,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing touch-none select-none h-full",
        isDragging && "opacity-40 scale-95"
      )}
    >
      <Link 
        href={`/dashboard/quiz/${quiz.id}`} 
        className="block h-full"
        onClick={(e) => {
          if (isDragging) e.preventDefault()
        }}
      >
        <QuizCard 
          quiz={quiz} 
          onRename={onRename} 
          onDelete={onDelete} 
        />
      </Link>
    </div>
  )
}
