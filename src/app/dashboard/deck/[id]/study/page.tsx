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
    <div className="min-h-screen bg-[var(--background)] flex flex-col relative overflow-hidden">
      {/* Header / Progress */}
      <div className="p-6 flex items-center justify-between z-10">
        <Link href={`/dashboard/deck/${id}`}>
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--muted-foreground)]"
          >
            <ChevronLeft />
          </Button>
        </Link>
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            {currentIndex + 1} / {cards.length}
          </span>
          <div className="w-32 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 rounded-full"
              style={{
                width: `${((currentIndex + 1) / cards.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="w-10" />
      </div>

      {/* Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
        {/* Stage badge */}
        <div className="mb-4">
          <span
            className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${
              stage === 'new'
                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : stage === 'learning'
                  ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : stage === 'mastered'
                    ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'text-green-500 bg-green-50 dark:bg-green-900/20'
            }`}
          >
            {getStageLabel(stage)}
          </span>
        </div>

        <div
          className="relative w-full max-w-2xl aspect-[3/2] cursor-pointer"
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
              className="absolute inset-0 bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-2xl shadow-xl flex items-center justify-center p-8 text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                  {currentCard.type === 'cloze' ? 'Preencha a Lacuna' : 'Pergunta'}
                </span>
                {currentCard.type === 'cloze' && (
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full">
                    Lacuna
                  </span>
                )}
              </div>
              <div className="prose prose-sm md:prose-base dark:prose-invert text-2xl md:text-3xl font-medium text-[var(--foreground)] leading-tight max-w-none prose-img:rounded-xl prose-img:mx-auto">
                <MarkdownDisplay content={currentCard.front} />
              </div>
              <div className="absolute bottom-6 text-xs text-[var(--muted-foreground)] flex items-center gap-1 animate-pulse">
                <RotateCw size={12} /> Clique para virar
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 bg-zinc-50 dark:bg-zinc-950 border border-[var(--border)] rounded-2xl shadow-xl flex items-center justify-center p-8 text-center"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="absolute top-6 left-6 text-xs font-bold text-green-500 uppercase tracking-widest">
                Resposta
              </div>
              <div className="prose prose-sm md:prose-base dark:prose-invert text-xl md:text-2xl text-[var(--muted-foreground)] leading-relaxed max-w-none prose-img:rounded-xl prose-img:mx-auto">
                <MarkdownDisplay content={currentCard.back} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent pt-16">
        <div className="max-w-lg mx-auto">
          {!isFlipped ? (
            <Button
              size="lg"
              className="w-full text-lg h-14 shadow-lg"
              onClick={() => setIsFlipped(true)}
            >
              Mostrar Resposta
            </Button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
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
