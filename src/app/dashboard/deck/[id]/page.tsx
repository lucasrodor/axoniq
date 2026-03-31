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
    <div className="min-h-screen bg-[var(--background)] p-4 sm:p-6 md:p-12">
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
        {/* Navigation */}
        <div className="mb-6 sm:mb-8">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 text-[var(--muted-foreground)]"
            >
              <ChevronLeft size={16} className="mr-1" />
              Voltar ao Painel
            </Button>
          </Link>
        </div>

        {/* Deck Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            {isEditingDeck ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none text-[var(--foreground)] pb-1"
                  autoFocus
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descrição (opcional)"
                  className="w-full text-sm bg-transparent border-b border-[var(--border)] focus:outline-none text-[var(--muted-foreground)] pb-1"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveDeck}>
                    <Check size={14} className="mr-1" /> Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingDeck(false)}
                  >
                    <X size={14} className="mr-1" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] truncate">
                  {deck.title}
                </h1>
                {deck.description && (
                  <p className="text-[var(--muted-foreground)] mt-1 text-sm sm:text-base">
                    {deck.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3 text-xs text-[var(--muted-foreground)]">
                  <Layers size={14} />
                  {flashcards.length} flashcard
                  {flashcards.length !== 1 ? 's' : ''}
                </div>
                {/* Folder selector */}
                {folders.length > 0 && (
                  <CustomSelect
                    className="mt-3 w-1/2"
                    label="Pasta"
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
                    icon={<Folder size={16} className="text-amber-500" />}
                  />
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
                onClick={() => setIsEditingDeck(true)}
              >
                <Pencil size={14} className="mr-1" /> Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} className="mr-1" /> Deletar
              </Button>
              <Link href={`/dashboard/deck/${deckId}/study`}>
                <Button size="sm">
                  <Play size={14} className="mr-1" /> Estudar
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-6 mb-8 animate-in zoom-in duration-200">
            <p className="text-red-700 dark:text-red-400 font-medium mb-4">
              Tem certeza que deseja deletar este deck e todos os{' '}
              {flashcards.length} flashcards?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteDeck}
              >
                Sim, deletar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Flashcards Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Flashcards</h2>
          {!isAddingCard && (
            <Button size="sm" onClick={() => setIsAddingCard(true)}>
              <Plus size={16} className="mr-1" /> Novo Card
            </Button>
          )}
        </div>

        {/* Add Card Form */}
        {isAddingCard && (
          <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-blue-500/30 rounded-xl p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Plus size={16} /> Novo Flashcard
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingCard(false)}>
                <X size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <RichEditor
                value={newFront}
                onChange={setNewFront}
                label="Frente (Pergunta)"
                placeholder="Ex: Qual a tríade da meningite?"
              />
              <RichEditor
                value={newBack}
                onChange={setNewBack}
                label="Verso (Resposta)"
                placeholder="Ex: Febre, rigidez de nuca e alteração do nível de consciência."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddingCard(false)}>Cancelar</Button>
              <Button onClick={handleCreateCard} disabled={!newFront.trim() || !newBack.trim()}>
                Criar Flashcard
              </Button>
            </div>
          </div>
        )}

        {/* Flashcards */}
        {flashcards.length === 0 ? (
          <div className="bg-[var(--secondary)] border border-[var(--border)] rounded-xl p-12 text-center">
            <p className="text-[var(--muted-foreground)]">
              Este deck ainda não tem flashcards.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashcards.map((card) => (
              <div
                key={card.id}
                className="bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-sm group relative"
              >
                {editingCardId === card.id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
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
                      <Button size="sm" onClick={() => handleSaveCard(card.id)}>
                        <Check size={14} className="mr-1" /> Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditCard}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="mb-4 pb-4 border-b border-[var(--border)]">
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                        Pergunta
                      </span>
                      <div className="mt-2 prose prose-sm dark:prose-invert text-[var(--foreground)] max-w-none prose-img:rounded-lg">
                        <MarkdownDisplay content={card.front} />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-500 uppercase tracking-widest">
                        Resposta
                      </span>
                      <div className="mt-2 prose prose-sm dark:prose-invert text-[var(--muted-foreground)] max-w-none prose-img:rounded-lg">
                        <MarkdownDisplay content={card.back} />
                      </div>
                    </div>
                    {/* Hover Actions */}
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditCard(card)}
                        className="p-1.5 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-[var(--muted-foreground)] hover:text-red-600 transition-colors"
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
