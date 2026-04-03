'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
  ChevronLeft, Loader2, HelpCircle, CheckCircle2,
  XCircle, ArrowRight, RotateCcw, Trophy, Clock,
  Tag, BarChart3, Plus, Trash2, Pencil, Check, X,
  Settings2, ListChecks, MessageSquare, Play
} from 'lucide-react'
import { RichEditor } from '@/components/editor/RichEditor'
import { CustomSelect } from '@/components/ui/select'
import MarkdownDisplay from '@/components/ui/markdown-display'

interface QuizQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'cloze' | 'true_false'
  options: string[]
  correct_answer: number
  explanation: string
  option_explanations?: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

interface QuizData {
  id: string
  title: string
  specialty_tag: string
  status: string
}

interface UserAnswer {
  questionId: string
  selectedAnswer: number
  isCorrect: boolean
}

type QuizStep = 'start' | 'playing' | 'results'

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const quizId = params.id as string

  // Data
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)

  // Quiz state
  const [step, setStep] = useState<QuizStep>('start')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)

  // Best score
  const [bestScore, setBestScore] = useState<number | null>(null)

  // Management state
  const [isManaging, setIsManaging] = useState(false)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  
  // New/Edit Question Form
  const [qText, setQText] = useState('')
  const [qType, setQType] = useState<'multiple_choice' | 'cloze' | 'true_false'>('multiple_choice')
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '', ''])
  const [qCorrect, setQCorrect] = useState(0)
  const [qExplanation, setQExplanation] = useState('')
  const [qOptionExplanations, setQOptionExplanations] = useState<string[]>(['', '', '', '', ''])
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  // Load quiz data
  useEffect(() => {
    async function loadQuiz() {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id, title, specialty_tag, status')
        .eq('id', quizId)
        .single()

      if (quizError || !quizData) {
        toast('Quiz não encontrado.', 'error')
        router.push('/dashboard')
        return
      }

      setQuiz(quizData)

      const { data: questionsData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)

      setQuestions(questionsData || [])

      // Load best score
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('score, total_questions')
          .eq('quiz_id', quizId)
          .eq('user_id', user.id)
          .order('score', { ascending: false })
          .limit(1)

        if (attempts && attempts.length > 0) {
          setBestScore(Math.round((attempts[0].score / attempts[0].total_questions) * 100))
        }
      }

      setLoading(false)
    }
    loadQuiz()
  }, [quizId])

  // Start quiz
  const handleStart = () => {
    const shuffled = shuffleArray(questions)
    setQuestions(shuffled)
    setStep('playing')
    setCurrentIndex(0)
    setAnswers([])
    setSelectedAnswer(null)
    setShowExplanation(false)
    setStartTime(new Date())
  }

  // Select answer
  const handleSelectAnswer = (index: number) => {
    if (selectedAnswer !== null) return // Already answered
    setSelectedAnswer(index)
    setShowExplanation(true)

    const currentQ = questions[currentIndex]
    const isCorrect = index === currentQ.correct_answer

    setAnswers(prev => [...prev, {
      questionId: currentQ.id,
      selectedAnswer: index,
      isCorrect,
    }])
  }

  const handleSaveQuestion = async () => {
    if (!qText.trim()) return
    
    const validOptions = qType === 'true_false' ? ['Verdadeiro', 'Falso'] : qOptions.filter(o => o.trim() !== '')
    
    // Ensure option_explanations matches the number of valid options
    const finalOptionExplanations = qType === 'multiple_choice' 
      ? qOptionExplanations.slice(0, validOptions.length) 
      : []

    const questionData = {
      quiz_id: quizId,
      question: qText.trim(),
      type: qType,
      options: validOptions,
      correct_answer: qCorrect,
      explanation: qExplanation.trim(),
      option_explanations: finalOptionExplanations,
      difficulty: qDifficulty
    }

    if (editingQuestionId) {
      const { data, error } = await supabase
        .from('quiz_questions')
        .update(questionData)
        .eq('id', editingQuestionId)
        .select()
        .single()

      if (error) {
        toast('Erro ao atualizar questão.', 'error')
      } else {
        setQuestions(prev => prev.map(q => q.id === editingQuestionId ? data : q))
        setIsAddingQuestion(false)
        setEditingQuestionId(null)
        resetQuestionForm()
        toast('Questão atualizada!', 'success')
      }
    } else {
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert(questionData)
        .select()
        .single()

      if (error) {
        toast('Erro ao adicionar questão.', 'error')
      } else {
        setQuestions(prev => [...prev, data])
        resetQuestionForm()
        setIsAddingQuestion(false)
        toast('Questão adicionada!', 'success')
      }
    }
  }

  const handleEditQuestion = (q: QuizQuestion) => {
    setEditingQuestionId(q.id)
    setQText(q.question)
    setQType(q.type)
    setQOptions([...q.options, ...Array(5 - q.options.length).fill('')])
    setQCorrect(q.correct_answer)
    setQExplanation(q.explanation || '')
    setQOptionExplanations(q.option_explanations ? [...q.option_explanations, ...Array(5 - q.option_explanations.length).fill('')] : ['', '', '', '', ''])
    setQDifficulty(q.difficulty)
    setIsAddingQuestion(false)
  }

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id)
    if (error) {
      toast('Erro ao excluir questão.', 'error')
    } else {
      setQuestions(prev => prev.filter(q => q.id !== id))
      toast('Questão excluída.', 'success')
    }
  }

  const resetQuestionForm = () => {
    setQText('')
    setQType('multiple_choice')
    setQOptions(['', '', '', '', ''])
    setQCorrect(0)
    setQExplanation('')
    setQOptionExplanations(['', '', '', '', ''])
    setQDifficulty('medium')
    setEditingQuestionId(null)
  }

  // Next question
  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      // Quiz finished
      const end = new Date()
      setEndTime(end)
      setStep('results')

      // Save attempt
      const score = answers.filter(a => a.isCorrect).length
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('quiz_attempts').insert({
          quiz_id: quizId,
          user_id: user.id,
          score,
          total_questions: questions.length,
          answers: answers,
          started_at: startTime?.toISOString(),
          completed_at: end.toISOString(),
        })
      }
    }
  }

  // Format time
  const formatTime = (start: Date, end: Date) => {
    const diff = Math.round((end.getTime() - start.getTime()) / 1000)
    const mins = Math.floor(diff / 60)
    const secs = diff % 60
    return `${mins}m ${secs}s`
  }

  // Difficulty badge
  const difficultyBadge = (d: string) => {
    const map: Record<string, string> = {
      easy: 'text-emerald-500 bg-emerald-500/5 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
      medium: 'text-blue-500 bg-blue-500/5 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
      hard: 'text-red-500 bg-red-500/5 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
    }
    const labels: Record<string, string> = { easy: 'Nível I', medium: 'Nível II', hard: 'Nível III' }
    return (
      <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.2em] shadow-sm transition-all ${map[d] || map.medium}`}>
        {labels[d] || d}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!quiz) return null

  const currentQuestion = questions[currentIndex]
  const score = answers.filter(a => a.isCorrect).length
  const scorePercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#09090B] p-4 sm:p-6 md:p-12 relative overflow-hidden selection:bg-blue-500/30">
      {/* Background Aurora */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto animate-in duration-700 relative z-10">
        {/* Navigation */}
        <div className="mb-10">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all group px-4 rounded-xl"
            onClick={() => router.push('/dashboard')}
          >
            <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Painel
          </Button>
        </div>

        {/* ======================== */}
        {/* START SCREEN             */}
        {/* ======================== */}
        {step === 'start' && !isManaging && (
          <div className="animate-in fade-in zoom-in-95 duration-700">
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[2.5rem] p-8 sm:p-12 backdrop-blur-2xl shadow-2xl text-center relative overflow-hidden group">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex justify-end mb-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsManaging(true)}
                    className="text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-xl px-4"
                  >
                    <Settings2 size={16} className="mr-2" /> Gerenciar Questões
                  </Button>
                </div>

                <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl inline-block mb-8 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                  <HelpCircle size={48} className="text-blue-500" />
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 mb-4 tracking-tight leading-tight">
                  {quiz.title}
                </h1>

                <div className="flex items-center justify-center gap-3 mb-10">
                  <span className="text-[10px] font-black text-blue-400 bg-blue-400/5 border border-blue-400/20 px-4 py-1.5 rounded-lg uppercase tracking-[0.2em] shadow-sm">
                    {quiz.specialty_tag}
                  </span>
                  <span className="text-[10px] font-black text-zinc-500 bg-zinc-950 border border-zinc-800 px-4 py-1.5 rounded-lg uppercase tracking-[0.2em]">
                    {questions.length} QUESTÕES
                  </span>
                </div>

                {/* Difficulty distribution */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-10 pb-10 border-b border-zinc-800/50">
                  {['easy', 'medium', 'hard'].map(d => {
                    const count = questions.filter(q => q.difficulty === d).length
                    if (count === 0) return null
                    return (
                      <div key={d} className="flex items-center gap-2">
                        {difficultyBadge(d)}
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{count}</span>
                      </div>
                    )
                  })}
                </div>

                {bestScore !== null && (
                  <div className="flex items-center justify-center gap-3 mb-10 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl animate-pulse">
                    <Trophy size={18} className="text-amber-500" />
                    <span className="text-sm font-black text-amber-500 uppercase tracking-[0.2em]">Melhor Desempenho: {bestScore}%</span>
                  </div>
                )}

                <Button
                  onClick={handleStart}
                  className="w-full sm:w-auto px-16 h-16 bg-zinc-100 text-zinc-900 hover:bg-white rounded-2xl text-lg font-black shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] active:scale-95 group/btn"
                >
                  <Play size={20} className="mr-3 fill-current group-hover:translate-x-0.5 transition-transform" />
                  INICIAR SIMULAÇÃO
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ======================== */}
        {/* ======================== */}
        {/* MANAGEMENT SCREEN        */}
        {/* ======================== */}
        {step === 'start' && isManaging && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between pb-8 border-b border-zinc-800/50">
              <div>
                <h2 className="text-2xl font-black text-zinc-100 tracking-tight uppercase tracking-[0.1em]">{quiz.title}</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Gerenciamento de Unidades de Simulação</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsManaging(false)} 
                className="text-zinc-500 hover:text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-xl px-6 transition-all active:scale-95"
              >
                Sair do Gerenciamento
              </Button>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  Unidades Disponíveis <span className="text-blue-500">({questions.length})</span>
                </h3>
                {!isAddingQuestion && !editingQuestionId && (
                  <Button 
                    size="sm" 
                    onClick={() => { resetQuestionForm(); setIsAddingQuestion(true); }} 
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all active:scale-95"
                  >
                    <Plus size={16} className="mr-2" /> Nova Questão
                  </Button>
                )}
              </div>

              {/* Add/Edit Form */}
              {(isAddingQuestion || editingQuestionId) && (
                <div className="bg-zinc-900/80 border border-blue-500/30 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                         {editingQuestionId ? <Pencil size={18} className="text-blue-500" /> : <Plus size={18} className="text-blue-500" />}
                         {editingQuestionId ? 'Editar Unidade' : 'Nova Unidade de Treinamento'}
                      </h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-zinc-500 hover:text-red-400"
                        onClick={() => { setIsAddingQuestion(false); setEditingQuestionId(null); }}
                      >
                        <X size={20} />
                      </Button>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="relative">
                          <RichEditor
                            value={qText}
                            onChange={setQText}
                            label="PROPOSIÇÃO TEÓRICA"
                            placeholder={qType === 'cloze' ? "Ex: O neurotransmissor principal é o ___." : "Inserir enunciado da questão..."}
                          />
                          {qType === 'cloze' && (
                            <div className="mt-3 flex items-center justify-between px-1">
                              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider flex items-center gap-2">
                                <HelpCircle size={12} className="text-blue-500" />
                                Use <code className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-blue-400">___</code> para lacunas.
                              </p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[9px] font-black uppercase tracking-widest gap-2 px-3 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-blue-400 hover:border-blue-500/50 transition-all"
                                onClick={() => setQText(prev => prev + ' ___ ')}
                              >
                                <Plus size={12} /> Inserir Lacuna
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Question Type & Difficulty */}
                      <div className="grid grid-cols-2 gap-6">
                        <CustomSelect
                          label="MODALIDADE"
                          value={qType}
                          onChange={(val) => setQType(val as any)}
                          options={[
                            { value: 'multiple_choice', label: 'Múltipla Escolha' },
                            { value: 'cloze', label: 'Preencher Lacuna' },
                            { value: 'true_false', label: 'Verdadeiro ou Falso' }
                          ]}
                        />
                        <CustomSelect
                          label="NÍVEL DE COMPLEXIDADE"
                          value={qDifficulty}
                          onChange={(val) => setQDifficulty(val as any)}
                          options={[
                            { value: 'easy', label: 'Nível I (Fácil)' },
                            { value: 'medium', label: 'Nível II (Médio)' },
                            { value: 'hard', label: 'Nível III (Difícil)' }
                          ]}
                        />
                      </div>

                      {/* Options (if not true_false) */}
                      {qType !== 'true_false' ? (
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">ALTERNATIVAS (DEFINA A CORRETA)</label>
                          <div className="space-y-3">
                            {qOptions.map((opt, idx) => (
                              <div key={idx} className="space-y-2">
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => setQCorrect(idx)}
                                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all border ${
                                      qCorrect === idx 
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-105' 
                                        : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </button>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...qOptions]
                                      newOpts[idx] = e.target.value
                                      setQOptions(newOpts)
                                    }}
                                    placeholder={`Alternativa ${String.fromCharCode(65 + idx)}`}
                                    className="flex-1 px-5 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                                  />
                                </div>
                                {opt.trim() !== '' && (
                                  <div className="ml-15 pr-4 mt-2">
                                    <div className="relative flex items-center gap-3 pl-15">
                                      <MessageSquare size={14} className="text-zinc-700 shrink-0" />
                                      <input
                                        type="text"
                                        value={qOptionExplanations[idx]}
                                        onChange={(e) => {
                                          const newExps = [...qOptionExplanations]
                                          newExps[idx] = e.target.value
                                          setQOptionExplanations(newExps)
                                        }}
                                        placeholder={`Esclarecimento para opção ${String.fromCharCode(65 + idx)}...`}
                                        className="w-full px-4 py-2 border-b border-zinc-800 bg-transparent text-[11px] text-zinc-400 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-800"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">RESPOSTA CORRETA</label>
                          <div className="flex gap-4">
                            <button 
                              className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border transition-all ${
                                qCorrect === 0 
                                ? 'bg-blue-600/10 text-blue-400 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                                : 'bg-zinc-950 text-zinc-600 border-zinc-800 hover:border-zinc-700'
                              }`}
                              onClick={() => setQCorrect(0)}
                            >
                              Verdadeiro
                            </button>
                            <button 
                              className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border transition-all ${
                                qCorrect === 1 
                                ? 'bg-red-600/10 text-red-400 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
                                : 'bg-zinc-950 text-zinc-600 border-zinc-800 hover:border-zinc-700'
                              }`}
                              onClick={() => setQCorrect(1)}
                            >
                              Falso
                            </button>
                          </div>
                        </div>
                      )}

                      {/* General Explanation */}
                      <div className="pt-6 border-t border-zinc-800/50">
                        <RichEditor
                          value={qExplanation}
                          onChange={setQExplanation}
                          label="COMENTÁRIGO TÉCNICO (GERAL)"
                          placeholder="Considerações finais sobre a questão..."
                        />
                      </div>

                      <div className="flex justify-end gap-4 pt-6 border-t border-zinc-800/50">
                        <Button 
                          variant="ghost" 
                          onClick={() => { setIsAddingQuestion(false); setEditingQuestionId(null); }}
                          className="text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-widest text-[10px]"
                        >
                          Descartar
                        </Button>
                        <Button 
                          onClick={handleSaveQuestion} 
                          disabled={!qText.trim() || (qType !== 'true_false' && qOptions.filter(o => o.trim() !== '').length < 2)}
                          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-10 h-12 font-black uppercase tracking-widest text-[11px] shadow-[0_0_30px_rgba(37,99,235,0.2)] disabled:opacity-30"
                        >
                          {editingQuestionId ? 'Confirmar Atualização' : 'Efetivar Questão'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions List Render */}
              <div className="grid grid-cols-1 gap-4">
                {questions.length === 0 && !isAddingQuestion ? (
                  <div className="p-20 text-center border-2 border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-950/50">
                    <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ListChecks className="text-zinc-700" size={24} />
                    </div>
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">Simulação sem unidades cadastradas</p>
                    <p className="text-zinc-600 text-[10px] mt-2">Arraste seus Decks ou crie questões manuais para começar.</p>
                  </div>
                ) : (
                  questions.map((q, idx) => (
                    <div key={q.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex items-start justify-between group hover:border-blue-500/30 transition-all hover:bg-zinc-900/60 shadow-lg hover:shadow-blue-500/5">
                      <div className="flex gap-5 min-w-0">
                        <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs font-black text-blue-500 group-hover:border-blue-500/50 transition-colors">
                          {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-200 line-clamp-2 pr-4">{q.question}</p>
                          <div className="flex items-center gap-3 mt-3">
                             {difficultyBadge(q.difficulty)}
                             <span className="text-[9px] uppercase text-zinc-500 font-black tracking-[0.2em] bg-zinc-950 px-3 py-1 rounded-md border border-zinc-800">
                               {q.type === 'cloze' ? 'Lacuna' : q.type === 'true_false' ? 'V/F' : 'Múltipla'}
                             </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-9 p-0 bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-blue-500 hover:border-blue-500/50 rounded-xl" 
                          onClick={() => handleEditQuestion(q)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-9 p-0 bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-500/50 rounded-xl" 
                          onClick={() => handleDeleteQuestion(q.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}


        {/* ======================== */}
        {/* ======================== */}
        {/* QUESTION SCREEN          */}
        {/* ======================== */}
        {step === 'playing' && currentQuestion && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Progress bar */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-md">
                    UNIDADE {currentIndex + 1} / {questions.length}
                  </span>
                  {difficultyBadge(currentQuestion.difficulty)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-zinc-600" />
                  <span className="text-[10px] font-black text-zinc-500 tabular-nums">
                    {startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0}s
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-900/50 rounded-full overflow-hidden border border-zinc-800/30">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[2rem] p-10 backdrop-blur-xl shadow-2xl mb-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors" />
              
              <div className="mb-6 flex flex-wrap gap-2">
                {currentQuestion.type === 'true_false' && (
                  <span className="text-[9px] font-black text-blue-400 bg-blue-400/5 border border-blue-400/20 px-3 py-1 rounded-lg uppercase tracking-[0.2em]">
                    ANÁLISE DE VERACIDADE
                  </span>
                )}
                {currentQuestion.type === 'cloze' && (
                  <span className="text-[9px] font-black text-violet-400 bg-violet-400/5 border border-violet-400/20 px-3 py-1 rounded-lg uppercase tracking-[0.2em]">
                    RECOMPOSIÇÃO DE LACUNA
                  </span>
                )}
                {currentQuestion.type === 'multiple_choice' && (
                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/5 border border-emerald-400/20 px-3 py-1 rounded-lg uppercase tracking-[0.2em]">
                    MÚLTIPLA ESCOLHA
                  </span>
                )}
              </div>

              <div className="text-xl md:text-2xl font-bold text-zinc-100 leading-relaxed max-w-none">
                <MarkdownDisplay content={currentQuestion.question} />
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-4 mb-10">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx
                const isCorrect = idx === currentQuestion.correct_answer
                const hasAnswered = selectedAnswer !== null

                let optionStyle = 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/50 cursor-pointer text-zinc-400'
                
                if (hasAnswered) {
                  if (isCorrect) {
                    optionStyle = 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'border-red-500/50 bg-red-500/5 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                  } else {
                    optionStyle = 'border-zinc-900 bg-zinc-950/20 opacity-40 text-zinc-600 grayscale'
                  }
                }

                const letter = String.fromCharCode(65 + idx)

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(idx)}
                    disabled={hasAnswered}
                    className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-300 group/opt ${optionStyle} ${!hasAnswered && 'hover:scale-[1.01] active:scale-[0.99]'}`}
                  >
                    <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                      hasAnswered && isCorrect
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : hasAnswered && isSelected && !isCorrect
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-500 group-hover/opt:border-zinc-600 group-hover/opt:text-zinc-300'
                    }`}>
                      {hasAnswered && isCorrect ? <Check size={20} /> :
                       hasAnswered && isSelected && !isCorrect ? <X size={20} /> :
                       letter}
                    </span>
                    <span className={`text-base font-bold transition-colors ${
                      hasAnswered && (isCorrect || isSelected) ? '' : 'group-hover/opt:text-zinc-200'
                    }`}>
                      {option}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (currentQuestion.explanation || (selectedAnswer !== null && currentQuestion.option_explanations?.[selectedAnswer])) && (
              <div className="bg-blue-600/5 border border-blue-500/20 rounded-[2rem] p-8 mb-10 animate-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <MessageSquare size={16} className="text-blue-400" />
                  </div>
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Justificativa</h4>
                </div>
                <div className="text-sm text-zinc-300 leading-relaxed max-w-none prose prose-invert prose-blue">
                  <MarkdownDisplay content={(selectedAnswer !== null && currentQuestion.option_explanations?.[selectedAnswer]) || currentQuestion.explanation} />
                </div>
              </div>
            )}

            {/* Next button */}
            {selectedAnswer !== null && (
              <Button
                onClick={handleNext}
                className="w-full h-16 bg-zinc-100 text-zinc-900 hover:bg-white rounded-[1.25rem] text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.01] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {currentIndex < questions.length - 1 ? (
                  <>PRÓXIMA QUESTÃO <ArrowRight size={18} className="ml-2" /></>
                ) : (
                  <>FINALIZAR SIMULAÇÃO <BarChart3 size={18} className="ml-2" /></>
                )}
              </Button>
            )}
          </div>
        )}


        {/* ======================== */}
        {/* RESULTS SCREEN           */}
        {/* ======================== */}
        {step === 'results' && (
          <div className="animate-in fade-in zoom-in-95 duration-700 max-w-2xl mx-auto">
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[2.5rem] p-10 md:p-14 backdrop-blur-2xl shadow-2xl relative overflow-hidden text-center group">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                  <Trophy size={32} className="text-blue-500" />
                </div>

                <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Eficiência de Resposta</h2>

                {/* Score */}
                <div className={`text-8xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b ${
                  scorePercent >= 80 ? 'from-emerald-400 to-emerald-600' :
                  scorePercent >= 60 ? 'from-amber-400 to-amber-600' :
                  'from-red-400 to-red-600'
                }`}>
                  {scorePercent}%
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
                  <div className="px-5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-zinc-300">{score} de {questions.length} ACERTOS</span>
                  </div>
                  {startTime && endTime && (
                    <div className="px-5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-3">
                      <Clock size={16} className="text-blue-500" />
                      <span className="text-xs font-bold text-zinc-300">{formatTime(startTime, endTime)}</span>
                    </div>
                  )}
                </div>

                {/* Performance message */}
                <div className={`inline-block px-10 py-4 rounded-2xl mb-12 border ${
                  scorePercent >= 80 ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                  scorePercent >= 60 ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' :
                  'bg-red-500/5 border-red-500/20 text-red-400'
                }`}>
                  <span className="font-black text-lg uppercase tracking-widest">
                    {scorePercent >= 80 ? 'Desempenho de Elite' :
                     scorePercent >= 60 ? 'Bom Progresso' :
                     'Necessita Revisão'}
                  </span>
                </div>

                {/* Incorrect questions summary */}
                {answers.filter(a => !a.isCorrect).length > 0 && (
                  <div className="text-left mt-8 pt-8 border-t border-zinc-800/50">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                       Falhas de Retenção <span className="text-red-500">({answers.filter(a => !a.isCorrect).length})</span>
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {answers.filter(a => !a.isCorrect).map((answer, idx) => {
                        const q = questions.find(q => q.id === answer.questionId)
                        if (!q) return null
                        return (
                          <div key={idx} className="p-5 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl group hover:border-red-500/30 transition-all">
                            <div className="text-sm font-bold text-zinc-300 mb-3 group-hover:text-zinc-100 transition-colors">
                                <MarkdownDisplay content={q.question} />
                            </div>
                            <div className="space-y-2">
                              <p className="text-[11px] font-bold text-red-400 flex items-center gap-2">
                                <X size={14} /> Opção: {q.options[answer.selectedAnswer]}
                              </p>
                              <p className="text-[11px] font-black text-emerald-500 flex items-center gap-2">
                                <Check size={14} /> Correto: {q.options[q.correct_answer]}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button
                variant="ghost"
                size="lg"
                className="flex-1 h-16 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95"
                onClick={handleStart}
              >
                <RotateCcw size={18} className="mr-3" />
                Reiniciar Ciclo
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="flex-1 h-16 bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95"
                onClick={() => router.push('/dashboard')}
              >
                <ChevronLeft size={18} className="mr-3" />
                Menu Principal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

