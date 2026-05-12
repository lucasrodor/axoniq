'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Zap, ChevronRight, Flame, X } from 'lucide-react'

const DISMISS_KEY = 'axoniq_lifetime_offer_dismissed_v1'

// ---------- Pre-launch banner (isLaunchWeek = true) ----------
// Same visual as the original LaunchCountdownBanner

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function PreLaunchBanner() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const targetDate = new Date('2026-05-12T02:59:00Z').getTime() // 11/05 23:59 BRT

  useEffect(() => {
    const tick = () => {
      const distance = targetDate - Date.now()
      if (distance < 0) { setTimeLeft(null); return }
      setTimeLeft({
        days: Math.floor(distance / 86400000),
        hours: Math.floor((distance % 86400000) / 3600000),
        minutes: Math.floor((distance % 3600000) / 60000),
        seconds: Math.floor((distance % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!timeLeft) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full mb-6 sm:mb-8 group"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-blue-600/10 rounded-2xl sm:rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

      <div className="relative glass-panel rounded-2xl sm:rounded-[2rem] border-blue-500/30 overflow-hidden bg-zinc-950/40 backdrop-blur-2xl">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-pulse" />

        <div className="p-3 sm:p-5 lg:p-6 xl:p-8 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4 lg:gap-8">
          {/* Left: icon + text */}
          <div className="flex flex-row items-center gap-3 sm:gap-4 lg:gap-6 text-left w-full lg:max-w-none flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-12 lg:w-14 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                <Crown size={20} className="text-blue-400 sm:w-6 lg:w-8 animate-bounce" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full animate-ping" />
              </div>
            </div>

            <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base lg:text-xl font-black text-white tracking-tight uppercase italic truncate">
                  Oferta Pré-Lançamento
                </h3>
                <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[7px] sm:text-[9px] font-black uppercase tracking-widest rounded-full shrink-0">VIP</span>
              </div>
              <p className="text-blue-200/60 text-[10px] sm:text-xs lg:text-sm font-medium leading-tight truncate">
                Acesso Pro até o lançamento oficial. Garanta agora!
              </p>
            </div>
          </div>

          {/* Right: countdown */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 bg-zinc-900/30 p-2 sm:p-3 rounded-2xl border border-white/5 shadow-2xl relative group/timer shrink-0 max-w-full">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/timer:opacity-100 transition-opacity" />
            <TimeUnit value={timeLeft.days} label="DIAS" />
            <TimeSep />
            <TimeUnit value={timeLeft.hours} label="HORAS" />
            <TimeSep />
            <TimeUnit value={timeLeft.minutes} label="MIN" />
            <TimeSep />
            <TimeUnit value={timeLeft.seconds} label="SEG" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-blue-600/10 border-t border-blue-500/20 p-2 sm:p-2.5 px-4 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest">
            <Zap size={10} className="sm:w-3 sm:h-3 animate-pulse" />
            Oferta exclusiva de pré-lançamento
          </div>
          <a
            href="#"
            className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-white bg-blue-600 hover:bg-blue-500 px-3 py-1 sm:px-4 sm:py-1 rounded-full transition-all hover:scale-105 active:scale-95 uppercase tracking-wider"
          >
            Quero Oferta <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[28px] sm:min-w-[40px] lg:min-w-[50px] relative z-10 shrink-0">
      <div className="text-sm sm:text-lg lg:text-2xl font-black text-white tabular-nums tracking-tighter leading-none mb-0.5">
        {value < 10 ? `0${value}` : value}
      </div>
      <div className="text-[5px] sm:text-[7px] lg:text-[8px] font-black text-blue-500 tracking-[0.1em]">{label}</div>
    </div>
  )
}

function TimeSep() {
  return <div className="h-3 sm:h-5 w-[1px] bg-white/10 shrink-0" />
}

// ---------- Post-launch banner (isLaunchWeek = false) ----------
// Amber lifetime offer, dismissible per user

function LifetimeOfferBanner() {
  const [visible, setVisible] = useState(true)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const targetDate = new Date('2026-05-20T03:00:00Z').getTime() // 19/05 23:59 BRT

  useEffect(() => {
    const tick = () => {
      const distance = targetDate - Date.now()
      if (distance < 0) { setTimeLeft(null); return }
      setTimeLeft({
        days: Math.floor(distance / 86400000),
        hours: Math.floor((distance % 86400000) / 3600000),
        minutes: Math.floor((distance % 3600000) / 60000),
        seconds: Math.floor((distance % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!timeLeft) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="relative w-full mb-6 sm:mb-8 group"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-amber-600/10 rounded-2xl sm:rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

          <div className="relative rounded-2xl sm:rounded-[2rem] overflow-hidden bg-zinc-950/60 backdrop-blur-2xl border border-amber-500/30">
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

            <div className="p-3 sm:p-5 lg:p-6 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4 lg:gap-8">
              {/* Left: icon + text */}
              <div className="flex flex-row items-center gap-3 sm:gap-4 text-left w-full flex-1 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 sm:w-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                    <Crown size={20} className="text-amber-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                  </div>
                </div>

                <div className="space-y-0.5 flex-1 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm sm:text-base lg:text-xl font-black text-white tracking-tight uppercase italic truncate">
                      Oferta de Lançamento
                    </h3>
                    <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[7px] sm:text-[9px] font-black uppercase tracking-widest rounded-full shrink-0">Vitalício</span>
                  </div>
                  <p className="text-amber-200/60 text-[10px] sm:text-xs font-medium leading-tight truncate">
                    R$ 336 à vista ou 10x R$ 40 · Pague uma vez, use para sempre.
                  </p>
                </div>
              </div>

              {/* Right: countdown + CTA + close */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-center">
                {/* Countdown */}
                <div className="flex items-center gap-1 sm:gap-2 bg-zinc-900/40 p-2 sm:p-3 rounded-2xl border border-amber-500/10 relative group/timer">
                  <AmberTimeUnit value={timeLeft.days} label="DIAS" />
                  <AmberTimeSep />
                  <AmberTimeUnit value={timeLeft.hours} label="HORAS" />
                  <AmberTimeSep />
                  <AmberTimeUnit value={timeLeft.minutes} label="MIN" />
                  <AmberTimeSep />
                  <AmberTimeUnit value={timeLeft.seconds} label="SEG" />
                </div>

                {/* CTA */}
                <a
                  href="https://pay.kirvano.com/25185e6c-b93f-4b75-986e-b3c2214e36e4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black rounded-xl whitespace-nowrap hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Garantir agora
                </a>

                {/* Close */}
                <button
                  onClick={() => setVisible(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="bg-amber-500/5 border-t border-amber-500/15 p-2 px-4 sm:px-6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-amber-500 uppercase tracking-widest">
                <Zap size={10} className="animate-pulse" />
                Oferta encerra em 20/05 · Pague uma vez, acesso para sempre
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AmberTimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[28px] sm:min-w-[36px] shrink-0">
      <div className="text-sm sm:text-lg font-black text-amber-400 tabular-nums tracking-tighter leading-none mb-0.5">
        {value < 10 ? `0${value}` : value}
      </div>
      <div className="text-[5px] sm:text-[7px] font-black text-amber-600 tracking-[0.1em]">{label}</div>
    </div>
  )
}

function AmberTimeSep() {
  return <div className="h-3 sm:h-5 w-[1px] bg-amber-500/20 shrink-0" />
}

// ---------- Main export ----------

import { useSubscription } from '@/hooks/useSubscription'

export function LaunchOfferBanner({ isLaunchWeek }: { isLaunchWeek: boolean }) {
  const { isPremium, isLoading } = useSubscription()

  // isLaunchWeek = true  → monetização DESATIVADA  → banner antigo pré-lançamento
  // isLaunchWeek = false → monetização ATIVADA     → banner amber oferta vitalícia (dismissível)
  
  // Se a assinatura ainda está sendo verificada ou se o usuário já é Pro, não exibe o banner
  if (isLoading || isPremium) return null
  
  return isLaunchWeek ? <PreLaunchBanner /> : <LifetimeOfferBanner />
}
