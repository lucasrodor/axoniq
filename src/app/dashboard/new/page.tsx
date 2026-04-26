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
  Sparkles
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { UpgradeModal, LowCreditModal } from '@/components/dashboard/dashboard-modals'
import { NeuronBackground } from '@/components/dashboard/neuron-background'
import { supabase } from '@/lib/supabase/client'

type GenerationStep = 'upload' | 'generating' | 'done'
type Status = 'waiting' | 'loading' | 'done' | 'error'

function NewSourcePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') as 'deck' | 'quiz' | 'mindmap' | null

  const [step, setStep] = useState<GenerationStep>('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [availableCredits, setAvailableCredits] = useState<number | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showLowCreditModal, setShowLowCreditModal] = useState(false)
  
  const [config, setConfig] = useState({
    type: initialType || 'deck',
    sourceType: 'pdf' as 'pdf' | 'text',
    file: null as File | null,
    text: '',
    generateFlashcards: true,
    generateQuiz: initialType === 'quiz',
    generateMindMap: initialType === 'mindmap'
  })

  const [genStatus, setGenStatus] = useState({
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
    fetch('/api/user/credits')
      .then(res => res.json())
      .then(data => setAvailableCredits(data.available))
  }, [])

  useEffect(() => {
    const handleConfirmLowCredit = () => {
      setStep('generating')
      setTimeout(() => handleStartGeneration(), 0)
    }
    window.addEventListener('confirm-low-credit', handleConfirmLowCredit)
    return () => window.removeEventListener('confirm-low-credit', handleConfirmLowCredit)
  }, [config])

  const handlePreGenerationCheck = async () => {
    const itemsSelected = [config.generateFlashcards, config.generateQuiz].filter(Boolean).length
    if (availableCredits === 0) {
      window.dispatchEvent(new Event('open-upgrade-modal'))
      return
    }
    if (availableCredits !== null && availableCredits < itemsSelected) {
      window.dispatchEvent(new CustomEvent('open-low-credit-modal', { detail: { available: availableCredits } }))
      return
    }
    handleStartGeneration()
  }

  const handleStartGeneration = async () => {
    setIsProcessing(true)
    setStep('generating')

    const formData = new FormData()
    if (config.sourceType === 'pdf' && config.file) {
      formData.append('file', config.file)
    } else {
      formData.append('text', config.text)
    }

    const tasks = []

    if (config.generateFlashcards) {
      setGenStatus(prev => ({ ...prev, flashcards: 'loading' }))
      tasks.push(
        fetch('/api/generate-flashcards', { method: 'POST', body: formData })
          .then(async res => {
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setGenStatus(prev => ({
              ...prev,
              flashcards: 'done',
              deckId: data.deckId,
              cardCount: data.count
            }))
          })
          .catch(() => setGenStatus(prev => ({ ...prev, flashcards: 'error' })))
      )
    }

    if (config.generateQuiz) {
      setGenStatus(prev => ({ ...prev, quiz: 'loading' }))
      tasks.push(
        fetch('/api/generate-quiz', { method: 'POST', body: formData })
          .then(async res => {
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setGenStatus(prev => ({
              ...prev,
              quiz: 'done',
              quizId: data.quizId,
              quizCount: data.count
            }))
          })
          .catch(() => setGenStatus(prev => ({ ...prev, quiz: 'error' })))
      )
    }

    await Promise.allSettled(tasks)
    setStep('done')
    setIsProcessing(false)
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
                  Envie seu material e deixe nossa IA sintetizar o conhecimento para você.
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
            <div className="py-20 flex flex-col items-center justify-center space-y-10">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap size={40} className="text-blue-500 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-4 max-w-sm mx-auto">
                <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Sintetizando...</h2>
                <div className="space-y-3">
                  {config.generateFlashcards && (
                    <GenerationStatusCard 
                      icon={<BookOpen size={20} />} 
                      label="Flashcards" 
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

              <div className="grid gap-4 max-w-md mx-auto">
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

    </>
  )
}

function GenerationConfigComponent({ config, onChange, onStart, isLoading }: any) {
  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onChange({ ...config, sourceType: 'pdf' })}
          className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
            config.sourceType === 'pdf' ? 'border-blue-500 bg-blue-500/5 text-blue-500' : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700'
          }`}
        >
          <Upload size={18} />
          <span className="font-bold text-sm">Upload PDF</span>
        </button>
        <button
          onClick={() => onChange({ ...config, sourceType: 'text' })}
          className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
            config.sourceType === 'text' ? 'border-blue-500 bg-blue-500/5 text-blue-500' : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700'
          }`}
        >
          <FileText size={18} />
          <span className="font-bold text-sm">Inserir Texto</span>
        </button>
      </div>

      {config.sourceType === 'pdf' ? (
        <div className="relative group">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => onChange({ ...config, file: e.target.files?.[0] || null })}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="p-10 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-zinc-800 rounded-2xl text-zinc-500 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-all">
              <Upload size={32} />
            </div>
            <div className="text-center">
              <p className="font-bold text-zinc-100">{config.file ? config.file.name : 'Selecione seu arquivo'}</p>
              <p className="text-xs text-zinc-500 mt-1">PDF até 10MB</p>
            </div>
          </div>
        </div>
      ) : (
        <textarea
          value={config.text}
          onChange={(e) => onChange({ ...config, text: e.target.value })}
          placeholder="Cole seu resumo, anotações ou transcrições aqui..."
          className="w-full h-48 p-6 rounded-3xl border-2 border-zinc-800 bg-zinc-900/30 text-zinc-100 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
        />
      )}

      <div className="space-y-3">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Sparkles size={12} className="text-blue-500" />
          O que vamos gerar?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChange({ ...config, generateFlashcards: !config.generateFlashcards })}
            className={`flex flex-col gap-3 p-5 rounded-[1.5rem] border-2 transition-all text-left group ${
              config.generateFlashcards ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-800 bg-zinc-900/50 opacity-50'
            }`}
          >
            <BookOpen size={20} className={config.generateFlashcards ? 'text-blue-500' : 'text-zinc-500'} />
            <span className={`font-bold text-sm ${config.generateFlashcards ? 'text-zinc-100' : 'text-zinc-500'}`}>Flashcards</span>
          </button>
          <button
            onClick={() => onChange({ ...config, generateQuiz: !config.generateQuiz })}
            className={`flex flex-col gap-3 p-5 rounded-[1.5rem] border-2 transition-all text-left group ${
              config.generateQuiz ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/50 opacity-50'
            }`}
          >
            <HelpCircle size={20} className={config.generateQuiz ? 'text-emerald-500' : 'text-zinc-500'} />
            <span className={`font-bold text-sm ${config.generateQuiz ? 'text-zinc-100' : 'text-zinc-500'}`}>Quiz Clínico</span>
          </button>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full h-16 rounded-[1.5rem] text-lg font-black tracking-tight mt-4 shadow-xl shadow-blue-600/10"
        onClick={onStart}
        disabled={isLoading || (config.sourceType === 'pdf' && !config.file) || (config.sourceType === 'text' && !config.text.trim())}
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
      <div className={`p-2 rounded-lg ${status === 'done' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
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
