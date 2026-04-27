'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Star, Rocket, ShieldCheck } from 'lucide-react'
import { createCheckoutSession } from '@/app/actions/stripe-actions'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Mensal',
    priceId: 'price_1TQ5rKDGo6c9XEzCjUnL9wb9',
    price: 'R$ 29,90',
    description: 'Flexibilidade total para começar agora.',
    features: [
      'Acesso Ilimitado à IA',
      'Criação de Decks Ilimitados',
      'Mapas Mentais Infinitos',
      'Suporte Prioritário',
    ],
    icon: Rocket,
    color: 'blue',
    gateway: 'stripe'
  },
  {
    name: 'Semestral',
    checkoutUrl: 'https://pay.kirvano.com/211b8bc5-8f73-450e-bc51-444aee40f87f?split=6',
    priceId: 'price_1TQ5rrDGo6c9XEzCDw2OVsTV',
    price: 'R$ 24,98',
    description: 'R$ 131,90 à vista (Economia de 25%)',
    features: [
      'Tudo do plano Mensal',
      'Economia de 30%',
      'Acesso Antecipado a Novas Funções',
      'Badge de Membro Alpha',
    ],
    popular: true,
    icon: Star,
    color: 'emerald',
    gateway: 'kirvano'
  },
  {
    name: 'Anual',
    checkoutUrl: 'https://pay.kirvano.com/d0f26a81-6eec-4348-8236-c8a2de41c490?split=12',
    priceId: 'price_1TQ5s6DGo6c9XEzCSHjjmLoR',
    price: 'R$ 19,98',
    description: 'R$ 195,00 à vista (Melhor Custo-Benefício)',
    features: [
      'Tudo do plano Semestral',
      'Melhor custo-benefício',
      'Consultoria de Estudo com IA',
      'Acesso Vitalício aos Decks Base',
    ],
    icon: Zap,
    color: 'amber',
    gateway: 'kirvano'
  }
]

export default function TestePlanosPage() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)

  const handleSubscribe = async (plan: typeof plans[0]) => {
    setLoadingPriceId(plan.priceId || plan.name)
    try {
      if (plan.gateway === 'kirvano' && plan.checkoutUrl) {
        const { supabase } = await import('@/lib/supabase/client')
        const { data: { user } } = await supabase.auth.getUser()
        
        let url = plan.checkoutUrl
        if (user) {
          url += `&email=${encodeURIComponent(user.email || '')}&src=${user.id}`
        }
        window.location.href = url
        return
      }

      if (plan.priceId) {
        await createCheckoutSession(plan.priceId)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingPriceId(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="text-center space-y-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-xs font-bold tracking-widest uppercase mb-4"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Pagamento 100% Seguro via Stripe
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500"
          >
            Escolha seu Plano
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg max-w-2xl mx-auto"
          >
            Libere o poder total da inteligência artificial nos seus estudos e acelere sua aprovação.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.priceId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 3) }}
              className={cn(
                "relative group p-8 rounded-[32px] border transition-all duration-500",
                plan.popular 
                  ? "bg-gradient-to-b from-zinc-900/80 to-zinc-950 border-blue-500/30 shadow-[0_20px_50px_rgba(59,130,246,0.1)] scale-105 z-10" 
                  : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700 shadow-xl"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Mais Popular
                </div>
              )}

              <div className="mb-8">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500",
                  plan.color === 'blue' ? "bg-blue-500/10 text-blue-500" :
                  plan.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
                  "bg-amber-500/10 text-amber-500"
                )}>
                  <plan.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">/periodo</span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                    <div className="mt-1 p-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPriceId !== null}
                className={cn(
                  "w-full py-4 rounded-2xl font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                  plan.popular
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                )}
              >
                {loadingPriceId === (plan.priceId || plan.name) ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Começar Agora
                    <Rocket className="w-4 h-4 opacity-50 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-zinc-500 text-sm">
            Dúvidas sobre os planos? Fale com nosso suporte técnico.
          </p>
        </div>
      </div>
    </div>
  )
}
