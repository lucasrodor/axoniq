'use client'

import { motion } from 'framer-motion'
import { Plus, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardEmptyStateProps {
  title: string
  description: string
  icon: LucideIcon
  actionLabel: string
  onAction: () => void
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple'
  className?: string
}

export function DashboardEmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  color = 'blue',
  className,
}: DashboardEmptyStateProps) {
  const colorStyles = {
    blue: {
      glow: 'bg-blue-500/5',
      iconBg: 'bg-blue-500/10 text-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
      border: 'border-blue-500/20'
    },
    emerald: {
      glow: 'bg-emerald-500/5',
      iconBg: 'bg-emerald-500/10 text-emerald-500',
      button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
      border: 'border-emerald-500/20'
    },
    amber: {
      glow: 'bg-amber-500/5',
      iconBg: 'bg-amber-500/10 text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600 !text-black shadow-amber-500/20',
      border: 'border-amber-500/20'
    },
    rose: {
      glow: 'bg-rose-500/5',
      iconBg: 'bg-rose-500/10 text-rose-500',
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
      border: 'border-rose-500/20'
    },
    purple: {
      glow: 'bg-purple-500/5',
      iconBg: 'bg-purple-500/10 text-purple-500',
      button: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20',
      border: 'border-purple-500/20'
    }
  }

  const styles = colorStyles[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        "relative py-20 px-6 text-center glass-panel border-zinc-800/50 rounded-[2.5rem] overflow-hidden",
        className
      )}
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--glow-color)_0%,transparent_70%)]",
        styles.glow
      )} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1 
          }}
          className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl border transition-colors",
            styles.iconBg,
            styles.border
          )}
        >
          <Icon size={32} />
        </motion.div>

        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-zinc-100 mb-3 tracking-tight"
        >
          {title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-zinc-500 mb-10 max-w-sm mx-auto text-base leading-relaxed"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={onAction}
            className={cn(
              "h-12 px-10 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all hover:scale-105 active:scale-95 border-none",
              styles.button
            )}
          >
            <Plus size={16} className="mr-2" />
            {actionLabel}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
