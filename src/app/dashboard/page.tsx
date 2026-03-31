'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Plus,
  BookOpen,
  Layers,
  Clock,
  Flame,
  Target,
  TrendingUp,
  Settings,
  Zap,
  LogOut,
  FolderPlus,
  Folder,
  ChevronDown,
  ChevronRight,
  Trash2,
  Pencil,
  Check,
  X,
  HelpCircle,
  Tag,
  Trophy,
  MoreVertical,
  BarChart3,
  FileText,
  AlertCircle,
  User
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import {
  getCardStage,
  type CardStage,
} from '@/lib/study/spaced-repetition'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

interface FolderType {
  id: string
  name: string
  created_at: string
}

interface DeckWithStats extends Deck {
  totalCards: number
  dueCards: number
  masteredCards: number
  progressPercent: number
}

interface Document {
  id: string
  name: string
  status: 'processing' | 'ready' | 'error'
  num_flashcards: number
  created_at: string
}

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

interface PerformanceReport {
  id: string
  title: string
  analysis_json: any
  summary_markdown: string
  created_at: string
}

interface MindMap {
  id: string
  title: string
  source_id: string | null
  folder_id: string | null
  specialty_tag: string
  status: 'generating' | 'ready' | 'error'
  created_at: string
}

type DashboardTab = 'decks' | 'quizzes' | 'reports' | 'mindmaps'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [decks, setDecks] = useState<DeckWithStats[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [allCards, setAllCards] = useState<Flashcard[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [activeTab, setActiveTab] = useState<DashboardTab>('decks')
  const [folders, setFolders] = useState<FolderType[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewDeckModal, setShowNewDeckModal] = useState(false)
  const [newDeckTitle, setNewDeckTitle] = useState('')
  const [showNewQuizModal, setShowNewQuizModal] = useState(false)
  const [newQuizTitle, setNewQuizTitle] = useState('')
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemName, setEditingItemName] = useState('')
  const [editingItemType, setEditingItemType] = useState<'deck' | 'quiz' | 'mindmap'>('deck')
  const [deletingItem, setDeletingItem] = useState<{ id: string, type: 'deck' | 'quiz' | 'mindmap', title: string } | null>(null)
  const [showCreateChoice, setShowCreateChoice] = useState(false)
  const [showNewMindMapModal, setShowNewMindMapModal] = useState(false)
  const [newMindMapTitle, setNewMindMapTitle] = useState('')
  const [reports, setReports] = useState<PerformanceReport[]>([])
  const [mindMaps, setMindMaps] = useState<MindMap[]>([])
  const [generatingReport, setGeneratingReport] = useState(false)
  const [showReportLimitModal, setShowReportLimitModal] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const handleSignOut = async () => {
    toast('Você saiu da sua conta.', 'info')
    await signOut()
  }

  async function loadDashboard() {
    if (!user) return

    try {
      // Fetch Decks
      const { data: decksData, error: decksError } = await supabase
        .from('decks')
        .select('*, flashcards(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (decksError) throw decksError

      // Fetch Folders
      const { data: foldersData } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      // Fetch Documents History
      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('*, quiz_questions(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch Mind Maps
      const { data: mmData } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch Reports
      const { data: reportsData } = await supabase
        .from('performance_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch latest scores for quizzes
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, score, total_questions, completed_at')
        .eq('user_id', user.id)

      // Fetch ALL flashcards for analytics
      const { data: cardsData, error: cardsError } = await supabase
        .from('flashcards')
        .select('id, ease_factor, interval, repetition, due_date, deck_id')
        .in(
          'deck_id',
          (decksData || []).map((d: Deck) => d.id)
        )

      if (cardsError) throw cardsError

      const cards = cardsData || []
      const now = new Date()

      // Build deck stats
      const enrichedDecks = (decksData || []).map((deck: Deck) => {
        const deckCards = cards.filter((c: Flashcard) => c.deck_id === deck.id)
        const dueCards = deckCards.filter(
          (c: Flashcard) => new Date(c.due_date) <= now
        ).length
        const masteredCards = deckCards.filter(
          (c: Flashcard) => getCardStage(c) === 'mastered'
        ).length
        const studiedCards = deckCards.filter(
          (c: Flashcard) => getCardStage(c) !== 'new'
        ).length
        const totalCards = deckCards.length

        return {
          ...deck,
          totalCards,
          dueCards,
          masteredCards,
          progressPercent:
            totalCards > 0
              ? Math.round((studiedCards / totalCards) * 100)
              : 0,
        }
      })

      // Build quiz stats
      const attempts = attemptsData || []
      const enrichedQuizzes = (quizzesData || []).map((quiz: any) => {
        const totalQuestions = quiz.quiz_questions?.[0]?.count || 0
        const quizAttempts = attempts.filter((a: any) => a.quiz_id === quiz.id)
        
        // Find the LATEST attempt using completed_at
        const lastAttempt = quizAttempts.length > 0
          ? quizAttempts.sort((a: any, b: any) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())[0]
          : null

        return {
          ...quiz,
          totalQuestions,
          lastScoreHit: lastAttempt ? lastAttempt.score : undefined,
          lastScoreTotal: lastAttempt ? lastAttempt.total_questions : undefined,
        }
      })

      setDecks(enrichedDecks)
      setDocuments(docsData || [])
      setFolders(foldersData || [])
      setAllCards(cards)
      setQuizzes(enrichedQuizzes)
      setReports(reportsData || [])
      setMindMaps(mmData || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [user])

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const itemId = active.id as string
    const targetFolderId = (over.id as string).replace('quiz-drop-', '').replace('deck-drop-', '').replace('mindmap-drop-', '')
    const resolvedFolderId = targetFolderId === 'unassigned' ? null : targetFolderId

    // Detect if it's a quiz or deck being dragged
    if (itemId.startsWith('quiz-')) {
      const quizId = itemId.replace('quiz-', '')
      const quizBeingMoved = quizzes.find(q => q.id === quizId)
      if (!quizBeingMoved || quizBeingMoved.folder_id === resolvedFolderId) return

      // Optimistic update
      setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, folder_id: resolvedFolderId } : q))

      const { error } = await supabase.from('quizzes').update({ folder_id: resolvedFolderId }).eq('id', quizId)
      if (error) {
        toast('Erro ao mover quiz.', 'error')
        loadDashboard()
      } else {
        toast('Quiz movido!', 'success')
      }
    } else if (itemId.startsWith('deck-')) {
      const deckId = itemId.replace('deck-', '')
      const deckBeingMoved = decks.find(d => d.id === deckId)
      if (!deckBeingMoved || deckBeingMoved.folder_id === resolvedFolderId) return

      // Optimistic update
      setDecks(prev => prev.map(d => d.id === deckId ? { ...d, folder_id: resolvedFolderId } : d))

      const { error } = await supabase.from('decks').update({ folder_id: resolvedFolderId }).eq('id', deckId)
      if (error) {
        toast('Erro ao mover deck.', 'error')
        loadDashboard()
      } else {
        toast('Deck movido!', 'success')
      }
    } else if (itemId.startsWith('mindmap-')) {
      const mmId = itemId.replace('mindmap-', '')
      const mmBeingMoved = mindMaps.find(m => m.id === mmId)
      if (!mmBeingMoved || mmBeingMoved.folder_id === resolvedFolderId) return

      setMindMaps(prev => prev.map(m => m.id === mmId ? { ...m, folder_id: resolvedFolderId } : m))

      const { error } = await supabase.from('mind_maps').update({ folder_id: resolvedFolderId }).eq('id', mmId)
      if (error) {
        toast('Erro ao mover mapa mental.', 'error')
        loadDashboard()
      } else {
        toast('Mapa mental movido!', 'success')
      }
    }
  }

  // Global stats
  const now = new Date()
  const totalCards = allCards.length
  const totalDue = allCards.filter((c) => new Date(c.due_date) <= now).length
  const totalMastered = allCards.filter(
    (c) => getCardStage(c) === 'mastered'
  ).length
  const totalLearning = allCards.filter(
    (c) => getCardStage(c) === 'learning'
  ).length
  const totalNew = allCards.filter((c) => getCardStage(c) === 'new').length
  const studiedTotal = allCards.filter((c) => getCardStage(c) !== 'new').length
  const masteryRate =
    totalCards > 0 ? Math.round((studiedTotal / totalCards) * 100) : 0

  async function handleCreateDeck() {
    if (!newDeckTitle.trim()) return
    const { data, error } = await supabase.from('decks').insert({
      title: newDeckTitle.trim(),
      user_id: user?.id
    }).select().single()

    if (error) {
      toast('Erro ao criar deck.', 'error')
    } else {
      setDecks(prev => [{ ...data, totalCards: 0, dueCards: 0, progressPercent: 0 }, ...prev])
      setNewDeckTitle('')
      setShowNewDeckModal(false)
      toast('Deck criado!', 'success')
      router.push(`/dashboard/deck/${data.id}`)
    }
  }

  async function handleCreateQuiz() {
    if (!newQuizTitle.trim()) return
    const { data, error } = await supabase.from('quizzes').insert({
      title: newQuizTitle.trim(),
      user_id: user?.id,
      status: 'ready',
      specialty_tag: 'Personalizado'
    }).select().single()

    if (error) {
      toast('Erro ao criar quiz.', 'error')
    } else {
      setQuizzes(prev => [data, ...prev])
      setNewQuizTitle('')
      setShowNewQuizModal(false)
      toast('Quiz criado!', 'success')
      router.push(`/dashboard/quiz/${data.id}`)
    }
  }

  // Folder management
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !user) return
    const { data, error } = await supabase
      .from('folders')
      .insert({ user_id: user.id, name: newFolderName.trim() })
      .select()
      .single()
    if (error) {
      toast('Erro ao criar pasta.', 'error')
    } else if (data) {
      setFolders(prev => [...prev, data])
      setNewFolderName('')
      setShowNewFolder(false)
      toast('Pasta criada!', 'success')
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    await supabase.from('decks').update({ folder_id: null }).eq('folder_id', folderId)
    await supabase.from('quizzes').update({ folder_id: null }).eq('folder_id', folderId)
    const { error } = await supabase.from('folders').delete().eq('id', folderId)
    if (!error) {
      setFolders(prev => prev.filter(f => f.id !== folderId))
      setDecks(prev => prev.map(d => d.folder_id === folderId ? { ...d, folder_id: null } : d))
      setQuizzes(prev => prev.map(q => q.folder_id === folderId ? { ...q, folder_id: null } : q))
      toast('Pasta removida.', 'success')
    }
  }

  const handleRenameFolder = async (folderId: string) => {
    if (!editFolderName.trim()) return
    const { error } = await supabase.from('folders').update({ name: editFolderName.trim() }).eq('id', folderId)
    if (!error) {
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: editFolderName.trim() } : f))
      setEditingFolderId(null)
      toast('Pasta renomeada!', 'success')
    }
  }

  const toggleFolderCollapse = (id: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Deck & Quiz CRUD
  const handleRenameDeck = async (deckId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    const { error } = await supabase.from('decks').update({ title: newTitle.trim() }).eq('id', deckId)
    if (!error) {
      setDecks(prev => prev.map(d => d.id === deckId ? { ...d, title: newTitle.trim() } : d))
      toast('Deck renomeado!', 'success')
    } else {
      toast('Erro ao renomear deck.', 'error')
    }
    setEditingItemId(null)
  }

  const handleDeleteDeck = async (deckId: string) => {
    const { error } = await supabase.from('decks').delete().eq('id', deckId)
    if (!error) {
      setDecks(prev => prev.filter(d => d.id !== deckId))
      setAllCards(prev => prev.filter(c => c.deck_id !== deckId))
      toast('Deck excluído.', 'success')
    } else {
      toast('Erro ao excluir deck.', 'error')
    }
    setDeletingItem(null)
  }

  const handleRenameQuiz = async (quizId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    const { error } = await supabase.from('quizzes').update({ title: newTitle.trim() }).eq('id', quizId)
    if (!error) {
      setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, title: newTitle.trim() } : q))
      toast('Quiz renomeado!', 'success')
    } else {
      toast('Erro ao renomear quiz.', 'error')
    }
    setEditingItemId(null)
  }

  const handleDeleteQuiz = async (quizId: string) => {
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId)
    if (!error) {
      setQuizzes(prev => prev.filter(q => q.id !== quizId))
      toast('Quiz excluído.', 'success')
    } else {
      toast('Erro ao excluir quiz.', 'error')
    }
    setDeletingItem(null)
  }

  const handleGenerateReport = async () => {
    // Check if there's a report in the last 7 days
    const latestReport = reports[0]
    if (latestReport) {
      const lastDate = new Date(latestReport.created_at)
      const diffTime = Math.abs(new Date().getTime() - lastDate.getTime())
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      
      if (diffDays < 7) {
        setShowReportLimitModal(true)
        return
      }
    }

    executeReportGeneration()
  }

  const executeReportGeneration = async () => {
    if (generatingReport) return
    setGeneratingReport(true)
    setShowReportLimitModal(false)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar relatório')

      toast('Relatório gerado com sucesso!', 'success')
      loadDashboard() // Refresh data
    } catch (error: any) {
      toast(error.message, 'error')
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleRenameMindMap = async (mmId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    const { error } = await supabase.from('mind_maps').update({ title: newTitle.trim() }).eq('id', mmId)
    if (!error) {
      setMindMaps(prev => prev.map(m => m.id === mmId ? { ...m, title: newTitle.trim() } : m))
      toast('Mapa mental renomeado!', 'success')
    } else {
      toast('Erro ao renomear mapa mental.', 'error')
    }
    setEditingItemId(null)
  }

  const handleDeleteMindMap = async (mmId: string) => {
    const { error } = await supabase.from('mind_maps').delete().eq('id', mmId)
    if (!error) {
      setMindMaps(prev => prev.filter(m => m.id !== mmId))
      toast('Mapa mental excluído.', 'success')
    } else {
      toast('Erro ao excluir mapa mental.', 'error')
    }
    setDeletingItem(null)
  }

  const handleCreateMindMap = async () => {
    if (!newMindMapTitle.trim()) return
    const { data, error } = await supabase.from('mind_maps').insert({
      title: newMindMapTitle.trim(),
      user_id: user?.id,
      status: 'ready',
      specialty_tag: 'Personalizado',
      data_json: { nodes: [], edges: [] }
    }).select().single()

    if (error) {
      toast('Erro ao criar mapa mental.', 'error')
    } else {
      setMindMaps(prev => [data, ...prev])
      setNewMindMapTitle('')
      setShowNewMindMapModal(false)
      toast('Mapa mental criado!', 'success')
      router.push(`/dashboard/mindmap/${data.id}`)
    }
  }

  const openRenameItem = (id: string, currentName: string, type: 'deck' | 'quiz' | 'mindmap') => {
    setEditingItemId(id)
    setEditingItemName(currentName)
    setEditingItemType(type)
  }

  const folderedDecks = folders.map(folder => ({
    folder,
    decks: decks.filter(d => d.folder_id === folder.id)
  }))
  const unassignedDecks = decks.filter(d => !d.folder_id)

  const folderedMindMaps = folders.map(folder => ({
    folder,
    mindMaps: mindMaps.filter(m => m.folder_id === folder.id)
  }))
  const unassignedMindMaps = mindMaps.filter(m => !m.folder_id)

  const activeDeck = activeId?.startsWith('deck-') ? decks.find(d => d.id === activeId.replace('deck-', '')) : null
  const activeQuiz = activeId?.startsWith('quiz-') ? quizzes.find(q => q.id === activeId.replace('quiz-', '')) : null

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-12">
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-6 md:pb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                Painel de Estudo
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Bem-vindo de volta, {user?.email?.split('@')[0]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="primary" 
                size="sm" 
                className={cn(
                  "shadow-lg hover:shadow-xl transition-all whitespace-nowrap",
                  activeTab === 'quizzes' && "!bg-emerald-600 hover:!bg-emerald-700",
                  activeTab === 'mindmaps' && "!bg-amber-500 hover:!bg-amber-600"
                )} 
                onClick={() => {
                  if (activeTab === 'mindmaps' || activeTab === 'reports') {
                    router.push('/dashboard/new')
                  } else {
                    setShowCreateChoice(true)
                  }
                }}
              >
                <Plus size={16} className="mr-1" /> Criar {activeTab === 'decks' ? 'Deck' : activeTab === 'quizzes' ? 'Quiz' : 'Mapa'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowNewFolder(true)} className="whitespace-nowrap">
                <FolderPlus size={14} className="mr-1" /> <span className="hidden sm:inline">Nova </span>Pasta
              </Button>
              
              {/* Spacer to push profile to the right on mobile */}
              <div className="flex-1 sm:hidden" />
              
              {/* Desktop: Conta + Sair buttons */}
              <div className="hidden sm:flex gap-2">
                <Link href="/dashboard/account">
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    <Settings size={14} className="mr-1" /> Conta
                  </Button>
                </Link>
                <Button onClick={() => setShowLogoutModal(true)} variant="ghost" size="sm" className="whitespace-nowrap">
                  <LogOut size={14} className="mr-1" /> Sair
                </Button>
              </div>
              
              {/* Mobile: Profile icon dropdown */}
              <div className="relative sm:hidden">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <User size={18} />
                </button>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-12 z-50 w-48 bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-xl shadow-xl py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Link href="/dashboard/account" onClick={() => setShowProfileMenu(false)}>
                        <div className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--foreground)] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <Settings size={16} className="text-[var(--muted-foreground)]" />
                          Conta
                        </div>
                      </Link>
                      <button 
                        onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <LogOut size={16} />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Layers size={20} />} label="Decks" value={decks.length} color="blue" />
            <StatCard icon={<BookOpen size={20} />} label="Flashcards" value={totalCards} color="green" />
            <StatCard icon={<Clock size={20} />} label="Pendentes" value={totalDue} color="amber" />
            <StatCard icon={<Target size={20} />} label="Estudado" value={`${masteryRate}%`} color="emerald" />
          </div>

          {/* Learning Progress Bar */}
          {totalCards > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-[var(--border)] p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-500" />
                  Progresso Geral
                </h3>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {studiedTotal} de {totalCards} estudados
                </span>
              </div>
              <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                <ProgressSegment value={totalMastered} total={totalCards} color="bg-emerald-500" />
                <ProgressSegment value={totalCards - totalMastered - totalLearning - totalNew} total={totalCards} color="bg-green-400" />
                <ProgressSegment value={totalLearning} total={totalCards} color="bg-orange-400" />
                <ProgressSegment value={totalNew} total={totalCards} color="bg-blue-400" />
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                <LegendItem color="bg-emerald-500" label={`Dominado (${totalMastered})`} />
                <LegendItem color="bg-green-400" label={`Revisão (${totalCards - totalMastered - totalLearning - totalNew})`} />
                <LegendItem color="bg-orange-400" label={`Aprendendo (${totalLearning})`} />
                <LegendItem color="bg-blue-400" label={`Novo (${totalNew})`} />
              </div>
            </div>
          )}

          {/* Due Cards Alert */}
          {totalDue > 0 && (
            <div className="p-4 md:p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>{totalDue}</strong> {totalDue === 1 ? 'carta precisa ser revisada' : 'cartas precisam ser revisadas'} hoje!
                </p>
              </div>
              <Link href="/dashboard/study-config" className="block">
                <Button size="sm" className="w-full sm:w-auto whitespace-nowrap">Estudar Agora</Button>
              </Link>
            </div>
          )}

          {/* New Folder Modal */}
          {showNewFolder && (
            <div className="bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-xl p-6 shadow-sm animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <FolderPlus size={16} className="text-blue-500" />
                Criar Nova Pasta
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  placeholder="Nome da pasta (ex: Cardiologia)"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
                <Button size="sm" onClick={handleCreateFolder}>Criar</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setNewFolderName('') }}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 border-b border-[var(--border)] overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            <button
              onClick={() => setActiveTab('decks')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'decks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <BookOpen size={16} />
              Decks
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">{decks.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'quizzes'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <HelpCircle size={16} />
              Quizzes
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">{quizzes.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('mindmaps')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'mindmaps'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Zap size={16} />
              Mapas
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">{mindMaps.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <BarChart3 size={16} />
              Relatórios
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">{reports.length}</span>
            </button>
          </div>

          {/* Decks Tab */}
          {activeTab === 'decks' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Seus Decks</h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}
              </div>
            ) : decks.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-8">
                {folderedDecks.map(({ folder, decks: folderDecks }) => (
                  <DroppableFolder key={folder.id} id={`deck-drop-${folder.id}`}>
                    <FolderHeader
                      folder={folder}
                      itemCount={folderDecks.length}
                      isCollapsed={collapsedFolders.has(folder.id)}
                      isEditing={editingFolderId === folder.id}
                      editName={editFolderName}
                      onToggleCollapse={() => toggleFolderCollapse(folder.id)}
                      onStartEdit={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name) }}
                      onEditNameChange={setEditFolderName}
                      onSaveEdit={() => handleRenameFolder(folder.id)}
                      onCancelEdit={() => setEditingFolderId(null)}
                      onDelete={() => handleDeleteFolder(folder.id)}
                    />
                    {!collapsedFolders.has(folder.id) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-6 min-h-[60px]">
                        {folderDecks.length === 0 ? (
                          <p className="text-xs text-[var(--muted-foreground)] italic col-span-full py-4">Vazio. Arraste decks para cá.</p>
                        ) : (
                          folderDecks.map((deck) => <DraggableDeck key={deck.id} deck={deck} onRename={(id, title) => openRenameItem(id, title, 'deck')} onDelete={(id, title) => setDeletingItem({ id, type: 'deck', title })} />)
                        )}
                      </div>
                    )}
                  </DroppableFolder>
                ))}

                <DroppableFolder id="deck-drop-unassigned">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={16} className="text-zinc-400" />
                    <span className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Decks Soltos</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{unassignedDecks.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[60px]">
                    {unassignedDecks.length === 0 ? (
                      folders.length > 0 && <p className="text-xs text-[var(--muted-foreground)] italic col-span-full py-4">Tudo organizado!</p>
                    ) : (
                      unassignedDecks.map((deck) => <DraggableDeck key={deck.id} deck={deck} onRename={(id, title) => openRenameItem(id, title, 'deck')} onDelete={(id, title) => setDeletingItem({ id, type: 'deck', title })} />)
                    )}
                  </div>
                </DroppableFolder>
              </div>
            )}
          </div>
          )}

          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Seus Quizzes</h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-xl">
                <HelpCircle size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Nenhum quiz ainda</h3>
                <p className="text-[var(--muted-foreground)] mb-6">Faça upload de um material e gere quizzes automaticamente.</p>
                <Link href="/dashboard/new">
                  <Button variant="primary" size="sm"><Plus size={14} className="mr-1" /> Nova Fonte</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Quizzes in folders */}
                {folders.map(folder => {
                  const folderQuizzes = quizzes.filter(q => q.folder_id === folder.id)
                  return (
                    <DroppableFolder key={folder.id} id={`quiz-drop-${folder.id}`}>
                      <FolderHeader
                        folder={folder}
                        itemCount={folderQuizzes.length}
                        isCollapsed={collapsedFolders.has(folder.id)}
                        isEditing={editingFolderId === folder.id}
                        editName={editFolderName}
                        onToggleCollapse={() => toggleFolderCollapse(folder.id)}
                        onStartEdit={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name) }}
                        onEditNameChange={setEditFolderName}
                        onSaveEdit={() => handleRenameFolder(folder.id)}
                        onCancelEdit={() => setEditingFolderId(null)}
                        onDelete={() => handleDeleteFolder(folder.id)}
                      />
                      {!collapsedFolders.has(folder.id) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-6 min-h-[60px]">
                          {folderQuizzes.length === 0 ? (
                            <p className="text-xs text-[var(--muted-foreground)] italic col-span-full py-4">Vazio. Arraste quizzes para cá.</p>
                          ) : (
                            folderQuizzes.map(quiz => <DraggableQuiz key={quiz.id} quiz={quiz} onRename={(id, title) => openRenameItem(id, title, 'quiz')} onDelete={(id, title) => setDeletingItem({ id, type: 'quiz', title })} />)
                          )}
                        </div>
                      )}
                    </DroppableFolder>
                  )
                })}
                {/* Unassigned quizzes */}
                <DroppableFolder id="quiz-drop-unassigned">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={16} className="text-zinc-400" />
                    <span className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Quizzes Soltos</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{quizzes.filter(q => !q.folder_id).length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[60px]">
                    {quizzes.filter(q => !q.folder_id).length === 0 ? (
                      folders.length > 0 && <p className="text-xs text-[var(--muted-foreground)] italic col-span-full py-4">Tudo organizado!</p>
                    ) : (
                      quizzes.filter(q => !q.folder_id).map(quiz => <DraggableQuiz key={quiz.id} quiz={quiz} onRename={(id, title) => openRenameItem(id, title, 'quiz')} onDelete={(id, title) => setDeletingItem({ id, type: 'quiz', title })} />)
                    )}
                  </div>
                </DroppableFolder>
              </div>
            )}
          </div>
          )}

          {/* Mind Maps Tab */}
          {activeTab === 'mindmaps' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Seus Mapas Mentais</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">Visualize conexões entre conceitos médicos.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/new')} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all whitespace-nowrap">
                  <Plus size={16} className="mr-2" />
                  Novo Mapa Mental
                </Button>
              </div>

              <div className="space-y-8">
                {folderedMindMaps.map(({ folder, mindMaps: folderItems }) => (
                  <DroppableFolder key={folder.id} id={`mindmap-drop-${folder.id}`}>
                    <FolderHeader 
                      folder={folder} 
                      itemCount={folderItems.length} 
                      isCollapsed={collapsedFolders.has(folder.id)} 
                      isEditing={editingFolderId === folder.id}
                      editName={editFolderName}
                      onToggleCollapse={() => toggleFolderCollapse(folder.id)}
                      onStartEdit={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                      onEditNameChange={setEditFolderName}
                      onSaveEdit={() => handleRenameFolder(folder.id)}
                      onCancelEdit={() => setEditingFolderId(null)}
                      onDelete={() => handleDeleteFolder(folder.id)}
                    />
                    {!collapsedFolders.has(folder.id) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[60px]">
                        {folderItems.length === 0 ? (
                          <p className="text-xs text-[var(--muted-foreground)] italic col-span-full py-4">Vazio. Arraste mapas para cá.</p>
                        ) : (
                          folderItems.map((mm) => (
                            <DraggableMindMap 
                              key={mm.id} 
                              mindMap={mm} 
                              onRename={(id: string, title: string) => openRenameItem(id, title, 'mindmap')} 
                              onDelete={(id: string, title: string) => setDeletingItem({ id, type: 'mindmap', title })} 
                            />
                          ))
                        )}
                      </div>
                    )}
                  </DroppableFolder>
                ))}

                <DroppableFolder id="mindmap-drop-unassigned">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={16} className="text-zinc-400" />
                    <span className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Mapas Soltos</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{unassignedMindMaps.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[60px]">
                    {unassignedMindMaps.length === 0 ? (
                      folders.length > 0 && <p className="text-xs text-[var(--muted-foreground)] italic col-span-full py-4">Tudo organizado!</p>
                    ) : (
                      unassignedMindMaps.map((mm) => (
                        <DraggableMindMap 
                          key={mm.id} 
                          mindMap={mm} 
                          onRename={(id: string, title: string) => openRenameItem(id, title, 'mindmap')} 
                          onDelete={(id: string, title: string) => setDeletingItem({ id, type: 'mindmap', title })} 
                        />
                      ))
                    )}
                  </div>
                </DroppableFolder>
              </div>

              <DragOverlay dropAnimation={null}>
                {activeId && activeId.startsWith('mindmap-') ? (
                  <div className="opacity-80 scale-105">
                    <MindMapCard mindMap={mindMaps.find(m => m.id === activeId.replace('mindmap-', ''))!} />
                  </div>
                ) : null}
              </DragOverlay>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Suas Análises</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">Visão detalhada do seu progresso e pontos focais.</p>
                </div>
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={generatingReport}
                  className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                >
                  {generatingReport ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analisando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap size={16} />
                      Nova Análise de Desempenho
                    </span>
                  )}
                </Button>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-2xl">
                  <BarChart3 size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Pronto para sua primeira análise?</h3>
                  <p className="text-[var(--muted-foreground)] mb-8 max-w-sm mx-auto">
                    Nossa IA vai analisar seus erros e acertos para dizer exatamente onde você deve focar seus estudos.
                  </p>
                  <Button variant="outline" onClick={handleGenerateReport} disabled={generatingReport}>
                    Gerar Primeiro Relatório
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {reports.map((report) => (
                    <Link key={report.id} href={`/dashboard/reports/${report.id}`}>
                      <div className="group bg-white dark:bg-zinc-900 border border-[var(--border)] p-6 rounded-2xl hover:border-blue-500 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <FileText size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-[var(--foreground)] group-hover:text-blue-500 transition-colors uppercase tracking-tight">{report.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                                <Clock size={12} /> {new Date(report.created_at).toLocaleDateString('pt-BR')} às {new Date(report.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden md:flex gap-2">
                            {report.analysis_json?.recommended_topics?.slice(0, 2).map((topic: string, i: number) => (
                              <span key={topic + i} className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full uppercase tracking-widest leading-none">
                                {topic}
                              </span>
                            ))}
                          </div>
                          <ChevronRight size={20} className="text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }) as any,
      } as any}>
        {activeDeck ? (
          <div className="w-[300px] pointer-events-none opacity-90 scale-105 shadow-2xl">
            <DeckCard deck={activeDeck} />
          </div>
        ) : activeQuiz ? (
          <div className="w-[300px] pointer-events-none opacity-90 scale-105 shadow-2xl">
            <QuizCard quiz={activeQuiz} />
          </div>
        ) : null}
      </DragOverlay>

      {/* Rename Item Modal */}
      {editingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setEditingItemId(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500"><Pencil size={20} /></div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Renomear {editingItemType === 'deck' ? 'Deck' : editingItemType === 'quiz' ? 'Quiz' : 'Mapa Mental'}</h3>
            </div>
            <input
              type="text"
              value={editingItemName}
              onChange={(e) => setEditingItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  editingItemType === 'deck'
                    ? handleRenameDeck(editingItemId, editingItemName)
                    : editingItemType === 'quiz'
                    ? handleRenameQuiz(editingItemId, editingItemName)
                    : handleRenameMindMap(editingItemId, editingItemName)
                }
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditingItemId(null)}>Cancelar</Button>
              <Button variant="primary" className="flex-1" onClick={() => {
                editingItemType === 'deck'
                  ? handleRenameDeck(editingItemId, editingItemName)
                  : editingItemType === 'quiz'
                  ? handleRenameQuiz(editingItemId, editingItemName)
                  : handleRenameMindMap(editingItemId, editingItemName)
              }}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Choice Modal */}
      {showCreateChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCreateChoice(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Como deseja criar seu {activeTab === 'decks' ? 'Deck' : 'Quiz'}?
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateChoice(false)}>
                <X size={20} />
              </Button>
            </div>
            
              {activeTab === 'decks' && (
                <>
                  <button 
                    onClick={() => {
                      setShowCreateChoice(false)
                      router.push('/dashboard/new?type=deck')
                    }}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group"
                  >
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Gerar com IA (Automático)</h4>
                      <p className="text-sm text-zinc-500">Faça upload de um PDF ou cole um texto e deixe nossa IA gerar todo o conteúdo para você em segundos.</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      setShowCreateChoice(false)
                      setShowNewDeckModal(true)
                    }}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all text-left group"
                  >
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 group-hover:scale-110 transition-transform">
                      <Pencil size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Criar Manualmente</h4>
                      <p className="text-sm text-zinc-500">Comece do zero e escreva suas próprias cartas ou questões. Ideal para revisões personalizadas.</p>
                    </div>
                  </button>
                </>
              )}

              {activeTab === 'quizzes' && (
                <>
                  <button 
                    onClick={() => {
                      setShowCreateChoice(false)
                      router.push('/dashboard/new?type=quiz')
                    }}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group"
                  >
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Gerar com IA (Automático)</h4>
                      <p className="text-sm text-zinc-500">Faça upload de um PDF ou cole um texto e deixe nossa IA gerar todo o conteúdo para você em segundos.</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      setShowCreateChoice(false)
                      setShowNewQuizModal(true)
                    }}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all text-left group"
                  >
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 group-hover:scale-110 transition-transform">
                      <Pencil size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Criar Manualmente</h4>
                      <p className="text-sm text-zinc-500">Comece do zero e escreva suas próprias cartas ou questões. Ideal para revisões personalizadas.</p>
                    </div>
                  </button>
                </>
              )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDeletingItem(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500"><Trash2 size={20} /></div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Excluir {deletingItem.type === 'deck' ? 'Deck' : deletingItem.type === 'quiz' ? 'Quiz' : 'Mapa Mental'}
            </h3>
          </div>
          <p className="text-[var(--muted-foreground)] text-sm mb-6">Tem certeza que deseja excluir <strong className="text-[var(--foreground)]">"{deletingItem.title}"</strong>? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeletingItem(null)}>Cancelar</Button>
            <Button variant="primary" className="flex-1 !bg-red-600 hover:!bg-red-700" onClick={() => {
              if (deletingItem.type === 'deck') handleDeleteDeck(deletingItem.id)
              else if (deletingItem.type === 'quiz') handleDeleteQuiz(deletingItem.id)
              else handleDeleteMindMap(deletingItem.id)
            }}>Excluir</Button>
          </div>
          </div>
        </div>
      )}

      {/* New Deck Modal */}
      {showNewDeckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowNewDeckModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500"><BookOpen size={20} /></div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Novo Deck Manual</h3>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm mb-4">Dê um nome para sua nova coleção de flashcards.</p>
            <input
              type="text"
              placeholder="Ex: Anatomia Cardíaca"
              value={newDeckTitle}
              onChange={(e) => setNewDeckTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDeck()}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewDeckModal(false)}>Cancelar</Button>
              <Button variant="primary" className="flex-1" onClick={handleCreateDeck} disabled={!newDeckTitle.trim()}>Criar Deck</Button>
            </div>
          </div>
        </div>
      )}

      {/* New Quiz Modal */}
      {showNewQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowNewQuizModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-500"><HelpCircle size={20} /></div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Novo Quiz Manual</h3>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm mb-4">Crie um conjunto de questões personalizadas.</p>
            <input
              type="text"
              placeholder="Ex: Simulado Fisiologia"
              value={newQuizTitle}
              onChange={(e) => setNewQuizTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateQuiz()}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewQuizModal(false)}>Cancelar</Button>
              <Button variant="primary" className="flex-1 !bg-emerald-600 hover:!bg-emerald-700" onClick={handleCreateQuiz} disabled={!newQuizTitle.trim()}>Criar Quiz</Button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <LogoutModal onClose={() => setShowLogoutModal(false)} onConfirm={() => { handleSignOut(); setShowLogoutModal(false); }} />
      )}

      {/* Report Limit Modal */}
      {showReportLimitModal && (
        <ReportLimitModal 
          onClose={() => setShowReportLimitModal(false)} 
          onConfirm={executeReportGeneration} 
          loading={generatingReport}
        />
      )}
    </DndContext>
  )
}

