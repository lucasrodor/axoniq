'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SPECIALTIES } from '@/lib/constants/specialties'
import { motion, AnimatePresence } from 'framer-motion'

interface SpecialtySelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SpecialtySelector({ value, onChange, className }: SpecialtySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredSpecialties = SPECIALTIES.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  )

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 border-zinc-800 bg-zinc-900/30 text-zinc-100 text-sm hover:border-blue-500/30 transition-all focus:outline-none focus:border-blue-500/50"
      >
        <span className={cn("truncate", !value && "text-zinc-500")}>
          {value || "Selecione a especialidade..."}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 4 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-4 py-3 border-b border-zinc-800">
              <Search className="h-4 w-4 text-zinc-500 mr-2" />
              <input
                className="flex-1 bg-transparent border-none text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                placeholder="Buscar área..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
              {filteredSpecialties.length === 0 ? (
                <div className="py-6 text-center text-sm text-zinc-500">
                  Nenhuma especialidade encontrada.
                </div>
              ) : (
                filteredSpecialties.map((specialty) => (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => {
                      onChange(specialty)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={cn(
                      "w-full flex items-center px-4 py-2.5 text-sm rounded-xl transition-colors text-left",
                      value === specialty 
                        ? "bg-blue-500/10 text-blue-400" 
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === specialty ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {specialty}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
