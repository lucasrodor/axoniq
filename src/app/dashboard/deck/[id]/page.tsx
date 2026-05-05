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
  Loader2,
  Tag,
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { CustomSelect } from '@/components/ui/select'
import { RichEditor } from '@/components/editor/RichEditor'
import { DashboardEmptyState } from '@/components/dashboard/empty-state'
import MarkdownDisplay from '@/components/ui/markdown-display'
import { SpecialtySelector } from '@/components/ui/specialty-selector'

interface Deck {
  id: string
  title: string
  description?: string
  specialty_tag?: string
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

function renderCloze(text: string) {
  return text.replace(/\{\{c\d+::(.*?)\}\}/g, '[...]')
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
  const [editSpecialty, setEditSpecialty] = useState('')

  // Card editing
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')

  // Card creation
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
        setEditSpecialty(deckRes.data.specialty_tag || '')
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
        specialty_tag: editSpecialty || null,
      })
      .eq('id', deckId)

    if (error) {
      toast('Erro ao salvar deck.', 'error')
    } else {
      setDeck((prev) =>
        prev
          ? { ...prev, title: editTitle.trim(), description: editDescription.trim(), specialty_tag: editSpecialty }
          : prev
      )
      setIsEditingDeck(false)
      toast('Deck atualizado!', 'success')
    }
  }

  const handleDeleteDeck = async () => {
    // Delete flashcards first, then deck
    await supabase.from('flashcards').delete().eq('id', deckId)
    const { error } = await supabase.from('decks').delete().eq('id', deckId)

    if (error) {
      toast('Erro ao deletar deck.', 'error')
    } else {
      toast('Deck deletado!', 'success')
      router.push('/dashboard')
    }
  }

  // --- Card CRUD ---
  const handleSaveCard = async (cardId: string) => {
    const { error } = await supabase
      .from('flashcards')
      .update({
        front: editFront,
        back: editBack,
      })
      .eq('id', cardId)

    if (error) {
      toast('Erro ao salvar flashcard.', 'error')
    } else {
      setFlashcards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, front: editFront, back: editBack } : c))
      )
      setEditingCardId(null)
      toast('Flashcard atualizado!', 'success')
    }
  }

  const handleAddCard = async () => {
    if (!newFront || !newBack) return
    setIsSubmitting(true)
    const { data, error } = await supabase
      .from('flashcards')
      .insert([
        {
          deck_id: deckId,
          front: newFront,
          back: newBack,
          type: 'qa',
        },
      ])
      .select()
      .single()

    if (error) {
      toast('Erro ao adicionar flashcard.', 'error')
    } else if (data) {
      setFlashcards((prev) => [...prev, data])
      setNewFront('')
      setNewBack('')
      setIsAddingCard(false)
      toast('Flashcard adicionado!', 'success')
    }
    setIsSubmitting(false)
  }

  const handleDeleteCard = async (cardId: string) => {
    const { error } = await supabase
      .from('flashcards')
      .delete().eq('id', cardId)

    if (error) {
      toast('Erro ao deletar flashcard.', 'error')
    } else {
      setFlashcards((prev) => prev.filter((c) => c.id !== cardId))
      toast('Flashcard removido!', 'success')
    }
  }

  // --- Folder move ---
  const handleMoveToFolder = async (folderId: string) => {
    setSelectedFolderId(folderId)
    const { error } = await supabase
      .from('decks')
      .update({ folder_id: folderId || null })
      .eq('id', deckId)

    if (error) {
      toast('Erro ao mover deck.', 'error')
    } else {
      toast('Deck movido!', 'success')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-zinc-500 text-sm font-medium animate-pulse">Carregando Deck...</p>
        </div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
        <DashboardEmptyState
          title="Deck não encontrado"
          description="O deck que você está procurando não existe ou foi removido."
          icon={Layers}
          actionLabel="Voltar ao Início"
          onAction={() => router.push('/dashboard')}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 p-4 sm:p-6 md:p-8 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-zinc-800/50 rounded-xl transition-all group">
              <ChevronLeft className="w-6 h-6 text-zinc-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">{deck.title}</h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                <Layers size={12} className="text-blue-500" />
                Coleção de {flashcards.length} Flashcards
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white px-4 h-11 font-bold transition-all"
              onClick={() => setIsEditingDeck(true)}
            >
              <Settings2 className="w-4 h-4 mr-2" /> Editar Deck
            </Button>
            <Button
              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-6 h-11 font-black shadow-[0_0_20px_rgba(37,99,235,0.25)] transition-all active:scale-95 group"
              onClick={() => router.push(`/dashboard/deck/${deckId}/study`)}
              disabled={flashcards.length === 0}
            >
              <Play className="w-4 h-4 mr-2 fill-current" /> ESTUDAR AGORA
            </Button>
          </div>
        </div>

        {/* Deck Info Section (Full Width Top) */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-transparent group-hover:from-blue-400 transition-colors" />
          
          {isEditingDeck ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título do Deck</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-sm bg-zinc-950/50 border border-zinc-800 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500/50 text-zinc-100 transition-all font-bold"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full text-sm bg-zinc-950/50 border border-zinc-800 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500/50 text-zinc-300 min-h-[120px] transition-all leading-relaxed"
                  />
                </div>
              </div>
              
              <div className="space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Área de Estudo</label>
                  <SpecialtySelector value={editSpecialty} onChange={setEditSpecialty} />
                </div>
                
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button size="lg" onClick={handleSaveDeck} className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                    <Check size={18} className="mr-2" /> Salvar Alterações
                  </Button>
                  <Button size="lg" variant="ghost" onClick={() => setIsEditingDeck(false)} className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-2xl px-8 h-14 font-bold transition-all">
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                    {deck.specialty_tag || 'Geral'}
                  </span>
                  {deck.folder_id && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Folder size={10} />
                      {folders.find(f => f.id === deck.folder_id)?.name || 'Pasta'}
                    </span>
                  )}
                </div>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Descrição do Deck</h3>
                <p className="text-zinc-300 text-sm md:text-base leading-relaxed font-medium max-w-3xl">
                  {deck.description || 'Sem descrição cadastrada para este deck.'}
                </p>
              </div>
              
              <div className="md:col-span-4 space-y-6 pt-4 md:pt-0">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Organização</h3>
                  <CustomSelect
                    value={selectedFolderId}
                    onChange={handleMoveToFolder}
                    options={[
                      { value: '', label: 'Sem Pasta' },
                      ...folders.map(f => ({ value: f.id, label: f.name }))
                    ]}
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                    className="text-[10px] font-black text-red-500/40 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={12} /> Excluir Coleção Completa
                  </button>
                  {showDeleteConfirm && (
                    <div className="mt-4 p-5 bg-red-500/5 border border-red-500/20 rounded-[1.5rem] space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-[11px] text-red-400 font-bold uppercase leading-tight tracking-wide">Ação Irreversível: Isso removerá permanentemente o deck e todos os cards vinculados.</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleDeleteDeck} className="h-9 text-[10px] font-black uppercase tracking-widest rounded-xl px-5 bg-red-600">Sim, Deletar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="h-9 text-[10px] font-black uppercase tracking-widest rounded-xl px-5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all">Cancelar</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cards Section (Grid Layout) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em]">Unidades de Aprendizado</h2>
              <span className="bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                {flashcards.length}
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddingCard(true)}
              className="bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl px-6 h-10 font-black text-[10px] tracking-widest uppercase shadow-lg active:scale-95 transition-all"
            >
              <Plus size={16} className="mr-2" /> Adicionar Card
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isAddingCard && (
              <div className="md:col-span-2 bg-zinc-900/80 border-2 border-blue-600/50 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500">
                <h3 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                  <Plus size={18} /> Novo Flashcard Manual
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <RichEditor value={newFront} onChange={setNewFront} label="FRENTE (PERGUNTA)" placeholder="Ex: Qual o principal sintoma da... ?" />
                  <RichEditor value={newBack} onChange={setNewBack} label="VERSO (RESPOSTA)" placeholder="Ex: Dor torácica opressiva..." />
                </div>
                <div className="flex justify-end gap-3 pt-8 border-t border-zinc-800/50 mt-8">
                  <Button variant="ghost" size="sm" onClick={() => setIsAddingCard(false)} className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 font-bold uppercase tracking-widest text-[10px] px-6 transition-all">Descartar</Button>
                  <Button size="sm" onClick={handleAddCard} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-10 h-12 font-black uppercase tracking-widest text-[11px] shadow-lg">
                    {isSubmitting ? 'Salvando...' : 'Confirmar Criação'}
                  </Button>
                </div>
              </div>
            )}

            {flashcards.length === 0 && !isAddingCard ? (
              <div className="md:col-span-2 py-24 text-center bg-zinc-900/20 border-2 border-dashed border-zinc-800/50 rounded-[3rem]">
                <Layers className="w-16 h-16 text-zinc-800 mx-auto mb-6 opacity-20" />
                <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-xs">Este deck ainda não possui flashcards.</p>
                <Button 
                  variant="link" 
                  onClick={() => setIsAddingCard(true)}
                  className="mt-2 text-blue-500 font-bold hover:text-blue-400"
                >
                  Começar a criar agora
                </Button>
              </div>
            ) : (
              flashcards.map((card) => (
                <div key={card.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-[2.5rem] p-8 group hover:border-blue-500/30 transition-all hover:bg-zinc-900/60 shadow-lg hover:shadow-blue-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                    <button
                      onClick={() => {
                        setEditingCardId(card.id)
                        setEditFront(card.front)
                        setEditBack(card.back)
                      }}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-blue-500 hover:border-blue-500/50 rounded-xl transition-all shadow-xl"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-500/50 rounded-xl transition-all shadow-xl"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {editingCardId === card.id ? (
                    <div className="space-y-6">
                      <RichEditor value={editFront} onChange={setEditFront} label="FRENTE" />
                      <RichEditor value={editBack} onChange={setEditBack} label="VERSO" />
                      <div className="flex justify-end gap-2 pt-2">
                        <Button size="sm" onClick={() => handleSaveCard(card.id)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 h-10 font-bold shadow-lg">
                          <Check size={14} className="mr-1.5" /> Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCardId(null)} className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 font-bold px-6 transition-all">Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 pt-2">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">PERGUNTA</p>
                        <div className="text-zinc-100 font-bold leading-relaxed text-sm md:text-base pr-20">
                          <MarkdownDisplay content={renderCloze(card.front)} />
                        </div>
                      </div>
                      <div className="pt-6 border-t border-zinc-800/50 space-y-3">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">RESPOSTA</p>
                        <div className="text-zinc-300 text-sm md:text-base leading-relaxed font-medium">
                          <MarkdownDisplay content={card.back} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { Settings2 } from 'lucide-react'
