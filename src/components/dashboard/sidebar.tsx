'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/providers/auth-provider'
import { cn } from '@/lib/utils'
import { InviteModal } from './invite-modal'

interface SidebarItemProps {
  href: string
  icon: string
  label: string
  isCollapsed: boolean
  onClick?: () => void
}

function SidebarItem({ href, icon, label, isCollapsed, onClick }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link href={href} onClick={onClick} title={isCollapsed ? label : ''}>
      <div
        className={cn(
          'flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group relative',
          isActive
            ? 'bg-blue-600/10 text-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]'
            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
        )}
      >
        {/* Active Indicator */}
        {isActive && (
          <motion.div
            layoutId="active-nav"
            className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}

        <span className={cn(
          "material-symbols-outlined text-[24px] transition-transform duration-300 group-hover:scale-110 shrink-0",
          isActive ? "fill-[1]" : ""
        )}>
          {icon}
        </span>
        
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-sm font-semibold tracking-tight whitespace-nowrap"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </Link>
  )
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  const isAdmin = user?.email === 'lucasrodor@gmail.com'

  // Load collapse state from local storage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setIsCollapsed(saved === 'true')
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
    window.dispatchEvent(new Event('sidebar-toggle'))
  }

  const menuItems = [
    { href: '/dashboard', icon: 'dashboard', label: 'Painel' },
    { href: '/dashboard/study', icon: 'auto_stories', label: 'Estudo' },
    { href: '/dashboard/retention', icon: 'analytics', label: 'Desempenho' },
    { href: '/dashboard?tab=decks', icon: 'layers', label: 'Decks' },
    { href: '/dashboard?tab=quizzes', icon: 'quiz', label: 'Quizzes' },
    { href: '/dashboard?tab=mindmaps', icon: 'schema', label: 'Mapas Mentais' },
  ]

  const bottomItems = [
    { href: '/dashboard/account', icon: 'settings', label: 'Configurações' },
  ]

  return (
    <>
      {/* Mobile Hamburger Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 shadow-xl"
        >
          <span className="material-symbols-outlined">
            {isMobileOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen z-[55] glass-panel border-r border-zinc-800/50 transition-all duration-500 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-[240px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full p-3 pt-6">
          {/* Logo Section */}
          <div className={cn(
            "flex items-center mb-10 mt-2 transition-all duration-500 relative",
            isCollapsed ? "justify-center" : "justify-start px-4"
          )}>
            <Link href="/dashboard" className="flex items-center">
              <img 
                src="/AxonIQ.png" 
                alt="Axoniq Logo" 
                className={cn("transition-all duration-500 hover:scale-105 active:scale-95", isCollapsed ? "w-10" : "w-28")} 
              />
            </Link>
          </div>

          {/* Floating Collapse Toggle (Desktop only) */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 items-center justify-center w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all z-[60] shadow-xl group"
            title={isCollapsed ? "Expandir" : "Recolher"}
          >
            <span className="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover:scale-125">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                isCollapsed={isCollapsed}
                onClick={() => setIsMobileOpen(false)}
              />
            ))}
          </nav>

          {/* Bottom Controls */}
          <div className="space-y-2 pt-4 border-t border-zinc-800/50">
            {bottomItems.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                isCollapsed={isCollapsed}
                onClick={() => setIsMobileOpen(false)}
              />
            ))}
            
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className={cn(
                'flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group w-full text-zinc-400 hover:bg-zinc-800/50 hover:text-red-500',
                isCollapsed && "justify-center"
              )}
            >
              <span className="material-symbols-outlined text-[24px]">logout</span>
              {!isCollapsed && <span className="text-sm font-semibold">Sair</span>}
            </button>

            {/* Admin Invite Section */}
            {isAdmin && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className={cn(
                  'flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group w-full text-emerald-500/80 hover:bg-emerald-500/5 hover:text-emerald-400 border border-transparent hover:border-emerald-500/20 shadow-sm mt-2',
                  isCollapsed && "justify-center"
                )}
              >
                <span className="material-symbols-outlined text-[24px] fill-[1]">auto_awesome</span>
                {!isCollapsed && <span className="text-sm font-bold tracking-tight">Convidar Alpha</span>}
              </button>
            )}
          </div>
        </div>
      </aside>

      <InviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
      />

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoutModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[360px] glass-panel border border-zinc-800/50 p-8 text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                <span className="material-symbols-outlined text-3xl">logout</span>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Sair da Conta?</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Você precisará entrar novamente para acessar seus estudos e IA.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    signOut()
                    window.location.href = '/login'
                  }}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-red-600/20"
                >
                  Confirmar Sair
                </button>
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="w-full py-3.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl transition-all active:scale-[0.98] border border-zinc-700/50"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
