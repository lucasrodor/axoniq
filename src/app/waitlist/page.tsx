'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
// import { Metadata } from 'next'

// export const metadata: Metadata = {
//   title: 'Lista de Espera | AxonIQ',
//   description: 'Garanta seu acesso antecipado ao futuro do estudo médico. Cadastre-se na nossa lista de espera.',
// }

// --- Visual Helpers (Reused from Main LP) ---

function NeuronBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-[0.03]">
      <motion.div 
        animate={{ y: [0, -30, 0], rotate: [0, 10, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[8%] left-[5%] w-[400px] h-[400px] opacity-80"
      >
        <Image src="/neuronio.svg" alt="Neuron Asset" fill className="object-contain brightness-125 grayscale invert" />
      </motion.div>

      <motion.div 
        animate={{ y: [0, 40, 0], rotate: [0, -15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[10%] right-[3%] w-[500px] h-[500px] opacity-60"
      >
        <Image src="/neuronio.svg" alt="Neuron Asset" fill className="object-contain brightness-150 grayscale invert" />
      </motion.div>

      <motion.div 
        animate={{ x: [-20, 20, -20], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] left-[2%] w-[250px] h-[250px] opacity-40 blur-[1px]"
      >
        <Image src="/neuronio.svg" alt="Neuron Asset" fill className="object-contain grayscale invert" />
      </motion.div>

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

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const sectionRef = useRef<HTMLElement>(null)
  const rawX = useMotionValue(0.5)
  const rawY = useMotionValue(0.5)

  const smoothX = useSpring(rawX, { stiffness: 40, damping: 25, mass: 1.2 })
  const smoothY = useSpring(rawY, { stiffness: 40, damping: 25, mass: 1.2 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    rawX.set((e.clientX - rect.left) / rect.width)
    rawY.set((e.clientY - rect.top) / rect.height)
  }, [rawX, rawY])

  const blob1Left = useMotionValue('50%')
  const blob1Top  = useMotionValue('40%')
  const blob2Left = useMotionValue('55%')
  const blob2Top  = useMotionValue('50%')

  useEffect(() => {
    document.title = 'Lista de Espera | AxonIQ'
  }, [])

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

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1')
    }
    return digits.slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      alert('Por favor, insira um telefone válido com DDD.')
      return
    }

    setStatus('loading')
    
    const { error } = await supabase.from('waitlist_leads').insert({
      name, email, phone: phoneDigits
    })

    if (error) {
      console.error('Erro detalhado do Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      if (error.code !== '23505') {
        alert(`Erro (${error.code}): ${error.message}`)
        setStatus('idle')
        return
      }
    }

    setStatus('success')
  }

  return (
    <div className="h-screen w-full bg-[#09090B] text-zinc-100 selection:bg-blue-600 selection:text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Layer */}
      <section 
        ref={sectionRef}
        onMouseMove={handleMouseMove}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ isolation: 'isolate' }}
      >
        <NeuronBackground />
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 -z-20 opacity-[0.03] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />

        {/* Aurora blobs */}
        <motion.div
          className="absolute rounded-full opacity-20 blur-[130px]"
          style={{
            width: 800,
            height: 800,
            background: 'radial-gradient(circle, #2563EB 0%, transparent 65%)',
            zIndex: -1,
            left: blob1Left,
            top: blob1Top,
            translateX: '-50%',
            translateY: '-50%',
          }}
        />
        <motion.div
          className="absolute rounded-full opacity-10 blur-[160px]"
          style={{
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, #6366F1 0%, transparent 65%)',
            zIndex: -1,
            left: blob2Left,
            top: blob2Top,
            translateX: '-50%',
            translateY: '-50%',
          }}
        />
      </section>

      {/* Main Content Area */}
      <div className="w-full max-w-lg z-20 flex flex-col items-center">
        {/* Logo inline instead of fixed to avoid overlap */}
        <div className="mb-10">
          <Link href="/">
            <Image 
              src="/AxonIQ.png" 
              alt="AxonIQ" 
              width={240} 
              height={60} 
              className="h-16 sm:h-20 w-auto object-contain cursor-pointer opacity-95 hover:opacity-100 transition-opacity" 
            />
          </Link>
        </div>

        <motion.div
          initial="hidden" animate="visible" variants={blurFade} custom={0}
          className="text-center mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-zinc-100">
            Garanta seu lugar no <span className="text-blue-500 italic">futuro</span> do estudo médico.
          </h1>
          <p className="text-base text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Estamos finalizando o acesso antecipado. Deixe seus dados abaixo para ser um dos primeiros.
          </p>
        </motion.div>

        <motion.div
           initial="hidden" animate="visible" variants={blurFade} custom={1}
           className="relative w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-md"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full pointer-events-none" />

          {status === 'success' ? (
            <div className="text-center py-6 relative z-10 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <MaterialIcon name="check" className="text-3xl font-bold" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-100 mb-2 tracking-tight">Você está na lista!</h3>
              <p className="text-zinc-400 text-base leading-relaxed">
                Enviaremos as instruções de acesso para o seu e-mail e WhatsApp em breve.
              </p>
              <Link href="/">
                <button className="mt-8 w-full py-3 bg-zinc-800 text-zinc-100 font-bold rounded-xl hover:bg-zinc-700 transition-all active:scale-95">
                  Voltar para Home
                </button>
              </Link>
            </div>
          ) : (
            <div className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Seu Nome</label>
                  <input 
                    type="text" required
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Mariana Silva"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500 transition-all text-base"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">E-mail Profissional</label>
                  <input 
                    type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500 transition-all text-base"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input 
                    type="tel" required
                    value={phone} onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    pattern="\(\d{2}\)\s\d{4,5}-\d{4}"
                    title="Formato esperado: (11) 99999-9999"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500 transition-all text-base font-medium font-mono"
                  />
                </div>
                
                <button 
                  type="submit" disabled={status === 'loading'}
                  className="w-full py-4 mt-2 bg-blue-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-blue-500 transition-all disabled:opacity-70"
                >
                  {status === 'loading' ? (
                    <MaterialIcon name="sync" className="animate-spin text-xl" />
                  ) : (
                    <>
                      <span>Entrar na Lista de Espera</span>
                      <MaterialIcon name="arrow_forward" className="text-lg" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </motion.div>

        {/* Compact Footer info */}
        <motion.div 
           initial="hidden" animate="visible" variants={blurFade} custom={2}
           className="mt-8 text-center"
        >
          <div className="flex items-center justify-center gap-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <MaterialIcon name="verified" className="text-blue-500 text-xs" />
              <span>Beta Gratuito</span>
            </div>
            <div className="w-1 h-1 bg-zinc-800 rounded-full" />
            <div className="flex items-center gap-1.5">
              <MaterialIcon name="bolt" className="text-blue-500 text-xs" />
              <span>Vagas Limitadas</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative neuron at bottom corners */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#09090B] to-transparent pointer-events-none" />
    </div>
  )
}
