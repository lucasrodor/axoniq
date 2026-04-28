'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  HelpCircle,
  X,
  Plus,
  FileText,
  Upload,
  Brain,
  Sparkles,
  Mic,
  Music,
  Trash2,
  FileAudio,
  Network,
  Image as ImageIcon
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { UpgradeModal, LowCreditModal } from '@/components/dashboard/dashboard-modals'
import { NeuronBackground } from '@/components/dashboard/neuron-background'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type GenerationStep = 'upload' | 'generating' | 'done'
type Status = 'waiting' | 'loading' | 'done' | 'error'

import { useGeneration } from '@/providers/GenerationProvider'

function NewSourcePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addGeneration, updateGeneration } = useGeneration()
  const initialType = searchParams.get('type') as 'deck' | 'quiz' | 'mindmap' | null

  const [step, setStep] = useState<GenerationStep>('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [availableCredits, setAvailableCredits] = useState<number | null>(null)
  
  // Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showLowCreditModal, setShowLowCreditModal] = useState(false)
  const [itemsToGenerate, setItemsToGenerate] = useState(0)

  const [config, setConfig] = useState({
    type: initialType || 'deck',
    sourceType: 'document' as 'document' | 'text' | 'audio',
    files: [] as File[],
    text: '',
    generateFlashcards: initialType === 'deck' || !initialType,
    generateQuiz: initialType === 'quiz',
    generateMindMap: initialType === 'mindmap'
  })

  const [genStatus, setGenStatus] = useState({
    source: 'waiting' as Status,
    flashcards: 'waiting' as Status,
    quiz: 'waiting' as Status,
    mindmap: 'waiting' as Status,
    deckId: null as string | null,
    quizId: null as string | null,
    mindmapId: null as string | null,
    cardCount: 0,
    quizCount: 0
  })

  useEffect(() => {
    const fetchCredits = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      try {
        const res = await fetch('/api/user/credits', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setAvailableCredits(data.remaining)
        }
      } catch (err) {
        console.error('Erro ao buscar créditos', err)
      }
    }
    fetchCredits()
  }, [])

  const handlePreGenerationCheck = async () => {
    const itemsSelected = [config.generateFlashcards, config.generateQuiz, config.generateMindMap].filter(Boolean).length
    setItemsToGenerate(itemsSelected)
    
    if (availableCredits === 0) {
      setShowUpgradeModal(true)
      return
    }
    
    if (availableCredits !== null && availableCredits < itemsSelected) {
      setShowLowCreditModal(true)
      return
    }
    
    handleStartGeneration()
  }

  const handleStartGeneration = async () => {
    const generationId = Math.random().toString(36).substring(7)
    const title = config.files.length > 0 ? config.files[0].name : (config.text ? 'Texto Colado' : 'Novo Material')
    
    setIsProcessing(true)
    setStep('generating')
    setShowLowCreditModal(false)

    // Register in global background state
    addGeneration({
      id: generationId,
      title: title,
      status: {
        source: 'loading',
        flashcards: config.generateFlashcards ? 'waiting' : 'done',
        quiz: config.generateQuiz ? 'waiting' : 'done',
        mindmap: config.generateMindMap ? 'waiting' : 'done',
      },
      config: {
        generateFlashcards: config.generateFlashcards,
        generateQuiz: config.generateQuiz,
        generateMindMap: config.generateMindMap,
      },
      isMinimized: false
    })

    try {
      setGenStatus(prev => ({ ...prev, source: 'loading' }))
      
      let sourceId = ''
      const { data: { session } } = await supabase.auth.getSession()
      
      if (config.sourceType === 'audio') {
        const formData = new FormData()
        formData.append('file', config.files[0])
        
        const res = await fetch('/api/process-audio', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session?.access_token}` },
          body: formData
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro ao processar áudio')
        sourceId = data.sourceId
      } else {
        const formData = new FormData()
        config.files.forEach(file => formData.append('files', file))
        if (config.text) formData.append('text', config.text)
        
        const res = await fetch('/api/process-document', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session?.access_token}` },
          body: formData
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro ao processar conteúdo')
        sourceId = data.sourceId
      }

      setGenStatus(prev => ({ ...prev, source: 'done' }))
      updateGeneration(generationId, { status: { source: 'done' } as any })

      const tasks = []

      if (config.generateFlashcards) {
        setGenStatus(prev => ({ ...prev, flashcards: 'loading' }))
        updateGeneration(generationId, { status: { flashcards: 'loading' } as any })
        
        const fd = new FormData()
        fd.append('sourceId', sourceId)
        fd.append('quantity', '20')
        
        tasks.push(
          fetch('/api/generate-flashcards', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session?.access_token}` },
            body: fd
          }).then(async res => {
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            
            const updates = { 
              flashcards: 'done' as Status, 
              deckId: data.deckId, 
              cardCount: data.count 
            }
            setGenStatus(prev => ({ ...prev, ...updates }))
            updateGeneration(generationId, { status: updates as any })
          }).catch(err => {
            console.error('Flashcard error:', err)
            setGenStatus(prev => ({ ...prev, flashcards: 'error' }))
            updateGeneration(generationId, { status: { flashcards: 'error' } as any })
          })
        )
      }

      if (config.generateQuiz) {
        setGenStatus(prev => ({ ...prev, quiz: 'loading' }))
        updateGeneration(generationId, { status: { quiz: 'loading' } as any })
        
        tasks.push(
          fetch('/api/generate-quiz', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sourceId, quantity: 15 })
          }).then(async res => {
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            
            const updates = { 
              quiz: 'done' as Status, 
              quizId: data.quizId, 
              quizCount: data.questionsCount 
            }
            setGenStatus(prev => ({ ...prev, ...updates }))
            updateGeneration(generationId, { status: updates as any })
          }).catch(err => {
            console.error('Quiz error:', err)
            setGenStatus(prev => ({ ...prev, quiz: 'error' }))
            updateGeneration(generationId, { status: { quiz: 'error' } as any })
          })
        )
      }

      if (config.generateMindMap) {
        setGenStatus(prev => ({ ...prev, mindmap: 'loading' }))
        updateGeneration(generationId, { status: { mindmap: 'loading' } as any })
        
        tasks.push(
          fetch('/api/generate-mindmap', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sourceId })
          }).then(async res => {
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            
            const updates = { 
              mindmap: 'done' as Status, 
              mindmapId: data.mindMapId 
            }
            setGenStatus(prev => ({ ...prev, ...updates }))
            updateGeneration(generationId, { status: updates as any })
          }).catch(err => {
            console.error('Mindmap error:', err)
            setGenStatus(prev => ({ ...prev, mindmap: 'error' }))
            updateGeneration(generationId, { status: { mindmap: 'error' } as any })
          })
        )
      }

      await Promise.allSettled(tasks)
      setStep('done')
    } catch (error: any) {
      console.error('Generation flow error:', error)
      alert(error.message || 'Erro inesperado na geração. Tente novamente.')
      setStep('upload')
      updateGeneration(generationId, { status: { source: 'error' } as any })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="min-h-screen relative clinical-grid overflow-x-hidden">
        <NeuronBackground />
        <div className="relative z-10 space-y-8 p-3 sm:p-4 md:p-8 max-w-2xl mx-auto text-center">
          {step === 'upload' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
                  <Zap size={14} className="animate-pulse" />
                  Novo Material
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 tracking-tight leading-tight">
                  O que vamos <span className="text-blue-500">estudar</span> hoje?
                </h1>
                <p className="text-zinc-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  Envie seus materiais (Documentos, Imagens, Áudio ou Texto) e deixe nossa IA sintetizar o conhecimento para você.
                </p>
              </div>

              <GenerationConfigComponent 
                config={config} 
                onChange={setConfig} 
                onStart={handlePreGenerationCheck}
                isLoading={isProcessing}
              />
            </motion.div>
          )}

          {step === 'generating' && (
            <div className="py-10 sm:py-20 flex flex-col items-center justify-center space-y-10">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain size={40} className="text-blue-500 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-4 w-full max-w-sm mx-auto">
                <h2 className="text-2xl font-black text-zinc-100 tracking-tight text-center">Sintetizando Conhecimento...</h2>
                <div className="space-y-3">
                  <GenerationStatusCard 
                    icon={<Sparkles size={20} />} 
                    label="Extração de Dados" 
                    status={genStatus.source} 
                  />
                  {config.generateFlashcards && (
                    <GenerationStatusCard 
                      icon={<BookOpen size={20} />} 
                      label="Flashcards Inteligentes" 
                      status={genStatus.flashcards} 
                    />
                  )}
                  {config.generateQuiz && (
                    <GenerationStatusCard 
                      icon={<HelpCircle size={20} />} 
                      label="Simulação de Quiz" 
                      status={genStatus.quiz} 
                    />
                  )}
                  {config.generateMindMap && (
                    <GenerationStatusCard 
                      icon={<Network size={20} />} 
                      label="Mapa Mental" 
                      status={genStatus.mindmap} 
                    />
                  )}
                </div>

                <div className="pt-6">
                  <Button
                    variant="outline"
                    className="w-full border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    onClick={() => router.push('/dashboard')}
                  >
                    Minimizar e continuar navegando
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'done' && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-zinc-100 tracking-tight leading-tight">Sua sessão de estudo está pronta!</h2>
                  <p className="text-zinc-500 max-w-xs mx-auto">Conteúdo sintetizado e organizado para máximo desempenho.</p>
                </div>
              </motion.div>

              <div className="grid gap-4 max-w-md mx-auto w-full">
                {genStatus.deckId && (
                  <button
                    onClick={() => router.push(`/dashboard/deck/${genStatus.deckId}`)}
                    className="w-full flex items-center gap-4 p-5 rounded-[2rem] border-2 border-blue-500/20 bg-blue-600/5 hover:border-blue-500/40 transition-all hover:bg-blue-600/10 active:scale-[0.98] text-left group"
                  >
                    <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-500 group-hover:scale-110 transition-transform">
                      <BookOpen size={24} />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-zinc-100 text-lg block">Ver Flashcards</span>
                      <p className="text-xs text-zinc-500">{genStatus.cardCount} cartas inteligentes geradas</p>
                    </div>
                    <ArrowRight size={20} className="text-blue-500 opacity-50 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                  </button>
                )}
                {genStatus.quizId && (
                  <button
                    onClick={() => router.push(`/dashboard/quiz/${genStatus.quizId}`)}
                    className="w-full flex items-center gap-4 p-5 rounded-[2rem] border-2 border-emerald-500/20 bg-emerald-600/5 hover:border-emerald-500/40 transition-all hover:bg-emerald-600/10 active:scale-[0.98] text-left group"
                  >
                    <div className="p-3 rounded-2xl bg-emerald-600/10 text-emerald-500 group-hover:scale-110 transition-transform">
                      <HelpCircle size={24} />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-zinc-100 text-lg block">Fazer Quiz</span>
                      <p className="text-xs text-zinc-500">{genStatus.quizCount} questões clínicas geradas</p>
                    </div>
                    <ArrowRight size={20} className="text-emerald-500 opacity-50 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                  </button>
                )}
                {genStatus.mindmapId && (
                  <button
                    onClick={() => router.push(`/dashboard/mindmap/${genStatus.mindmapId}`)}
                    className="w-full flex items-center gap-4 p-5 rounded-[2rem] border-2 border-amber-500/20 bg-amber-600/5 hover:border-amber-500/40 transition-all hover:bg-amber-600/10 active:scale-[0.98] text-left group"
                  >
                    <div className="p-3 rounded-2xl bg-amber-600/10 text-amber-500 group-hover:scale-110 transition-transform">
                      <Network size={24} />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-zinc-100 text-lg block">Mapa Mental</span>
                      <p className="text-xs text-zinc-500">Conexões visuais estratégicas</p>
                    </div>
                    <ArrowRight size={20} className="text-amber-500 opacity-50 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                  </button>
                )}
                
                <div className="pt-4 border-t border-zinc-800/50 mt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-14 rounded-2xl text-base shadow-lg shadow-blue-600/20"
                    onClick={() => router.push('/dashboard')}
                  >
                    Ir ao Dashboard
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
      
      {showLowCreditModal && (
        <LowCreditModal 
          available={availableCredits || 0}
          onClose={() => setShowLowCreditModal(false)}
          onConfirm={() => {
            setShowLowCreditModal(false)
            handleStartGeneration()
          }}
          onUpgrade={() => {
            setShowLowCreditModal(false)
            router.push('/dashboard/upgrade')
          }}
        />
      )}
    </>
  )
}

function GenerationConfigComponent({ config, onChange, onStart, isLoading }: any) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    const updatedFiles = [...config.files, ...newFiles].slice(0, 5)
    onChange({ ...config, files: updatedFiles })
  }

  const removeFile = (index: number) => {
    const updatedFiles = config.files.filter((_: any, i: number) => i !== index)
    onChange({ ...config, files: updatedFiles })
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex p-1.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
        <button
          onClick={() => onChange({ ...config, sourceType: 'document', files: [] })}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
            config.sourceType === 'document' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Upload size={18} />
          Documentos
        </button>
        <button
          onClick={() => onChange({ ...config, sourceType: 'audio', files: [] })}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
            config.sourceType === 'audio' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Mic size={18} />
          Áudio
        </button>
        <button
          onClick={() => onChange({ ...config, sourceType: 'text' })}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
            config.sourceType === 'text' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <FileText size={18} />
          Texto
        </button>
      </div>

      <div className="min-h-[200px]">
        {config.sourceType === 'document' && (
          <div className="space-y-4">
            <div className="relative group">
              <input
                type="file"
                accept=".pdf,image/*,.docx"
                multiple
                onChange={handleFileChange}
                disabled={config.files.length >= 5}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
              />
              <div className="p-8 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-zinc-800 rounded-2xl text-zinc-500 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-all">
                  <Plus size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-zinc-100">Adicionar Arquivos</p>
                  <p className="text-xs text-zinc-500 mt-1">PDF, Imagens ou DOCX (Até 5 itens)</p>
                </div>
              </div>
            </div>

            {config.files.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {config.files.map((file: File, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    {file.type.startsWith('image/') ? <ImageIcon size={18} className="text-blue-500" /> : <FileText size={18} className="text-blue-500" />}
                    <span className="flex-1 text-xs text-zinc-300 truncate font-medium">{file.name}</span>
                    <button onClick={() => removeFile(i)} className="text-zinc-600 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {config.sourceType === 'audio' && (
          <div className="space-y-4">
            <div className="relative group">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => onChange({ ...config, files: [e.target.files?.[0] as File] })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="p-8 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-zinc-800 rounded-2xl text-zinc-500 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-all">
                  <Music size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-zinc-100">{config.files[0] ? config.files[0].name : 'Selecionar Áudio'}</p>
                  <p className="text-xs text-zinc-500 mt-1">MP3, WAV ou M4A (Até 25MB)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {config.sourceType === 'text' && (
          <textarea
            value={config.text}
            onChange={(e) => onChange({ ...config, text: e.target.value })}
            placeholder="Cole seu resumo, anotações ou transcrições aqui..."
            className="w-full h-48 p-6 rounded-3xl border-2 border-zinc-800 bg-zinc-900/30 text-zinc-100 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
          />
        )}
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Sparkles size={12} className="text-blue-500" />
          O que vamos gerar?
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            onClick={() => onChange({ ...config, generateFlashcards: !config.generateFlashcards })}
            className={cn(
              "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-center",
              config.generateFlashcards ? "border-blue-500 bg-blue-500/5" : "border-zinc-800 bg-zinc-900/30 opacity-40 hover:opacity-60"
            )}
          >
            <BookOpen size={20} className={config.generateFlashcards ? "text-blue-500" : "text-zinc-500"} />
            <span className={cn("font-bold text-[10px] sm:text-xs", config.generateFlashcards ? "text-zinc-100" : "text-zinc-500")}>Flashcards</span>
          </button>
          <button
            onClick={() => onChange({ ...config, generateQuiz: !config.generateQuiz })}
            className={cn(
              "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-center",
              config.generateQuiz ? "border-emerald-500 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30 opacity-40 hover:opacity-60"
            )}
          >
            <HelpCircle size={20} className={config.generateQuiz ? "text-emerald-500" : "text-zinc-500"} />
            <span className={cn("font-bold text-[10px] sm:text-xs", config.generateQuiz ? "text-zinc-100" : "text-zinc-500")}>Quiz Clínico</span>
          </button>
          <button
            onClick={() => onChange({ ...config, generateMindMap: !config.generateMindMap })}
            className={cn(
              "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-center",
              config.generateMindMap ? "border-amber-500 bg-amber-500/5" : "border-zinc-800 bg-zinc-900/30 opacity-40 hover:opacity-60"
            )}
          >
            <Network size={20} className={config.generateMindMap ? "text-amber-500" : "text-zinc-500"} />
            <span className={cn("font-bold text-[10px] sm:text-xs", config.generateMindMap ? "text-zinc-100" : "text-zinc-500")}>Mapa Mental</span>
          </button>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full h-16 rounded-2xl text-lg font-black tracking-tight mt-4 shadow-xl shadow-blue-600/20"
        onClick={onStart}
        disabled={isLoading || (config.sourceType !== 'text' && config.files.length === 0) || (config.sourceType === 'text' && !config.text.trim()) || (!config.generateFlashcards && !config.generateQuiz && !config.generateMindMap)}
      >
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Processando...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Brain size={22} />
            <span>Gerar Material de Estudo</span>
          </div>
        )}
      </Button>
    </div>
  )
}

function GenerationStatusCard({ icon, label, status }: { icon: React.ReactNode, label: string, status: Status }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
      <div className={cn(
        "p-2 rounded-lg",
        status === 'done' ? "bg-emerald-500/10 text-emerald-500" : 
        status === 'loading' ? "bg-blue-500/10 text-blue-500" : "bg-zinc-800 text-zinc-500"
      )}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-zinc-100">{label}</p>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
          {status === 'waiting' ? 'Aguardando' : status === 'loading' ? 'Processando...' : status === 'done' ? 'Concluído' : 'Erro'}
        </p>
      </div>
      {status === 'loading' && (
        <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      )}
      {status === 'done' && (
        <CheckCircle2 size={18} className="text-emerald-500" />
      )}
    </div>
  )
}

export default function NewSourcePage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500 text-center mt-20">Preparando ambiente de geração...</div>}>
      <NewSourcePageContent />
    </Suspense>
  )
}

