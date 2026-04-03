'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  Play,
  Layers,
  Trash2,
  Pencil,
  Check,
  X,
  Folder,
  Plus,
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { CustomSelect } from '@/components/ui/select'
import { RichEditor } from '@/components/editor/RichEditor'
import MarkdownDisplay from '@/components/ui/markdown-display'

interface Deck {
  id: string
  title: string
  description?: string
  created_at: string
  folder_id?: string | null
}

interface Flashcard {
  id: string
  front: string
  back: string
}

interface FolderType {
  id: string
  name: string
}

export default function DeckDetailPage() {
  const params = useParams()
  const deckId = params.id as string
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [deck, setDeck] = useState<Deck | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Deck editing
  const [isEditingDeck, setIsEditingDeck] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Card editing
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')

  // Card creation
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')

  // Folder management
  const [folders, setFolders] = useState<FolderType[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')

  useEffect(() => {
    if (!user || !deckId) return

    const loadDeck = async () => {
      try {
      const [deckRes, cardsRes, foldersRes] = await Promise.all([
        supabase.from('decks').select('*').eq('id', deckId).single(),
        supabase
          .from('flashcards')
          .select('id, front, back')
          .eq('deck_id', deckId)
          .order('created_at'),
        supabase
          .from('folders')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name'),
      ])

      if (deckRes.error) {
        console.error('Deck error:', deckRes.error)
        toast('Não foi possível carregar o deck.', 'error')
      } else if (deckRes.data) {
        setDeck(deckRes.data)
        setEditTitle(deckRes.data.title)
        setEditDescription(deckRes.data.description || '')
        setSelectedFolderId(deckRes.data.folder_id || '')
      }
      if (cardsRes.data) setFlashcards(cardsRes.data)
      if (foldersRes.data) setFolders(foldersRes.data)
      } catch (err) {
        console.error('Error loading deck:', err)
        toast('Erro ao carregar deck.', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    loadDeck()
  }, [user, deckId])

  // --- Deck CRUD ---
  const handleSaveDeck = async () => {
    if (!editTitle.trim()) return
    const { error } = await supabase
      .from('decks')
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      })
      .eq('id', deckId)

    if (error) {
      toast('Erro ao salvar deck.', 'error')
    } else {
      setDeck((prev) =>
        prev
          ? { ...prev, title: editTitle.trim(), description: editDescription.trim() }
          : prev
      )
      setIsEditingDeck(false)
      toast('Deck atualizado!', 'success')
    }
  }

  const handleDeleteDeck = async () => {
    // Delete flashcards first, then deck
    await supabase.from('flashcards').delete().eq('deck_id', deckId)
    const { error } = await supabase.from('decks').delete().eq('id', deckId)

    if (error) {
      toast('Erro ao deletar deck.', 'error')
    } else {
      toast('Deck deletado.', 'success')
      router.push('/dashboard')
    }
  }

  // --- Card CRUD ---
  const startEditCard = (card: Flashcard) => {
    setEditingCardId(card.id)
    setEditFront(card.front)
    setEditBack(card.back)
  }

  const cancelEditCard = () => {
    setEditingCardId(null)
    setEditFront('')
    setEditBack('')
  }

  const handleSaveCard = async (cardId: string) => {
    if (!editFront.trim() || !editBack.trim()) return

    const { error } = await supabase
      .from('flashcards')
      .update({ front: editFront.trim(), back: editBack.trim() })
      .eq('id', cardId)

    if (error) {
      toast('Erro ao salvar flashcard.', 'error')
    } else {
      setFlashcards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? { ...c, front: editFront.trim(), back: editBack.trim() }
            : c
        )
      )
      cancelEditCard()
      toast('Flashcard atualizado!', 'success')
    }
  }

  const handleCreateCard = async () => {
    if (!newFront.trim() || !newBack.trim()) return

    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        deck_id: deckId,
        front: newFront.trim(),
        back: newBack.trim(),
        due_date: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      toast('Erro ao criar flashcard.', 'error')
    } else {
      setFlashcards((prev) => [...prev, data])
      setNewFront('')
      setNewBack('')
      setIsAddingCard(false)
      toast('Flashcard criado!', 'success')
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', cardId)

    if (error) {
      toast('Erro ao deletar flashcard.', 'error')
    } else {
      setFlashcards((prev) => prev.filter((c) => c.id !== cardId))
      toast('Flashcard removido.', 'success')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-pulse text-[var(--muted-foreground)]">
          Carregando...
        </div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[var(--muted-foreground)]">Deck não encontrado.</p>
          <Link href="/dashboard">
            <Button variant="outline">Voltar ao Painel</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090B] p-4 sm:p-6 md:p-12 relative overflow-hidden selection:bg-blue-500/30">
      {/* Background Aurora */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto animate-in fade-in duration-700 relative z-10">
        {/* Navigation */}
        <div className="mb-10">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 text-zinc-500 hover:text-white hover:bg-zinc-900/50 transition-all group px-4 rounded-xl"
            >
              <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
              PAINEL
            </Button>
          </Link>
        </div>

        {/* Deck Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-12">
          <div className="flex-1 min-w-0">
            {isEditingDeck ? (
              <div className="space-y-4 max-w-2xl bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-xl shadow-2xl">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] ml-1">Título do Deck</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-2xl font-black bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 text-zinc-100 transition-all"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Descrição</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="O que este deck aborda..."
                    className="w-full text-sm bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 text-zinc-300 min-h-[100px] transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSaveDeck} className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-6">
                    <Check size={14} className="mr-1.5" /> Salvar Alterações
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-500 hover:text-zinc-100"
                    onClick={() => setIsEditingDeck(false)}
                  >
                    <X size={14} className="mr-1.5" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-100 truncate mb-1">
                  {deck.title}
                </h1>
                {deck.description && (
                  <p className="text-zinc-400 mt-2 text-sm sm:text-base leading-relaxed max-w-2xl">
                    {deck.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-[10px] font-black text-blue-500 bg-blue-500/5 border border-blue-500/20 px-3 py-1 rounded-lg uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    {flashcards.length} Flashcard{flashcards.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] font-black text-zinc-500 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-lg uppercase tracking-[0.2em]">
                    GERADO DIA {new Date(deck.created_at).toLocaleDateString()}
                  </span>
                </div>
                {/* Folder selector */}
                {folders.length > 0 && (
                  <div className="mt-8">
                    <CustomSelect
                      className="w-full max-w-[300px]"
                      label="Pasta de Destino"
                      options={[
                        { value: '', label: 'Sem pasta' },
                        ...folders.map((f) => ({ value: f.id, label: f.name }))
                      ]}
                      value={selectedFolderId}
                      onChange={async (val) => {
                        const folderId = val || null
                        setSelectedFolderId(val)
                        await supabase.from('decks').update({ folder_id: folderId }).eq('id', deckId)
                        toast('Deck movido com sucesso!', 'success')
                      }}
                      icon={<Folder size={16} className="text-blue-500" />}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          {!isEditingDeck && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-zinc-100 transition-colors"
                onClick={() => setIsEditingDeck(true)}
              >
                <Pencil size={14} className="mr-1.5" /> Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} className="mr-1.5" /> Deletar
              </Button>
              <Link href={`/dashboard/deck/${deckId}/study`}>
                <Button size="sm" className="bg-zinc-900/50 text-blue-400 border border-blue-500/30 hover:bg-blue-600/10 rounded-xl px-5 font-black uppercase tracking-[0.1em] text-[10px] shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all hover:-translate-y-0.5">
                  <Play size={14} className="mr-1.5 fill-current" /> ESTUDAR
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 mb-12 animate-in zoom-in duration-300 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.05)]">
            <p className="text-red-400 font-bold mb-6 text-lg tracking-tight">
              Ação Irreversível: Deletar este deck e todos os{' '}
              <span className="text-white px-2 py-0.5 bg-red-500/20 rounded-lg">{flashcards.length}</span> flashcards?
            </p>
            <div className="flex gap-3">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-8 font-bold transition-all shadow-lg shadow-red-500/10"
                onClick={handleDeleteDeck}
              >
                Sim, Deletar Tudo
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-zinc-400 hover:text-zinc-100 rounded-xl px-8"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Flashcards Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-zinc-100 uppercase tracking-[0.2em]">Flashcards</h2>
          {!isAddingCard && (
            <Button size="sm" onClick={() => setIsAddingCard(true)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 font-bold shadow-lg shadow-blue-500/10 transition-all hover:-translate-y-0.5">
              <Plus size={16} className="mr-1.5" /> Novo Card
            </Button>
          )}
        </div>

        {/* Add Card Form */}
        {isAddingCard && (
          <div className="bg-zinc-900/50 border border-blue-500/30 rounded-3xl p-8 mb-12 animate-in slide-in-from-top-4 duration-500 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Plus size={16} /> Adicionar Novo Conhecimento
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingCard(false)} className="text-zinc-500 hover:text-zinc-100">
                <X size={20} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 items-start">
              <RichEditor
                value={newFront}
                onChange={setNewFront}
                label="Frente (Pergunta/Conceito)"
                placeholder="Ex: Qual a tríade da meningite?"
              />
              <RichEditor
                value={newBack}
                onChange={setNewBack}
                label="Verso (Resposta/Definição)"
                placeholder="Ex: Febre, rigidez de nuca e alteração..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" className="text-zinc-500 hover:text-zinc-100" onClick={() => setIsAddingCard(false)}>Cancelar</Button>
              <Button onClick={handleCreateCard} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-10 font-bold shadow-lg shadow-blue-500/20" disabled={!newFront.trim() || !newBack.trim()}>
                Criar Flashcard
              </Button>
            </div>
          </div>
        )}

        {/* Flashcards */}
        {flashcards.length === 0 ? (
          <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl p-20 text-center backdrop-blur-sm">
            <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">
              Este deck ainda não possui unidades de conhecimento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {flashcards.map((card) => (
              <div
                key={card.id}
                className="bg-zinc-900/50 border border-zinc-800/80 rounded-[2rem] p-8 shadow-xl group relative backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300"
              >
                {editingCardId === card.id ? (
                  /* Edit Mode */
                  <div className="space-y-6">
                    <RichEditor
                      value={editFront}
                      onChange={setEditFront}
                      label="Pergunta"
                    />
                    <RichEditor
                      value={editBack}
                      onChange={setEditBack}
                      label="Resposta"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveCard(card.id)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-6 font-bold">
                        <Check size={14} className="mr-1.5" /> Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-zinc-500 hover:text-zinc-100"
                        onClick={cancelEditCard}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="mb-6 pb-6 border-b border-zinc-800/50">
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">
                        Pergunta
                      </span>
                      <div className="mt-4 prose prose-sm dark:prose-invert text-zinc-100 max-w-none prose-p:leading-relaxed">
                        <MarkdownDisplay content={card.front} />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                        Resposta
                      </span>
                      <div className="mt-4 prose prose-sm dark:prose-invert text-zinc-400 max-w-none prose-p:leading-relaxed">
                        <MarkdownDisplay content={card.back} />
                      </div>
                    </div>
                    {/* Hover Actions */}
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <button
                        onClick={() => startEditCard(card)}
                        className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-blue-500 hover:border-blue-500/30 transition-all shadow-2xl"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all shadow-2xl"
                        title="Deletar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
