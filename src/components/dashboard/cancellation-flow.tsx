'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Crown, AlertTriangle, ChevronRight, X, MessageSquare, HeartOff, ZapOff, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CancellationFlowProps {
  isOpen: boolean
  isKirvano?: boolean
  onClose: () => void
  onConfirm: (reason: string, feedback: string) => void
}

const reasons = [
  { id: 'too-expensive', label: 'Achei o preço muito alto', icon: '💰' },
  { id: 'not-using', label: 'Não estou usando o suficiente', icon: '⏳' },
  { id: 'missing-features', label: 'Faltam funcionalidades que eu preciso', icon: '🛠️' },
  { id: 'bugs', label: 'Encontrei muitos erros ou bugs', icon: '🐛' },
  { id: 'other', label: 'Outro motivo', icon: '📝' },
]

export function CancellationFlow({ isOpen, isKirvano, onClose, onConfirm }: CancellationFlowProps) {
  const [step, setStep] = useState(1)
  const [selectedReason, setSelectedReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNext = () => {
    if (step === 1 && selectedReason) setStep(2)
  }

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm(selectedReason, feedback)
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg glass-panel border border-zinc-800/50 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                  <HeartOff size={20} />
                </div>
                <h2 className="text-xl font-bold text-zinc-100">Gerenciar Assinatura</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <h3 className="text-2xl font-black text-zinc-100 tracking-tight">Poxa, que pena que quer nos deixar! 😢</h3>
                    <p className="text-zinc-400 text-sm">Poderia nos contar o motivo do cancelamento? Isso nos ajuda muito a melhorar.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mt-8">
                    {reasons.map((reason) => (
                      <button
                        key={reason.id}
                        onClick={() => setSelectedReason(reason.id)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
                          selectedReason === reason.id
                            ? "bg-blue-600/10 border-blue-500 text-zinc-100"
                            : "bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        )}
                      >
                        <span className="text-2xl">{reason.icon}</span>
                        <span className="font-bold text-sm flex-1">{reason.label}</span>
                        <div className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                          selectedReason === reason.id ? "border-blue-500 bg-blue-500" : "border-zinc-700"
                        )}>
                          {selectedReason === reason.id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  <Button
                    disabled={!selectedReason}
                    onClick={handleNext}
                    className="w-full py-7 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/10 mt-4 bg-zinc-100 text-zinc-900 hover:bg-white"
                  >
                    Continuar para Cancelamento
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500 mb-4 animate-pulse">
                      <Sparkles size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-zinc-100 tracking-tight">O AxonIQ está evoluindo rápido!</h3>
                    <p className="text-zinc-400 text-sm">
                      Temos atualizações semanais e novos modelos de IA chegando. Tem certeza que quer perder o acesso ilimitado?
                    </p>
                  </div>

                  <div className="space-y-4 mt-8">
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block px-1">Mensagem adicional (Opcional)</label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Algo que possamos fazer para você ficar?"
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 min-h-[100px] resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-8">
                    <Button
                      onClick={onClose}
                      className="w-full py-7 rounded-2xl font-black text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20"
                    >
                      Manter Minha Assinatura
                    </Button>
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="w-full py-4 text-zinc-500 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? 'Processando...' : 'Confirmar e ir para o Portal'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
