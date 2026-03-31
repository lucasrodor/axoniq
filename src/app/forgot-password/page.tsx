'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar email.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-500">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="-ml-3 text-[var(--muted-foreground)]">
            <ChevronLeft size={16} className="mr-1" /> Voltar ao login
          </Button>
        </Link>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto text-green-600">
              <Mail size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Email enviado!
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Se o email <strong>{email}</strong> estiver cadastrado, você receberá
              um link para redefinir sua senha.
            </p>
            <Link href="/login">
              <Button variant="outline" className="mt-4">Voltar ao Login</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                Esqueceu a senha?
              </h1>
              <p className="text-[var(--muted-foreground)]">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-xs font-medium uppercase text-[var(--muted-foreground)] tracking-wider"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:border-transparent transition-all"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-base" isLoading={isLoading}>
                Enviar Link de Recuperação
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
