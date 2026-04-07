'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState, use } from 'react'
import {
  ChevronLeft,
  RotateCw,
  CheckCircle,
  XCircle,
  Zap,
  Brain,
  Clock,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Dynamically import MarkdownDisplay to avoid Turbopack bundling issues/panics
const MarkdownDisplay = dynamic(() => import('@/components/ui/markdown-display'), { ssr: false })
import {
  calculateNextReview,
  getCardStage,
  getStageLabel,
  type Quality,
  type CardStage,
} from '@/lib/study/spaced-repetition'

interface Flashcard {
  id: string
  front: string
  back: string
  type?: 'standard' | 'cloze'
  ease_factor: number
  interval: number
  repetition: number
  due_date: string
}

export default function StudyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [stats, setStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  })

  useEffect(() => {
    async function loadDueCards() {
      if (!user?.id) return

      try {
        const now = new Date().toISOString()

        const { data, error } = await supabase
          .from('flashcards')
          .select('id, front, back, type, ease_factor, interval, repetition, due_date')
          .eq('deck_id', id)
          .lte('due_date', now)
          .order('due_date', { ascending: true })

        if (error) throw error

        setCards(data || [])
        // If cards are re-fetched mid-session, ensure current index is valid
        setCurrentIndex(0)
      } catch (error) {
        console.error('Error loading due cards:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDueCards()
  }, [user?.id, id])

  const handleAnswer = async (quality: Quality) => {
    const card = cards[currentIndex]
    setSaving(true)

    try {
      const result = calculateNextReview(
        {
          ease_factor: card.ease_factor,
          interval: card.interval,
          repetition: card.repetition,
        },
        quality
      )

      // Persist to Supabase
      await Promise.all([
        supabase
          .from('flashcards')
          .update({
            ease_factor: result.ease_factor,
            interval: result.interval,
            repetition: result.repetition,
            due_date: result.due_date,
          })
          .eq('id', card.id),
        
        // Log history for Phase 3 Analytics
        user?.id && supabase
          .from('flashcard_reviews')
          .insert({
            card_id: card.id,
            user_id: user.id,
            quality: quality
          })
      ])

      // Track stats
      const label =
        quality === 1
          ? 'again'
          : quality === 3
            ? 'hard'
            : quality === 4
              ? 'good'
              : 'easy'

      setStats((prev) => ({ ...prev, [label]: prev[label] + 1 }))
    } catch (error) {
      console.error('Error saving review:', error)
    } finally {
      setSaving(false)
    }

    // Advance to next card
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false)
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150)
    } else {
      setSessionComplete(true)
      toast('Sessão concluída! Bom trabalho.', 'success')
    }
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Carregando sessão...
          </p>
        </div>
      </div>
    )
  }

  // --- Session Complete ---
  if (sessionComplete) {
    const total = stats.again + stats.hard + stats.good + stats.easy
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-6">
          <CheckCircle size={40} />
        </div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Sessão Concluída!
        </h1>
        <p className="text-[var(--muted-foreground)] mb-8">
          Você revisou {total} {total === 1 ? 'carta' : 'cartas'}.
        </p>

        <div className="grid grid-cols-4 gap-4 mb-10 w-full max-w-md">
          <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
            <p className="text-xl font-bold text-red-500">{stats.again}</p>
            <p className="text-[10px] uppercase tracking-wider text-red-400 mt-1">
              Errei
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
            <p className="text-xl font-bold text-orange-500">{stats.hard}</p>
            <p className="text-[10px] uppercase tracking-wider text-orange-400 mt-1">
              Difícil
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
            <p className="text-xl font-bold text-green-500">{stats.good}</p>
            <p className="text-[10px] uppercase tracking-wider text-green-400 mt-1">
              Acertei
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <p className="text-xl font-bold text-blue-500">{stats.easy}</p>
            <p className="text-[10px] uppercase tracking-wider text-blue-400 mt-1">
              Fácil
            </p>
          </div>
        </div>

        <Link href={`/dashboard/deck/${id}`}>
          <Button size="lg">Voltar ao Deck</Button>
        </Link>
      </div>
    )
  }

  // --- No Due Cards ---
  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-6">
          <Clock size={40} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Nenhum card pendente!
        </h1>
        <p className="text-[var(--muted-foreground)] mb-8 max-w-sm">
          Todos os cards deste deck já foram revisados. Volte mais tarde quando
          novas revisões estiverem agendadas.
        </p>
        <Link href={`/dashboard/deck/${id}`}>
          <Button size="lg">Voltar ao Deck</Button>
        </Link>
      </div>
    )
  }

  // --- Study Session ---
  const currentCard = cards[currentIndex]
  
  if (!currentCard) {
    // Failsafe in case currentIndex goes out of bounds unexpectedly
    return (
       <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[var(--muted-foreground)]">Sincronizando sessão...</p>
      </div>
    )
  }
  
  const stage = getCardStage(currentCard)

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#09090B] relative overflow-hidden selection:bg-blue-500/30">
      {/* Background Aurora */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />
      {/* Header / Progress */}
      <div className="flex justify-center p-3 border-b border-zinc-900 bg-zinc-950/30 backdrop-blur-sm z-10 w-full">
        <div className="w-full max-w-xl grid grid-cols-3 items-center">
        <div className="flex justify-start">
          <Link href={`/dashboard/deck/${id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900/50 transition-all rounded-xl px-4"
            >
              <ChevronLeft size={18} className="mr-2" /> PAINEL
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">
            PROGRESSO: {currentIndex + 1} / {cards.length}
          </span>
          <div className="w-full max-w-[140px] sm:max-w-xs h-1 bg-zinc-900 rounded-full mt-1.5 sm:mt-2 overflow-hidden border border-zinc-800/50">
            <div
              className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-300 rounded-full"
              style={{
                width: `${((currentIndex + 1) / cards.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex justify-end invisible md:visible">
          {/* Spacer to keep center balanced */}
          <div className="w-[100px]" />
        </div>
      </div>
</div>

      {/* Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center pt-4 pb-2">

        <div
          className="relative w-full max-w-xl aspect-[3/2.2] cursor-pointer"
          style={{ perspective: '1000px' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="w-full h-full relative"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{
              duration: 0.6,
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 bg-zinc-900/60 border border-zinc-800/80 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl flex flex-col items-center justify-center p-8 sm:p-12 text-center overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-full max-h-full overflow-y-auto custom-scrollbar flex items-center justify-center">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-100 leading-normal px-4 sm:px-6 flex items-center justify-center text-center">
                  <MarkdownDisplay content={currentCard.front} raw={true} className="text-inherit !leading-inherit" />
                </h2>
              </div>
              <div className="absolute bottom-6 text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2 opacity-50">
                <RotateCw size={10} /> Clique para virar
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 bg-zinc-950/80 border border-zinc-800/80 rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.05)] backdrop-blur-3xl flex items-center justify-center p-8 sm:p-12 text-center overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="w-full max-h-full overflow-y-auto custom-scrollbar flex items-center justify-center">
                <div className="text-lg sm:text-2xl text-zinc-300 leading-normal font-medium max-w-[95%] flex items-center justify-center text-center">
                  <MarkdownDisplay content={currentCard.back} raw={true} className="text-inherit !leading-inherit" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-auto py-2 flex justify-center z-20">
        <div className="w-full max-w-xl px-6">
          {!isFlipped ? (
            <Button
              size="lg"
              className="w-full text-[10px] h-14 sm:h-16 flex items-center justify-center font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] rounded-[1.5rem] sm:rounded-[2rem] bg-blue-600/10 text-blue-400 border border-blue-500/30 hover:bg-blue-600/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all hover:-translate-y-1 active:scale-95 group px-4"
              onClick={() => setIsFlipped(true)}
            >
              MOSTRAR RESPOSTA <Zap className="ml-2 sm:ml-3 group-hover:animate-pulse" size={16} />
            </Button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <button
                disabled={saving}
                onClick={() => handleAnswer(1)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
              >
                <XCircle size={22} />
                <span className="text-xs font-semibold">Errei</span>
                <span className="text-[10px] text-red-400">&lt;1min</span>
              </button>
              <button
                disabled={saving}
                onClick={() => handleAnswer(3)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-orange-200 dark:border-orange-900/50 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors disabled:opacity-50"
              >
                <Brain size={22} />
                <span className="text-xs font-semibold">Difícil</span>
                <span className="text-[10px] text-orange-400">
                  {currentCard.repetition === 0
                    ? '1d'
                    : `${Math.round(currentCard.interval * 1.2)}d`}
                </span>
              </button>
              <button
                disabled={saving}
                onClick={() => handleAnswer(4)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-green-200 dark:border-green-900/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={22} />
                <span className="text-xs font-semibold">Acertei</span>
                <span className="text-[10px] text-green-400">
                  {currentCard.repetition === 0
                    ? '1d'
                    : currentCard.repetition === 1
                      ? '6d'
                      : `${Math.round(currentCard.interval * currentCard.ease_factor)}d`}
                </span>
              </button>
              <button
                disabled={saving}
                onClick={() => handleAnswer(5)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50"
              >
                <Zap size={22} />
                <span className="text-xs font-semibold">Fácil</span>
                <span className="text-[10px] text-blue-400">
                  {currentCard.repetition === 0
                    ? '1d'
                    : currentCard.repetition === 1
                      ? '6d'
                      : `${Math.round(currentCard.interval * currentCard.ease_factor * 1.3)}d`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
