'use client'

import { motion } from 'framer-motion'
import { Crown, Zap, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'

interface UpgradeGateProps {
  feature: string
  description?: string
  children?: React.ReactNode
}

export function UpgradeGate({ feature, description, children }: UpgradeGateProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async (interval: 'monthly' | 'semiannual' | 'annual') => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ interval }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[60vh] flex items-center justify-center">
      {/* Blurred background content */}
      {children && (
        <div className="absolute inset-0 blur-md opacity-20 pointer-events-none overflow-hidden">
          {children}
        </div>
      )}

      {/* Gate overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-lg w-full mx-auto text-center p-10"
      >
        <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Crown className="w-10 h-10 text-amber-400" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">
          {feature}
        </h2>
        <p className="text-zinc-400 mb-10 max-w-md mx-auto leading-relaxed">
          {description || 'Este recurso é exclusivo para assinantes do plano Pro. Faça upgrade e desbloqueie todo o potencial do AxonIQ.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => handleUpgrade('monthly')}
            disabled={loading}
            className="group relative px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-2xl text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {loading ? 'Redirecionando...' : 'Upgrade Pro — R$ 24,90/mês'}
          </button>
        </div>

        <p className="text-xs text-zinc-600 mt-6 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" />
          7 dias grátis • Cancele quando quiser
        </p>
      </motion.div>
    </div>
  )
}
