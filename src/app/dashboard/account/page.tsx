'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, User, Mail, Lock, Trash2, LogOut, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { Crown, Zap, ExternalLink, Calendar, CreditCard } from 'lucide-react'
import { CancellationFlow } from '@/components/dashboard/cancellation-flow'
import { cn } from '@/lib/utils'

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const { isPremium, credits, plan, subscription, refresh } = useSubscription()
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) return
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    } catch {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'A senha deve ter no mínimo 6 caracteres.',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setMessage({ type: 'error', text: 'Erro ao alterar a senha.' })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleManageSubscription = async (reason?: string, feedback?: string) => {
    setIsCancelModalOpen(false)
    setSaving(true)
    
    try {
      // Opcional: Salvar o feedback do cancelamento no seu banco aqui
      if (reason) {
        console.log('Motivo do cancelamento:', reason, feedback)
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao abrir portal')
      }

      const { url } = await res.json()
      if (url) {
        setMessage({ type: 'success', text: 'Redirecionando para o portal de pagamentos...' })
        setTimeout(() => {
          window.location.href = url
        }, 1500)
      }
    } catch (err: any) {
      console.error('Erro ao abrir portal do Stripe:', err)
      setMessage({ type: 'error', text: err.message || 'Erro ao abrir portal de pagamentos.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 sm:p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 text-zinc-500 hover:text-zinc-200"
            >
              <ChevronLeft size={16} className="mr-1" />
              Voltar ao Painel
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">Sistema Online</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/50 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-100">
              Minha Conta
            </h1>
            <p className="text-zinc-500 mt-1 font-medium">
              Gerencie seu perfil, segurança e faturamento
            </p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40"
          >
            <LogOut size={16} className="mr-2" /> Sair da Conta
          </Button>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={cn(
              "p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2 duration-300",
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", message.type === 'success' ? "bg-emerald-500" : "bg-red-500")} />
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column - Subscription */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Section */}
            <div className="glass-panel border border-zinc-800/50 p-8 shadow-sm relative overflow-hidden group h-full">
              <div className={cn(
                "absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
                isPremium ? "via-blue-500/40" : "via-zinc-500/20"
              )} />
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    isPremium ? "bg-blue-500/10 text-blue-400" : "bg-zinc-500/10 text-zinc-400"
                  )}>
                    {isPremium ? <Crown size={24} /> : <Zap size={24} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-100 tracking-tight">
                      Plano Atual
                    </h2>
                    <p className="text-sm text-zinc-500 font-medium">Você está no plano {isPremium ? 'Profissional' : 'Gratuito'}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border",
                  isPremium 
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                )}>
                  {isPremium ? 'PRO — ATIVO' : 'FREE'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-black/40 border border-zinc-800/50 space-y-2 group/card hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Calendar size={14} className="group-hover/card:text-blue-400 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Próxima Renovação</span>
                  </div>
                  <p className="text-lg font-black text-zinc-100">
                    {subscription?.currentPeriodEnd 
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) 
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-zinc-800/50 space-y-2 group/card hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <CreditCard size={14} className="group-hover/card:text-blue-400 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Saldo de Créditos</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-black text-zinc-100">
                      {isPremium ? 'Ilimitado' : `${credits.remaining} / ${credits.limit}`}
                    </p>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          isPremium ? "bg-blue-400 w-full shadow-[0_0_15px_rgba(96,165,250,0.6)]" : "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                        )}
                        style={{ width: isPremium ? '100%' : `${(credits.remaining / credits.limit) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {isPremium ? (
                  <Button
                    onClick={() => setIsCancelModalOpen(true)}
                    variant="outline"
                    className="h-12 px-6 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 gap-2 rounded-xl font-bold"
                  >
                    Gerenciar Assinatura
                    <ExternalLink size={16} />
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl font-black shadow-xl shadow-blue-600/20"
                  >
                    Fazer Upgrade Agora
                    <Crown size={18} />
                  </Button>
                )}
                <Button
                  onClick={() => handleManageSubscription()}
                  variant="ghost"
                  className="h-12 px-6 text-zinc-500 hover:text-zinc-300 font-bold"
                >
                  Ver Histórico de Faturas
                </Button>
              </div>
            </div>
          </div>

          {/* Side Column - Info */}
          <div className="space-y-6">
            {/* Email Section */}
            <div className="glass-panel border border-zinc-800/50 p-6 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <Mail size={18} />
                </div>
                <h2 className="text-lg font-bold text-zinc-100">Email</h2>
              </div>
              <div className="p-4 bg-black/40 border border-zinc-800/50 rounded-xl">
                <p className="text-zinc-200 font-mono text-xs truncate">
                  {user?.email}
                </p>
              </div>
              <p className="text-[10px] text-zinc-500 mt-3 font-bold uppercase tracking-widest">
                Identificador Único
              </p>
            </div>

            {/* Support/Links Section */}
            <div className="glass-panel border border-zinc-800/50 p-6 shadow-sm bg-gradient-to-br from-zinc-900/50 to-black/50">
              <h3 className="text-sm font-black text-zinc-100 uppercase tracking-widest mb-4">Central de Ajuda</h3>
              <div className="space-y-2">
                {['Termos de Uso', 'Privacidade', 'Falar com Suporte'].map((item) => (
                  <button key={item} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-zinc-100 transition-all group">
                    <span className="text-sm font-semibold">{item}</span>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Section */}
          <div className="glass-panel border border-zinc-800/50 p-8 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <User size={20} />
              </div>
              <h2 className="text-xl font-bold text-zinc-100">Dados do Perfil</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Como quer ser chamado?"
                  className="w-full px-5 py-3.5 rounded-2xl border border-zinc-800 bg-black/40 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-600 font-medium"
                />
              </div>
              <Button
                onClick={handleUpdateProfile}
                isLoading={saving}
                className="w-full h-12 rounded-2xl font-bold"
              >
                Atualizar Perfil
              </Button>
            </div>
          </div>

          {/* Password Section */}
          <div className="glass-panel border border-zinc-800/50 p-8 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                <Lock size={20} />
              </div>
              <h2 className="text-xl font-bold text-zinc-100">Segurança</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-5 py-3.5 pr-12 rounded-2xl border border-zinc-800 bg-black/40 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-600 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-blue-400 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleChangePassword}
                isLoading={saving}
                variant="outline"
                className="w-full h-12 rounded-2xl font-bold border-zinc-800 hover:bg-zinc-800/50"
              >
                Alterar Senha de Acesso
              </Button>
            </div>
          </div>
        </div>

        <CancellationFlow 
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleManageSubscription}
        />
      </div>
    </div>
  )
}
