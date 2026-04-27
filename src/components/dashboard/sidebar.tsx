'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'
import { useSubscription } from '@/hooks/useSubscription'
import { UpgradeGate } from '@/components/dashboard/upgrade-gate'
import { LowCreditModal } from '@/components/dashboard/dashboard-modals'
import { InviteModal } from '@/components/dashboard/invite-modal'
import { X } from 'lucide-react'

// Subcomponente original da Sidebar
function SidebarItem({ href, icon, label, isCollapsed, onClick }: { href: string, icon: string, label: string, isCollapsed: boolean, onClick?: () => void }) {
  const pathname = usePathname()
  
  // Lógica inteligente para saber qual item está ativo
  const isActive = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    
    const url = new URL(href, window.location.origin)
    const hrefTab = url.searchParams.get('tab')
    const currentTab = new URLSearchParams(window.location.search).get('tab')

    // Se o item tem uma tab (ex: ?tab=decks), só ativa se a tab da URL for igual
    if (hrefTab) {
      return pathname === '/dashboard' && currentTab === hrefTab
    }

    // Se for o Painel (sem tab), só ativa se estivermos no /dashboard E não houver tab na URL
    if (href === '/dashboard') {
      return pathname === '/dashboard' && !currentTab
    }

    // Para outras rotas (Estudo, Desempenho, etc)
    return pathname === href
  }, [pathname, href])

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group relative border border-transparent",
        isActive 
          ? "bg-blue-600/10 text-blue-500 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)] border-blue-500/10" 
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
        isCollapsed && "justify-center"
      )}
    >
      <span className={cn(
        "material-symbols-outlined text-[24px] transition-all duration-300",
        isActive && "fill-[1] scale-110"
      )}>
        {icon}
      </span>
      {!isCollapsed && <span className="text-sm font-semibold tracking-tight">{label}</span>}
      {isActive && !isCollapsed && (
        <motion.div 
          layoutId="active-pill"
          className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />
      )}
    </Link>
  )
}

