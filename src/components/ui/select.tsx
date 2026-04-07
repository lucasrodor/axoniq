'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
  icon?: React.ReactNode
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção',
  label,
  className,
  icon
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("w-full space-y-1.5", className)} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between pl-4 pr-5 py-2.5 rounded-lg border transition-all duration-300 text-sm",
            "bg-zinc-900/80 backdrop-blur-sm border-zinc-800 hover:border-zinc-600 shadow-sm hover:shadow-md",
            isOpen && "ring-4 ring-blue-500/5 border-blue-500/50 shadow-lg bg-zinc-900",
            !selectedOption && "text-zinc-500"
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {icon && <span className="flex-shrink-0 opacity-60 text-blue-400">{icon}</span>}
            <span className="truncate font-semibold tracking-tight text-zinc-100">{selectedOption ? selectedOption.label : placeholder}</span>
          </div>
          <ChevronDown 
            size={16} 
            className={cn("text-zinc-400 transition-transform duration-500 ease-in-out ml-2", isOpen && "rotate-180 text-blue-500")} 
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Optional: Backdrop to close on mobile or just click-outside logic is enough */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 4, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="absolute z-50 w-full bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl shadow-2xl overflow-hidden py-1.5 ring-1 ring-white/5"
              >
                <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                  {options.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-zinc-500 italic">
                      Nenhuma opção disponível
                    </div>
                  ) : (
                    <div className="px-1.5 space-y-0.5">
                      {options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            onChange(option.value)
                            setIsOpen(false)
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left group",
                            option.value === value 
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold" 
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                          )}
                        >
                          <span className="truncate">{option.label}</span>
                          {option.value === value && (
                            <motion.div layoutId="active-check">
                              <Check size={14} className="flex-shrink-0 text-blue-500" />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
