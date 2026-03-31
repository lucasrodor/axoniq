'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the URL hash fragment
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReady(true)
      }
    })

    // Also check if we already have a session (user might have refreshed)
    supabase.auth.getSession().then((result: { data: { session: unknown } }) => {
      if (result.data.session) {
        setIsReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('New password should be different')) {
        setError('A nova senha não pode ser igual à anterior.')
      } else if (msg.includes('Auth session missing')) {
        setError('Sessão expirada. Solicite um novo link de recuperação.')
      } else if (msg.includes('Password should be at least')) {
        setError('A senha deve ter no mínimo 6 caracteres.')
      } else {
        setError('Erro ao redefinir senha. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="text-center space-y-4 animate-in zoom-in duration-500">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto text-green-600">
            <CheckCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Senha redefinida!</h1>
          <p className="text-[var(--muted-foreground)]">
            Redirecionando para o login...
          </p>
        </div>
      </div>
    )
  }

  // Waiting for Supabase to establish session from the URL hash
  if (!isReady) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="text-center space-y-4 animate-in fade-in duration-500">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-[var(--muted-foreground)]">
            Verificando seu link de recuperação...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Nova senha
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Digite sua nova senha abaixo.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-[var(--muted-foreground)] tracking-wider">
              Nova Senha
            </label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:border-transparent transition-all"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-[var(--muted-foreground)] tracking-wider">
              Confirmar Senha
            </label>
            <input
              type="password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:border-transparent transition-all"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-base" isLoading={isLoading}>
            Redefinir Senha
          </Button>
        </form>
      </div>
    </div>
  )
}
