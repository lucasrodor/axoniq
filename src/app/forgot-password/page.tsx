'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar email.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Aurora Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-600/5 blur-[100px] rounded-full delay-700" />
      
      <div className="w-full max-w-sm relative z-10">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link href="/login">
            <button className="flex items-center gap-2 text-zinc-500 hover:text-zinc-100 transition-colors group">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                <ChevronLeft size={16} />
              </div>
              <span className="text-sm font-medium">Voltar ao portal</span>
            </button>
          </Link>
        </motion.div>

        {/* Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border border-zinc-800/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Logo Area */}
          <div className="flex flex-col items-center mb-8 text-center">
            <motion.img 
              src="/AxonIQ.png" 
              alt="Axoniq" 
              className="w-28 mb-8 opacity-90 transition-all hover:scale-105"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
            
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div 
                  key="sent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
                    <CheckCircle2 size={32} />
                  </div>
                  <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Email Enviado!</h1>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Se o email <strong className="text-zinc-300">{email}</strong> estiver cadastrado, você receberá 
                    instruções de recuperação em instantes.
                  </p>
                  <Link href="/login" className="block pt-4">
                    <Button variant="outline" className="w-full border-zinc-800 hover:bg-zinc-800 rounded-xl">
                      Ir para Login
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full space-y-6"
                >
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Esqueceu a senha?</h1>
                    <p className="text-zinc-500 text-sm">
                      Insira seu email clínico para receber o link de recuperação.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                        Endereço de Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                        <input
                          id="email"
                          type="email"
                          placeholder="nome@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#161618] border border-zinc-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 transition-all outline-none"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-400 flex items-center gap-2"
                      >
                        <AlertCircle size={14} />
                        {error}
                      </motion.div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] border-none flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={18} />
                          Enviar Recuperação
                        </>
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer info */}
        <p className="mt-8 text-[10px] text-zinc-600 text-center uppercase tracking-widest leading-relaxed">
          Axoniq Protection System • Recovery Control
        </p>
      </div>
    </div>
  )
}
