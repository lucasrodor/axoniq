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
import { cn } from '@/lib/utils'
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

  const [allDecks, setAllDecks] = useState<any[]>([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  
  useEffect(() => {
    async function loadDecks() {
      if (deckIds.length > 0) return
      
      const { data: decksData, error: decksError } = await supabase
        .from('decks')
        .select(`
          id, 
          title, 
          created_at,
          flashcards(count)
        `)
        .order('created_at', { ascending: false })

      if (decksError) return
      setAllDecks(decksData as any)
    }
    loadDecks()
  }, [])

  const totalPages = Math.ceil(allDecks.length / itemsPerPage)
  const paginatedDecks = allDecks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
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
  }, [user, searchParams])

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
    <div className="h-screen flex items-center justify-center bg-[#09090B]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.3em] animate-pulse">Sincronizando Neurônios...</p>
      </div>
    </div>
  )

  if (sessionComplete || (cards.length === 0 && !loading)) {
    const total = stats.again + stats.hard + stats.good + stats.easy
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-start sm:justify-center p-6 pt-20 sm:pt-6 text-center relative overflow-hidden">
        {/* Background Aurora */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]" />

        <div className="z-10 w-full max-w-5xl flex flex-col items-center">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-6 sm:mb-10 border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl shadow-2xl ${cards.length === 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
            {cards.length === 0 ? <Clock size={40} /> : <CheckCircle size={40} />}
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight mb-4">
            {cards.length === 0 
              ? (deckIds.length > 0 ? 'Protocolo em Dia!' : (allDecks.length > 0 ? 'Selecione o que estudar' : 'Nada por aqui!')) 
              : 'Sessão Concluída!'}
          </h1>
          <p className="text-zinc-400 mb-12 max-w-md text-lg">
            {cards.length === 0 
              ? (deckIds.length > 0 
                  ? 'Não há cartas precisando de revisão neste deck hoje. Seus neurônios estão perfeitamente sincronizados!' 
                  : (allDecks.length > 0 ? 'Escolha um dos seus decks abaixo para iniciar uma sessão de revisão imediata.' : 'Você ainda não possui flashcards pendentes ou decks criados.')) 
              : `Excelente progresso! Você revisou ${total} ${total === 1 ? 'carta' : 'cartas'} hoje.`}
          </p>

          {cards.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 w-full max-w-2xl">
              {[
                { label: 'Errei', val: stats.again, color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/20' },
                { label: 'Difícil', val: stats.hard, color: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
                { label: 'Acertei', val: stats.good, color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
                { label: 'Fácil', val: stats.easy, color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
              ].map((s: any) => (
                <div key={s.label} className={cn("text-center p-6 rounded-2xl border backdrop-blur-md", s.bg, s.border)}>
                  <p className={cn("text-3xl font-black mb-1", s.color)}>{s.val}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {cards.length === 0 && allDecks.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mb-8">
                {paginatedDecks.map((deck: any) => (
                  <button
                    key={deck.id}
                    onClick={() => router.push(`/dashboard/study?decks=${deck.id}`)}
                    className="group p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-md text-left hover:border-blue-500/50 transition-all hover:bg-zinc-800/50"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                        <Brain size={20} />
                      </div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                        {deck.flashcards?.[0]?.count || 0} CARDS
                      </span>
                    </div>
                    <h3 className="text-zinc-100 font-bold group-hover:text-blue-400 transition-colors uppercase tracking-tight text-sm truncate">
                      {deck.title}
                    </h3>
                  </button>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mb-12">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="border-zinc-800 text-zinc-400 hover:text-zinc-100"
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-zinc-500 font-bold">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="border-zinc-800 text-zinc-400 hover:text-zinc-100"
                  >
                    Próximo
                  </Button>
                </div>
              )}
            </>
          )}
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-zinc-800 rounded-[2rem] px-12 h-16 font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95">
                Voltar ao Painel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  const stage = getCardStage(currentCard)

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col relative overflow-hidden selection:bg-blue-500/30">
      {/* Background Aurora */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="p-3 sm:p-6 flex items-center justify-between z-10 w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-100 transition-colors shrink-0">
          <ChevronLeft />
        </Button>
        <div className="flex flex-col items-center flex-1 mx-4">
          <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
            PROCESSO {currentIndex + 1} <span className="text-zinc-700">/</span> {cards.length}
          </span>
          <div className="w-full max-w-[140px] sm:max-w-[200px] h-1 bg-zinc-900 rounded-full mt-2 overflow-hidden border border-zinc-800/50">
            <div className="h-full bg-blue-500/80 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-500 ease-out" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
          </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 z-10 min-h-0">
        <div className="mb-4 sm:mb-8">
          <span className={cn(
            "text-[10px] uppercase font-black tracking-[0.3em] px-6 py-2 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-500",
            stage === 'new' ? 'text-blue-400 bg-blue-500/5 border-blue-500/20 shadow-blue-500/5' : 
            stage === 'learning' ? 'text-orange-400 bg-orange-500/5 border-orange-500/20 shadow-orange-500/5' : 
            'text-emerald-400 bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5'
          )}>
            {getStageLabel(stage)}
          </span>
        </div>

        <div className="relative w-full max-w-2xl px-2 sm:px-4 aspect-[4/5] sm:aspect-[4/3] md:aspect-[3/2] group mb-6 sm:mb-10" style={{ perspective: '2000px' }} onClick={() => setIsFlipped(!isFlipped)}>
          <motion.div className="w-full h-full relative" animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.8, type: 'spring', stiffness: 200, damping: 25 }} style={{ transformStyle: 'preserve-3d' }}>
            {/* Front */}
            <div className="absolute inset-0 bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl backdrop-blur-3xl flex flex-col items-center justify-center p-8 sm:p-12 text-center overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0" />
              <div className="absolute top-10 left-10 text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] opacity-50">
                PROMPT ANALÍTICO
              </div>
              <div className="w-full max-h-full overflow-y-auto custom-scrollbar flex items-center justify-center">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-100 leading-tight tracking-tight px-4 flex items-center justify-center text-center">
                  {currentCard.front}
                </h2>
              </div>
              <div className="absolute bottom-10 text-[10px] text-zinc-500 flex items-center gap-2 opacity-60 uppercase tracking-[0.2em] font-bold">
                <RotateCw size={14} className="animate-spin-slow" /> Clique para revelar resposta
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 bg-zinc-950/80 border border-zinc-800/80 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.05)] backdrop-blur-3xl flex flex-col items-center justify-center p-8 sm:p-12 text-center overflow-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0" />
              <div className="absolute top-10 left-10 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] opacity-40">
                SÍNTESE DE RESPOSTA
              </div>
              <div className="w-full max-h-full overflow-y-auto custom-scrollbar flex items-center justify-center">
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-zinc-300 leading-relaxed max-w-lg flex items-center justify-center text-center">
                  {currentCard.back}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-2xl px-4">
          {!isFlipped ? (
            <Button 
              size="lg" 
              className="w-full text-[10px] h-14 sm:h-20 font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] rounded-[1.5rem] sm:rounded-[2rem] bg-blue-600/10 text-blue-400 border border-blue-500/30 hover:bg-blue-600/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all hover:-translate-y-1 active:scale-95 group px-4" 
              onClick={() => setIsFlipped(true)}
            >
              MOSTRAR RESPOSTA <Zap className="ml-2 sm:ml-3 group-hover:animate-pulse" size={16} />
            </Button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
              {[
                { q: 1, label: 'Errei', icon: XCircle, color: 'text-red-400', hover: 'hover:bg-red-500/10 hover:border-red-500/30', border: 'border-red-500/10', desc: '<1min' },
                { q: 3, label: 'Difícil', icon: Brain, color: 'text-orange-400', hover: 'hover:bg-orange-500/10 hover:border-orange-500/30', border: 'border-orange-500/10', desc: currentCard.repetition === 0 ? '1d' : `${Math.round(currentCard.interval * 1.2)}d` },
                { q: 4, label: 'Acertei', icon: CheckCircle, color: 'text-emerald-400', hover: 'hover:bg-emerald-500/10 hover:border-emerald-500/30', border: 'border-emerald-500/10', desc: currentCard.repetition === 0 ? '1d' : currentCard.repetition === 1 ? '6d' : `${Math.round(currentCard.interval * currentCard.ease_factor)}d` },
                { q: 5, label: 'Fácil', icon: Zap, color: 'text-blue-400', hover: 'hover:bg-blue-500/10 hover:border-blue-500/30', border: 'border-blue-500/10', desc: currentCard.repetition === 0 ? '1d' : currentCard.repetition === 1 ? '6d' : `${Math.round(currentCard.interval * currentCard.ease_factor * 1.3)}d` },
              ].map(opt => (
                <button 
                  key={opt.q} 
                  disabled={saving} 
                  onClick={() => handleAnswer(opt.q as any)} 
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border bg-zinc-900/50 backdrop-blur-md transition-all duration-300 disabled:opacity-50 hover:-translate-y-1 group",
                    opt.color, opt.border, opt.hover
                  )}
                >
                  <opt.icon size={24} className="group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                    <span className="text-[9px] opacity-40 font-bold mt-0.5">{opt.desc}</span>
                  </div>
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
