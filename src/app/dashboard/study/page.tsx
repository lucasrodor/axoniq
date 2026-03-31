'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState, Suspense } from 'react'
import {
  ChevronLeft,
  RotateCw,
  CheckCircle,
  XCircle,
  Zap,
  Brain,
  Clock,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  calculateNextReview,
  getCardStage,
  getStageLabel,
  type Quality,
} from '@/lib/study/spaced-repetition'

interface Flashcard {
  id: string
  front: string
  back: string
  ease_factor: number
  interval: number
  repetition: number
  due_date: string
  deck_id: string
}

function StudySession() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const deckIds = searchParams.get('decks')?.split(',') || []
  const limit = parseInt(searchParams.get('limit') || '0')

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
      if (!user || deckIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        const now = new Date().toISOString()

        const { data, error } = await supabase
          .from('flashcards')
          .select('id, front, back, ease_factor, interval, repetition, due_date, deck_id')
          .in('deck_id', deckIds)
          .lte('due_date', now)
          .order('due_date', { ascending: true })

        if (error) throw error

        let loadedCards = data || []
        // Shuffle cards for a mixed session
        loadedCards = loadedCards.sort(() => Math.random() - 0.5)
        
        // Apply limit if specified
        if (limit > 0) {
          loadedCards = loadedCards.slice(0, limit)
        }

        setCards(loadedCards)
      } catch (error) {
        console.error('Error loading due cards:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDueCards()
  }, [user])

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

      await supabase
        .from('flashcards')
        .update({
          ease_factor: result.ease_factor,
          interval: result.interval,
          repetition: result.repetition,
          due_date: result.due_date,
        })
        .eq('id', card.id)

      const label = quality === 1 ? 'again' : quality === 3 ? 'hard' : quality === 4 ? 'good' : 'easy'
      setStats((prev) => ({ ...prev, [label]: prev[label] + 1 }))
    } catch (error) {
      console.error('Error saving review:', error)
    } finally {
      setSaving(false)
    }

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false)
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150)
    } else {
      setSessionComplete(true)
      toast('Sessão concluída! Bom trabalho.', 'success')
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[var(--muted-foreground)] uppercase font-bold tracking-widest">Iniciando sessão...</p>
      </div>
    </div>
  )

  if (sessionComplete || (cards.length === 0 && !loading)) {
    const total = stats.again + stats.hard + stats.good + stats.easy
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${cards.length === 0 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
          {cards.length === 0 ? <Clock size={40} /> : <CheckCircle size={40} />}
        </div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          {cards.length === 0 ? 'Nada por aqui!' : 'Sessão Concluída!'}
        </h1>
        <p className="text-[var(--muted-foreground)] mb-8 max-w-xs">
          {cards.length === 0 
            ? 'Não há mais cards pendentes para os decks selecionados.' 
            : `Você revisou ${total} ${total === 1 ? 'carta' : 'cartas'} hoje.`}
        </p>

        {cards.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-10 w-full max-w-md">
            {[
              { label: 'Errei', val: stats.again, color: 'red' },
              { label: 'Difícil', val: stats.hard, color: 'orange' },
              { label: 'Acertei', val: stats.good, color: 'green' },
              { label: 'Fácil', val: stats.easy, color: 'blue' },
            ].map(s => (
              <div key={s.label} className={`text-center p-3 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-900/20`}>
                <p className={`text-xl font-bold text-${s.color}-500`}>{s.val}</p>
                <p className={`text-[10px] uppercase tracking-wider text-${s.color}-400 mt-1`}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <Link href="/dashboard">
          <Button size="lg" variant="primary">Voltar ao Painel</Button>
        </Link>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  const stage = getCardStage(currentCard)

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col relative overflow-hidden">
      <div className="p-6 flex items-center justify-between z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[var(--muted-foreground)]">
          <ChevronLeft />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            {currentIndex + 1} / {cards.length}
          </span>
          <div className="w-32 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-300 rounded-full" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
          </div>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
        <div className="mb-6">
          <span className={`text-[10px] uppercase font-bold tracking-widest px-4 py-1.5 rounded-full border shadow-sm ${
            stage === 'new' ? 'text-blue-500 bg-blue-50 border-blue-100' : 
            stage === 'learning' ? 'text-orange-500 bg-orange-50 border-orange-100' : 
            'text-emerald-500 bg-emerald-50 border-emerald-100'
          }`}>
            {getStageLabel(stage)}
          </span>
        </div>

        <div className="relative w-full max-w-2xl aspect-[4/3] md:aspect-[3/2] cursor-pointer group" style={{ perspective: '1200px' }} onClick={() => setIsFlipped(!isFlipped)}>
          <motion.div className="w-full h-full relative" animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }} style={{ transformStyle: 'preserve-3d' }}>
            {/* Front */}
            <div className="absolute inset-0 bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-2xl shadow-xl flex flex-col items-center justify-center p-10 text-center overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 opacity-50" />
              <div className="absolute top-8 left-8 text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] opacity-80">
                Pergunta
              </div>
              <div className="w-full max-h-full overflow-y-auto custom-scrollbar flex items-center justify-center">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-[var(--foreground)] leading-snug">
                  {currentCard.front}
                </h2>
              </div>
              <div className="absolute bottom-6 text-[10px] text-[var(--muted-foreground)] flex items-center gap-1.5 opacity-60 uppercase tracking-widest">
                <RotateCw size={12} /> Clique para virar
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 bg-zinc-50 dark:bg-zinc-950 border border-[var(--border)] rounded-2xl shadow-xl flex flex-col items-center justify-center p-10 text-center overflow-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600 opacity-50" />
              <div className="absolute top-8 left-8 text-[10px] font-bold text-green-500 uppercase tracking-[0.2em] opacity-80">
                Resposta
              </div>
              <div className="w-full max-h-full overflow-y-auto custom-scrollbar flex items-center justify-center">
                <p className="text-lg sm:text-xl md:text-2xl text-[var(--muted-foreground)] leading-relaxed">
                  {currentCard.back}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent pt-16">
        <div className="max-w-lg mx-auto">
          {!isFlipped ? (
            <Button size="lg" className="w-full text-lg h-14 shadow-lg" onClick={() => setIsFlipped(true)}>Mostrar Resposta</Button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {[
                { q: 1, label: 'Errei', icon: XCircle, color: 'red', desc: '<1min' },
                { q: 3, label: 'Difícil', icon: Brain, color: 'orange', desc: currentCard.repetition === 0 ? '1d' : `${Math.round(currentCard.interval * 1.2)}d` },
                { q: 4, label: 'Acertei', icon: CheckCircle, color: 'green', desc: currentCard.repetition === 0 ? '1d' : currentCard.repetition === 1 ? '6d' : `${Math.round(currentCard.interval * currentCard.ease_factor)}d` },
                { q: 5, label: 'Fácil', icon: Zap, color: 'blue', desc: currentCard.repetition === 0 ? '1d' : currentCard.repetition === 1 ? '6d' : `${Math.round(currentCard.interval * currentCard.ease_factor * 1.3)}d` },
              ].map(opt => (
                <button key={opt.q} disabled={saving} onClick={() => handleAnswer(opt.q as any)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border border-${opt.color}-200 dark:border-${opt.color}-900/50 text-${opt.color}-600 hover:bg-${opt.color}-50 dark:hover:bg-${opt.color}-950/30 transition-colors disabled:opacity-50`}>
                  <opt.icon size={22} />
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className={`text-[10px] text-${opt.color}-400`}>{opt.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StudyPageContainer() {
  return (
    <Suspense fallback={null}>
      <StudySession />
    </Suspense>
  )
}