// Subcomponents
function StatCard({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
  const colors: any = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
  }
  return (
    <div className="bg-white dark:bg-zinc-900 border border-[var(--border)] p-5 rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-lg", colors[color])}>{icon}</div>
        <div>
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ProgressSegment({ value, total, color }: { value: number, total: number, color: string }) {
  if (value <= 0) return null
  return (
    <div className={cn("h-full transition-all duration-500", color)} style={{ width: `${(value / total) * 100}%` }} />
  )
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
      <span className={cn("w-2.5 h-2.5 rounded-full", color)} />
      {label}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="bg-[var(--secondary)] border border-[var(--border)] rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-3xl mb-2">📂</div>
      <h3 className="text-lg font-medium text-[var(--foreground)]">Nenhuma coleção encontrada</h3>
      <p className="text-[var(--muted-foreground)] max-w-sm">Faça upload de documentos para que a IA gere seus flashcards automaticamente.</p>
      <div className="pt-4"><Link href="/dashboard/new"><Button variant="secondary">Começar Agora</Button></Link></div>
    </div>
  )
}

function LogoutModal({ onClose, onConfirm }: { onClose: () => void, onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500"><LogOut size={20} /></div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Sair da conta</h3>
        </div>
        <p className="text-[var(--muted-foreground)] text-sm mb-6">Tem certeza que deseja sair?</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1 !bg-red-600 hover:!bg-red-700" onClick={onConfirm}>Sair</Button>
        </div>
      </div>
    </div>
  )
}

