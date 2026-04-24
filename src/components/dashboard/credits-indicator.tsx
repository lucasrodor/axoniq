'use client'

import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreditsIndicatorProps {
  used: number
  limit: number
  remaining: number
  isPremium: boolean
  className?: string
}

export function CreditsIndicator({ used, limit, remaining, isPremium, className }: CreditsIndicatorProps) {
  if (isPremium) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20", className)}>
        <Zap className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">PRO — Ilimitado</span>
      </div>
    )
  }

  const percentage = (remaining / limit) * 100
  const isLow = remaining <= 3
  const isEmpty = remaining <= 0

  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-colors",
      isEmpty 
        ? "bg-red-500/10 border-red-500/20" 
        : isLow 
          ? "bg-amber-500/10 border-amber-500/20" 
          : "bg-zinc-800/50 border-zinc-700/50",
      className
    )}>
      <Zap className={cn(
        "w-3.5 h-3.5",
        isEmpty ? "text-red-400" : isLow ? "text-amber-400" : "text-zinc-400"
      )} />
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          isEmpty ? "text-red-400" : isLow ? "text-amber-400" : "text-zinc-400"
        )}>
          {remaining}/{limit}
        </span>
        <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isEmpty ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
