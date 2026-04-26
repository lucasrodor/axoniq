'use client'

import { motion } from 'framer-motion'
import { Crown, Zap, Lock, CheckCircle2, TrendingDown } from 'lucide-react'
import { createCheckoutSession } from '@/app/actions/stripe-actions'
import { useState } from 'react'

interface UpgradeGateProps {
  feature: string
  description?: string
  children?: React.ReactNode
}

const PLANS = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 'R$ 27,90',
    description: 'Flexibilidade total mês a mês',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || 'price_1TQ5rKDGo6c9XEzCjUnL9wb9',
    badge: null
  },
  {
    id: 'semiannual',
    name: 'Semestral',
    price: 'R$ 23,90',
    description: 'R$ 143,40 a cada 6 meses',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SEMIANNUAL || 'price_1TQ5rrDGo6c9XEzCDw2OVsTV',
    badge: 'Mais Vendido',
    save: '15% OFF'
  },
  {
    id: 'annual',
    name: 'Anual',
    price: 'R$ 19,90',
    description: 'R$ 238,80 por ano',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || 'price_1TQ5s6DGo6c9XEzCSHjjmLoR',
    badge: 'Melhor Valor',
    save: '30% OFF'
  }
]

const FEATURES = [
  'Relatórios de Desempenho com IA',
  'Painel de Acompanhamento de Resultados',
  'Créditos Ilimitados para IA',
  'Uploads de Arquivos e Imagens Ilimitados',
  'Acesso Prioritário a Novas Funções'
]

export function UpgradeGate({ feature, description, children }: UpgradeGateProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleUpgrade = async (priceId: string) => {
    setLoadingId(priceId)
    try {
      await createCheckoutSession(priceId)
    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="relative flex items-center justify-center py-6 sm:py-10">
      {/* Blurred background content */}
      {children && (
        <div className="absolute inset-0 blur-xl opacity-10 pointer-events-none overflow-hidden">
          {children}
        </div>
      )}

      {/* Gate overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-5xl w-full mx-auto text-center px-4 sm:px-6"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-100 mb-3 sm:mb-4 tracking-tight leading-tight">
          {feature}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-2">
          {description || 'Este recurso é exclusivo para assinantes Pro. Escolha o melhor plano para você e libere o potencial máximo do seu aprendizado.'}
        </p>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -5 }}
              className={`relative bg-zinc-900/50 border ${plan.badge ? 'border-blue-500/50 shadow-lg shadow-blue-500/5' : 'border-zinc-800'} p-6 sm:p-8 rounded-3xl flex flex-col text-left backdrop-blur-md group transition-all`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-10">
                  {plan.badge}
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <p className="text-zinc-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-zinc-500 text-xs sm:text-sm">/mês</span>
                </div>
                {plan.save && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wide border border-emerald-500/20">
                    <TrendingDown className="w-3 h-3" />
                    Economize {plan.save}
                  </div>
                )}
              </div>

              <p className="text-zinc-500 text-[10px] sm:text-xs mb-6 sm:mb-8 leading-relaxed">
                {plan.description}
              </p>

              <button
                onClick={() => handleUpgrade(plan.priceId)}
                disabled={!!loadingId}
                className={`mt-auto w-full py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  plan.badge 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {loadingId === plan.priceId ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Assinar Agora
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-8 gap-y-3 text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] max-w-2xl px-2">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-500/50" />
                {f}
              </div>
            ))}
          </div>

          <p className="text-[9px] sm:text-[10px] text-zinc-700 mt-2 sm:mt-4 flex items-center gap-1.5 uppercase font-bold tracking-[0.2em]">
            <Lock className="w-3 h-3" />
            7 dias grátis • Stripe
          </p>
        </div>
      </motion.div>
    </div>
  )
}