function DraggableDeck({ deck, onRename, onDelete }: { deck: DeckWithStats, onRename?: (id: string, title: string) => void, onDelete?: (id: string, title: string) => void }) {
  const router = useRouter()
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
        "cursor-grab active:cursor-grabbing touch-none select-none",
        isDragging && "opacity-40 scale-95"
      )}
    >
      <Link 
        href={`/dashboard/deck/${deck.id}`} 
        className="block"
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

function DraggableQuiz({ quiz, onRename, onDelete }: { quiz: Quiz, onRename?: (id: string, title: string) => void, onDelete?: (id: string, title: string) => void }) {
  const router = useRouter()
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
        "cursor-grab active:cursor-grabbing touch-none select-none",
        isDragging && "opacity-40 scale-95"
      )}
    >
      <Link 
        href={`/dashboard/quiz/${quiz.id}`} 
        className="block"
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

function DroppableFolder({ id, children }: { id: string, children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl transition-all duration-200 p-3 -m-3",
        isOver
          ? "bg-blue-500/10 ring-2 ring-blue-500 ring-inset shadow-lg shadow-blue-500/10"
          : "ring-2 ring-transparent"
      )}
    >
      {children}
    </div>
  )
}

function FolderHeader({
  folder,
  itemCount,
  isCollapsed,
  isEditing,
  editName,
  onToggleCollapse,
  onStartEdit,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  folder: FolderType
  itemCount: number
  isCollapsed: boolean
  isEditing: boolean
  editName: string
  onToggleCollapse: () => void
  onStartEdit: () => void
  onEditNameChange: (name: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-2 group mb-3">
      <button onClick={onToggleCollapse} className="flex items-center gap-2 text-[var(--foreground)] hover:text-blue-500 transition-colors">
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        <Folder size={16} className="text-amber-500" />
        {isEditing ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
              className="px-2 py-0.5 text-sm rounded border border-blue-500 bg-transparent focus:outline-none"
              autoFocus
            />
            <button onClick={onSaveEdit} className="text-green-500 hover:text-green-600"><Check size={14} /></button>
            <button onClick={onCancelEdit} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"><X size={14} /></button>
          </div>
        ) : (
          <span className="text-sm font-bold uppercase tracking-wider">{folder.name}</span>
        )}
      </button>
      <span className="text-[10px] text-[var(--muted-foreground)] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{itemCount}</span>
      {!isEditing && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
          <button onClick={onStartEdit} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--muted-foreground)]"><Pencil size={12} /></button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--muted-foreground)] hover:text-red-500"><Trash2 size={12} /></button>
        </div>
      )}
    </div>
  )
}

