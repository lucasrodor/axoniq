'use client'

import { Sidebar } from '@/components/dashboard/sidebar'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

import { GenerationProvider } from '@/providers/GenerationProvider'
import { BackgroundGenerationWidget } from '@/components/dashboard/background-generation-widget'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // O DashboardLayout precisa saber o estado da Sidebar para ajustar a margem do conteúdo
  // No mundo real, usaríamos um Contexto ou Zustand, mas para este refactor rápido
  // vamos escutar o localStorage ou disparar um evento customizado
  useEffect(() => {
    const checkState = () => {
      const saved = localStorage.getItem('sidebar-collapsed')
      setIsSidebarCollapsed(saved === 'true')
    }
    
    checkState()
    window.addEventListener('storage', checkState)
    // Custom event to trigger immediate update since 'storage' only fires on other tabs
    window.addEventListener('sidebar-toggle', checkState)
    
    return () => {
      window.removeEventListener('storage', checkState)
      window.removeEventListener('sidebar-toggle', checkState)
    }
  }, [])

  return (
    <GenerationProvider>
      <div className="flex min-h-screen bg-[#09090B] overflow-x-hidden selection:bg-blue-500 selection:text-white">
        {/* Background Aurora Blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" />
        </div>

        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <main 
          className={cn(
            "flex-1 transition-all duration-500 ease-in-out relative z-10 w-full max-w-full overflow-x-hidden",
            "lg:pl-[72px]", // Base desktop margin (collapsed)
            !isSidebarCollapsed && "lg:pl-[240px]" // Expanded desktop margin
          )}
        >
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 pt-20 md:pt-20 lg:pt-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
        
        {/* New Global Background Widget */}
        <BackgroundGenerationWidget />
      </div>
    </GenerationProvider>
  )
}
