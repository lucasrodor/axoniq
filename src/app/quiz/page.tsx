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
    quote: 'Em 2 semanas usando o AxonIQ parei de fazer flashcard no Anki. Economizo umas 6h por semana.',
    name: 'Joao',
    detail: '4o semestre',
  },
  {
    quote: 'Cheguei na P3 lembrando do conteudo da P1, coisa que nunca tinha acontecido.',
    name: 'Marina',
    detail: '3o semestre',
  },
  {
    quote: 'Subo o PDF e o deck ja sai com Cloze, explicacao e revisao pronta. Meu estudo ficou muito mais leve.',
    name: 'Rafael',
    detail: 'ciclo clinico',
  },
]

const steps: FunnelStep[] = [
  { kind: 'intro', id: 'intro' },
  { kind: 'social', id: 'social' },
  { kind: 'lead', id: 'lead' },
  {
    kind: 'question',
    id: 'course_phase',
    question: 'Em qual fase voce ta no curso?',
    options: [
      '1o ao 4o semestre (ciclo basico)',
      '5o ao 8o semestre (ciclo clinico)',
      '9o ao 12o semestre (internato)',
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
  {
    kind: 'loading',
    id: 'loading-profile',
    title: 'Identificando seu perfil de estudo...',
    subtitle: 'Cruzando rotina, metodo atual e pontos de atrito.',
    duration: 1500,
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

function StepCard({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.section
      key="step-card"
      initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'mx-auto w-full px-4 pt-22 pb-8 sm:px-6 sm:pt-28 sm:pb-10',
        wide ? 'max-w-6xl' : 'max-w-2xl'
      )}
    >
      {children}
    </motion.section>
  )
}

export default function QuizPage() {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [lead, setLead] = useState<Lead>({ name: '', email: '', phone: '' })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [scaleValue, setScaleValue] = useState(5)

  const activeStep = steps[stepIndex]
  const profile = useMemo(() => deriveProfile(answers), [answers])

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
    if (!lead.name.trim() || !lead.email.trim() || phoneDigits.length < 10) return

    const cleanLead = {
      name: lead.name.trim(),
      email: lead.email.trim(),
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
                Diagnostico em 1 minuto
              </div>
              <h1 className="mx-auto mb-5 max-w-[22rem] text-[2rem] font-black leading-[1.12] text-zinc-100 sm:max-w-xl sm:text-6xl sm:leading-tight">
                Descubra como triplicar sua retencao de conteudo na medicina
              </h1>
              <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                Veja como estudantes de medicina estao estudando metade do tempo e aprendendo o dobro.
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
          <StepCard>
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-400">
                <Star className="h-3.5 w-3.5" />
                Alunos usando AxonIQ
              </div>
              <h2 className="text-3xl font-black text-zinc-100 sm:text-5xl">O estudo para de depender de forca bruta.</h2>
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
            <div className="mt-8 text-center">
              <PrimaryButton onClick={() => goToStep(2)}>
                Continuar
                <ArrowRight className="h-5 w-5" />
              </PrimaryButton>
            </div>
          </StepCard>
        )

      case 'lead':
        return (
          <StepCard>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl shadow-black/20 sm:p-8">
              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black text-zinc-100 sm:text-4xl">Pra personalizar seu resultado, me diz seu nome, email e WhatsApp.</h2>
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
                  <span className="mb-2 block text-[10px] font-black uppercase text-zinc-500">Email</span>
                  <input
                    value={lead.email}
                    onChange={(e) => setLead({ ...lead, email: e.target.value })}
                    placeholder="seu@email.com"
                    type="email"
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
                  disabled={!lead.name.trim() || !lead.email.trim() || lead.phone.replace(/\D/g, '').length < 10}
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
          <StepCard>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 sm:p-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-amber-400">
                <Target className="h-3.5 w-3.5" />
                Caso da Marina
              </div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl font-black text-blue-400">M</div>
                <div>
                  <h2 className="text-3xl font-black text-zinc-100">Esse e o caso da Marina</h2>
                  <p className="font-bold text-zinc-500">3o semestre de medicina</p>
                </div>
              </div>
              <p className="text-lg font-semibold leading-relaxed text-zinc-300">
                Ela tava no 3o semestre, estudava 8h por dia e chegava na prova esquecendo o que tinha visto semanas antes. Em 30 dias usando o AxonIQ, ela cortou as horas de preparacao pela metade e chegou na P2 com o conteudo organizado para revisar.
              </p>
              <div className="mt-8">
                <PrimaryButton onClick={() => goToStep(stepIndex + 1)}>
                  Continuar
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </div>
            </div>
          </StepCard>
        )

      case 'testimonial':
        return (
          <StepCard>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 sm:p-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-blue-400">
                <Star className="h-3.5 w-3.5" />
                Case de sucesso
              </div>
              <blockquote className="mb-6 text-2xl font-black leading-tight text-zinc-100 sm:text-4xl">
                &quot;Eu fazia flashcard manualmente no Anki, levava 2h pra montar uns 30 cards de uma materia. Com o AxonIQ subo o PDF e em 30s tenho o deck pronto, com Cloze, explicacao e tudo. Mudou completamente meu estudo.&quot;
              </blockquote>
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 font-black text-emerald-400">@</div>
                <div>
                  <p className="font-black text-zinc-100">@aluno</p>
                  <p className="text-sm font-bold text-zinc-500">AxonIQ em rotina de prova</p>
                </div>
              </div>
              <PrimaryButton onClick={() => goToStep(stepIndex + 1)}>
                Ver meu diagnostico
                <ArrowRight className="h-5 w-5" />
              </PrimaryButton>
            </div>
          </StepCard>
        )

      case 'preview': {
        const name = firstName(lead.name)
        const phase = answers.course_phase || 'sua fase atual'
        const time = answers.weekly_time_lost || 'tempo relevante'
        return (
          <StepCard>
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
        )
      }

      case 'offer':
        return (
          <StepCard wide>
            <div className="mb-10 text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-amber-400">
                <Flame className="h-3.5 w-3.5" />
                Condicao especial do quiz
              </div>
              <h2 className="mx-auto mb-4 max-w-3xl text-4xl font-black leading-tight text-zinc-100 sm:text-6xl">
                Parabens, voce esta a um passo de transformar seus estudos.
              </h2>
              <p className="mx-auto max-w-2xl text-zinc-400">
                Como voce completou o diagnostico e demonstrou compromisso com seus estudos, liberamos os planos com 7 dias gratuitos para testar o AxonIQ completo.
              </p>
              <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-lg font-black text-amber-300">
                <Clock className="h-5 w-5" />
                15:00
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-6 shadow-xl shadow-black/20',
                    plan.badge === 'Mais Popular'
                      ? 'border-blue-500/40 bg-gradient-to-b from-zinc-900/95 to-zinc-950 shadow-blue-500/10 lg:-mt-4'
                      : 'border-zinc-800 bg-zinc-900/70'
                  )}
                >
                  {plan.badge && (
                    <div className={cn(
                      'absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase',
                      plan.badgeColor === 'blue' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-black'
                    )}>
                      {plan.badge}
                    </div>
                  )}
                  <h3 className="mb-1 mt-2 text-xl font-black text-zinc-100">{plan.name}</h3>
                  <p className="mb-5 text-sm font-bold text-zinc-500">{plan.desc}</p>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-zinc-100">{plan.price}</span>
                    <span className="text-sm font-bold text-zinc-500">{plan.period}</span>
                  </div>
                  {plan.total ? <p className="mb-6 text-xs font-bold text-zinc-500">{plan.total}</p> : <div className="mb-6 h-4" />}
                  <ul className="mb-6 flex-1 space-y-3">
                    {baseFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm font-semibold text-zinc-300">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                          <Check className="h-3 w-3" />
                        </span>
                        {feature}
                      </li>
                    ))}
                    {plan.bonus && (
                      <li className="border-t border-zinc-800 pt-3 text-sm font-black text-blue-400">{plan.bonus}</li>
                    )}
                  </ul>
                  <button
                    type="button"
                    onClick={() => handleCheckout(plan)}
                    disabled={loadingPlan !== null}
                    className={cn(
                      'min-h-13 w-full rounded-xl px-4 py-3 font-black transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
                      plan.badge === 'Mais Popular'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500'
                        : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                    )}
                  >
                    {loadingPlan === plan.id ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Abrindo checkout
                      </span>
                    ) : plan.cta}
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-center">
              <div className="mb-3 flex items-center justify-center gap-2 text-sm font-black text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
                7 dias gratuitos + garantia de 7 dias
              </div>
              <p className="text-sm leading-relaxed text-zinc-500">
                Ao escolher um plano, voce concorda em receber comunicacoes do AxonIQ por email e WhatsApp sobre seu diagnostico, acesso e condicoes comerciais.
              </p>
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
