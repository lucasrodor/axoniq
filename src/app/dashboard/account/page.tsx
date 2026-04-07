'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'
import { ChevronLeft, User, Mail, Lock, Trash2, LogOut, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
        {/* Nav */}
        <div>
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 text-[var(--muted-foreground)]"
            >
              <ChevronLeft size={16} className="mr-1" />
              Voltar ao Painel
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Minha Conta
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Gerencie seu perfil e configurações
          </p>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30'
                : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Email Section */}
        <div className="glass-panel border border-zinc-800/50 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Mail size={18} />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Email
            </h2>
          </div>
          <p className="text-zinc-400 bg-black/40 border border-zinc-800/50 p-3 rounded-lg font-mono text-sm">
            {user?.email}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            O email não pode ser alterado diretamente.
          </p>
        </div>

        {/* Profile Section */}
        <div className="glass-panel border border-zinc-800/50 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <User size={18} />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Perfil
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
                Nome Completo
              </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-800 bg-black/40 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-600"
                />
            </div>
            <Button
              onClick={handleUpdateProfile}
              isLoading={saving}
              size="sm"
            >
              Salvar Perfil
            </Button>
          </div>
        </div>

        {/* Password Section */}
        <div className="glass-panel border border-zinc-800/50 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
              <Lock size={18} />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Alterar Senha
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 pr-12 rounded-lg border border-zinc-800 bg-black/40 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-600 hover:text-blue-400 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-4 py-2.5 pr-12 rounded-lg border border-zinc-800 bg-black/40 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-600 hover:text-blue-400 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button
              onClick={handleChangePassword}
              isLoading={saving}
              variant="outline"
              size="sm"
            >
              Alterar Senha
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[var(--border)] pt-6 flex flex-col gap-3">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full justify-center"
          >
            <LogOut size={16} className="mr-2" /> Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  )
}
