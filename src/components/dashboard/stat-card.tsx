'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  description?: string
  trend?: {
    value: number
    positive: boolean
  }
  className?: string
  color?: 'blue' | 'emerald' | 'amber' | 'red'
}

export function StatCard({ 
  icon, 
  label, 
  value, 
  description, 
  trend, 
  className,
  color = 'blue' 
}: StatCardProps) {
  const auroraClasses = {
    blue: 'aurora-border-blue text-blue-400',
    emerald: 'aurora-border-emerald text-emerald-400',
    amber: 'aurora-border-amber text-amber-400',
    red: 'aurora-border-red text-red-400',
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        "glass-panel p-6 rounded-2xl flex flex-col justify-between group transition-all duration-500",
        auroraClasses[color],
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-900/50 border border-zinc-800/50 group-hover:scale-110 transition-transform duration-500",
          color === 'blue' && "text-blue-500",
          color === 'emerald' && "text-emerald-500",
          color === 'amber' && "text-amber-5100",
          color === 'red' && "text-red-500"
        )}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-full",
            trend.positive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {trend.positive ? '+' : '-'}{Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <div>
        <div className="text-3xl font-bold tracking-tighter text-zinc-100 mb-1">
          {value}
        </div>
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
          {label}
        </div>
        {description && (
          <p className="text-[10px] text-zinc-400 mt-2 line-clamp-1">{description}</p>
        )}
      </div>

      {/* Decorative Gradient Glow */}
      <div className="absolute -bottom-px -left-px -right-px h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  )
}

export function BentoGrid({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-6", className)}>
      {children}
    </div>
  )
}
