'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Tilt } from './tilt'
import { getCardStage } from '@/lib/study/spaced-repetition'
import { 
  Heart, 
  Brain as BrainIcon, 
  Baby, 
  Activity, 
  Stethoscope, 
  CircleDot,
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface Flashcard {
  id: string
  ease_factor: number
  interval: number
  repetition: number
  due_date: string
  deck_id: string
}

interface Deck {
  id: string
  title: string
  created_at: string
  folder_id?: string | null
  flashcards?: { count: number }[]
}

interface DeckWithStats extends Deck {
  totalCards: number
  dueCards: number
  masteredCards: number
  progressPercent: number
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

export function CardKebabMenu({ onRename, onDelete }: { onRename: () => void, onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={menuRef} className="relative" style={{ zIndex: open ? 100 : 1 }}>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(!open) }}
        onPointerDown={(e) => e.stopPropagation()}
        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors opacity-100 sm:opacity-0 group-hover/card:opacity-100"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div 
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ transform: 'translateZ(100px)' }}
          className="absolute right-0 top-full mt-2 z-[100] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onRename() }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Pencil size={14} className="text-zinc-500" />
            Renomear
          </button>
          <div className="border-t border-zinc-800" />
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onDelete() }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
            Excluir
          </button>
        </div>
      )}
    </div>
  )
}

export function DeckCard({ 
  deck, 
  onRename, 
  onDelete 
}: { 
  deck: DeckWithStats, 
  onRename?: (id: string, title: string) => void, 
  onDelete?: (id: string, title: string) => void 
}) {
  const isDue = deck.dueCards > 0
  const isMastered = deck.progressPercent >= 80

  const glowColor = isDue 
    ? 'rgba(245, 158, 11, 0.2)' 
    : isMastered 
      ? 'rgba(16, 185, 129, 0.2)' 
      : 'rgba(59, 130, 246, 0.2)'

  const auroraClass = isDue 
    ? "aurora-border-amber" 
    : isMastered 
      ? "aurora-border-emerald" 
      : "aurora-border-blue"

  return (
    <Tilt glowColor={glowColor} className="h-full w-full">
      <div className={cn(
        "group/card h-full glass-panel p-3 sm:p-5 rounded-2xl transition-all duration-500 relative min-w-0 max-w-[400px] mx-auto sm:max-w-none",
        auroraClass
      )}>
        {/* Background Clipping Container for internal glows */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          {/* Glow corner (Secondary glow) */}
          <div className={cn(
            "absolute -top-12 -right-12 w-24 h-24 blur-[40px] opacity-10 transition-all duration-700 group-hover/card:scale-150 group-hover/card:opacity-20",
            isDue ? "bg-amber-500" : isMastered ? "bg-emerald-500" : "bg-blue-500"
          )} />
        </div>

        <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-40 min-w-0 w-full">
          <div className={cn(
            "p-2 sm:p-3 rounded-xl transition-all duration-500 group-hover/card:scale-110 shrink-0",
            isDue ? "bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : 
            isMastered ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : 
            "bg-blue-500/10 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          )}>
            {getSpecialtyIcon(deck.title)}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {isDue && (
              <span className="text-[9px] sm:text-[10px] font-black text-amber-400 bg-amber-500/5 px-2 py-1.5 rounded-lg uppercase tracking-wider border border-amber-500/20">
                REVISAR
              </span>
            )}
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 bg-zinc-950 px-2 py-1.5 rounded-lg uppercase tracking-widest border border-zinc-800 shrink-0">
              {deck.totalCards} cards
            </span>
            {onRename && onDelete && (
              <CardKebabMenu
                onRename={() => onRename(deck.id, deck.title)}
                onDelete={() => onDelete(deck.id, deck.title)}
              />
            )}
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-zinc-100 line-clamp-2 mb-6 group-hover/card:text-blue-400 transition-colors relative z-10 tracking-tight">
          {deck.title}
        </h3>

        <div className="mt-auto relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Domínio de Células</span>
            <span className={cn(
              "text-[10px] font-bold",
              isMastered ? "text-emerald-500" : "text-blue-500"
            )}>{deck.progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${deck.progressPercent}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                isMastered ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 text-[9px] font-bold text-zinc-600 tracking-widest uppercase relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Criado em {new Date(deck.created_at).toLocaleDateString()}</span>
          </div>
          <motion.span 
            animate={{ x: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="text-blue-500 opacity-0 group-hover/card:opacity-100 transition-opacity"
          >
            Acessar Protocolo →
          </motion.span>
        </div>
      </div>
    </Tilt>
  )
}

export function DraggableDeck({ deck, onRename, onDelete }: { deck: DeckWithStats, onRename?: (id: string, title: string) => void, onDelete?: (id: string, title: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `deck-${deck.id}` })
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
        href={`/dashboard/deck/${deck.id}`} 
        className="block h-full"
        onClick={(e) => {
          if (isDragging) e.preventDefault()
        }}
      >
        <DeckCard
          deck={deck}
          onDelete={onDelete}
          onRename={onRename}
        />
      </Link>
    </div>
  )
}
