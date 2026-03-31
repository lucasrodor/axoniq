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
  Settings2, ListChecks, MessageSquare
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
      easy: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      medium: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
      hard: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    }
    const labels: Record<string, string> = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${map[d] || map.medium}`}>
        {labels[d] || d}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!quiz) return null

  const currentQuestion = questions[currentIndex]
  const score = answers.filter(a => a.isCorrect).length
  const scorePercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 md:p-12">
      <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-700">

        {/* Navigation */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 text-[var(--muted-foreground)]"
            onClick={() => router.push('/dashboard')}
          >
            <ChevronLeft size={16} className="mr-1" />
            Voltar ao Painel
          </Button>
        </div>

        {/* ======================== */}
        {/* START SCREEN             */}
        {/* ======================== */}
        {step === 'start' && !isManaging && (
          <div className="text-center">
            <div className="bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-2xl p-10 shadow-sm mb-6">
              <div className="flex justify-end mb-4">
                <Button variant="ghost" size="sm" onClick={() => setIsManaging(true)}>
                  <Settings2 size={16} className="mr-1" /> Gerenciar Questões
                </Button>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl inline-block mb-6">
                <HelpCircle size={40} className="text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{quiz.title}</h1>
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                  {quiz.specialty_tag}
                </span>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {questions.length} questões
                </span>
              </div>

              {/* Difficulty distribution */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {['easy', 'medium', 'hard'].map(d => {
                  const count = questions.filter(q => q.difficulty === d).length
                  if (count === 0) return null
                  return (
                    <div key={d} className="flex items-center gap-1">
                      {difficultyBadge(d)}
                      <span className="text-xs text-[var(--muted-foreground)]">({count})</span>
                    </div>
                  )
                })}
              </div>

              {/* Question type distribution */}
              <div className="flex items-center justify-center gap-4 mb-8 text-xs text-[var(--muted-foreground)]">
                {(() => {
                  const mc = questions.filter(q => q.type === 'multiple_choice').length
                  const cl = questions.filter(q => q.type === 'cloze').length
                  const tf = questions.filter(q => q.type === 'true_false').length
                  return (
                    <>
                      {mc > 0 && <span>Múltipla escolha: {mc}</span>}
                      {cl > 0 && <span>Lacuna: {cl}</span>}
                      {tf > 0 && <span>V/F: {tf}</span>}
                    </>
                  )
                })()}
              </div>

              {bestScore !== null && (
                <div className="flex items-center justify-center gap-2 mb-6 text-amber-600">
                  <Trophy size={16} />
                  <span className="text-sm font-bold">Melhor nota: {bestScore}%</span>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="px-12 h-14 text-base shadow-lg"
                onClick={handleStart}
              >
                Iniciar Quiz
              </Button>
            </div>
          </div>
        )}

        {/* ======================== */}
        {/* MANAGEMENT SCREEN        */}
        {/* ======================== */}
        {step === 'start' && isManaging && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{quiz.title}</h2>
                <p className="text-[var(--muted-foreground)] text-sm">Gerencie as questões deste quiz</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsManaging(false)}>
                Voltar ao Início
              </Button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Questões ({questions.length})
                </h3>
                {!isAddingQuestion && !editingQuestionId && (
                  <Button size="sm" onClick={() => { resetQuestionForm(); setIsAddingQuestion(true); }}>
                    <Plus size={16} className="mr-1" /> Adicionar Questão
                  </Button>
                )}
              </div>

              {/* Add/Edit Form */}
              {(isAddingQuestion || editingQuestionId) && (
                <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-emerald-500/30 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                       {editingQuestionId ? <Pencil size={16} /> : <Plus size={16} />}
                       {editingQuestionId ? 'Editar Questão' : 'Nova Questão'}
                    </h4>
                    <Button variant="ghost" size="sm" onClick={() => { setIsAddingQuestion(false); setEditingQuestionId(null); }}>
                      <X size={16} />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="relative">
                        <RichEditor
                          value={qText}
                          onChange={setQText}
                          label="Pergunta"
                          placeholder={qType === 'cloze' ? "Ex: O neurotransmissor principal é o ___." : "Ex: Qual o principal neurotransmissor inibitório do SNC?"}
                        />
                        {qType === 'cloze' && (
                          <div className="mt-2 flex items-center justify-between px-1">
                            <p className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                              <HelpCircle size={10} className="text-blue-500" />
                              Use <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-blue-600">___</code> (3 underscores) para indicar a lacuna.
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-6 text-[10px] gap-1 px-2 border-dashed hover:border-blue-500 hover:text-blue-600 transition-all shadow-none"
                              onClick={() => setQText(prev => prev + ' ___ ')}
                            >
                              <Plus size={10} /> Inserir Lacuna
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Type & Difficulty */}
                    <div className="grid grid-cols-2 gap-4">
                      <CustomSelect
                        label="Tipo"
                        value={qType}
                        onChange={(val) => setQType(val as any)}
                        options={[
                          { value: 'multiple_choice', label: 'Múltipla Escolha' },
                          { value: 'cloze', label: 'Preencher Lacuna' },
                          { value: 'true_false', label: 'Verdadeiro ou Falso' }
                        ]}
                      />
                      <CustomSelect
                        label="Dificuldade"
                        value={qDifficulty}
                        onChange={(val) => setQDifficulty(val as any)}
                        options={[
                          { value: 'easy', label: 'Fácil' },
                          { value: 'medium', label: 'Médio' },
                          { value: 'hard', label: 'Difícil' }
                        ]}
                      />
                    </div>

                    {/* Options (if not true_false) */}
                    {qType !== 'true_false' ? (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Alternativas (Marque a correta)</label>
                        {qOptions.map((opt, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex gap-3">
                              <button
                                onClick={() => setQCorrect(idx)}
                                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                  qCorrect === idx 
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--muted-foreground)] hover:bg-zinc-200 dark:hover:bg-zinc-700'
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
                                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </div>
                            {opt.trim() !== '' && (
                              <div className="ml-[52px] pr-4 mt-2">
                                <div className="relative group/exp">
                                  <div className="absolute -left-7 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-700">
                                    <MessageSquare size={14} />
                                  </div>
                                  <input
                                    type="text"
                                    value={qOptionExplanations[idx]}
                                    onChange={(e) => {
                                      const newExps = [...qOptionExplanations]
                                      newExps[idx] = e.target.value
                                      setQOptionExplanations(newExps)
                                    }}
                                    placeholder={`Explicação ${qCorrect === idx ? '(para a correta)' : '(para esta incorreta)'}...`}
                                    className="w-full px-3 py-1.5 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Resposta Correta</label>
                        <div className="flex gap-4">
                          <Button 
                            variant={qCorrect === 0 ? 'primary' : 'outline'} 
                            className="flex-1" 
                            onClick={() => setQCorrect(0)}
                          >
                            Verdadeiro
                          </Button>
                          <Button 
                            variant={qCorrect === 1 ? 'primary' : 'outline'} 
                            className="flex-1" 
                            onClick={() => setQCorrect(1)}
                          >
                            Falso
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* General Explanation */}
                    <div className="pt-4 border-t border-[var(--border)]">
                      <RichEditor
                        value={qExplanation}
                        onChange={setQExplanation}
                        label="Comentário Geral (Fallback)"
                        placeholder="Este comentário aparece se a alternativa selecionada não tiver uma explicação específica..."
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                      <Button variant="outline" onClick={() => { setIsAddingQuestion(false); setEditingQuestionId(null); }}>Cancelar</Button>
                      <Button onClick={handleSaveQuestion} disabled={!qText.trim() || (qType !== 'true_false' && qOptions.filter(o => o.trim() !== '').length < 2)}>
                        {editingQuestionId ? 'Atualizar Questão' : 'Salvar Questão'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions List Render */}
              <div className="space-y-3">
                {questions.length === 0 && !isAddingQuestion ? (
                  <div className="p-12 text-center border-2 border-dashed border-[var(--border)] rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
                    <p className="text-[var(--muted-foreground)]">Este quiz ainda não possui questões.</p>
                  </div>
                ) : (
                  questions.map((q, idx) => (
                    <div key={q.id} className="bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-xl p-4 flex items-start justify-between group hover:border-emerald-500/30 transition-all">
                      <div className="flex gap-4 min-w-0">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-xs font-bold text-emerald-600">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)] line-clamp-2">{q.question}</p>
                          <div className="flex items-center gap-2 mt-2">
                             {difficultyBadge(q.difficulty)}
                             <span className="text-[10px] uppercase text-[var(--muted-foreground)] font-bold tracking-widest">{q.type === 'cloze' ? 'Lacuna' : q.type === 'true_false' ? 'V/F' : 'Múltipla'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all ml-4">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-blue-500" onClick={() => handleEditQuestion(q)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10" onClick={() => handleDeleteQuestion(q.id)}>
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
        {/* QUESTION SCREEN          */}
        {/* ======================== */}
        {step === 'playing' && currentQuestion && (
          <div>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Questão {currentIndex + 1} de {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  {difficultyBadge(currentQuestion.difficulty)}
                </div>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-2xl p-8 shadow-sm mb-6">
              {currentQuestion.type === 'true_false' && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider mb-3 inline-block">
                  Verdadeiro ou Falso
                </span>
              )}
              {currentQuestion.type === 'cloze' && (
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider mb-3 inline-block">
                  Preencha a Lacuna
                </span>
              )}
              <div className="prose prose-sm dark:prose-invert text-xl font-semibold text-[var(--foreground)] leading-relaxed max-w-none prose-img:rounded-xl">
                <MarkdownDisplay content={currentQuestion.question} />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx
                const isCorrect = idx === currentQuestion.correct_answer
                const hasAnswered = selectedAnswer !== null

                let optionStyle = 'border-[var(--border)] hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer'
                if (hasAnswered) {
                  if (isCorrect) {
                    optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'border-red-500 bg-red-50 dark:bg-red-900/10'
                  } else {
                    optionStyle = 'border-[var(--border)] opacity-50'
                  }
                }

                const letter = String.fromCharCode(65 + idx) // A, B, C, D, E

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(idx)}
                    disabled={hasAnswered}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${optionStyle}`}
                  >
                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      hasAnswered && isCorrect
                        ? 'bg-emerald-500 text-white'
                        : hasAnswered && isSelected && !isCorrect
                        ? 'bg-red-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--muted-foreground)]'
                    }`}>
                      {hasAnswered && isCorrect ? <CheckCircle2 size={16} /> :
                       hasAnswered && isSelected && !isCorrect ? <XCircle size={16} /> :
                       letter}
                    </span>
                    <span className={`text-base pt-1 ${
                      hasAnswered && isCorrect ? 'font-semibold text-emerald-700 dark:text-emerald-400' :
                      hasAnswered && isSelected && !isCorrect ? 'line-through text-red-700 dark:text-red-400' :
                      'text-[var(--foreground)]'
                    }`}>
                      {option}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (currentQuestion.explanation || (selectedAnswer !== null && currentQuestion.option_explanations?.[selectedAnswer])) && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-5 mb-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Explicação</h4>
                </div>
                <div className="prose prose-sm dark:prose-invert text-sm text-blue-800 dark:text-blue-300 leading-relaxed max-w-none">
                  {/* Show specific explanation for the selected answer if it exists, otherwise fallback to general explanation */}
                  <MarkdownDisplay content={(selectedAnswer !== null && currentQuestion.option_explanations?.[selectedAnswer]) || currentQuestion.explanation} />
                </div>
              </div>
            )}

            {/* Next button */}
            {selectedAnswer !== null && (
              <Button
                variant="primary"
                size="lg"
                className="w-full h-14 text-base shadow-lg animate-in slide-in-from-bottom-4 duration-300"
                onClick={handleNext}
              >
                {currentIndex < questions.length - 1 ? (
                  <>Próxima <ArrowRight size={18} className="ml-2" /></>
                ) : (
                  <>Ver Resultado <BarChart3 size={18} className="ml-2" /></>
                )}
              </Button>
            )}
          </div>
        )}

        {/* ======================== */}
        {/* RESULTS SCREEN           */}
        {/* ======================== */}
        {step === 'results' && (
          <div className="text-center">
            <div className="bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-2xl p-10 shadow-sm mb-6">
              {/* Score */}
              <div className={`text-7xl font-black mb-2 ${
                scorePercent >= 80 ? 'text-emerald-500' :
                scorePercent >= 60 ? 'text-amber-500' :
                'text-red-500'
              }`}>
                {scorePercent}%
              </div>
              <p className="text-lg text-[var(--muted-foreground)] mb-2">
                {score} de {questions.length} corretas
              </p>
              {startTime && endTime && (
                <p className="text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-1 mb-6">
                  <Clock size={14} /> {formatTime(startTime, endTime)}
                </p>
              )}

              {/* Performance message */}
              <div className={`inline-block px-6 py-3 rounded-xl mb-8 ${
                scorePercent >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                scorePercent >= 60 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                <span className="font-bold text-lg">
                  {scorePercent >= 80 ? '🎉 Excelente!' :
                   scorePercent >= 60 ? '💪 Bom trabalho!' :
                   '📚 Continue estudando!'}
                </span>
              </div>

              {/* Incorrect questions summary */}
              {answers.filter(a => !a.isCorrect).length > 0 && (
                <div className="text-left mt-6">
                  <h3 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">
                    Questões que você errou ({answers.filter(a => !a.isCorrect).length})
                  </h3>
                  <div className="space-y-3">
                    {answers.filter(a => !a.isCorrect).map((answer, idx) => {
                      const q = questions.find(q => q.id === answer.questionId)
                      if (!q) return null
                      return (
                        <div key={idx} className="p-4 bg-red-50/50 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20 rounded-xl">
                          <p className="text-sm font-medium text-[var(--foreground)] mb-2">{q.question}</p>
                          <p className="text-xs text-red-600 mb-1">
                            ✗ Sua resposta: {q.options[answer.selectedAnswer]}
                          </p>
                          <p className="text-xs text-emerald-600">
                            ✓ Correta: {q.options[q.correct_answer]}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleStart}
              >
                <RotateCcw size={18} className="mr-2" />
                Refazer Quiz
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => router.push('/dashboard')}
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