function DeckCard({ deck, onRename, onDelete }: { deck: DeckWithStats, onRename?: (id: string, title: string) => void, onDelete?: (id: string, title: string) => void }) {
  return (
    <div className="group/card h-full bg-white dark:bg-zinc-900 border border-[var(--border)] p-6 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-200 dark:hover:border-blue-800/50 relative">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 group-hover/card:bg-blue-600 group-hover/card:text-white transition-colors">
          <BookOpen size={18} />
        </div>
        <div className="flex items-center gap-2">
          {deck.dueCards > 0 && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider">{deck.dueCards} pendente{deck.dueCards > 1 ? 's' : ''}</span>}
          <span className="text-xs font-medium text-[var(--muted-foreground)] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">{deck.totalCards} cards</span>
          {onRename && onDelete && (
            <CardKebabMenu
              onRename={() => onRename(deck.id, deck.title)}
              onDelete={() => onDelete(deck.id, deck.title)}
            />
          )}
        </div>
      </div>
      <h3 className="text-lg font-bold text-[var(--foreground)] line-clamp-2 mb-3 group-hover/card:text-blue-600 transition-colors">{deck.title}</h3>
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Progresso</span>
          <span className="text-[10px] font-bold text-emerald-500">{deck.progressPercent}%</span>
        </div>
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${deck.progressPercent}%` }} />
        </div>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">Criado em {new Date(deck.created_at).toLocaleDateString()}</p>
    </div>
  )
}

function QuizCard({ quiz, onRename, onDelete }: { quiz: Quiz, onRename?: (id: string, title: string) => void, onDelete?: (id: string, title: string) => void }) {
  return (
    <div className="group/card h-full bg-white dark:bg-zinc-900 border border-[var(--border)] p-6 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-emerald-200 dark:hover:border-emerald-800/50 cursor-pointer relative">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 group-hover/card:bg-emerald-600 group-hover/card:text-white transition-colors">
          <HelpCircle size={18} />
        </div>
        <div className="flex items-center gap-2">
          {quiz.status === 'generating' && (
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              Gerando...
            </span>
          )}
          {quiz.status === 'error' && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Erro
            </span>
          )}
          <span className="text-xs font-medium text-[var(--muted-foreground)] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
            {quiz.totalQuestions} questões
          </span>
          {onRename && onDelete && (
            <CardKebabMenu
              onRename={() => onRename(quiz.id, quiz.title)}
              onDelete={() => onDelete(quiz.id, quiz.title)}
            />
          )}
        </div>
      </div>
      <h3 className="text-lg font-bold text-[var(--foreground)] line-clamp-2 mb-2 group-hover/card:text-emerald-600 transition-colors">
        {quiz.title}
      </h3>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
          {quiz.specialty_tag}
        </span>
        {quiz.lastScoreHit !== undefined && quiz.lastScoreTotal !== undefined && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
            <Trophy size={10} /> {quiz.lastScoreHit}/{quiz.lastScoreTotal} acertos
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">Criado em {new Date(quiz.created_at).toLocaleDateString()}</p>
    </div>
  )
}

function DraggableMindMap({ mindMap, onRename, onDelete }: { mindMap: MindMap, onRename?: (id: string, title: string) => void, onDelete?: (id: string, title: string) => void }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `mindmap-${mindMap.id}` })
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
        "cursor-grab active:cursor-grabbing touch-none select-none",
        isDragging && "opacity-40 scale-95"
      )}
    >
      <Link 
        href={`/dashboard/mindmap/${mindMap.id}`} 
        className="block"
        onClick={(e) => {
          if (isDragging) e.preventDefault()
        }}
      >
        <MindMapCard 
          mindMap={mindMap} 
          onRename={onRename} 
          onDelete={onDelete} 
        />
      </Link>
    </div>
  )
}

function MindMapCard({ mindMap, onRename, onDelete }: { mindMap: MindMap, onRename?: (id: string, title: string) => void, onDelete?: (id: string, title: string) => void }) {
  return (
    <div className="group/card h-full bg-white dark:bg-zinc-900 border border-[var(--border)] p-6 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-amber-200 dark:hover:border-amber-800/50 cursor-pointer relative">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 group-hover/card:bg-amber-600 group-hover/card:text-white transition-colors">
          <Zap size={18} />
        </div>
        <div className="flex items-center gap-2">
          {mindMap.status === 'generating' && (
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              Gerando...
            </span>
          )}
          {mindMap.status === 'error' && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Erro
            </span>
          )}
          {onRename && onDelete && (
            <CardKebabMenu
              onRename={() => onRename(mindMap.id, mindMap.title)}
              onDelete={() => onDelete(mindMap.id, mindMap.title)}
            />
          )}
        </div>
      </div>
      <h3 className="text-lg font-bold text-[var(--foreground)] line-clamp-2 mb-2 group-hover/card:text-amber-600 transition-colors">
        {mindMap.title}
      </h3>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
          {mindMap.specialty_tag}
        </span>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">Criado em {new Date(mindMap.created_at).toLocaleDateString()}</p>
    </div>
  )
}

function CardKebabMenu({ onRename, onDelete }: { onRename: () => void, onDelete: () => void }) {
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
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(!open) }}
        onPointerDown={(e) => e.stopPropagation()}
        className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors opacity-0 group-hover/card:opacity-100"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onRename() }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <Pencil size={14} className="text-[var(--muted-foreground)]" />
            Renomear
          </button>
          <div className="border-t border-[var(--border)]" />
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onDelete() }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={14} />
            Excluir
          </button>
        </div>
      )}
    </div>
  )
}
function ReportLimitModal({ onClose, onConfirm, loading }: { onClose: () => void, onConfirm: () => void, loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-500"><Zap size={24} /></div>
          <h3 className="text-xl font-bold text-[var(--foreground)]">Análise Recente</h3>
        </div>
        <p className="text-[var(--muted-foreground)] text-sm mb-2 leading-relaxed">
          Você já gerou uma análise de desempenho nos últimos <strong>7 dias</strong>.
        </p>
        <p className="text-[var(--muted-foreground)] text-sm mb-8 leading-relaxed">
          Para extrair o máximo valor, recomendamos estudar um pouco mais antes de pedir uma nova visão da IA. Deseja prosseguir mesmo assim?
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="primary" className="w-full shadow-lg" onClick={onConfirm} disabled={loading}>
            {loading ? 'Iniciando...' : 'Gerar Nova Análise'}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Estudar Mais Primeiro
          </Button>
        </div>
      </div>
    </div>
  )
}
