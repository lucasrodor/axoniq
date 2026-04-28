'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Status = 'waiting' | 'loading' | 'done' | 'error'

interface ActiveGeneration {
  id: string
  title: string
  status: {
    source: Status
    flashcards: Status
    quiz: Status
    mindmap: Status
    deckId?: string | null
    quizId?: string | null
    mindmapId?: string | null
    cardCount?: number
    quizCount?: number
  }
  config: {
    generateFlashcards: boolean
    generateQuiz: boolean
    generateMindMap: boolean
  }
  isMinimized: boolean
}

interface GenerationContextType {
  generations: ActiveGeneration[]
  addGeneration: (gen: ActiveGeneration) => void
  updateGeneration: (id: string, updates: Partial<ActiveGeneration>) => void
  removeGeneration: (id: string) => void
  toggleMinimize: (id: string) => void
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined)

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [generations, setGenerations] = useState<ActiveGeneration[]>([])

  const addGeneration = (gen: ActiveGeneration) => {
    setGenerations(prev => [...prev, gen])
  }

  const updateGeneration = (id: string, updates: Partial<ActiveGeneration>) => {
    setGenerations(prev => prev.map(g => 
      g.id === id ? { ...g, ...updates, status: { ...g.status, ...(updates.status || {}) } } : g
    ))
  }

  const removeGeneration = (id: string) => {
    setGenerations(prev => prev.filter(g => g.id !== id))
  }

  const toggleMinimize = (id: string) => {
    setGenerations(prev => prev.map(g => 
      g.id === id ? { ...g, isMinimized: !g.isMinimized } : g
    ))
  }

  return (
    <GenerationContext.Provider value={{ 
      generations, 
      addGeneration, 
      updateGeneration, 
      removeGeneration,
      toggleMinimize
    }}>
      {children}
    </GenerationContext.Provider>
  )
}

export function useGeneration() {
  const context = useContext(GenerationContext)
  if (context === undefined) {
    throw new Error('useGeneration must be used within a GenerationProvider')
  }
  return context
}
