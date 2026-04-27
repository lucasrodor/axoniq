'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { trackLead } from '@/components/meta-pixel'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  })
} as any

const blurFade = {
  hidden: { opacity: 0, filter: 'blur(10px)', y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  }),
} as any

function NeuronBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-[0.03]">
      {/* Only show static neurons - CSS animations instead of framer-motion */}
      <div 
        className="absolute top-[8%] left-[5%] w-[300px] h-[300px] md:w-[400px] md:h-[400px] opacity-80"
        style={{ animation: 'float-slow 15s ease-in-out infinite' }}
      >
        <Image src="/neuronio.svg" alt="" fill className="object-contain brightness-125 grayscale invert" />
      </div>

      <div 
        className="hidden md:block absolute bottom-[10%] right-[3%] w-[500px] h-[500px] opacity-60"
        style={{ animation: 'float-slow 20s ease-in-out infinite reverse' }}
      >
        <Image src="/neuronio.svg" alt="" fill className="object-contain brightness-150 grayscale invert" />
      </div>

      {/* Sparse Neural Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(24,24,27,0)_0%,rgba(9,9,11,1)_100%)] mix-blend-overlay opacity-50" />
    </div>
  )
}

function MaterialIcon({ name, className = '', fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  )
}

function OrbitPill({ angle, radius, label, icon, delay = 0 }: { angle: number, radius: number, label: string, icon: string, delay?: number }) {
  const radian = angle * (Math.PI / 180);
  const x = Math.cos(radian) * radius;
  const y = Math.sin(radian) * radius;

  return (
    <div 
      className="absolute hidden md:block"
      style={{ 
        left: `calc(50% + ${x}px)`, 
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)' 
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2 bg-zinc-900/90 border border-zinc-800 rounded-full shadow-2xl whitespace-nowrap z-20"
        style={{ animation: `float-slow ${4 + delay}s ease-in-out infinite` }}
      >
        <MaterialIcon name={icon} className="text-blue-500 text-sm" />
        <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest">{label}</span>
      </div>
    </div>
  )
}

function Tilt({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  // Tilt is desktop-only (no hover on mobile = useless overhead)
  return <div className={className}>{children}</div>
}

function FAQItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center text-left font-bold text-zinc-100">
        <span>{question}</span>
        <MaterialIcon name={open ? 'remove' : 'add'} className={open ? 'text-blue-500' : 'text-zinc-400'} />
      </button>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 text-sm text-zinc-400 leading-relaxed"
        >
          {answer}
        </motion.p>
      )}
    </div>
  )
}

/* ── Demo Flashcards Data ── */
const demoCards = [
  { front: 'Qual é a principal função do sistema linfático?', back: 'Drenar o líquido intersticial, transportar lipídios e participar da defesa imunológica do organismo.' },
  { front: 'Quais são os Critérios Maiores de Framingham para ICC?', back: 'Dispneia paroxística noturna, turgência jugular, estertores crepitantes, cardiomegalia, edema agudo de pulmão, terceira bulha (B3) e pressão venosa central > 16 cmH₂O.' },
  { front: 'Qual é o mecanismo de ação dos inibidores da ECA?', back: 'Bloqueiam a enzima conversora de angiotensina, impedindo a conversão de angiotensina I em angiotensina II, causando vasodilatação e redução da aldosterona.' },
  { front: 'Quais são as fases do potencial de ação cardíaco?', back: 'Fase 0: despolarização rápida (Na⁺). Fase 1: repolarização precoce (K⁺). Fase 2: platô (Ca²⁺). Fase 3: repolarização rápida (K⁺). Fase 4: repouso.' },
  { front: 'Qual é a tríade de Cushing na hipertensão intracraniana?', back: 'Hipertensão arterial sistêmica, bradicardia e alteração do padrão respiratório (respiração irregular).' },
  { front: 'O que é a Curva de Ebbinghaus e como se aplica ao estudo?', back: 'A Curva do Esquecimento mostra que perdemos até 70% da informação em 24h sem revisão. O estudo com repetição espaçada combate esse efeito, consolidando a memória de longo prazo.' },
  { front: 'Quais são os sinais patognomônicos do tétano?', back: 'Trismo (rigidez mandibular), riso sardônico, opistótono (hiperextensão do corpo) e espasmos musculares generalizados.' },
  { front: 'Qual é a diferença entre sensibilidade e especificidade?', back: 'Sensibilidade é a capacidade do teste de detectar verdadeiros positivos (doentes). Especificidade é a capacidade de detectar verdadeiros negativos (saudáveis).' },
  { front: 'Quais são as camadas da parede arterial?', back: 'Túnica íntima (endotélio), túnica média (músculo liso e fibras elásticas) e túnica adventícia (tecido conjuntivo).' },
  { front: 'Como funciona o algoritmo SM-2 de repetição espaçada?', back: 'O SM-2 ajusta o intervalo de revisão com base na qualidade da resposta. Respostas fáceis aumentam o intervalo exponencialmente, enquanto erros reiniciam o ciclo, otimizando a retenção a longo prazo.' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function FlashcardDemo({ onJoinWaitlist }: { onJoinWaitlist: () => void }) {
  const [cards, setCards] = useState(demoCards)
  const [idx, setIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 })

  useEffect(() => {
    setCards(shuffle(demoCards))
  }, [])

  const currentCard = cards[idx]
  const total = stats.again + stats.hard + stats.good + stats.easy

  const handleAnswer = useCallback((quality: 'again' | 'hard' | 'good' | 'easy') => {
    setStats(prev => ({ ...prev, [quality]: prev[quality] + 1 }))
    setIsFlipped(false)
    setTimeout(() => {
      setIdx(prev => {
        if (prev >= cards.length - 1) {
          setCards(shuffle(demoCards))
          return 0
        }
        return prev + 1
      })
    }, 200)
  }, [cards.length])

  return (
    <div className="mt-16 mx-auto max-w-3xl">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] bg-blue-900/20 px-2.5 py-1 rounded-full border border-blue-800/30">
            Demo ao vivo
          </span>
          <span className="text-xs text-zinc-500">{idx + 1}/{cards.length}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="text-emerald-400 font-bold">{stats.good + stats.easy} ✓</span>
          <span className="text-red-400 font-bold">{stats.again} ✗</span>
          <span>{total} total</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-blue-500 rounded-full"
          animate={{ width: `${((idx + 1) / cards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Flashcard */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ x: 80, opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -80, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Tilt className="relative w-full aspect-[4/3] sm:aspect-[3/2] cursor-pointer">
            <div
              className="w-full h-full relative"
              style={{ perspective: '1200px' }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full relative"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 sm:p-10 text-center overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 opacity-50" />
                  <div className="absolute top-6 left-6 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] opacity-80">
                    Pergunta
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-zinc-100 leading-snug">
                    {currentCard.front}
                  </h2>
                  <div className="absolute bottom-5 text-[10px] text-zinc-500 flex items-center gap-1.5 uppercase tracking-widest">
                    <MaterialIcon name="touch_app" className="text-sm" /> Toque para virar
                  </div>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 sm:p-10 text-center overflow-hidden"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600 opacity-50" />
                  <div className="absolute top-6 left-6 text-[10px] font-bold text-green-400 uppercase tracking-[0.2em] opacity-80">
                    Resposta
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>
              </motion.div>
            </div>
          </Tilt>
        </motion.div>
      </AnimatePresence>

      {/* Answer buttons */}
      <div className="mt-6">
        {!isFlipped ? (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full py-4 bg-zinc-100 text-zinc-900 rounded-xl font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
          >
            Mostrar Resposta
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { key: 'again' as const, label: 'Errei', icon: 'close', border: 'border-red-900/50', text: 'text-red-400', hover: 'hover:bg-red-950/30' },
              { key: 'hard' as const, label: 'Difícil', icon: 'psychology', border: 'border-orange-900/50', text: 'text-orange-400', hover: 'hover:bg-orange-950/30' },
              { key: 'good' as const, label: 'Acertei', icon: 'check_circle', border: 'border-green-900/50', text: 'text-green-400', hover: 'hover:bg-green-950/30' },
              { key: 'easy' as const, label: 'Fácil', icon: 'bolt', border: 'border-blue-900/50', text: 'text-blue-400', hover: 'hover:bg-blue-950/30' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => handleAnswer(opt.key)}
                className={`flex flex-col items-center gap-1 p-3 sm:p-4 rounded-xl border ${opt.border} ${opt.text} ${opt.hover} transition-all active:scale-95`}
              >
                <MaterialIcon name={opt.icon} className="text-xl sm:text-2xl" />
                <span className="text-[10px] sm:text-xs font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-zinc-600 mt-4">
        Experimente agora — <button onClick={onJoinWaitlist} className="text-blue-500 hover:underline font-medium">crie flashcards do seu próprio material</button>
      </p>
    </div>
  )
}

const testimonials = [
  {
    text: '"O Axoniq me economiza pelo menos 3 horas de estudo por dia. O que eu levava uma tarde inteira pra resumir no Anki, ele faz em segundos."',
    name: 'Dra. Mariana Silva',
    role: 'Residente de Clínica Médica',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR1wpC5APD4jR6HIl43n6MFp92-1mCuuBNJZb-yRMKB5N-XzechW9KLMNBUjB4z2FgavnNecVU8WQZBgdXUV01-hYliXvMaxkabKXrb2EZfo0YyongCSWOR1y2bFIESghN0pRSPWn2qXisWFU0VRl-XbArjZO7IDkxOvhxLAfpFNfo1uYPSE_Eqa4YVB_0-ffxNyk2DfU14c1qzifEFGNNdFRH2lVQJG5WR6tU7L9AC091dIh8foEKC_ZTPA2ZWFV_03hMPqWoYtav',
  },
  {
    text: '"A IA para mapas mentais é surreal. Ela consegue conectar conceitos de farmacologia com fisiopatologia de um jeito que eu nunca vi."',
    name: 'Lucas Oliveira',
    role: 'Interno do 6º Ano',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA99IZ6n1b2oZI3Zgd2yD-glKYlhy7Me978-uCY0bj62mIuijFdWcs0FCkKVHn_DNyMjXvlVKrb_pGKaX5W6aFN2flPzYOXBacXkx7WueC4GNJS8qk914x9XneKt1dmiz_NWlZUICWbq-MFYRiEYbvXvPlAS3P41MI6Hdl-O-6rLPOEW60B4ozYCTLgnEm-_fTAjFVbKzntO5827rCc9TOAMC91eIdwXSfWifJmF6Z0K9IeXjV7TyGjIYDyJH4CFeF6NfGudc-2aNNq',
  },
  {
    text: '"Passei na residência dos meus sonhos usando o Axoniq para revisar temas densos como nefrologia e infecto. Melhor investimento."',
    name: 'Dra. Beatriz Costa',
    role: 'Aprovada USP-SP',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYXXAqq-RerWWtvlIfcFZWPT5RbLfEZEapCN9jSdXFOVncEcuPVMDNf8uR0LsAe1zaAJSinelQHXoqMnCP8_3_emPNPr59W9YLb7QbVz5o813_VB4ehWo-ID9uHQmhcBG3CdmJU0m7WHC0EtPG6XabPpSsUmj04wVbE9R3slLBEGTyZHAsC3QUdVKvVnoe0FmhXu6w7ByPoAlOhmnzBXYOG95SW0z5ZbV4Izfm1cnwl922V2FadIMOdS2QAMiLtZpLgT_O_azm2rpR',
  },
]

const howItWorks = [
  { icon: 'upload_file', title: '1. Suba seu material', desc: 'PDFs de aulas, prints de slides ou links de vídeos. Nossa IA lê e entende tudo.' },
  { icon: 'auto_fix_high', title: '2. O AxonIQ monta seu material', desc: 'Em segundos, geramos flashcards otimizados, questões de prova e mapas mentais.' },
  { icon: 'psychology', title: '3. Estude com ciência', desc: 'Estude através de repetição espaçada e receba feedbacks imediatos sobre seu desempenho.' },
]

function WaitlistModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    
    const { error } = await supabase.from('waitlist_leads').insert({
      name, email, phone
    })

    if (error) {
      console.error('Erro ao salvar lead:', error)
      // Código de erro do Postgres para violação de unique constraint (e-mail já cadastrado)
      if (error.code !== '23505') {
        alert('Ocorreu um erro ao salvar suas informações. Tente novamente.')
        setStatus('idle')
        return
      }
    }

    setStatus('success')
    trackLead()
  }

  // Reset status on open
  useEffect(() => {
    if (isOpen) {
      setStatus('idle')
      setEmail('')
      setName('')
      setPhone('')
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
            
            <button onClick={onClose} className="absolute top-6 right-6 z-50 text-zinc-500 hover:text-zinc-100 transition-colors">
              <MaterialIcon name="close" />
            </button>

            {status === 'success' ? (
              <div className="text-center py-8 relative z-10">
                <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MaterialIcon name="check" className="text-3xl font-bold" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-2">Você está na lista!</h3>
                <p className="text-zinc-400">Em breve enviaremos seu acesso antecipado exclusivo para não assinantes.</p>
                <button onClick={onClose} className="mt-8 w-full py-3 bg-zinc-800 text-zinc-100 font-bold rounded-xl hover:bg-zinc-700 transition-colors">
                  Fechar
                </button>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-zinc-100 mb-2">Acesso Antecipado</h3>
                  <p className="text-zinc-400 text-sm">Inscreva-se na lista de espera para testar o Axoniq antes do lançamento oficial.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Seu Nome</label>
                    <input 
                      type="text" required
                      value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Como gosta de ser chamado"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">E-mail</label>
                    <input 
                      type="email" required
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@exemplo.com"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Telefone / WhatsApp</label>
                    <input 
                      type="tel" required
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  <button 
                    type="submit" disabled={status === 'loading'}
                    className="w-full py-4 mt-2 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all disabled:opacity-70"
                  >
                    {status === 'loading' ? <MaterialIcon name="sync" className="animate-spin" /> : 'Entrar na Lista de Espera'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}


function AuroraHero({ onJoinWaitlist }: { onJoinWaitlist: () => void }) {
  const sectionRef = useRef<HTMLElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Detect password recovery from hash and redirect
    if (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token')) {
      router.push('/reset-password' + window.location.hash)
    }
  }, [router])

  const rawX = useMotionValue(0.5)
  const rawY = useMotionValue(0.5)

  // Spring-smoothed values (0–1 normalized)
  const smoothX = useSpring(rawX, { stiffness: 40, damping: 25, mass: 1.2 })
  const smoothY = useSpring(rawY, { stiffness: 40, damping: 25, mass: 1.2 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    rawX.set((e.clientX - rect.left) / rect.width)
    rawY.set((e.clientY - rect.top) / rect.height)
  }, [rawX, rawY])

  // Blob 1: follows cursor directly
  const blob1Left = useMotionValue('50%')
  const blob1Top  = useMotionValue('40%')

  // Blob 2: offset from cursor
  const blob2Left = useMotionValue('55%')
  const blob2Top  = useMotionValue('50%')

  useEffect(() => {
    const unsub1 = smoothX.on('change', v => {
      blob1Left.set(`${v * 100}%`)
      blob2Left.set(`${v * 100 + 12}%`)
    })
    const unsub2 = smoothY.on('change', v => {
      blob1Top.set(`${v * 100}%`)
      blob2Top.set(`${v * 100 + 8}%`)
    })
    return () => { unsub1(); unsub2() }
  }, [smoothX, smoothY, blob1Left, blob1Top, blob2Left, blob2Top])

  return (
    <section
      id="produto"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative px-6 pt-10 pb-6 md:pt-20 md:pb-8 max-w-5xl mx-auto text-center"
      style={{ isolation: 'isolate' }}
    >
      <NeuronBackground />
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 -z-20 opacity-[0.03] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      {/* Aurora blob — static on mobile, cursor-following on desktop */}
      <div className="md:hidden pointer-events-none absolute rounded-full opacity-20 blur-[80px]"
        style={{
          width: 400, height: 400,
          background: 'radial-gradient(circle, #2563EB 0%, transparent 65%)',
          zIndex: -1, left: '50%', top: '30%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <motion.div
        className="pointer-events-none absolute rounded-full opacity-25 blur-[130px] hidden md:block"
        style={{
          width: 650, height: 650,
          background: 'radial-gradient(circle, #2563EB 0%, transparent 65%)',
          zIndex: -1,
          left: blob1Left, top: blob1Top,
          translateX: '-50%', translateY: '-50%',
        }}
      />
      <motion.div
        className="pointer-events-none absolute rounded-full opacity-15 blur-[160px] hidden md:block"
        style={{
          width: 520, height: 520,
          background: 'radial-gradient(circle, #6366F1 0%, transparent 65%)',
          zIndex: -1,
          left: blob2Left, top: blob2Top,
          translateX: '-50%', translateY: '-50%',
        }}
      />

      <motion.h1
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={blurFade} custom={0}
        className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-4 text-zinc-100"
      >
        Transforme horas de estudo em{' '}
        <span className="text-blue-500">retenção permanente.</span>
      </motion.h1>

      <motion.p
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={blurFade} custom={1}
        className="text-lg text-zinc-400 mb-6 max-w-2xl mx-auto leading-relaxed"
      >
        O Axoniq transforma qualquer material de estudo em flashcards, quizzes e mapas mentais em segundos usando inteligência artificial clínica de ponta.
      </motion.p>

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={blurFade} custom={2}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        <button onClick={onJoinWaitlist} className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-all">
          Entrar na Lista de Espera
        </button>
        <a href="#como-funciona" className="w-full sm:w-auto px-8 py-4 text-blue-400 border border-blue-600/20 rounded-xl font-bold text-lg hover:bg-blue-600/5 transition-all text-center">
          Ver como funciona
        </a>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={blurFade} custom={3} className="mt-16">
        <FlashcardDemo onJoinWaitlist={onJoinWaitlist} />
      </motion.div>
    </section>
  )
}

export default function LandingPage() {

  const [mobileMenu, setMobileMenu] = useState(false)
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 selection:bg-blue-600 selection:text-white">
      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />

      {/* ── Navbar ── */}
      <nav className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Image src="/AxonIQ.png" alt="AxonIQ" width={120} height={32} className="h-8 w-auto object-contain" />
          </div>

          <div className="hidden md:flex gap-8 items-center">
            <a href="#produto" className="text-blue-500 font-semibold hover:text-blue-400 transition-colors">Produto</a>
            <a href="#funcionalidades" className="text-zinc-400 hover:text-blue-500 transition-colors">Funcionalidades</a>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsWaitlistOpen(true)} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-blue-500 active:scale-95 transition-all">
              Lista de Espera
            </button>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400">
              <MaterialIcon name={mobileMenu ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        {mobileMenu && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="md:hidden px-6 pb-4 flex flex-col gap-3 border-t border-zinc-800">
            <a href="#produto" onClick={() => setMobileMenu(false)} className="py-2 text-zinc-300 font-medium">Produto</a>
            <a href="#funcionalidades" onClick={() => setMobileMenu(false)} className="py-2 text-zinc-300 font-medium">Funcionalidades</a>
          </motion.div>
        )}
      </nav>

      <main className="pt-24 overflow-x-hidden">

        {/* ── Hero ── */}
        <AuroraHero onJoinWaitlist={() => setIsWaitlistOpen(true)} />

        {/* ── Informações do Beta ── */}
        <section className="bg-zinc-900 py-12 border-y border-zinc-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {[
                { value: '10x', label: 'Mais rápido que resumir' },
                { value: '+90%', label: 'Retenção focada' },
                { value: '100%', label: 'Gratuito no período Beta' },
              ].map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="text-3xl font-bold text-zinc-100">{s.value}</div>
                  <div className="text-sm text-zinc-500 font-medium uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The Problem ── */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-zinc-100">Você leu 40 páginas ontem. Quanto ainda lembra?</h2>
              <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                A Curva do Esquecimento de Ebbinghaus prova que perdemos até 70% da informação nas primeiras 24 horas se não houver repetição espaçada. O Axoniq impede essa perda.
              </p>
              <ul className="space-y-4">
                {['Resumos passivos que não geram memória', 'Perda de tempo formatando flashcards', 'Sensação de estar "correndo e não saindo do lugar"'].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-zinc-300">
                    <MaterialIcon name="cancel" className="text-red-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-xl">
              <div className="mb-4 flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Análise de Retenção</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded">Otimizado por IA</span>
              </div>
              <div className="w-full h-48 sm:h-64 relative">
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  <path d="M 0 20 Q 50 180 380 190" fill="none" stroke="#EF4444" strokeDasharray="5,5" strokeWidth="3" />
                  <path d="M 0 20 C 50 20, 80 40, 100 40 S 130 30, 160 30 S 190 50, 220 50 S 250 40, 300 40 S 350 45, 400 45" fill="none" stroke="#10B981" strokeWidth="4" />
                  <circle cx="0" cy="20" fill="#2563EB" r="5" />
                  <text fill="#3B82F6" fontFamily="monospace" fontSize="10" x="10" y="15">Aula Assistida</text>
                  <text fill="#EF4444" fontFamily="monospace" fontSize="10" x="280" y="180">Esquecimento Comum</text>
                  <text fill="#10B981" fontFamily="monospace" fontSize="10" x="250" y="25">Retenção Axoniq</text>
                </svg>
              </div>
              <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center justify-around">
                <div className="text-center"><div className="text-2xl font-bold text-zinc-100">94%</div><div className="text-[10px] text-zinc-500 uppercase">Retenção 30d</div></div>
                <div className="w-px h-8 bg-zinc-700" />
                <div className="text-center"><div className="text-2xl font-bold text-red-500">12%</div><div className="text-[10px] text-zinc-500 uppercase">Método Tradicional</div></div>
              </div>
            </motion.div>
          </div>
        </section>
        <section className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left Column: Text Content */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                A solução
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-8 text-zinc-100 leading-tight">
                Conheça o <span className="text-blue-500">Axoniq</span>
              </h2>
              <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
                O ecossistema de estudos que elimina o ruído e entrega apenas o que funciona. Baseado em neurociência para acelerar sua aprovação.
              </p>
              
              <div className="space-y-8">
                {[
                  { icon: 'bolt', title: 'Geração instantânea', desc: 'Envie PDFs, slides ou vídeos. O AxonIQ transforma tudo em flashcards, quizzes e mapas mentais em segundos.' },
                  { icon: 'neurology', title: 'Retenção baseada em ciência', desc: 'Algoritmo de repetição espaçada que combate a Curva do Esquecimento automaticamente.' },
                  { icon: 'folder_managed', title: 'Tudo no lugar certo', desc: 'Matérias, revisões e progresso organizados sem você precisar pensar nisso.' },
                ].map((feature, i) => (
                  <motion.div 
                    key={feature.title} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/20">
                      <MaterialIcon name={feature.icon} className="text-blue-500 text-xl" />
                    </div>
                    <div>
                      <h4 className="text-zinc-100 font-bold mb-1">{feature.title}</h4>
                      <p className="text-zinc-500 text-sm">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Column: Orbit Animation */}
            <div className="relative h-[400px] md:h-[500px] flex items-center justify-center">
              {/* Concentric Circles */}
              {[350, 240, 140].map((size, i) => (
                <div 
                  key={size}
                  className="absolute rounded-full border border-zinc-800/50"
                  style={{ width: size, height: size }}
                />
              ))}
              
              {/* Central Logo */}
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-32 h-32 md:w-44 md:h-44 z-10"
              >
                <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-full" />
                <Image src="/AxonIQ.png" alt="Axoniq Logo" fill className="object-contain" />
              </motion.div>

              {/* Orbiting Pills (Static with float) */}
              <OrbitPill angle={75} radius={175} label="Repetição Espaçada" icon="psychology" />
              <OrbitPill angle={210} radius={120} label="Active Recall" icon="neurology" delay={1} />
              <OrbitPill angle={330} radius={120} label="Simples" icon="check_circle" delay={2} />
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="como-funciona" className="bg-zinc-950 py-32 px-6 relative overflow-hidden">
          {/* Subtle background line only on desktop */}
          <div className="hidden md:block absolute top-[44.5%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent z-0" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <motion.h2 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={blurFade} custom={0}
                className="text-3xl md:text-5xl font-bold mb-6 text-zinc-100"
              >
                Simples assim
              </motion.h2>
              <motion.p 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={blurFade} custom={1}
                className="text-zinc-500 max-w-xl mx-auto text-lg"
              >
                Sua rotina de estudos em três passos simples e automatizados.
              </motion.p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10">
              {howItWorks.map((item, i) => (
                <motion.div 
                  key={item.title} 
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className="relative pt-6"
                >
                  {/* Number Badge */}
                  <div className="absolute top-0 left-8 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white z-20 border-[6px] border-zinc-950 shadow-xl">
                    0{i + 1}
                  </div>

                  <Tilt className="h-full">
                    <motion.div 
                      whileHover={{ y: -8, transition: { duration: 0.3 } }}
                      className="bg-zinc-900/40 backdrop-blur-sm p-10 rounded-[2rem] border border-zinc-800 h-full group hover:bg-zinc-900/60 transition-all duration-500"
                    >
                      <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-8 shadow-inner ring-1 ring-white/5 group-hover:scale-110 group-hover:bg-blue-600/10 transition-all">
                        <MaterialIcon name={item.icon} className="text-blue-500 text-3xl group-hover:text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-zinc-100 tracking-tight">{item.title}</h3>
                      <p className="text-zinc-400 leading-relaxed text-base font-medium">
                        {item.desc}
                      </p>
                    </motion.div>
                  </Tilt>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bento Features ── */}
        <section id="funcionalidades" className="py-24 px-6 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-zinc-100">O ecossistema definitivo para o estudante de Medicina</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:min-h-[600px]">

            <Tilt className="md:col-span-2 md:row-span-1">
              <div className="h-full bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MaterialIcon name="style" className="text-blue-500" fill />
                    <span className="font-bold text-zinc-100">Flashcards Inteligentes</span>
                  </div>
                  <p className="text-sm text-zinc-400">Algoritmo de Active Recall que prioriza o que você mais esquece.</p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="mt-6 rounded-xl h-32 w-full object-cover" alt="Estudante usando flashcards digitais" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhX_SzKThYPkjrmVpKB-vtGk20s3GbLqyvC9DtGn2vhBuqCXjsDdLYUnrB-0ubWbuPMrm2AoyklDihzuYamPUO-N2qCJtbhHNwUgej69IhzDdtxA4ZgAphFsxvSkIjIeYOeKrpmsJOIjeHq7E7be_gCLW_fF5UDHtWnFlqhXz9iem0y2a_ulGyquCqL73gQmLJMYwEt2ifpKcyXqn9inMCF_DGF8q98x8AJUWPRO4Fw7jbTC9k3CQZkHgLmtgTQi4xh6A6DJp31IqZ" />
              </div>
            </Tilt>

            <Tilt className="md:col-span-1 md:row-span-2">
              <div className="h-full bg-blue-600 p-8 rounded-3xl text-white flex flex-col justify-between group overflow-hidden relative">
                <div className="z-10">
                  <MaterialIcon name="quiz" className="mb-4 text-3xl" />
                  <h3 className="text-xl font-bold mb-4 leading-tight">Quiz Interativo &amp; Questões de Residência</h3>
                  <p className="text-white/80 text-sm">Simule provas reais com feedback imediato baseado no material que você subiu.</p>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-500">
                  <MaterialIcon name="assignment" className="text-[120px]" />
                </div>
              </div>
            </Tilt>

            <Tilt className="md:col-span-1 md:row-span-1">
              <div className="h-full bg-zinc-900 p-8 rounded-3xl border border-zinc-800 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 bg-blue-500 text-[10px] font-bold rounded mb-2 text-white">ULTRA BADGE</span>
                  <h3 className="text-lg font-bold text-zinc-100">Mapa Mental</h3>
                  <p className="text-zinc-400 text-xs mt-1">Geração visual automática de conexões entre doenças e tratamentos.</p>
                </div>
                <div className="mt-4 flex gap-1">
                  <div className="h-1 w-full bg-blue-500 rounded-full" />
                  <div className="h-1 w-1/2 bg-zinc-700 rounded-full" />
                </div>
              </div>
            </Tilt>

            <Tilt className="md:col-span-2 md:row-span-1">
              <div className="h-full bg-zinc-800/50 p-8 rounded-3xl border border-zinc-700/20 flex gap-6 items-center">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-zinc-100">Análise de Desempenho</h3>
                  <p className="text-zinc-400 text-sm">Heatmaps e métricas de proficiência por especialidade clínica.</p>
                </div>
                <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center shrink-0">
                  <div className="relative w-20 h-20 md:w-24 md:h-24 border-8 border-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-zinc-100">88%</span>
                  </div>
                </div>
              </div>
            </Tilt>

            <Tilt className="md:col-span-1 md:row-span-1">
              <div className="h-full bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-sm">
                <MaterialIcon name="folder_managed" className="text-blue-500 mb-3" />
                <h3 className="font-bold text-zinc-100">Organização Automática</h3>
                <p className="text-xs text-zinc-400 mt-2">Pastas inteligentes por disciplina: GO, Pediatria, Clínica e mais.</p>
              </div>
            </Tilt>
          </div>
        </section>

        {/* ── Science ── */}
        <section className="bg-[#18181B] py-24 px-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <svg fill="none" height="100%" viewBox="0 0 400 400" width="100%">
              <circle cx="400" cy="0" r="400" stroke="white" strokeWidth="1" />
              <circle cx="400" cy="0" r="300" stroke="white" strokeWidth="1" />
              <circle cx="400" cy="0" r="200" stroke="white" strokeWidth="1" />
            </svg>
          </div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">Ciência no núcleo do seu aprendizado.</h2>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-blue-400 mb-2 flex items-center gap-2"><MaterialIcon name="bolt" /> Active Recall</h3>
                    <p className="text-zinc-400 leading-relaxed">Em vez de ler passivamente, forçamos seu cérebro a recuperar a informação. Isso cria conexões neurais muito mais fortes e duradouras.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-400 mb-2 flex items-center gap-2"><MaterialIcon name="schedule" /> Spaced Repetition</h3>
                    <p className="text-zinc-400 leading-relaxed">Nossa IA agenda suas revisões no momento exato em que você começaria a esquecer, garantindo eficiência máxima no seu tempo de estudo.</p>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 grid grid-cols-2 gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="rounded-2xl h-48 md:h-64 w-full object-cover" alt="Microscópio científico" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjKWlbfQBazSRm9_GK5SCAgrKpJ9gJN4UgWATKtxdMfhFa03Su1YjTnqtng08ssPYgCQO9hZIgS3HQ3rl6vfxJiqgIPoaLU8zMILpXS6ZsOSmEC1tVGuVkns4n7m14Ar_en7ZKOMJfzedACEiylTIoqtjz_eHTwJAuSW21hvXvYf4dfoDGBfffQvSrll2O4lA2bogsngOa54z9Nt2sdocS5mGdf4ThfU1cMfUFGwxrmWxbSLzRqZhxsgHxI-taFI4casLgWyr5vVDa" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="rounded-2xl h-48 md:h-64 w-full object-cover mt-8" alt="Cérebro neural" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxRndBB0TFn2lNAGYJ27ynV_uID0Uroj5cZaury6xFdNLcW6eetXxdfk9Z7qS-jDrMFchmbqHz34l-jEPjNUzBI8vcyRpWJCwb4pt28-OAO9dX7DXdxb8ZmDJAMyDLvC7Kw_1Xqsdl-B4EqYwAVkkO1q925VDA0GbJwKUadtaJRERUDIwqhP_tdmddvrH4sxXEvEUPYCKjKruvKsyUiCYCTPTEaAyXXn_4U6toSn_zN1gRe23RL_-nbuSdIr4M4X5CrRWGcm2V_k2q" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials (Oculto para Lançamento) ── */}
        {/*
        <section className="bg-zinc-900 py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 text-zinc-100">Quem usa o Axoniq, aprova.</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
                  className="bg-zinc-800 p-8 rounded-2xl border border-zinc-700">
                  <div className="flex text-amber-500 mb-4">{Array.from({ length: 5 }).map((_, i) => <MaterialIcon key={i} name="star" fill />)}</div>
                  <p className="text-zinc-300 mb-6 italic">{t.text}</p>
                  <div className="flex items-center gap-4">
                    <img className="w-12 h-12 rounded-full object-cover" alt={t.name} src={t.img} />
                    <div>
                      <div className="font-bold text-zinc-100">{t.name}</div>
                      <div className="text-xs text-zinc-500">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        */}

        {/* ── Plans (Oculto para Lançamento) ── */}
        {/*
        <section id="planos" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-100">Escolha seu nível de domínio</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-end">

            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 flex flex-col h-full">
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-2 text-zinc-100">Iniciante</h3>
                <div className="text-4xl font-extrabold mb-2 text-zinc-100">R$ 0</div>
                <p className="text-xs text-zinc-500">Para sentir o poder da IA.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['5 uploads de arquivos/mês', '100 flashcards gerados', 'App Mobile (Beta)'].map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-zinc-300"><MaterialIcon name="check" className="text-emerald-400 text-lg" /> {f}</li>
                ))}
              </ul>
              <Link href="/login" className="w-full py-3 border border-blue-500 text-blue-400 rounded-xl font-bold hover:bg-blue-600/5 transition-all text-center block">Criar conta grátis</Link>
            </div>

            <div className="bg-zinc-900 p-8 rounded-3xl border-2 border-blue-600 shadow-2xl relative flex flex-col md:scale-105 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">Mais Popular</div>
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-2 text-zinc-100">Profissional</h3>
                <div className="text-4xl font-extrabold mb-2 text-zinc-100">R$ 19,90<span className="text-sm text-zinc-500 font-normal">/mês</span></div>
                <p className="text-xs text-zinc-500">O essencial para sua aprovação.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Uploads ilimitados', 'Flashcards infinitos', 'Quiz de Questões Reais', 'Relatórios de performance semanal'].map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-zinc-300"><MaterialIcon name="check" className="text-emerald-400 text-lg" /> {f}</li>
                ))}
              </ul>
              <Link href="/login" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-all text-center block">Assinar agora</Link>
            </div>

            <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 flex flex-col h-full">
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-2 text-zinc-100">Ultra</h3>
                <div className="text-4xl font-extrabold mb-2 text-zinc-100">R$ 39,90<span className="text-sm text-zinc-500 font-normal">/mês</span></div>
                <p className="text-xs text-zinc-500">Para os 1% mais competitivos.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Tudo do Plano Pro', 'Mapas Mentais Gerados por IA', 'Prioridade no Processamento', 'Suporte Individual 24h'].map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-zinc-300"><MaterialIcon name="check" className="text-blue-400 text-lg" /> {f}</li>
                ))}
              </ul>
              <Link href="/login" className="w-full py-3 bg-zinc-800 text-zinc-100 rounded-xl font-bold hover:bg-zinc-700 transition-all text-center block">Quero ser Ultra</Link>
            </div>
          </div>
        </section>
        */}

        {/* ── FAQ ── */}
        <section className="bg-zinc-900 py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-zinc-100">Dúvidas Frequentes</h2>
            <div className="space-y-4">
              <FAQItem question="Por que entrar na lista de espera agora?" answer="As vagas iniciais são limitadas para garantirmos a melhor experiência. Quem estiver na lista terá acesso antecipado exclusivo e condições comerciais especiais (desconto de fundador) no lançamento oficial." defaultOpen />
              <FAQItem question="É totalmente gratuito para entrar na lista?" answer="Sim, a inscrição é 100% gratuita. Você não precisa cadastrar nenhum cartão de crédito e não assume nenhum compromisso financeiro ao garantir seu lugar." />
              <FAQItem question="O Axoniq serve do Ciclo Básico até a prova de Residência?" answer="Com certeza. A plataforma adapta a profundidade do conteúdo com base no material que você envia. O Axoniq estrutura desde resumos de anatomia para o Ciclo Básico até guidelines complexos de Clínica Médica para o Internato e Residência." />
              <FAQItem question="Meus PDFs e resumos enviados estão seguros?" answer="Absolutamente. Seus materiais são isolados e protegidos na plataforma. Nós não utilizamos os PDFs das suas aulas ou resumos para treinar modelos abertos; só você tem acesso ao que sobe no Axoniq." />
              <FAQItem question="Como vou saber quando minha conta for liberada?" answer="Assim que a plataforma estiver pronta para receber sua turma, enviaremos um convite exclusivo direto para o e-mail e WhatsApp cadastrados na lista de espera, contendo todas as instruções de acesso." />
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-blue-600 rounded-[2.5rem] p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
                <path d="M0 100 C 20 0 50 0 100 100" fill="none" stroke="white" strokeWidth="0.5" />
                <path d="M0 80 C 30 20 60 20 100 80" fill="none" stroke="white" strokeWidth="0.5" />
              </svg>
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">A aprovação começa com o material de hoje.</h2>
              <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">Inscreva-se na lista de espera exclusiva e tenha acesso antecipado à plataforma que revoluciona o estudo médico.</p>
              <button onClick={() => setIsWaitlistOpen(true)} className="inline-block bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold text-xl hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all">
                Garantir Acesso Antecipado
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-zinc-950 text-zinc-400 py-16 px-6 border-t border-zinc-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="text-zinc-100 font-bold text-2xl flex items-center gap-1 tracking-tight">Axoniq<span className="text-blue-500">.</span></div>
            <p className="text-sm leading-relaxed">A primeira inteligência artificial clínica dedicada ao domínio absoluto da medicina brasileira.</p>
          </div>
          <div>
            <h4 className="text-zinc-100 font-bold mb-6">Produto</h4>
            <ul className="space-y-4 text-sm">
              <li><a className="hover:text-zinc-100 transition-colors" href="#como-funciona">Como funciona</a></li>
              <li><a className="hover:text-zinc-100 transition-colors" href="#funcionalidades">Flashcards</a></li>
              <li><a className="hover:text-zinc-100 transition-colors" href="#funcionalidades">Mapas Mentais</a></li>
              <li><a className="hover:text-zinc-100 transition-colors" href="#funcionalidades">Residência</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-zinc-100 font-bold mb-6">Empresa</h4>
            <ul className="space-y-4 text-sm">
              <li><a className="hover:text-zinc-100 transition-colors" href="#">Sobre nós</a></li>
              <li><a className="hover:text-zinc-100 transition-colors" href="#">Carreiras</a></li>
              <li><a className="hover:text-zinc-100 transition-colors" href="#">Blog Clínico</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-zinc-100 font-bold mb-6">Jurídico</h4>
            <ul className="space-y-4 text-sm">
              <li><Link className="hover:text-zinc-100 transition-colors" href="/terms">Termos de Uso</Link></li>
              <li><Link className="hover:text-zinc-100 transition-colors" href="/privacy">Privacidade</Link></li>
              <li><a className="hover:text-zinc-100 transition-colors" href="#">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-zinc-800 text-center text-xs max-w-7xl mx-auto font-mono">
          © 2026 Axoniq. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
