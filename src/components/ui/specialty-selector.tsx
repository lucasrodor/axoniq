'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SPECIALTIES } from '@/lib/constants/specialties'
import { motion, AnimatePresence } from 'framer-motion'

interface SpecialtySelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  showAll?: boolean
}

export function SpecialtySelector({ value, onChange, className, placeholder, showAll }: SpecialtySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  const specialtiesToList = showAll ? ["Todas as Áreas", ...SPECIALTIES] : SPECIALTIES

  const filteredSpecialties = specialtiesToList.filter((s) =>
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
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-zinc-800 bg-zinc-950/50 text-zinc-100 text-sm hover:border-blue-500/30 transition-all focus:outline-none focus:border-blue-500/50 h-[46px]"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Tag size={16} className="text-zinc-500 shrink-0" />
          <span className={cn("truncate", !value && "text-zinc-500")}>
          {value === 'all' || value === 'Todas as Áreas' ? 'Todas as Áreas' : (value || placeholder || "Selecione a área...")}
          </span>
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-zinc-500" />
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
                      (value === specialty || (value === 'all' && specialty === 'Todas as Áreas')) 
                        ? "bg-blue-500/10 text-blue-400 font-bold" 
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        (value === specialty || (value === 'all' && specialty === 'Todas as Áreas')) ? "opacity-100" : "opacity-0"
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
