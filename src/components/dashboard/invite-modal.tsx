'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createAlphaUser } from '@/app/actions/admin-actions'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setStatus('idle')
      setErrorMsg('')
      setLoading(false)
    }
  }, [isOpen])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setLoading(true)
    setStatus('idle')
    
    try {
      const result = await createAlphaUser(email)
      if (result.success) {
        setStatus('success')
        setEmail('')
        // No auto-close here to let the admin read the message
      } else {
        setStatus('error')
        setErrorMsg(result.error || 'Erro ao criar acesso Alpha.')
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg('Ocorreu um erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800/50 rounded-3xl shadow-2xl p-8 pointer-events-auto relative overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Liberar Acesso VIP Alpha</h2>
                    <p className="text-sm text-zinc-500 mt-1">Fase 1: Full Access Trial (2026)</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-900/50 rounded-xl"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleInvite} className="space-y-6">
                  {!status || status !== 'success' ? (
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">
                        Email do Convidado
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="exemplo@email.com"
                          required
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 transition-all outline-none"
                        />
                      </div>
                    </div>
                  ) : null}

                  {status === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs"
                    >
                      <AlertCircle size={16} />
                      {errorMsg}
                    </motion.div>
                  )}

                  {status === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center gap-3 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 size={20} />
                        Acesso criado!
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">
                        Enviamos um email VIP para o convidado com os dados de acesso e uma senha temporária. Ele já pode logar imediatamente.
                      </p>
                      <Button 
                        onClick={onClose}
                        className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-none rounded-xl text-xs mt-2"
                      >
                        Fechar
                      </Button>
                    </motion.div>
                  )}

                  {status !== 'success' && (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 border-none"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={18} />
                          Gerar Acesso e Enviar Email
                        </>
                      )}
                    </Button>
                  )}
                </form>

                <p className="mt-6 text-[10px] text-zinc-600 text-center uppercase tracking-widest leading-relaxed">
                  Fluxo VIP Alpha: Criação direta via Admin API + Notificação Resend.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
