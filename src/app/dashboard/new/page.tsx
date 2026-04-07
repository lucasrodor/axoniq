'use client'

import { useState, useEffect, useCallback } from 'react'
import { UploadZone } from '@/components/upload/upload-zone'
import { AudioUploadZone } from '@/components/upload/audio-upload-zone'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, Loader2, Folder, BookOpen, 
  HelpCircle, CheckCircle2, XCircle, ArrowRight, Zap,
  FileText, Tag, ChevronDown, Mic
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { CustomSelect } from '@/components/ui/select'

interface FolderType {
  id: string
  name: string
}

type Step = 'upload' | 'source-ready' | 'generating' | 'done'

interface GenerationStatus {
  flashcards: 'idle' | 'generating' | 'done' | 'error'
  quiz: 'idle' | 'generating' | 'done' | 'error'
  flashcardsCount?: number
  quizCount?: number
  deckId?: string
  quizId?: string
  mindmap: 'idle' | 'generating' | 'done' | 'error'
  mindmapId?: string
}

export default function NewSourcePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('upload')
  const [isExtracting, setIsExtracting] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [processingStep, setProcessingStep] = useState('')
  const [inputMode, setInputMode] = useState<'file' | 'text' | 'audio'>('file')
  const [rawText, setRawText] = useState('')
  const [rawTitle, setRawTitle] = useState('')

  // Source data
  const [sourceId, setSourceId] = useState<string>('')
  const [sourceTitle, setSourceTitle] = useState<string>('')
  const [specialtyTag, setSpecialtyTag] = useState<string>('Outros')
  const [textPreview, setTextPreview] = useState<string>('')

  // Generation options
  const [generateFlashcards, setGenerateFlashcards] = useState(true)
  const [generateQuiz, setGenerateQuiz] = useState(true)
  const [generateMindMap, setGenerateMindMap] = useState(true)
  const [flashcardQuantity, setFlashcardQuantity] = useState(20)
  const [quizQuantity, setQuizQuantity] = useState(20)
  const [folders, setFolders] = useState<FolderType[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [customTitle, setCustomTitle] = useState<string>('')

  // Generation status
  const [genStatus, setGenStatus] = useState<GenerationStatus>({
    flashcards: 'idle',
    quiz: 'idle',
    mindmap: 'idle',
  })

  useEffect(() => {
    const loadFolders = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name')
      setFolders(data || [])
    }
    loadFolders()
  }, [])

  // Helper: Get auth headers with access token
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Sessão expirada. Faça login novamente.')
    return { Authorization: `Bearer ${session.access_token}` }
  }

  // Handle Text Submission
  const handleTextSubmit = async () => {
    if (rawText.trim().length < 50) {
      toast('O texto deve ter pelo menos 50 caracteres.', 'error')
      return
    }

    setIsExtracting(true)
    setLoadingMessage('Processando texto e detectando especialidade...')

    try {
      const authHeaders = await getAuthHeaders()
      const formData = new FormData()
      formData.append('text', rawText)
      if (rawTitle) formData.append('title', rawTitle)

      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: { ...authHeaders },
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Erro na extração')

      setSourceId(data.sourceId)
      setSourceTitle(data.title)
      setSpecialtyTag(data.specialtyTag)
      setTextPreview(data.preview)
      setCustomTitle(data.title)
      setStep('source-ready')
      toast('Texto processado com sucesso!', 'success')

    } catch (error) {
      console.error(error)
      toast('Erro ao processar: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), 'error')
    } finally {
      setIsExtracting(false)
      setLoadingMessage('')
    }
  }

  // Step 1 → Step 2: Upload and Extract
  const handleFileSelect = async (file: File) => {
    setIsExtracting(true)
    setLoadingMessage('Extraindo conteúdo e detectando especialidade...')

    try {
      const authHeaders = await getAuthHeaders()
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: { ...authHeaders },
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Erro na extração')

      setSourceId(data.sourceId)
      setSourceTitle(data.title)
      setSpecialtyTag(data.specialtyTag)
      setTextPreview(data.preview)
      setCustomTitle(data.title)
      setStep('source-ready')
      toast('Conteúdo extraído com sucesso!', 'success')

    } catch (error) {
      console.error(error)
      toast('Erro ao processar: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), 'error')
    } finally {
      setIsExtracting(false)
      setLoadingMessage('')
    }
  }

  // Handle Audio Selection
  const handleAudioSelect = async (file: File) => {
    setIsExtracting(true)
    setLoadingMessage('Preparando áudio...')
    setProcessingStep('Enviando arquivo...')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sessão expirada. Faça login novamente.')
      
      const formData = new FormData()
      formData.append('file', file)

      // 1. Transcribe the audio
      const res = await fetch('/api/process-audio', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na transcrição')

      // Once transcribed, we treat it like a document
      setSourceId(data.sourceId)
      setSourceTitle(data.title)
      setCustomTitle(data.title)
      setSpecialtyTag(data.specialtyTag || 'Outros')
      setTextPreview(data.preview || '')
      setStep('source-ready')
      toast('Transcrição concluída!', 'success')
    } catch (error) {
      console.error('Audio process error:', error)
      toast('Erro ao transcrever áudio. Verifique o tamanho e formato.', 'error')
    } finally {
      setIsExtracting(false)
      setProcessingStep('')
    }
  }

  // Step 2 → Step 3: Start Generation
  const handleStartGeneration = async () => {
    if (!generateFlashcards && !generateQuiz && !generateMindMap) {
      toast('Selecione pelo menos uma opção para gerar.', 'error')
      return
    }

    setStep('generating')
    const title = customTitle || sourceTitle

    // Get auth token once
    let authHeaders: Record<string, string>
    try {
      authHeaders = await getAuthHeaders()
    } catch {
      toast('Sessão expirada. Faça login novamente.', 'error')
      return
    }

    // Fire both in parallel
    const promises: Promise<void>[] = []

    if (generateFlashcards) {
      setGenStatus(prev => ({ ...prev, flashcards: 'generating' }))
      promises.push(
        fetch('/api/generate-flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            sourceId,
            quantity: flashcardQuantity,
            folderId: selectedFolderId || null,
            deckTitle: title,
            specialtyTag,
          }),
        })
          .then(async res => {
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setGenStatus(prev => ({
              ...prev,
              flashcards: 'done',
              flashcardsCount: data.flashcardsCount,
              deckId: data.deckId,
            }))
          })
          .catch(err => {
            console.error('Flashcard generation error:', err)
            setGenStatus(prev => ({ ...prev, flashcards: 'error' }))
          })
      )
    }

    if (generateQuiz) {
      setGenStatus(prev => ({ ...prev, quiz: 'generating' }))
      promises.push(
        fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            sourceId,
            quantity: quizQuantity,
            folderId: selectedFolderId || null,
            quizTitle: title,
            specialtyTag,
          }),
        })
          .then(async res => {
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setGenStatus(prev => ({
              ...prev,
              quiz: 'done',
              quizCount: data.questionsCount,
              quizId: data.quizId,
            }))
          })
          .catch(err => {
            console.error('Quiz generation error:', err)
            setGenStatus(prev => ({ ...prev, quiz: 'error' }))
          })
      )
    }

    if (generateMindMap) {
      setGenStatus(prev => ({ ...prev, mindmap: 'generating' }))
      promises.push(
        fetch('/api/generate-mindmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            sourceId,
            folderId: selectedFolderId || null,
            mapTitle: title,
            specialtyTag,
          }),
        })
          .then(async res => {
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setGenStatus(prev => ({
              ...prev,
              mindmap: 'done',
              mindmapId: data.mindMapId,
            }))
          })
          .catch(err => {
            console.error('Mindmap generation error:', err)
            setGenStatus(prev => ({ ...prev, mindmap: 'error' }))
          })
      )
    }

    await Promise.allSettled(promises)
    setStep('done')
  }

  // Helpers
  const quantityOptions = [
    { label: 'Pequeno', value: 10, desc: '~10' },
    { label: 'Médio', value: 20, desc: '~20' },
    { label: 'Grande', value: 30, desc: '~30' },
  ]

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-12">
      <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-700">

        {/* Navigation */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 text-[var(--muted-foreground)]"
            onClick={() => {
              if (step === 'source-ready') setStep('upload')
              else if (step === 'done') router.push('/dashboard')
              else router.back()
            }}
          >
            <ChevronLeft size={16} className="mr-1" />
            {step === 'done' ? 'Ir ao Painel' : step === 'source-ready' ? 'Voltar' : 'Voltar ao Painel'}
          </Button>
        </div>

        {/* ======================== */}
        {/* STEP 1: Upload           */}
        {/* ======================== */}
        {step === 'upload' && (
          <>
            <div className="space-y-2 mb-8 md:mb-10">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                Nova Fonte de Estudo
              </h1>
              <p className="text-[var(--muted-foreground)] text-base md:text-lg">
                Faça upload do seu material ou cole texto bruto para gerar flashcards, quiz ou ambos.
              </p>
            </div>

            {isExtracting && inputMode !== 'audio' ? (
              <div className="bg-[var(--secondary)] border border-[var(--border)] rounded-xl p-12 flex flex-col items-center justify-center text-center animate-pulse">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-lg font-medium text-[var(--foreground)]">{loadingMessage}</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-2">Analisando conteúdo e detectando a especialidade médica...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Seletor Visual Moderno - Escondido durante extração de texto para foco */}
                {!isExtracting && (
                  <div className="flex flex-col sm:flex-row bg-zinc-900/50 p-1.5 rounded-xl w-full sm:w-fit border border-zinc-800/50 gap-1 sm:gap-0">
                  <button 
                    onClick={() => setInputMode('file')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${inputMode === 'file' ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                  >
                    Upload de Arquivo
                  </button>
                  <button 
                    onClick={() => setInputMode('text')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${inputMode === 'text' ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                  >
                    Colar Texto
                  </button>
                  <button 
                    onClick={() => setInputMode('audio')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${inputMode === 'audio' ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                  >
                    Áudio
                  </button>
                </div>
              )}

                {inputMode === 'file' && (
                  <UploadZone onFileSelect={(file) => handleFileSelect(file)} isProcessing={isExtracting} />
                )}
                
                {inputMode === 'text' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <input 
                      type="text" 
                      placeholder="Título do Material (Opcional)"
                      value={rawTitle}
                      onChange={(e) => setRawTitle(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--foreground)] font-medium"
                    />
                    <textarea 
                      placeholder="Cole o seu texto de estudo aqui... (mínimo 50 caracteres)"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 min-h-[300px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--foreground)]"
                    />
                    <Button 
                      className="w-full h-14 text-base shadow-lg hover:shadow-xl transition-shadow" 
                      onClick={handleTextSubmit}
                      disabled={rawText.trim().length < 50}
                    >
                      Processar Texto
                    </Button>
                  </div>
                )}

                {inputMode === 'audio' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <AudioUploadZone 
                      onFileSelect={handleAudioSelect} 
                      isProcessing={isExtracting}
                      processingStep={processingStep}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ======================== */}
        {/* STEP 2: Source Ready     */}
        {/* ======================== */}
        {step === 'source-ready' && (
          <>
            <div className="space-y-2 mb-8 md:mb-10">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                Fonte Processada
              </h1>
              <p className="text-[var(--muted-foreground)] text-base md:text-lg">
                Conteúdo extraído com sucesso. Escolha o que gerar.
              </p>
            </div>

            <div className="space-y-6">
              {/* Source Info Card */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-blue-600/10 rounded-lg text-blue-400">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full text-xl font-bold bg-transparent border-none focus:outline-none text-[var(--foreground)] placeholder-zinc-400"
                      placeholder="Nome do material..."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <CustomSelect
                    className="w-48"
                    value={specialtyTag}
                    onChange={(val) => setSpecialtyTag(val)}
                    icon={<Tag size={14} className="text-emerald-500" />}
                    options={[
                      'Anestesiologia', 'Cardiologia', 'Cirurgia Geral', 'Clínica Médica',
                      'Dermatologia', 'Endocrinologia', 'Gastroenterologia', 'Geriatria',
                      'Ginecologia e Obstetrícia', 'Hematologia', 'Infectologia',
                      'Medicina de Emergência', 'Nefrologia', 'Neurologia', 'Oftalmologia',
                      'Oncologia', 'Ortopedia', 'Otorrinolaringologia', 'Pediatria',
                      'Pneumologia', 'Psiquiatria', 'Radiologia', 'Reumatologia',
                      'Urologia', 'Outros',
                    ].map(tag => ({ value: tag, label: tag }))}
                  />
                </div>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed line-clamp-4">
                  {textPreview}
                </p>
              </div>

              {/* Output Selection */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-[var(--muted-foreground)] mb-5 uppercase tracking-widest">
                  O que deseja gerar?
                </h2>

                {/* Flashcards Option */}
                <div className="space-y-4">
                  <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    generateFlashcards
                      ? 'border-blue-500/50 bg-blue-600/10'
                      : 'border-zinc-800/50 hover:border-zinc-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={generateFlashcards}
                      onChange={(e) => setGenerateFlashcards(e.target.checked)}
                      className="mt-1 accent-blue-500 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={18} className="text-blue-500" />
                        <span className="font-bold text-[var(--foreground)]">Flashcards</span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Cards de pergunta e resposta + cloze (lacuna) para memorização via repetição espaçada.
                      </p>
                      {generateFlashcards && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {quantityOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={(e) => { e.preventDefault(); setFlashcardQuantity(opt.value) }}
                              className={`text-center py-2 px-3 rounded-lg border text-sm transition-all ${
                                flashcardQuantity === opt.value
                                  ? 'border-blue-500/50 bg-blue-600/20 text-blue-400 font-bold'
                                  : 'border-zinc-800 text-[var(--muted-foreground)] hover:border-zinc-700'
                              }`}
                            >
                              <span className="font-medium">{opt.label}</span>
                              <span className="block text-[10px] opacity-70">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Quiz Option */}
                  <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    generateQuiz
                      ? 'border-emerald-500/60 bg-emerald-500/10'
                      : 'border-zinc-800/50 hover:border-zinc-700 bg-zinc-950/40'
                  }`}>
                    <input
                      type="checkbox"
                      checked={generateQuiz}
                      onChange={(e) => setGenerateQuiz(e.target.checked)}
                      className="mt-1 accent-emerald-500 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <HelpCircle size={18} className="text-emerald-400" />
                        <span className="font-bold text-zinc-100">Quiz</span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        Questões de múltipla escolha, lacuna e verdadeiro/falso no estilo prova de residência.
                      </p>
                      {generateQuiz && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {quantityOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={(e) => { e.preventDefault(); setQuizQuantity(opt.value) }}
                              className={`text-center py-2 px-3 rounded-lg border text-sm transition-all ${
                                quizQuantity === opt.value
                                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400 font-bold'
                                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                              }`}
                            >
                              <span className="font-medium">{opt.label}</span>
                              <span className="block text-[10px] opacity-70">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                  <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    generateMindMap
                      ? 'border-amber-500/60 bg-amber-500/10'
                      : 'border-zinc-800/50 hover:border-zinc-700 bg-zinc-950/40'
                  }`}>
                    <input
                      type="checkbox"
                      checked={generateMindMap}
                      onChange={(e) => setGenerateMindMap(e.target.checked)}
                      className="mt-1 accent-amber-500 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap size={18} className="text-amber-400" />
                        <span className="font-bold text-zinc-100">Mapa Mental IA</span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        Uma visão panorâmica e hierárquica dos conceitos-chave para revisão rápida.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Folder Selection */}
              {folders.length > 0 && (
                <CustomSelect
                  className="w-1/2"
                  label="Pasta (opcional)"
                  options={[
                    { value: '', label: 'Sem pasta' },
                    ...folders.map((f) => ({ value: f.id, label: f.name }))
                  ]}
                  value={selectedFolderId}
                  onChange={(val) => setSelectedFolderId(val)}
                  icon={<Folder size={18} className="text-amber-500 flex-shrink-0" />}
                />
              )}

              {/* Generate Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full h-14 text-base shadow-lg hover:shadow-xl transition-shadow"
                onClick={handleStartGeneration}
              >
                <Zap size={18} className="mr-2" />
                Gerar {[generateFlashcards && 'Flashcards', generateQuiz && 'Quiz', generateMindMap && 'Mapa Mental'].filter(Boolean).join(' + ')}
              </Button>
            </div>
          </>
        )}

        {/* ======================== */}
        {/* STEP 3: Generating       */}
        {/* ======================== */}
        {step === 'generating' && (
          <>
            <div className="space-y-2 mb-8 md:mb-10">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                Gerando seu material...
              </h1>
              <p className="text-[var(--muted-foreground)] text-base md:text-lg">
                Processando seu documento. Isso pode levar alguns segundos.
              </p>
            </div>

            <div className="space-y-4">
              {generateFlashcards && (
                <GenerationStatusCard
                  icon={<BookOpen size={20} />}
                  label="Flashcards"
                  status={genStatus.flashcards}
                  count={genStatus.flashcardsCount}
                  color="blue"
                />
              )}
              {generateQuiz && (
                <GenerationStatusCard
                  icon={<HelpCircle size={20} />}
                  label="Quiz"
                  status={genStatus.quiz}
                  count={genStatus.quizCount}
                  color="emerald"
                />
              )}
              {generateMindMap && (
                <GenerationStatusCard
                  icon={<Zap size={20} />}
                  label="Mapa Mental"
                  status={genStatus.mindmap}
                  color="amber"
                />
              )}
            </div>
          </>
        )}

        {/* ======================== */}
        {/* STEP 4: Done             */}
        {/* ======================== */}
        {step === 'done' && (
          <>
            <div className="space-y-2 mb-8">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                Tudo pronto! 🎉
              </h1>
              <p className="text-[var(--muted-foreground)] text-base md:text-lg">
                Seu material de estudo foi gerado com sucesso.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {generateFlashcards && (
                <GenerationStatusCard
                  icon={<BookOpen size={20} />}
                  label="Flashcards"
                  status={genStatus.flashcards}
                  count={genStatus.flashcardsCount}
                  color="blue"
                />
              )}
              {generateQuiz && (
                <GenerationStatusCard
                  icon={<HelpCircle size={20} />}
                  label="Quiz"
                  status={genStatus.quiz}
                  count={genStatus.quizCount}
                  color="emerald"
                />
              )}
              {generateMindMap && (
                <GenerationStatusCard
                  icon={<Zap size={20} />}
                  label="Mapa Mental"
                  status={genStatus.mindmap}
                  color="amber"
                />
              )}
            </div>

            {/* Action Buttons — Mobile Optimized */}
            <div className="space-y-3">
              {/* Secondary Actions: Colored Cards */}
              {genStatus.deckId && (
                <button
                  onClick={() => router.push(`/dashboard/deck/${genStatus.deckId}`)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-500/20 bg-blue-600/5 hover:border-blue-500/40 transition-all active:scale-[0.98]"
                >
                  <div className="p-2.5 rounded-lg bg-blue-600/10 text-blue-400">
                    <BookOpen size={22} />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-bold text-zinc-100 text-base">Ver Flashcards</span>
                    {genStatus.flashcardsCount && (
                      <p className="text-xs text-zinc-500">{genStatus.flashcardsCount} cards prontos para estudar</p>
                    )}
                  </div>
                  <ArrowRight size={18} className="text-blue-500" />
                </button>
              )}
              {genStatus.quizId && (
                <button
                  onClick={() => router.push(`/dashboard/quiz/${genStatus.quizId}`)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-500/20 bg-emerald-600/5 hover:border-emerald-500/40 transition-all active:scale-[0.98]"
                >
                  <div className="p-2.5 rounded-lg bg-emerald-600/10 text-emerald-400">
                    <HelpCircle size={22} />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-bold text-zinc-100 text-base">Fazer Quiz</span>
                    {genStatus.quizCount && (
                      <p className="text-xs text-zinc-500">{genStatus.quizCount} questões geradas</p>
                    )}
                  </div>
                  <ArrowRight size={18} className="text-emerald-500" />
                </button>
              )}
              {genStatus.mindmapId && (
                <button
                  onClick={() => router.push(`/dashboard/mindmap/${genStatus.mindmapId}`)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500/60 transition-all active:scale-[0.98]"
                >
                  <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-500">
                    <Zap size={22} />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-bold text-[var(--foreground)] text-base">Ver Mapa Mental</span>
                    <p className="text-xs text-[var(--muted-foreground)]">Visão panorâmica dos conceitos</p>
                  </div>
                  <ArrowRight size={18} className="text-amber-500" />
                </button>
              )}

              {/* Primary CTA */}
              <Button
                variant="primary"
                size="lg"
                className="w-full h-14 text-base mt-2"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowRight size={18} className="mr-2" />
                Ir ao Dashboard
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// Sub-component: Generation status card
function GenerationStatusCard({
  icon,
  label,
  status,
  count,
  color,
}: {
  icon: React.ReactNode
  label: string
  status: 'idle' | 'generating' | 'done' | 'error'
  count?: number
  color: 'blue' | 'emerald' | 'amber'
}) {
  const colorMap = {
    blue: {
      bg: 'bg-zinc-900/40',
      text: 'text-blue-400',
      border: 'border-zinc-800',
    },
    emerald: {
      bg: 'bg-zinc-900/40',
      text: 'text-emerald-400',
      border: 'border-zinc-800',
    },
    amber: {
      bg: 'bg-zinc-900/40',
      text: 'text-amber-400',
      border: 'border-zinc-800',
    },
  }
  const c = colorMap[color]

  return (
    <div className={`flex items-center gap-4 p-5 rounded-xl border ${c.border} ${c.bg} transition-all`}>
      <div className={`p-2.5 rounded-lg ${c.bg} ${c.text}`}>
        {icon}
      </div>
      <div className="flex-1">
        <span className="font-bold text-[var(--foreground)]">{label}</span>
        {count !== undefined && (
          <span className="text-sm text-[var(--muted-foreground)] ml-2">({count} itens)</span>
        )}
      </div>
      {status === 'generating' && (
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Loader2 size={16} className="animate-spin" />
          Gerando...
        </div>
      )}
      {status === 'done' && (
        <div className={`flex items-center gap-1 text-sm font-medium ${c.text}`}>
          <CheckCircle2 size={16} />
          Pronto!
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-1 text-sm font-medium text-red-500">
          <XCircle size={16} />
          Erro
        </div>
      )}
    </div>
  )
}