// Subcomponente original de Créditos
function CreditsIndicator({ used, limit, remaining, isPremium, isCollapsed, className }: any) {
  return (
    <div className={cn("space-y-3", className)}>
      {!isCollapsed && (
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            {isPremium ? 'STATUS DO PLANO' : 'CRÉDITOS RESTANTES'}
          </span>
          {!isPremium && (
            <span className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">
              {remaining}/{limit}
            </span>
          )}
        </div>
      )}
      
      <button 
        onClick={() => !isPremium && window.dispatchEvent(new Event('open-upgrade-modal'))}
        disabled={isPremium}
        className={cn(
          "w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-1 group transition-all overflow-hidden relative",
          isPremium ? "border-blue-500/30 cursor-default" : "hover:border-blue-500/30",
          isCollapsed ? "h-12 flex items-center justify-center" : "h-auto"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        {isCollapsed ? (
          <span className={cn(
            "material-symbols-outlined fill-[1] transition-transform",
            isPremium ? "text-blue-400" : "text-blue-500 group-hover:scale-110"
          )}>bolt</span>
        ) : (
          <div className="p-2 space-y-2">
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: isPremium ? '100%' : `${(remaining / limit) * 100}%` }}
                className={cn(
                  "h-full transition-all duration-1000",
                  isPremium ? "bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.4)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                )}
              />
            </div>
            <div className={cn(
              "flex items-center gap-2",
              isPremium ? "text-blue-400" : "text-blue-500"
            )}>
               <span className="material-symbols-outlined text-[14px] fill-[1]">bolt</span>
               <span className="text-[10px] font-black uppercase tracking-tight">
                 {isPremium ? 'Assinatura Pro Ativa' : 'Fazer Upgrade'}
               </span>
            </div>
          </div>
        )}
      </button>
    </div>
  )
}

export function Sidebar() {
  const { user, signOut } = useAuth()
  const { isPremium, credits } = useSubscription()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Novos estados para os modais globais
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [isLowCreditModalOpen, setIsLowCreditModalOpen] = useState(false)
  const [lowCreditAvailable, setLowCreditAvailable] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setIsCollapsed(saved === 'true')
    if (user?.email === 'lucasrodor@gmail.com') setIsAdmin(true)
  }, [user])

  // Escuta de eventos globais
  useEffect(() => {
    const handleOpenUpgrade = () => setIsUpgradeModalOpen(true)
    const handleOpenLowCredit = (e: any) => {
      setLowCreditAvailable(e.detail?.available || 0)
      setIsLowCreditModalOpen(true)
    }
    window.addEventListener('open-upgrade-modal', handleOpenUpgrade)
    window.addEventListener('open-low-credit-modal', handleOpenLowCredit)
    return () => {
      window.removeEventListener('open-upgrade-modal', handleOpenUpgrade)
      window.removeEventListener('open-low-credit-modal', handleOpenLowCredit)
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
    window.dispatchEvent(new Event('sidebar-toggle'))
  }

  const menuItems = [
    { href: '/dashboard', icon: 'grid_view', label: 'Painel' },
    { href: '/dashboard/study', icon: 'menu_book', label: 'Estudo' },
    { href: '/dashboard/retention', icon: 'analytics', label: 'Desempenho' },
    { href: '/dashboard?tab=decks', icon: 'layers', label: 'Decks' },
    { href: '/dashboard?tab=quizzes', icon: 'quiz', label: 'Quizzes' },
    { href: '/dashboard?tab=mindmaps', icon: 'account_tree', label: 'Mapas Mentais' },
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
          "fixed top-0 left-0 h-screen z-[55] glass-panel border-r border-zinc-800/50 transition-all duration-500 ease-in-out bg-[#09090B]/80 backdrop-blur-xl",
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
          >
            <span className="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover:scale-125">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1.5">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                isCollapsed={isCollapsed}
                onClick={() => setIsMobileOpen(false)}
              />
            ))}
          </nav>

          {/* Plan Badge & Credits */}
          <div id="tour-credits" className={cn("py-4 border-t border-zinc-800/50", isCollapsed ? "px-1" : "px-1")}>
            <CreditsIndicator
              used={credits.used}
              limit={credits.limit}
              remaining={credits.remaining}
              isPremium={isPremium}
              isCollapsed={isCollapsed}
              className={cn(isCollapsed && "justify-center")}
            />
          </div>

          {/* Bottom Controls */}
          <div className="space-y-1.5 pt-4 border-t border-zinc-800/50">
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
              {!isCollapsed && <span className="text-sm font-semibold tracking-tight">Sair</span>}
            </button>

            {isAdmin && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className={cn(
                  'flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group w-full text-emerald-500/80 hover:bg-emerald-500/5 hover:text-emerald-400 border border-transparent hover:border-emerald-500/20 shadow-sm mt-1',
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

      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoutModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[360px] glass-panel border border-zinc-800/50 p-8 text-center space-y-6 shadow-2xl z-10"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                <span className="material-symbols-outlined text-3xl">logout</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Sair da Conta?</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">Você precisará entrar novamente para acessar seus estudos.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { signOut(); window.location.href = '/login'; }}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20"
                >
                  Confirmar Sair
                </button>
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="w-full py-3.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl transition-all border border-zinc-700/50"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500 p-3 sm:p-4" onClick={() => setIsUpgradeModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="w-full max-w-5xl relative max-h-[90vh] overflow-y-auto rounded-[3rem] hide-scrollbar" 
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsUpgradeModalOpen(false)}
                className="fixed top-6 right-6 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full text-zinc-500 hover:text-white transition-all z-[70] shadow-xl"
              >
                <X size={20} />
              </button>
              <div className="bg-zinc-950 border border-white/5 shadow-[0_0_100px_rgba(59,130,246,0.15)]">
                <UpgradeGate 
                  feature="Acesso Ilimitado ao AxonIQ Pro"
                  description="Seus créditos gratuitos acabaram, mas sua jornada de aprendizado não precisa parar. Desbloqueie gerações ilimitadas e muito mais."
                />
              </div>
            </motion.div>
          </div>
        )}

        {isLowCreditModalOpen && (
          <LowCreditModal 
            key="low-credit-modal-global"
            available={lowCreditAvailable} 
            onClose={() => setIsLowCreditModalOpen(false)} 
            onUpgrade={() => {
              setIsLowCreditModalOpen(false)
              setIsUpgradeModalOpen(true)
            }}
            onConfirm={() => {
              setIsLowCreditModalOpen(false)
              window.dispatchEvent(new CustomEvent('confirm-low-credit'))
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
