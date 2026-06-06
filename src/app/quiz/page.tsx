'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  Lock,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  ChevronDown,
} from 'lucide-react'
import { trackInitiateCheckout, trackLead } from '@/components/meta-pixel'
import { cn } from '@/lib/utils'

type Lead = {
  name: string
  email: string
  phone: string
}

type Answers = Record<string, string | number>

type FunnelStep =
  | { kind: 'intro'; id: 'intro' }
  | { kind: 'social'; id: 'social' }
  | { kind: 'lead'; id: 'lead' }
  | { kind: 'question'; id: string; question: string; options: string[] }
  | { kind: 'scale'; id: string; question: string; min: number; max: number }
  | { kind: 'loading'; id: string; title: string; subtitle: string; duration: number }
  | { kind: 'checkpoint'; id: 'checkpoint' }
  | { kind: 'story'; id: 'story-marina' }
  | { kind: 'testimonial'; id: 'testimonial' }
  | { kind: 'preview'; id: 'preview' }
  | { kind: 'offer'; id: 'offer' }

const SESSION_KEY = 'axoniq_quiz_session_id'
const STATE_KEY = 'axoniq_quiz_state'

const testimonials = [
  {
    quote: 'Em 2 semanas usando o AxonIQ parei de fazer flashcard no Anki e agora economizo umas 6h por semana.',
    name: 'Daniel',
    detail: '4º semestre - UnB',
  },
  {
    quote: 'É muito facil, eu subo o PDF das minhas anotações e já sai a revisao pronta. Meu estudo ficou muito mais produtivo.',
    name: 'Lucas',
    detail: '1º semestre - UniCEUB',
  },
  {
    quote: 'Cheguei na P3 lembrando do conteudo da P1, coisa que nunca tinha acontecido antes.',
    name: 'Marina',
    detail: '3º semestre - UFRJ',
  },
]

const steps: FunnelStep[] = [
  { kind: 'intro', id: 'intro' },
  { kind: 'social', id: 'social' },
  {
    kind: 'question',
    id: 'course_phase',
    question: 'Em qual fase voce ta no curso?',
    options: [
      '1º ao 4º semestre (ciclo basico)',
      '5º ao 8º semestre (ciclo clinico)',
      '9º ao 12º semestre (internato)',
      'Me preparando pra residencia',
      'Outro',
    ],
  },
  {
    kind: 'question',
    id: 'current_method',
    question: 'Como voce otimiza o seu estudo hoje?',
    options: [
      'So leio o material e faco resumo',
      'Uso Anki + faco flashcard na mao',
      'Uso alguma IA pra resumir e tirar duvida',
      'Misturo varias ferramentas (Anki, IA, resumo, caderno)',
      'Honestamente, nao tenho metodo nenhum',
    ],
  },
  { kind: 'lead', id: 'lead' },
  {
    kind: 'loading',
    id: 'loading-profile',
    title: 'Identificando seu perfil de estudo...',
    subtitle: '',
    duration: 4000,
  },
  { kind: 'checkpoint', id: 'checkpoint' },
  {
    kind: 'question',
    id: 'weekly_time_lost',
    question: 'Quanto tempo por semana voce gasta montando flashcard, resumo ou organizando material?',
    options: [
      'Menos de 2 horas',
      '2 a 5 horas',
      '5 a 10 horas',
      'Mais de 10 horas',
      'Honestamente, perco a conta',
    ],
  },
  {
    kind: 'scale',
    id: 'retention_30_days',
    question: 'De 0 a 10, o quanto voce consegue lembrar do que estudou ha 30 dias?',
    min: 0,
    max: 10,
  },
  {
    kind: 'question',
    id: 'main_difficulty',
    question: 'Qual sua maior dificuldade nos estudos hoje?',
    options: [
      'Nao consigo reter o que estudo',
      'Perco muito tempo organizando material',
      'Nao sei o que revisar e quando',
      'Tenho conteudo demais e tempo de menos',
      'Estudo errado, mas nao sei o que fazer diferente',
    ],
  },
  {
    kind: 'question',
    id: 'retention_impact',
    question: 'O que aconteceria se voce conseguisse reter o dobro do que estuda hoje?',
    options: [
      'Tiraria notas muito melhores nas provas',
      'Chegaria na residencia com base mais solida',
      'Teria mais tempo livre pra mim',
      'Ia parar de estudar com medo de esquecer',
      'Tudo isso',
    ],
  },
  { kind: 'story', id: 'story-marina' },
  {
    kind: 'question',
    id: 'six_month_goal',
    question: 'Imaginando daqui a 6 meses, qual o nivel de dominio que voce quer ter do conteudo?',
    options: [
      'Conseguir lembrar 30% do que estudei',
      '30% a 50%',
      '50% a 70%',
      '70% a 90%',
      'Mais de 90%',
    ],
  },
  {
    kind: 'question',
    id: 'expected_30_day_gain',
    question: 'O que seria um avanco real esperado depois de usar o AxonIQ por 30 dias?',
    options: [
      'Recuperar 3-5h por semana',
      'Reter o dobro do que estudo',
      'Organizar tudo que ja tenho de material',
      'Sentir que to no controle dos estudos',
      'Tudo acima',
    ],
  },
  {
    kind: 'question',
    id: 'cost_of_inaction',
    question: 'E se voce nao mudar nada agora, o que voce acha que vai te custar nos proximos meses?',
    options: [
      'Vou continuar perdendo horas preparando material para revisar',
      'Vou esquecer tudo de novo',
      'Vou chegar na residencia despreparado',
      'Nao sei, mas sei que precisa mudar',
      'Nao pensei nisso ainda',
    ],
  },
  { kind: 'testimonial', id: 'testimonial' },
  {
    kind: 'loading',
    id: 'loading-plan',
    title: 'Analisando suas respostas e montando seu plano personalizado...',
    subtitle: 'Organizando tempo perdido, retencao e objetivo de prova.',
    duration: 2200,
  },
  { kind: 'preview', id: 'preview' },
  { kind: 'offer', id: 'offer' },
]

