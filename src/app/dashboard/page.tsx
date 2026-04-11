'use client'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
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
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
import { cn } from '@/lib/utils'
import { StatCard, BentoGrid } from '@/components/dashboard/stat-card'
import { NeuronBackground } from '@/components/dashboard/neuron-background'
import { DeckCard, DraggableDeck } from '@/components/dashboard/deck-card'
import { QuizCard, DraggableQuiz } from '@/components/dashboard/quiz-card'
import { MindMapCard, DraggableMindMap } from '@/components/dashboard/mind-map-card'
import { FolderHeader, DroppableFolder } from '@/components/dashboard/folder-management'
import { 
  RenameItemModal, 
  CreateChoiceModal, 
  DeleteConfirmationModal, 
  LogoutModal, 
  ReportLimitModal,
  NewFolderModal,
  NewDeckModal,
  NewQuizModal
} from '@/components/dashboard/dashboard-modals'
import { 
  Heart, 
  Activity, 
  Stethoscope, 
  Microscope,
  Baby,
  Brain as BrainIcon,
  CircleDot
} from 'lucide-react'
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
function DashboardPageContent() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [decks, setDecks] = useState<DeckWithStats[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [allCardsStats, setAllCardsStats] = useState<{
    total_cards: number;
    due_today: number;
    mastered: number;
    learning: number;
    new: number;
    studied_total: number;
  } | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<DashboardTab>((searchParams.get('tab') as DashboardTab) || 'decks')
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
  const [searchTerm, setSearchTerm] = useState('')
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null)
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
      setLoading(true)
      
      // Parallel fetches for base entities using optimized views where possible
      const [
        { data: decksData, error: decksError },
        { data: foldersData },
        { data: docsData },
        { data: quizzesData },
        { data: mmData },
        { data: reportsData },
        { data: profileData },
        { data: progressSummary }
      ] = await Promise.all([
        supabase.from('deck_stats_view').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('folders').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('quiz_stats_view').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('mind_maps').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('performance_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.rpc('get_user_progress_summary', { p_user_id: user.id })
      ])

      if (decksError) throw decksError
      
      // Map deck stats directly from optimized view
      const enrichedDecks = (decksData || []).map((deck: any) => ({
        ...deck,
        totalCards: Number(deck.total_cards || 0),
        dueCards: Number(deck.due_cards || 0),
        masteredCards: Number(deck.mastered_cards || 0),
        progressPercent: Number(deck.total_cards) > 0 
          ? Math.round((Number(deck.studied_cards) / Number(deck.total_cards)) * 100) 
          : 0
      }))

      // Map quiz stats directly from optimized view
      const enrichedQuizzes = (quizzesData || []).map((quiz: any) => ({
        ...quiz,
        totalQuestions: Number(quiz.total_questions || 0),
        lastScoreHit: quiz.last_score_hit,
        lastScoreTotal: quiz.last_score_total,
      }))

      setDecks(enrichedDecks)
      setDocuments(docsData || [])
      setFolders(foldersData || [])
      setQuizzes(enrichedQuizzes)
      setReports(reportsData || [])
      setMindMaps(mmData || [])
      setProfile(profileData)
      
      // Set global stats from summary RPC
      if (progressSummary) {
        setAllCardsStats(progressSummary)
      }

    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      toast('Erro ao carregar dashboard.', 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadDashboard()
  }, [user])
  // Sync activeTab with URL search params
  useEffect(() => {
    const tab = searchParams.get('tab') as DashboardTab
    if (tab && ['decks', 'quizzes', 'reports', 'mindmaps'].includes(tab) && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams])
  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/dashboard?${params.toString()}`, { scroll: false })
  }
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
  // Global stats from optimized RPC summary
  const totalCards = allCardsStats?.total_cards || 0
  const totalDue = allCardsStats?.due_today || 0
  const totalMastered = allCardsStats?.mastered || 0
  const totalLearning = allCardsStats?.learning || 0
  const totalNew = allCardsStats?.new || 0
  const studiedTotal = allCardsStats?.studied_total || 0
  const masteryRate = totalCards > 0 ? Math.round((studiedTotal / totalCards) * 100) : 0
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
      toast('Deck excluído.', 'success')
      loadDashboard()
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
      loadDashboard()
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
  const getSpecialtyIcon = (tag: string) => {
    const t = tag?.toLowerCase() || ''
    if (t.includes('cardio')) return <Heart size={14} className="text-red-400" />
    if (t.includes('neuro')) return <BrainIcon size={14} className="text-purple-400" />
    if (t.includes('pediat')) return <Baby size={14} className="text-blue-300" />
    if (t.includes('emerg')) return <Activity size={14} className="text-orange-400" />
    if (t.includes('cirur')) return <Stethoscope size={14} className="text-emerald-400" />
    return <CircleDot size={14} className="text-emerald-400" />
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
  // Search Filtering Logic
  const filteredDecks = decks.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.specialty_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.quiz_questions?.[0]?.count?.toString().includes(searchTerm)
  )
  const filteredMindMaps = mindMaps.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const folderedDecks = folders.map(folder => ({
    folder,
    decks: filteredDecks.filter(d => d.folder_id === folder.id)
  }))
  const unassignedDecks = filteredDecks.filter(d => !d.folder_id)
  const folderedMindMaps = folders.map(folder => ({
    folder,
    mindMaps: filteredMindMaps.filter(m => m.folder_id === folder.id)
  }))
  const unassignedMindMaps = filteredMindMaps.filter(m => !m.folder_id)
  const activeIdString = activeId || ''
  const activeDeck = activeIdString.startsWith('deck-') ? filteredDecks.find(d => d.id === activeIdString.replace('deck-', '')) : null
  const activeQuiz = activeIdString.startsWith('quiz-') ? filteredQuizzes.find(q => q.id === activeIdString.replace('quiz-', '')) : null
    return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen relative clinical-grid overflow-x-hidden">
        <NeuronBackground />
        <div className="relative z-10 space-y-8 p-3 sm:p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header - Unified with Bento Search */}
        <header className="flex flex-col md:flex-row md:items-start justify-between pb-4 md:pb-8 gap-3 px-1 sm:px-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                Painel de Estudo
              </h1>
               <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 truncate">
                Bem-vindo de volta, <span className="text-zinc-100 font-medium truncate max-w-[100px] sm:max-w-none inline-block align-bottom">{profile?.full_name || user?.email?.split('@')[0]}</span>
              </p>
            </div>
            {/* Premium Search Bar */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                  type="text"
                  placeholder="Buscar decks, questões ou tópicos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all backdrop-blur-md"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="text-[10px] font-bold text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded-md bg-zinc-900">⌘K</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto px-1">
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowNewFolder(true)} 
                className="whitespace-nowrap rounded-2xl border-zinc-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-500 group/btn"
              >
                <FolderPlus size={14} className="mr-2 text-zinc-500 group-hover/btn:text-blue-500 transition-colors" /> 
                Nova Pasta
              </Button>
              {/* Spacer to push profile to the right on mobile */}
              <div className="flex-1 sm:hidden" />
              {/* Perfil e Ações movidos para a Sidebar */}
              {/* Menu mobile movido para a Sidebar Hamburger */}
            </div>
          </header>
          {/* Bento Command Center */}
          <BentoGrid>
            <StatCard 
              className="md:col-span-2"
              icon={<Zap size={24} />} 
              label="Devido Hoje" 
              value={totalDue} 
              description={totalDue > 0 ? "Você tem revisões pendentes. Mantenha o streak!" : "Tudo em dia! Ótimo trabalho."}
              color={totalDue > 0 ? "amber" : "emerald"}
              trend={{ value: 12, positive: true }}
            />
            <StatCard icon={<Layers size={20} />} label="Decks" value={decks.length} color="blue" />
            <StatCard icon={<Target size={20} />} label="Estudado" value={`${masteryRate}%`} color="emerald" />
          </BentoGrid>
          {/* Learning Progress Bar */}
          {totalCards > 0 && (
            <div className="glass-panel p-4 sm:p-6 rounded-3xl border-zinc-800/50 relative overflow-hidden w-full min-w-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] sm:text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5 leading-none">
                  <TrendingUp size={14} className="text-blue-500 shrink-0" />
                  Progresso Geral
                </h3>
                <span className="text-[10px] sm:text-xs text-[var(--muted-foreground)] whitespace-nowrap px-1">
                  {studiedTotal} de {totalCards} cards
                </span>
              </div>
              <div className="h-3 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden flex shadow-inner">
                <ProgressSegment value={totalMastered} total={totalCards} color="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                <ProgressSegment value={totalCards - totalMastered - totalLearning - totalNew} total={totalCards} color="bg-green-400/80 shadow-[0_0_10px_rgba(74,222,128,0.3)]" />
                <ProgressSegment value={totalLearning} total={totalCards} color="bg-orange-400/80 shadow-[0_0_10px_rgba(251,146,60,0.3)]" />
                <ProgressSegment value={totalNew} total={totalCards} color="bg-blue-400/80 shadow-[0_0_10px_rgba(96,165,250,0.3)]" />
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-3 gap-y-2 mt-4 px-1 sm:px-0">
                <LegendItem color="bg-emerald-500" label={`Dominado (${totalMastered})`} />
                <LegendItem color="bg-green-400/80" label={`Revisão (${totalCards - totalMastered - totalLearning - totalNew})`} />
                <LegendItem color="bg-orange-400/80" label={`Aprendendo (${totalLearning})`} />
                <LegendItem color="bg-blue-400/80" label={`Novo (${totalNew})`} />
              </div>
            </div>
          )}
          {/* Due Cards Alert */}
          {totalDue > 0 && (
            <div className="p-4 sm:p-6 rounded-[2rem] bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-transparent border border-amber-500/20 backdrop-blur-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 group">
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <Zap size={24} className="animate-pulse" />
                </div>
                <p className="text-sm text-zinc-300">
                  <strong className="text-amber-500 font-bold">{totalDue}</strong> {totalDue === 1 ? 'carta precisa ser revisada' : 'cartas precisam ser revisadas'} hoje!
                </p>
              </div>
              <Link href="/dashboard/study-config" className="block relative z-10 pr-2">
                <Button className="w-full sm:w-auto h-12 px-10 whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-black border-none font-black uppercase text-[11px] tracking-[0.1em] shadow-lg shadow-amber-500/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">Estudar Agora</Button>
              </Link>
            </div>
          )}
          {/* New Folder Modal */}
          <AnimatePresence>
            {showNewFolder && (
              <NewFolderModal
                value={newFolderName}
                onChange={setNewFolderName}
                onConfirm={handleCreateFolder}
                onClose={() => { setShowNewFolder(false); setNewFolderName('') }}
              />
            )}
          </AnimatePresence>
          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 border-b border-zinc-800 overflow-x-auto scrollbar-none mb-10 -mx-3 px-3 sm:mx-0 sm:px-0">
            <button
              onClick={() => handleTabChange('decks')}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-300 ${
                activeTab === 'decks'
                  ? 'border-blue-500 text-blue-500 bg-blue-500/5'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              <BookOpen size={14} />
              DECKS
              <span className="text-[10px] bg-zinc-950 text-blue-500/70 px-2 py-0.5 rounded-md border border-zinc-800">{filteredDecks.length}</span>
            </button>
            <button
              onClick={() => handleTabChange('quizzes')}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-300 ${
                activeTab === 'quizzes'
                  ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              <HelpCircle size={14} />
              QUIZZES
              <span className="text-[10px] bg-zinc-950 text-emerald-500/70 px-2 py-0.5 rounded-md border border-zinc-800">{filteredQuizzes.length}</span>
            </button>
            <button
              onClick={() => handleTabChange('mindmaps')}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-300 ${
                activeTab === 'mindmaps'
                  ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              <Zap size={14} />
              MAPAS
              <span className="text-[10px] bg-zinc-950 text-amber-500/70 px-2 py-0.5 rounded-md border border-zinc-800">{filteredMindMaps.length}</span>
            </button>
            <button
              onClick={() => handleTabChange('reports')}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-300 ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-600 bg-blue-600/5'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              <BarChart3 size={14} />
              RELATÓRIOS
              <span className="text-[10px] bg-zinc-950 text-blue-600/70 px-2 py-0.5 rounded-md border border-zinc-800">{reports.length}</span>
            </button>
          </div>
          {/* Decks Tab */}
          {activeTab === 'decks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Seus Decks</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-zinc-500 hover:text-blue-500 transition-all hover:bg-blue-500/5 rounded-xl"
                title="Novo Deck" 
                onClick={() => router.push('/dashboard/new?type=deck')}
              >
                <Plus size={20} />
              </Button>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-10">
                {[1, 2, 3].map((i) => <div key={i} className="h-56 bg-zinc-900 border border-zinc-800 rounded-3xl animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>)}
              </div>
            ) : decks.length === 0 ? (
              <div className="text-center py-24 glass-panel border-zinc-800/50 rounded-[2rem] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
                <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                   <HelpCircle size={32} className="text-zinc-700" />
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-3 tracking-tight">Protocolo de Decks Inexistente</h3>
                <p className="text-zinc-500 mb-10 max-w-sm mx-auto text-sm leading-relaxed">Sua biblioteca neural está vazia. Comece criando um novo deck ou importe materiais via IA.</p>
                <Button 
                  type="button"
                  onClick={() => router.push('/dashboard/new')}
                  className="relative z-50 cursor-pointer pointer-events-auto h-12 px-8 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 border-none"
                >
                  <Plus size={16} className="mr-2" /> NOVO DECK
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {folderedDecks.map(({ folder, decks: folderDecks }) => (
                  <DroppableFolder key={folder.id} id={`deck-drop-${folder.id}`} isCollapsed={collapsedFolders.has(folder.id)}>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pl-4 min-h-[60px]">
                        {folderDecks.length === 0 ? (
                          <p className="text-[10px] text-zinc-600 font-bold col-span-full py-3 uppercase tracking-[0.2em] opacity-30 text-center border border-dashed border-zinc-800/50 rounded-3xl">Pasta vazia. Arraste seus decks para cá nos respectivos locais.</p>
                        ) : (
                          folderDecks.map((deck) => (
                            <DraggableDeck 
                              key={deck.id} 
                              deck={deck} 
                              onRename={(id, title) => openRenameItem(id, title, 'deck')} 
                              onDelete={(id, title) => setDeletingItem({ id, type: 'deck', title })} 
                            />
                          ))
                        )}
                      </div>
                    )}
                  </DroppableFolder>
                ))}
                <DroppableFolder id="deck-drop-unassigned">
                  <div className="flex items-center gap-3 mb-6 relative z-10 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800/50 w-fit">
                    <Layers size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Decks</span>
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{unassignedDecks.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 min-h-[60px]">
                    {unassignedDecks.length === 0 ? (
                      folders.length > 0 && <p className="text-[9px] text-zinc-600 font-bold col-span-full py-3 uppercase tracking-[0.2em] opacity-30 text-center border border-dashed border-zinc-800/50 rounded-2xl">Arraste seus decks para cá para organizar</p>
                    ) : (
                      unassignedDecks.map((deck) => (
                        <DraggableDeck 
                          key={deck.id} 
                          deck={deck} 
                          onRename={(id, title) => openRenameItem(id, title, 'deck')} 
                          onDelete={(id, title) => setDeletingItem({ id, type: 'deck', title })} 
                        />
                      ))
                    )}
                  </div>
                </DroppableFolder>
              </div>
            )}
          </div>
          )}
          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Seus Quizzes</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-zinc-500 hover:text-emerald-500 transition-all hover:bg-emerald-500/5 rounded-xl"
                title="Novo Quiz" 
                onClick={() => router.push('/dashboard/new?type=quiz')}
              >
                <Plus size={20} />
              </Button>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1, 2, 3].map((i) => <div key={i} className="h-56 bg-zinc-900 border border-zinc-800 rounded-3xl animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>)}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-24 glass-panel border-zinc-800/50 rounded-[2rem] relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
                 <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <HelpCircle size={32} className="text-zinc-700" />
                 </div>
                 <h3 className="text-xl font-bold text-zinc-100 mb-3 tracking-tight">Faltam Simulações de Quiz</h3>
                 <p className="text-zinc-500 mb-10 max-w-sm mx-auto text-sm leading-relaxed">Sincronize seu conhecimento através de testes práticos. Utilize nossa IA para gerar questões agora.</p>
                 <Button 
                   type="button"
                   onClick={() => router.push('/dashboard/new')}
                   className="relative z-50 cursor-pointer pointer-events-auto h-12 px-8 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 border-none"
                 >
                   <Plus size={16} className="mr-2" /> NOVO QUIZ
                 </Button>
               </div>
            ) : (
              <div className="space-y-4">
                {/* Quizzes in folders */}
                {folders.map(folder => {
                  const folderQuizzes = quizzes.filter(q => q.folder_id === folder.id)
                  return (
                    <DroppableFolder key={folder.id} id={`quiz-drop-${folder.id}`} isCollapsed={collapsedFolders.has(folder.id)}>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 pl-0 sm:pl-4 min-h-[60px]">
                          {folderQuizzes.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 font-bold col-span-full py-3 uppercase tracking-[0.2em] opacity-30 text-center border border-dashed border-zinc-800/50 rounded-3xl">Pasta vazia. Arraste seus quizzes para cá nos respectivos locais.</p>
                          ) : (
                            folderQuizzes.map(quiz => (
                              <DraggableQuiz 
                                key={quiz.id} 
                                quiz={quiz} 
                                onRename={(id, title) => openRenameItem(id, title, 'quiz')} 
                                onDelete={(id, title) => setDeletingItem({ id, type: 'quiz', title })} 
                              />
                            ))
                          )}
                        </div>
                      )}
                    </DroppableFolder>
                  )
                })}
                {/* Unassigned quizzes */}
                <DroppableFolder id="quiz-drop-unassigned">
                  <div className="flex items-center gap-3 mb-6 relative z-10 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800/50 w-fit">
                    <Layers size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Quizzes</span>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{quizzes.filter(q => !q.folder_id).length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-10 min-h-[60px]">
                    {quizzes.filter(q => !q.folder_id).length === 0 ? (
                      folders.length > 0 && <p className="text-[9px] text-zinc-600 font-bold col-span-full py-10 uppercase tracking-[0.2em] opacity-30 text-center border border-dashed border-zinc-800/50 rounded-2xl">Arraste seus itens para cá para organizar</p>
                    ) : (
                      quizzes.filter(q => !q.folder_id).map(quiz => (
                        <DraggableQuiz 
                          key={quiz.id} 
                          quiz={quiz} 
                          onRename={(id, title) => openRenameItem(id, title, 'quiz')} 
                          onDelete={(id, title) => setDeletingItem({ id, type: 'quiz', title })} 
                        />
                      ))
                    )}
                  </div>
                </DroppableFolder>
              </div>
            )}
          </div>
          )}
          {/* Mind Maps Tab */}
          {activeTab === 'mindmaps' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Seus Mapas Mentais</h2>
                  <p className="text-sm text-[var(--muted-foreground)] hidden sm:block">Visualize conexões entre conceitos médicos.</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-zinc-500 hover:text-amber-500 transition-all hover:bg-amber-500/5 rounded-xl"
                  title="Novo Mapa Mental" 
                  onClick={() => router.push('/dashboard/new')}
                >
                  <Plus size={20} />
                </Button>
              </div>
              <div className="space-y-4">
                {folderedMindMaps.map(({ folder, mindMaps: folderItems }) => (
                  <DroppableFolder key={folder.id} id={`mindmap-drop-${folder.id}`} isCollapsed={collapsedFolders.has(folder.id)}>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 pl-0 sm:pl-4">
                        {folderItems.length === 0 ? (
                           <p className="text-[10px] text-zinc-600 font-bold col-span-full py-3 uppercase tracking-[0.2em] opacity-30 text-center border border-dashed border-zinc-800/50 rounded-3xl">Pasta vazia. Arraste seus mapas para cá nos respectivos locais.</p>
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
                  <div className="flex items-center gap-3 mb-6 relative z-10 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800/50 w-fit">
                    <Layers size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mapas Mentais</span>
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{unassignedMindMaps.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 min-h-[60px]">
                    {unassignedMindMaps.length === 0 ? (
                      folders.length > 0 && <p className="text-[9px] text-zinc-600 font-bold col-span-full py-10 uppercase tracking-[0.2em] opacity-30 text-center border border-dashed border-zinc-800/50 rounded-2xl">Arraste seus itens para cá para organizar</p>
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
            <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Suas Análises</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">Visão detalhada do seu progresso e pontos focais.</p>
                </div>
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={generatingReport}
                  className="w-full sm:w-auto shadow-xl hover:shadow-blue-500/10 transition-all whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white border-none"
                >
                  {generatingReport ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analisando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap size={16} />
                      Gerar Nova Análise
                    </span>
                  )}
                </Button>
              </div>
              {reports.length === 0 ? (
                <div className="text-center py-20 glass-panel border-zinc-800/50 rounded-2xl">
                  <BarChart3 size={48} className="mx-auto text-zinc-700 dark:text-zinc-800 mb-4" />
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2 tracking-tight">Pronto para sua primeira análise?</h3>
                  <p className="text-zinc-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                    Nossa IA vai analisar seus erros e acertos para dizer exatamente onde você deve focar seus estudos.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleGenerateReport} 
                    disabled={generatingReport}
                    className="border-blue-500/30 text-blue-400 hover:bg-blue-500/5"
                  >
                    Gerar Primeiro Relatório
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {reports.map((report) => (
                    <Link key={report.id} href={`/dashboard/reports/${report.id}`}>
                      <div className="group glass-panel border-zinc-800/50 p-6 rounded-2xl hover:border-blue-500/50 transition-all flex items-center justify-between backdrop-blur-md">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-blue-500/5 rounded-xl text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all border border-blue-500/10">
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
                          <div className="hidden md:flex gap-2">
                            {report.analysis_json?.recommended_topics?.slice(0, 2).map((topic: string, i: number) => (
                              <span key={topic + i} className="text-[9px] font-black text-zinc-400 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg uppercase tracking-[0.2em]">
                                {topic}
                              </span>
                            ))}
                          </div>
                          <ChevronRight size={20} className="text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
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
      {/* Modals Refactored */}
      <AnimatePresence>
        {editingItemId && (
          <RenameItemModal
            id={editingItemId}
            name={editingItemName}
            type={editingItemType}
            onClose={() => setEditingItemId(null)}
            onRename={(id, name) => {
              if (editingItemType === 'deck') handleRenameDeck(id, name)
              else if (editingItemType === 'quiz') handleRenameQuiz(id, name)
              else handleRenameMindMap(id, name)
            }}
          />
        )}
        {showCreateChoice && (
          <CreateChoiceModal
            activeTab={activeTab === 'decks' || activeTab === 'quizzes' ? activeTab : 'decks'}
            onClose={() => setShowCreateChoice(false)}
            onChoice={(choice) => {
              setShowCreateChoice(false)
              if (choice === 'ai') {
                router.push(`/dashboard/new?type=${activeTab === 'quizzes' ? 'quiz' : 'deck'}`)
              } else {
                if (activeTab === 'quizzes') setShowNewQuizModal(true)
                else setShowNewDeckModal(true)
              }
            }}
          />
        )}
        {deletingItem && (
          <DeleteConfirmationModal
            title={deletingItem.title}
            type={deletingItem.type === 'deck' ? 'Deck' : deletingItem.type === 'quiz' ? 'Quiz' : 'Mapa Mental'}
            onClose={() => setDeletingItem(null)}
            onConfirm={() => {
              if (deletingItem.type === 'deck') handleDeleteDeck(deletingItem.id)
              else if (deletingItem.type === 'quiz') handleDeleteQuiz(deletingItem.id)
              else handleDeleteMindMap(deletingItem.id)
            }}
          />
        )}
        {showNewDeckModal && (
          <NewDeckModal
            title={newDeckTitle}
            onChange={setNewDeckTitle}
            disabled={!newDeckTitle.trim()}
            onClose={() => setShowNewDeckModal(false)}
            onConfirm={handleCreateDeck}
          />
        )}
        {showNewQuizModal && (
          <NewQuizModal
            title={newQuizTitle}
            onChange={setNewQuizTitle}
            disabled={!newQuizTitle.trim()}
            onClose={() => setShowNewQuizModal(false)}
            onConfirm={handleCreateQuiz}
          />
        )}
        {showLogoutModal && (
          <LogoutModal
            onClose={() => setShowLogoutModal(false)}
            onConfirm={() => { handleSignOut(); setShowLogoutModal(false); }}
          />
        )}
        {showReportLimitModal && (
          <ReportLimitModal
            loading={generatingReport}
            onClose={() => setShowReportLimitModal(false)}
            onConfirm={executeReportGeneration}
          />
        )}
      </AnimatePresence>
    </DndContext>
  )
}
// Subcomponents (centralized in components/dashboard)
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
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Carregando painel principal...</div>}>
      <DashboardPageContent />
    </Suspense>
  )
}
