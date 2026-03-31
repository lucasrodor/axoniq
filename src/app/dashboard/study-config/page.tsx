'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, BookOpen, Layers, Check, Zap } from 'lucide-react'

interface Deck {
  id: string
  title: string
  dueCards: number
}

export default function StudyConfigPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([])
  const [limit, setLimit] = useState<number>(20)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDecks() {
      if (!user) return
      try {
        // Fetch decks
        const { data: decksData } = await supabase
          .from('decks')
          .select('id, title')
          .eq('user_id', user.id)

        // Fetch all due cards to count per deck
        const now = new Date().toISOString()
        const { data: cardsData } = await supabase
          .from('flashcards')
          .select('deck_id')
          .lte('due_date', now)
          .in('deck_id', (decksData || []).map(d => d.id))

        const enrichedDecks = (decksData || []).map((deck: {id: string, title: string}) => ({
          ...deck,
          dueCards: (cardsData || []).filter((c: {deck_id: string}) => c.deck_id === deck.id).length
        })).filter((deck: {dueCards: number}) => deck.dueCards > 0)

        setDecks(enrichedDecks)
        setSelectedDeckIds(enrichedDecks.map((d: {id: string}) => d.id)) // All selected by default
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadDecks()
  }, [user])

  const toggleDeck = (id: string) => {
    setSelectedDeckIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const startSession = () => {
    if (selectedDeckIds.length === 0) return
    const params = new URLSearchParams()
    params.set('decks', selectedDeckIds.join(','))
    params.set('limit', limit.toString())
    router.push(`/dashboard/study?${params.toString()}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4" />
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-bottom-8 duration-700">
        
        {/* Navigation */}
        <div className="-ml-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-[var(--muted-foreground)]">
            <ChevronLeft size={16} className="mr-1" /> Voltar ao Painel
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Configurar Sessão
          </h1>
          <p className="text-[var(--muted-foreground)] text-lg">
            Escolha o que você quer revisar hoje e defina sua meta.
          </p>
        </div>

        {/* Content Selector */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-blue-500" />
            Conteúdo para Revisão
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {decks.length === 0 ? (
              <div className="bg-[var(--secondary)] border border-[var(--border)] rounded-xl p-8 text-center">
                <p className="text-[var(--muted-foreground)]">Você não tem cards pendentes para revisão no momento.</p>
              </div>
            ) : (
              decks.map(deck => (
                <button
                  key={deck.id}
                  onClick={() => toggleDeck(deck.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedDeckIds.includes(deck.id)
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm'
                      : 'border-[var(--border)] bg-white dark:bg-zinc-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedDeckIds.includes(deck.id) ? 'bg-blue-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--muted-foreground)]'
                    }`}>
                      <BookOpen size={18} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[var(--foreground)] line-clamp-1">{deck.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{deck.dueCards} cards pendentes</p>
                    </div>
                  </div>
                  {selectedDeckIds.includes(deck.id) && <Check size={20} className="text-blue-500" />}
                </button>
              ))
            )}
          </div>
        </section>

        {/* Meta Selector */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            Meta da Sessão
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {[10, 20, 30, 0].map((val) => (
              <button
                key={val}
                onClick={() => setLimit(val)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  limit === val
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-600 shadow-sm'
                    : 'border-[var(--border)] bg-white dark:bg-zinc-900 text-[var(--muted-foreground)]'
                }`}
              >
                <span className="text-lg font-bold">{val === 0 ? '∞' : val}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">{val === 0 ? 'Tudo' : 'Cards'}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Action Button */}
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full h-14 text-lg shadow-xl"
          disabled={selectedDeckIds.length === 0}
          onClick={startSession}
        >
          Começar Revisão
        </Button>

      </div>
    </div>
  )
}