const baseFeatures = [
  'Creditos ilimitados',
  'Flashcards e quizzes',
  'Mapas mentais',
  'Relatorios de desempenho',
  'Revisao espacada',
  'Suporte prioritario',
]

const plans = [
  {
    id: 'monthly' as const,
    name: 'Mensal',
    price: 'R$ 29,90',
    period: '/mes',
    desc: 'Flexibilidade total.',
    total: '',
    cta: 'Assinar Mensal',
    badge: null,
    badgeColor: '',
    bonus: null,
    checkout: 'stripe',
  },
  {
    id: 'semiannual' as const,
    name: 'Semestral',
    price: 'R$ 24,98',
    period: '/mes',
    desc: '6 meses com desconto.',
    total: 'R$ 131,90 a vista',
    cta: 'Assinar Semestral',
    badge: 'Mais Popular',
    badgeColor: 'blue',
    bonus: '+ 15% de desconto vs. mensal',
    checkout: 'https://pay.kirvano.com/211b8bc5-8f73-450e-bc51-444aee40f87f?split=6',
  },
  {
    id: 'annual' as const,
    name: 'Anual',
    price: 'R$ 19,98',
    period: '/mes',
    desc: '12 meses com maior desconto.',
    total: 'R$ 195,00 a vista',
    cta: 'Assinar Anual',
    badge: '33% OFF',
    badgeColor: 'amber',
    bonus: '+ 33% de desconto vs. mensal',
    checkout: 'https://pay.kirvano.com/d0f26a81-6eec-4348-8236-c8a2de41c490?split=12',
  },
]

function getUtmParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  return keys.reduce<Record<string, string>>((acc, key) => {
    const value = params.get(key)
    if (value) acc[key] = value
    return acc
  }, {})
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
}

function deriveProfile(answers: Answers) {
  const difficulty = String(answers.main_difficulty || '')
  const method = String(answers.current_method || '')
  const time = String(answers.weekly_time_lost || '')
  const retention = Number(answers.retention_30_days ?? 10)

  if (retention <= 4 || difficulty.includes('reter')) {
    return 'Retencao em risco'
  }

  if (time.includes('5 a 10') || time.includes('Mais de 10') || time.includes('perco a conta') || difficulty.includes('conteudo demais')) {
    return 'Acumulador de conteudo'
  }

  if (method.includes('Anki') || difficulty.includes('organizando')) {
    return 'Organizador manual'
  }

  return 'Potencial de alta performance'
}

function firstName(name: string) {
  return name.trim().split(' ')[0] || 'voce'
}

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 selection:bg-blue-600 selection:text-white overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none clinical-grid opacity-70" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.16),transparent_36%),linear-gradient(180deg,rgba(9,9,11,0),#09090B_74%)]" />
      <motion.div
        aria-hidden
        animate={{ y: [0, -18, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="fixed -right-20 top-16 h-[420px] w-[420px] opacity-[0.05] pointer-events-none"
      >
        <Image src="/neuronio.svg" alt="" fill className="object-contain grayscale invert" priority />
      </motion.div>
      <div className="relative z-10">{children}</div>
    </main>
  )
}

function ProgressHeader({ stepIndex, onReset }: { stepIndex: number; onReset: () => void }) {
  const progress = Math.max(4, Math.round(((stepIndex + 1) / steps.length) * 100))

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <div className="flex items-center gap-2 font-black text-zinc-100">
          <Image src="/favicon.png" alt="AxonIQ" width={24} height={24} />
          <span>AxonIQ</span>
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={onReset}
              title="Refazer diagnostico"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-zinc-500">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          Diagnostico de estudo
        </div>
        <div className="w-28 sm:w-40">
          <div className="mb-1 flex justify-between text-[10px] font-bold text-zinc-500">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-blue-500"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

function PrimaryButton({ children, onClick, disabled = false }: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2, scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-base font-black text-white shadow-xl shadow-blue-600/25 transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {children}
    </motion.button>
  )
}

function ChoiceButton({ option, onClick }: { option: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, borderColor: 'rgba(59,130,246,0.55)' }}
      whileTap={{ scale: 0.99 }}
      className="group flex min-h-13 w-full items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-left text-[13px] font-bold leading-snug text-zinc-200 shadow-lg shadow-black/10 transition-all hover:bg-zinc-900 sm:min-h-16 sm:gap-4 sm:px-5 sm:py-4 sm:text-base"
    >
      <span>{option}</span>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 transition-colors group-hover:bg-blue-500/15 group-hover:text-blue-400 sm:h-8 sm:w-8">
        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </span>
    </motion.button>
  )
}

