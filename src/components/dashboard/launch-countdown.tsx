'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Zap, ChevronRight } from 'lucide-react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function LaunchCountdownBanner({ onOpenWaitlist }: { onOpenWaitlist: () => void }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  
  const targetDate = new Date('2026-05-11T23:59:59-03:00').getTime()

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft(null)
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (!timeLeft) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full mb-6 sm:mb-8 group"
    >
      {/* Background Cinematic Glows */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-blue-600/10 rounded-2xl sm:rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="relative glass-panel rounded-2xl sm:rounded-[2rem] border-blue-500/30 overflow-hidden bg-zinc-950/40 backdrop-blur-2xl">
        {/* Animated Aurora Edge */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-pulse" />
        
        <div className="p-3 sm:p-5 lg:p-6 xl:p-8 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4 lg:gap-8">
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
                <h3 className="text-sm sm:text-base lg:text-xl font-black text-white tracking-tight uppercase italic truncate">Oferta Pré-Lançamento</h3>
                <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[7px] sm:text-[9px] font-black uppercase tracking-widest rounded-full shrink-0">VIP</span>
              </div>
              <p className="text-blue-200/60 text-[10px] sm:text-xs lg:text-sm font-medium leading-tight truncate">
                Acesso Pro até dia 11. 
                <span 
                  onClick={onOpenWaitlist}
                  className="text-blue-400 font-bold ml-1 underline decoration-blue-500/30 underline-offset-2 cursor-pointer hover:text-blue-300 transition-colors whitespace-nowrap"
                >
                  Garantir oferta →
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 bg-zinc-900/30 p-2 sm:p-3 rounded-2xl border border-white/5 shadow-2xl relative group/timer shrink-0 max-w-full">
             <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/timer:opacity-100 transition-opacity" />
             
             <TimeUnit value={timeLeft.days} label="DIAS" />
             <TimeSeparator />
             <TimeUnit value={timeLeft.hours} label="HORAS" />
             <TimeSeparator />
             <TimeUnit value={timeLeft.minutes} label="MIN" />
             <TimeSeparator />
             <TimeUnit value={timeLeft.seconds} label="SEG" isLast />
          </div>
        </div>

        {/* Action Bar - Slim */}
        <div className="bg-blue-600/10 border-t border-blue-500/20 p-2 sm:p-2.5 px-4 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest">
            <Zap size={10} className="sm:w-3 sm:h-3 animate-pulse" />
            Vence 11/05
          </div>
          <button 
            onClick={onOpenWaitlist}
            className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-white bg-blue-600 hover:bg-blue-500 px-3 py-1 sm:px-4 sm:py-1 rounded-full transition-all hover:scale-105 active:scale-95 uppercase tracking-wider"
          >
            Quero Oferta <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function TimeUnit({ value, label, isLast = false }: { value: number, label: string, isLast?: boolean }) {
  return (
    <div className="flex flex-col items-center min-w-[28px] sm:min-w-[40px] lg:min-w-[50px] relative z-10 shrink-0">
      <div className="text-sm sm:text-lg lg:text-2xl font-black text-white tabular-nums tracking-tighter leading-none mb-0.5">
        {value < 10 ? `0${value}` : value}
      </div>
      <div className="text-[5px] sm:text-[7px] lg:text-[8px] font-black text-blue-500 tracking-[0.1em]">{label}</div>
    </div>
  )
}

function TimeSeparator() {
  return (
    <div className="h-3 sm:h-5 w-[1px] bg-white/10 shrink-0" />
  )
}
