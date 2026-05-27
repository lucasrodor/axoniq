'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onChange: (startDate: string, endDate: string) => void
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

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

  // Format YYYY-MM-DD to DD/MM/YYYY
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay()
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleDayClick = (day: number) => {
    const formattedDay = String(day).padStart(2, '0')
    const formattedMonth = String(month + 1).padStart(2, '0')
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      onChange(dateStr, '')
    } else {
      // Selection of range end
      if (dateStr < startDate) {
        onChange(dateStr, '')
      } else {
        onChange(startDate, dateStr)
      }
    }
  }

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('', '')
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayIndex = getFirstDayOfMonth(year, month)

  // Calendar days grid items
  const dayItems = []
  for (let i = 0; i < firstDayIndex; i++) {
    dayItems.push(<div key={`empty-${i}`} className="p-2" />)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const formattedDay = String(d).padStart(2, '0')
    const formattedMonth = String(month + 1).padStart(2, '0')
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`

    const isSelectedStart = startDate === dateStr
    const isSelectedEnd = endDate === dateStr
    const isInRange = startDate && endDate && dateStr > startDate && dateStr < endDate

    dayItems.push(
      <button
        key={`day-${d}`}
        type="button"
        onClick={() => handleDayClick(d)}
        className={cn(
          "w-8 h-8 rounded-lg text-xs font-semibold transition-all relative flex items-center justify-center m-auto",
          isSelectedStart || isSelectedEnd
            ? "bg-blue-500 text-white font-bold shadow-md hover:bg-blue-600"
            : isInRange
            ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        )}
      >
        {d}
      </button>
    )
  }

  const displayLabel = () => {
    if (startDate && endDate) {
      return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`
    } else if (startDate) {
      return `${formatDateLabel(startDate)} - selecionar final`
    }
    return 'Selecionar período'
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-2 pl-3 pr-4 py-2.5 rounded-lg border transition-all duration-300 text-sm w-full",
          "bg-zinc-900/80 backdrop-blur-sm border-zinc-800 hover:border-zinc-600 shadow-sm hover:shadow-md",
          isOpen && "ring-4 ring-blue-500/5 border-blue-500/50 shadow-lg bg-zinc-900",
          (!startDate && !endDate) && "text-zinc-500"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="truncate font-semibold tracking-tight text-zinc-100">{displayLabel()}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {(startDate || endDate) && (
            <span 
              onClick={clearSelection}
              className="p-0.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown 
            size={16} 
            className={cn("text-zinc-400 transition-transform duration-500 ease-in-out", isOpen && "rotate-180 text-blue-500")} 
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
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
              className="absolute right-0 z-50 mt-2 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl shadow-2xl overflow-hidden p-4 w-[280px] ring-1 ring-white/5"
            >
              <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  {monthNames[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Weekdays header */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                  <span key={idx} className="text-[10px] font-bold text-zinc-500">
                    {day}
                  </span>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {dayItems}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