function StepCard({ children, wide = false, extraPadding = false }: { children: React.ReactNode; wide?: boolean; extraPadding?: boolean }) {
  return (
    <motion.section
      key="step-card"
      initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'mx-auto w-full px-4 pt-22 pb-8 sm:px-6 sm:pt-28 sm:pb-10',
        extraPadding && 'pb-32 sm:pb-12',
        wide ? 'max-w-6xl' : 'max-w-2xl'
      )}
    >
      {children}
    </motion.section>
  )
}

function LoadingStep({ duration, title }: { duration: number; title: string }) {
  const [step, setStep] = useState(0)

  const messages = [
    "Cruzando respostas com a Curva de Esquecimento de Ebbinghaus...",
    "Calculando o seu vazamento de retenção semanal na faculdade...",
    "Modelando seu padrão de revisões ideais baseadas em Inteligência Artificial...",
    "Gerando seu Relatório de Diagnóstico Personalizado..."
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, messages.length - 1))
    }, duration / messages.length)

    return () => clearInterval(interval)
  }, [duration, messages.length])

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
      <h2 className="mb-3 text-2xl font-black text-zinc-100 sm:text-4xl">{title}</h2>
      <div className="max-w-md text-zinc-400 h-16 flex items-center justify-center text-sm sm:text-base px-4 font-medium leading-relaxed">
        {messages[step]}
      </div>
      <div className="mt-10 h-2 w-full max-w-sm overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          className="h-full rounded-full bg-blue-500"
          initial={{ width: '8%' }}
          animate={{ width: '100%' }}
          transition={{ duration: duration / 1000, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

export default function QuizPage() {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [lead, setLead] = useState<Lead>({ name: '', email: '', phone: '' })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [scaleValue, setScaleValue] = useState(5)
  const [offerTimerSeconds, setOfferTimerSeconds] = useState(900)
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null)

  const activeStep = steps[stepIndex]
  const profile = useMemo(() => deriveProfile(answers), [answers])

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getPersonalizedSubtitle = () => {
    const phase = answers.course_phase
    if (phase === '1º ao 4º semestre (ciclo basico)') {
      return 'Como você completou o diagnóstico e identificamos que está no Ciclo Básico, o AxonIQ vai te ajudar a fixar anatomia, fisiologia e patologia de longo prazo para nunca mais ter que reaprender tudo do zero no ciclo clínico.'
    }
    if (phase === '5º ao 8º semestre (ciclo clinico)') {
      return 'Como você completou o diagnóstico e identificamos que está no Ciclo Clínico, o AxonIQ vai te ajudar a fixar as condutas, diagnósticos e raciocínio clínico diretamente para os seus rounds e ambulatórios.'
    }
    if (phase === '9º ao 12º semestre (internato)' || phase === 'Me preparando pra residencia') {
      return 'Como você completou o diagnóstico e identificamos que está focado em provas e internato, o AxonIQ vai te ajudar a revisar os grandes temas do Enare/provas sem precisar acumular revisões atrasadas no internato.'
    }
    return 'Como você completou o diagnóstico e demonstrou compromisso com seus estudos, liberamos os planos com 7 dias gratuitos para testar o AxonIQ completo.'
  }

  const persist = useCallback(async (payload: Record<string, unknown>) => {
    try {
      const storedSessionId = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_KEY) : null
      const res = await fetch('/api/quiz-funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || storedSessionId,
          utm: getUtmParams(),
          sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          ...payload,
        }),
      })
      const data = await res.json()
      if (data.sessionId) {
        setSessionId(data.sessionId)
        window.localStorage.setItem(SESSION_KEY, data.sessionId)
      }
    } catch (error) {
      console.error('Erro ao salvar quiz:', error)
    }
  }, [sessionId])

  const saveLocalState = useCallback((nextStep: number, nextAnswers = answers, nextLead = lead) => {
    window.localStorage.setItem(STATE_KEY, JSON.stringify({
      stepIndex: nextStep,
      answers: nextAnswers,
      lead: nextLead,
    }))
  }, [answers, lead])

  useEffect(() => {
    document.title = 'Diagnostico de Estudo | AxonIQ'

    const storedSessionId = window.localStorage.getItem(SESSION_KEY)
    if (storedSessionId) setSessionId(storedSessionId)

    const storedState = window.localStorage.getItem(STATE_KEY)
    if (storedState) {
      try {
        const parsed = JSON.parse(storedState)
        if (parsed.answers) setAnswers(parsed.answers)
        if (parsed.lead) setLead(parsed.lead)
        if (typeof parsed.stepIndex === 'number') {
          setStepIndex(Math.min(parsed.stepIndex, steps.length - 1))
        }
      } catch {
        window.localStorage.removeItem(STATE_KEY)
      }
    }

    persist({ currentStep: 0, event: 'quiz_view' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goToStep = useCallback((nextStep: number, event = 'step_continue') => {
    const safeStep = Math.min(nextStep, steps.length - 1)
    setStepIndex(safeStep)
    saveLocalState(safeStep)
    persist({ currentStep: safeStep, event })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [persist, saveLocalState])

  useEffect(() => {
    if (activeStep.kind !== 'loading') return

    const timeout = window.setTimeout(() => {
      goToStep(stepIndex + 1, `${activeStep.id}_complete`)
    }, activeStep.duration)

    return () => window.clearTimeout(timeout)
  }, [activeStep, goToStep, stepIndex])

  useEffect(() => {
    if (activeStep.kind !== 'offer') return
    const timer = setInterval(() => {
      setOfferTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [activeStep.kind])

  const handleAnswer = (questionKey: string, answer: string | number) => {
    const nextAnswers = { ...answers, [questionKey]: answer }
    const nextStep = stepIndex + 1
    setAnswers(nextAnswers)
    setStepIndex(nextStep)
    saveLocalState(nextStep, nextAnswers)
    persist({
      currentStep: nextStep,
      questionKey,
      answer,
      answers: nextAnswers,
      resultProfile: deriveProfile(nextAnswers),
      event: 'answered_question',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLeadSubmit = () => {
    const phoneDigits = lead.phone.replace(/\D/g, '')
    if (!lead.name.trim() || phoneDigits.length < 10) return

    const cleanLead = {
      name: lead.name.trim(),
      email: '',
      phone: phoneDigits,
    }
    const nextStep = stepIndex + 1
    setLead({ ...cleanLead, phone: formatPhone(phoneDigits) })
    setStepIndex(nextStep)
    saveLocalState(nextStep, answers, { ...cleanLead, phone: formatPhone(phoneDigits) })
    trackLead()
    persist({
      currentStep: nextStep,
      lead: cleanLead,
      event: 'lead_captured',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCheckout = async (plan: typeof plans[number]) => {
    setLoadingPlan(plan.id)
    trackInitiateCheckout()
    persist({
      currentStep: stepIndex,
      checkoutPlan: plan.id,
      resultProfile: profile,
      completed: true,
      event: 'checkout_clicked',
    })

    try {
      if (plan.checkout === 'stripe') {
        const { createCheckoutSession } = await import('@/app/actions/stripe-actions')
        const result = await createCheckoutSession(plan.id)
        if (result.url) {
          window.location.href = result.url
          return
        }
        if (result.error) alert(result.error)
        return
      }

      const url = new URL(plan.checkout)
      if (lead.email) url.searchParams.set('email', lead.email)
      if (sessionId) url.searchParams.set('src', sessionId)
      window.location.href = url.toString()
    } catch (error) {
      console.error(error)
      alert('Nao foi possivel abrir o checkout agora. Tente novamente em instantes.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const resetQuiz = () => {
    window.localStorage.removeItem(SESSION_KEY)
    window.localStorage.removeItem(STATE_KEY)
    setSessionId(null)
    setAnswers({})
    setLead({ name: '', email: '', phone: '' })
    setScaleValue(5)
    setOfferTimerSeconds(900)
    setActiveFaqIndex(null)
    setStepIndex(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderStep = () => {
    switch (activeStep.kind) {
      case 'intro':
        return (
          <StepCard>
            <div className="text-center">
              <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10 text-blue-400">
                <Brain className="h-8 w-8" />
              </div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-blue-400">
                <Sparkles className="h-3.5 w-3.5" />
                Parabéns por chegar até aqui
              </div>
              <h1 className="mx-auto mb-5 max-w-[22rem] text-[2rem] font-black leading-[1.12] text-zinc-100 sm:max-w-xl sm:text-6xl sm:leading-tight">
                Cansado de estudar 8h por dia e sentir que esquece tudo na semana da prova?
              </h1>
              <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                Responda a este diagnóstico de 1 minuto e descubra o método de revisão automatizada com inteligência artificial que está salvando as noites de sono dos estudantes de medicina.
              </p>
              <PrimaryButton onClick={() => goToStep(1, 'quiz_started')}>
                Quero descobrir agora
                <ArrowRight className="h-5 w-5" />
              </PrimaryButton>
              <p className="mt-6 text-sm font-bold text-zinc-500">Veja como outros alunos transformaram seus estudos</p>
            </div>
          </StepCard>
        )

      case 'social':
        return (
          <>
            <StepCard extraPadding={true}>
              <div className="mb-8 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-400">
                  <Star className="h-3.5 w-3.5" />
                  Alunos usando AxonIQ
                </div>
                <h2 className="text-3xl font-black text-zinc-100 sm:text-5xl">Quem usa já sente a diferença em pouco tempo...</h2>
              </div>
              <div className="space-y-4">
                {testimonials.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5"
                  >
                    <p className="mb-4 text-base font-semibold leading-relaxed text-zinc-200">&quot;{item.quote}&quot;</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-black text-blue-400">
                        {item.name.slice(0, 1)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-100">{item.name}</p>
                        <p className="text-xs font-bold text-zinc-500">{item.detail}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="hidden sm:flex mt-8 justify-center">
                <PrimaryButton onClick={() => goToStep(2)}>
                  Continuar
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </div>
            </StepCard>
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl p-4 flex justify-center sm:hidden">
              <div className="w-full max-w-md">
                <PrimaryButton onClick={() => goToStep(2)}>
                  Continuar
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </div>
            </div>
          </>
        )

      case 'lead':
        return (
          <StepCard>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl shadow-black/20 sm:p-8">
              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black text-zinc-100 sm:text-4xl">
                  Para salvar seu progresso e carregar seu perfil de estudo, me diz seu nome e WhatsApp.
                </h2>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase text-zinc-500">Nome completo</span>
                  <input
                    value={lead.name}
                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                    placeholder="Seu nome"
                    className="h-13 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-bold text-zinc-100 outline-none transition focus:border-blue-500/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase text-zinc-500">WhatsApp</span>
                  <input
                    value={lead.phone}
                    onChange={(e) => setLead({ ...lead, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    className="h-13 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-bold text-zinc-100 outline-none transition focus:border-blue-500/60"
                  />
                </label>
              </div>
              <div className="mt-7">
                <PrimaryButton
                  onClick={handleLeadSubmit}
                  disabled={!lead.name.trim() || lead.phone.replace(/\D/g, '').length < 10}
                >
                  Personalizar meu diagnostico
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </div>
            </div>
          </StepCard>
        )

      case 'question':
        return (
          <StepCard>
            <div className="mb-5 sm:mb-8">
              <p className="mb-2 text-[10px] font-black uppercase text-blue-400 sm:mb-3">Diagnostico AxonIQ</p>
              <h2 className="text-[1.65rem] font-black leading-[1.16] text-zinc-100 sm:text-5xl sm:leading-tight">{activeStep.question}</h2>
            </div>
            <div className="space-y-2.5 sm:space-y-3">
              {activeStep.options.map((option) => (
                <ChoiceButton key={option} option={option} onClick={() => handleAnswer(activeStep.id, option)} />
              ))}
            </div>
          </StepCard>
        )

      case 'scale':
        return (
          <StepCard>
            <div className="mb-5 sm:mb-8">
              <p className="mb-2 text-[10px] font-black uppercase text-blue-400 sm:mb-3">Retencao atual</p>
              <h2 className="text-[1.65rem] font-black leading-[1.16] text-zinc-100 sm:text-5xl sm:leading-tight">{activeStep.question}</h2>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
              <div className="mb-6 flex items-end justify-center gap-2">
                <span className="text-7xl font-black text-blue-400">{scaleValue}</span>
                <span className="pb-3 text-xl font-black text-zinc-500">/10</span>
              </div>
              <input
                type="range"
                min={activeStep.min}
                max={activeStep.max}
                value={scaleValue}
                onChange={(e) => setScaleValue(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="mt-4 flex justify-between text-xs font-bold text-zinc-500">
                <span>Esqueco quase tudo</span>
                <span>Lembro muito bem</span>
              </div>
              <div className="mt-8 text-center">
                <PrimaryButton onClick={() => handleAnswer(activeStep.id, scaleValue)}>
                  Continuar
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </div>
            </div>
          </StepCard>
        )

      case 'loading':
        return (
          <StepCard>
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
              <h2 className="mb-3 text-3xl font-black text-zinc-100 sm:text-5xl">{activeStep.title}</h2>
              <p className="max-w-md text-zinc-400">{activeStep.subtitle}</p>
              <div className="mt-10 h-2 w-full max-w-sm overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  className="h-full rounded-full bg-blue-500"
                  initial={{ width: '8%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: activeStep.duration / 1000, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </StepCard>
        )

      case 'checkpoint':
        return (
          <StepCard>
            <div className="text-center">
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-11 w-11" />
              </div>
              <h2 className="mb-3 text-4xl font-black text-zinc-100 sm:text-6xl">Perfil identificado</h2>
              <p className="mx-auto mb-8 max-w-md text-zinc-400">
                Agora vamos medir onde esta o maior vazamento de tempo e retencao no seu estudo.
              </p>
              <PrimaryButton onClick={() => goToStep(stepIndex + 1)}>
                Continuar
                <ArrowRight className="h-5 w-5" />
              </PrimaryButton>
            </div>
          </StepCard>
        )

      case 'story':
        return (
          <>
            <StepCard extraPadding={true}>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 sm:p-8">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-amber-400">
                  <Target className="h-3.5 w-3.5" />
                  Caso da Marina
                </div>
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl font-black text-blue-400">M</div>
                  <div>
                    <h2 className="text-3xl font-black text-zinc-100">Esse é o caso da Marina</h2>
                    <p className="font-bold text-zinc-500">3º semestre de medicina</p>
                  </div>
                </div>
                <p className="text-lg font-semibold leading-relaxed text-zinc-300">
                  Ela tava no 3º semestre, estudava 8h por dia e chegava na prova esquecendo o que tinha visto semanas antes. Em 30 dias usando o AxonIQ, ela cortou as horas de preparacao pela metade e chegou na P2 com o conteudo organizado para revisar.
                </p>
              </div>
              <div className="hidden sm:flex mt-8 justify-center">
                <PrimaryButton onClick={() => goToStep(stepIndex + 1)}>
                  Continuar
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </div>
            </StepCard>
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl p-4 flex justify-center sm:hidden">
              <div className="w-full max-w-md">
                <PrimaryButton onClick={() => goToStep(stepIndex + 1)}>
                  Continuar
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </div>
            </div>
          </>
        )

      case 'testimonial':
        return (
          <>
            <StepCard extraPadding={true}>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 sm:p-8">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-blue-400">
                  <Star className="h-3.5 w-3.5" />
                  Case de sucesso
                </div>
                <blockquote className="mb-6 text-xl sm:text-2xl font-semibold leading-relaxed text-zinc-200 italic">
                  &quot;Desde o cursinho eu já sabia da importância dos flashcards mas não conseguia usar porque eu gastava mais tempo fazendo do que estudando de verdade.
                  Agora com o AxonIQ subo meu conteúdo e em 30s tenho o deck pronto e ainda posso fazer questões. Mudou completamente meu estudo.&quot;
                </blockquote>
                <div className="mb-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 font-black text-emerald-400">@</div>
                  <div>
                    <p className="font-black text-zinc-100">Lucas Rodor</p>
                    <p className="text-sm font-bold text-zinc-500">1º Semestre de Medicina</p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex mt-8 justify-center">
                <PrimaryButton onClick={() => goToStep(stepIndex + 1)}>
                  Ver meu diagnostico
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </div>
            </StepCard>
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl p-4 flex justify-center sm:hidden">
              <div className="w-full max-w-md">
                <PrimaryButton onClick={() => goToStep(stepIndex + 1)}>
                  Ver meu diagnostico
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </div>
            </div>
          </>
        )

      case 'preview': {
        const name = firstName(lead.name)
        const phase = answers.course_phase || 'sua fase atual'
        const time = answers.weekly_time_lost || 'tempo relevante'
        return (
          <>
            <StepCard extraPadding={true}>
              <div className="rounded-2xl border border-blue-500/25 bg-zinc-950/80 p-6 shadow-2xl shadow-blue-500/10 sm:p-8">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="mb-4 text-3xl font-black leading-tight text-zinc-100 sm:text-5xl">
                  Pronto, {name}.
                </h2>
                <p className="mb-5 text-lg font-semibold leading-relaxed text-zinc-300">
                  Com base nas suas respostas, identificamos que voce e o perfil ideal pro AxonIQ.
                </p>
                <p className="mb-7 text-zinc-400 leading-relaxed">
                  Voce ta no <strong className="text-zinc-100">{phase}</strong>, gasta <strong className="text-zinc-100">{time}</strong> organizando material e quer recuperar tempo + reter mais. Exatamente o problema que o AxonIQ resolve.
                </p>
                <div className="mb-8 grid gap-3 sm:grid-cols-3">
                  {['Recuperacao de pelo menos 3h por semana', 'Aumento perceptivel na retencao', 'Sensacao de controle sobre os estudos'].map((item) => (
                    <div key={item} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                      <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-400" />
                      <p className="text-sm font-bold text-zinc-300">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="mb-8 text-sm font-bold text-zinc-500">
                  92% dos alunos com seu perfil que comecaram a usar relataram evolucao perceptivel em 30 dias.
                </p>
              </div>
              <div className="hidden sm:flex mt-8 justify-center">
                <PrimaryButton
                  onClick={() => {
                    persist({ currentStep: stepIndex + 1, resultProfile: profile, completed: true, event: 'offer_viewed' })
                    goToStep(stepIndex + 1, 'offer_viewed')
                  }}
                >
                  Veja o que separamos pra voce
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </div>
            </StepCard>
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl p-4 flex justify-center sm:hidden">
              <div className="w-full max-w-md">
                <PrimaryButton
                  onClick={() => {
                    persist({ currentStep: stepIndex + 1, resultProfile: profile, completed: true, event: 'offer_viewed' })
                    goToStep(stepIndex + 1, 'offer_viewed')
                  }}
                >
                  Veja o que separamos pra voce
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </div>
            </div>
          </>
        )
      }

      case 'offer':
        return (
          <StepCard wide>
            {/* Banner de Urgência Regressiva */}
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 font-mono text-sm font-black uppercase text-amber-400">
                <Clock className="h-4 w-4 animate-pulse" />
                <span>Condição especial válida por: {formatTimer(offerTimerSeconds)}</span>
              </div>
            </div>

            {/* Cabeçalho */}
            <div className="mb-12 text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10 text-blue-400">
                <Brain className="h-8 w-8" />
              </div>
              <h2 className="mx-auto mb-4 max-w-3xl text-3xl font-black leading-tight text-zinc-100 sm:text-5xl">
                Parabéns! Você está a um passo de ativar seu acesso ao AxonIQ.
              </h2>
              <p className="mx-auto max-w-2xl text-base font-semibold leading-relaxed text-zinc-400">
                E como você concluiu o diagnóstico e provou estar 100% comprometido com seu futuro médico, preparamos uma condição exclusiva:
              </p>
              <div className="mx-auto mt-6 max-w-3xl text-sm text-zinc-300 leading-relaxed bg-zinc-900/40 p-5 rounded-xl border border-zinc-800">
                {getPersonalizedSubtitle()}
              </div>
            </div>

            {/* Planos Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan, index) => {
                const isPopular = plan.badge === 'Mais Popular'
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={cn(
                      'relative flex flex-col rounded-2xl border p-6 transition-all duration-300',
                      isPopular
                        ? 'border-blue-500 bg-gradient-to-b from-blue-950/20 to-zinc-950/95 shadow-xl shadow-blue-500/10 lg:-mt-4 lg:mb-4'
                        : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-700'
                    )}
                  >
                    {plan.badge && (
                      <div className={cn(
                        'absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider',
                        plan.badgeColor === 'blue' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/35' : 'bg-amber-500 text-black'
                      )}>
                        {plan.badge}
                      </div>
                    )}
                    
                    {/* Tag de Teste Grátis */}
                    <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-xl font-black text-zinc-100">{plan.name}</h3>
                      <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-400 border border-emerald-500/10 uppercase">
                        7 Dias Grátis
                      </span>
                    </div>

                    <p className="mb-5 text-sm font-bold text-zinc-500">{plan.desc}</p>
                    <div className="mb-1 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-zinc-100">{plan.price}</span>
                      <span className="text-sm font-bold text-zinc-500">{plan.period}</span>
                    </div>
                    {plan.total ? <p className="mb-6 text-xs font-bold text-zinc-500">{plan.total}</p> : <div className="mb-6 h-4" />}
                    
                    <ul className="mb-8 flex-1 space-y-3.5">
                      {baseFeatures.map((feature) => (
                        <li key={feature} className="flex items-center gap-2.5 text-sm font-semibold text-zinc-300">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                            <Check className="h-3 w-3" />
                          </span>
                          {feature}
                        </li>
                      ))}
                      {plan.bonus && (
                        <li className="border-t border-zinc-800/80 pt-3.5 text-sm font-black text-blue-400 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 shrink-0 text-blue-400" />
                          {plan.bonus}
                        </li>
                      )}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleCheckout(plan)}
                      disabled={loadingPlan !== null}
                      className={cn(
                        'min-h-13 w-full rounded-xl px-4 py-3.5 text-sm font-black transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 shadow-md',
                        isPopular
                          ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'
                          : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 shadow-black/30'
                      )}
                    >
                      {loadingPlan === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Abrindo checkout...
                        </>
                      ) : (
                        <>
                          Experimentar 7 Dias Grátis
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </div>

            {/* Garantia */}
            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8">
              <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-9 w-9" />
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/5 pointer-events-none" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-black text-zinc-100">Garantia Incondicional de 15 Dias</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    O AxonIQ foi criado para transformar a sua rotina de estudos. Por isso, você conta com risco zero: use e abuse da plataforma completa. Se em até <strong>15 dias</strong> você decidir que o AxonIQ não é para você, basta solicitar o reembolso e devolveremos 100% do seu dinheiro investido. Simples assim.
                  </p>
                </div>
              </div>
            </div>

            {/* Depoimentos de Alunos */}
            <div className="mt-20">
              <div className="text-center mb-12">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-blue-400">
                  <Star className="h-3.5 w-3.5 fill-blue-400/20" />
                  Comunidade AxonIQ
                </div>
                <h3 className="text-3xl font-black text-zinc-100 sm:text-4xl">
                  Mais de 1.200 estudantes de medicina já confiam no AxonIQ
                </h3>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-300 italic mb-6">
                      &quot;Subir os PDFs dos meus resumos e slides e receber o deck do Anki pronto em segundos parece mágica. O AxonIQ salvou meu semestre. Não perco mais tempo fazendo card manualmente, agora só estudo.&quot;
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-black text-blue-400">
                      C
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-100">Cairo Nascimento</p>
                      <p className="text-xs font-bold text-zinc-500">@caironascimento · 4º semestre de Medicina</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-300 italic mb-6">
                      &quot;Eu já usava o Anki, mas migrar meus decks antigos pro AxonIQ foi automático. A interface é maravilhosa, muito superior ao Anki puro, e a IA gera os flashcards das aulas pra mim sem eu precisar quebrar a cabeça.&quot;
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-black text-blue-400">
                      F
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-100">Fabia Dias</p>
                      <p className="text-xs font-bold text-zinc-500">@fabiadias · 2º semestre de Medicina</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Próximos Passos */}
            <div className="mt-20 max-w-4xl mx-auto">
              <h3 className="text-2xl font-black text-zinc-100 text-center mb-10">Próximos passos...</h3>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="relative rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5">
                  <div className="absolute -top-3 left-6 h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white shadow-md shadow-blue-600/30">
                    1
                  </div>
                  <h4 className="mt-2 mb-2 text-sm font-black text-zinc-200">Escolha seu plano</h4>
                  <p className="text-xs leading-relaxed text-zinc-400">
                    Selecione o plano que melhor se adapta à sua rotina acadêmica. A cobrança só ocorrerá após os 7 dias grátis.
                  </p>
                </div>

                <div className="relative rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5">
                  <div className="absolute -top-3 left-6 h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white shadow-md shadow-blue-600/30">
                    2
                  </div>
                  <h4 className="mt-2 mb-2 text-sm font-black text-zinc-200">Acesso instantâneo</h4>
                  <p className="text-xs leading-relaxed text-zinc-400">
                    Você receberá seu login e senha imediatamente no seu e-mail e WhatsApp para começar na mesma hora.
                  </p>
                </div>

                <div className="relative rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5">
                  <div className="absolute -top-3 left-6 h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white shadow-md shadow-blue-600/30">
                    3
                  </div>
                  <h4 className="mt-2 mb-2 text-sm font-black text-zinc-200">Suba seu material</h4>
                  <p className="text-xs leading-relaxed text-zinc-400">
                    Faça o upload do seu primeiro PDF ou envie seu deck do Anki e assista à IA estruturar todo o seu cronograma.
                  </p>
                </div>
              </div>
            </div>

            {/* Dúvidas Comuns (FAQ Accordion) */}
            <div className="mt-20 max-w-3xl mx-auto">
              <h3 className="text-2xl font-black text-zinc-100 text-center mb-10">Dúvidas comuns...</h3>
              <div className="space-y-3">
                {[
                  {
                    q: 'O que é o AxonIQ?',
                    a: 'O AxonIQ é uma plataforma de estudos inteligente desenvolvida especialmente para estudantes de medicina. Unindo inteligência artificial avançada com a metodologia científica de revisão espaçada, ele automatiza a criação de flashcards, quizzes e mapas mentais direto a partir do seu material ou PDFs de aula.',
                  },
                  {
                    q: 'Como o AxonIQ vai me fazer aprender mais?',
                    a: 'Em vez de ler resumos passivos repetidamente, o AxonIQ te força a praticar a recuperação ativa da memória no momento ideal. O algoritmo calcula a curva de esquecimento do seu cérebro, identificando o momento exato em que você precisa revisar cada conceito de medicina para fixá-lo na memória de longo prazo.',
                  },
                  {
                    q: 'Já uso o anki, tenho como importar os decks de lá?',
                    a: 'Sim, totalmente! O AxonIQ possui compatibilidade total com decks do Anki (.apkg). A migração é feita em segundos com poucos cliques: você mantém seus decks antigos intactos e ganha a facilidade da IA para gerar novos cards automaticamente a partir do conteúdo novo da faculdade.',
                  },
                ].map((faq, index) => {
                  const isOpen = activeFaqIndex === index
                  return (
                    <div key={index} className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden transition-all duration-200">
                      <button
                        type="button"
                        onClick={() => setActiveFaqIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-5 text-left text-sm font-black text-zinc-200 hover:text-zinc-100 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={cn('h-4 w-4 text-zinc-500 transition-transform duration-200 shrink-0 ml-4', isOpen && 'rotate-180')} />
                      </button>
                      
                      {/* Accordion Content with smooth Tailwind transition */}
                      <div className={cn(
                        'transition-all duration-350 ease-in-out overflow-hidden',
                        isOpen ? 'max-h-60 border-t border-zinc-800 bg-zinc-950/20' : 'max-h-0'
                      )}>
                        <p className="p-5 text-xs leading-relaxed text-zinc-400 font-medium">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Escassez Final */}
            <div className="mt-20 max-w-3xl mx-auto text-center border-t border-zinc-900 pt-12">
              <h3 className="text-xl font-black text-zinc-100 mb-4">Não deixe para depois...</h3>
              <p className="text-sm leading-relaxed text-zinc-400 max-w-xl mx-auto">
                Ao fechar esta página, você perderá a oportunidade única de receber a condição especial do quiz com os <strong>7 dias de teste grátis</strong> e a <strong>garantia de 15 dias</strong> para experimentar o AxonIQ completo.
              </p>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-500 shadow-md shadow-blue-600/10 transition active:scale-[0.98]"
              >
                Garantir meu teste gratuito
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </StepCard>
        )
    }
  }

  return (
    <ScreenShell>
      <ProgressHeader stepIndex={stepIndex} onReset={resetQuiz} />
      <AnimatePresence mode="wait">
        <div key={activeStep.id}>{renderStep()}</div>
      </AnimatePresence>
    </ScreenShell>
  )
}
