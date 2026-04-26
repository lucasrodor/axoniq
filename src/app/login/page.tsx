'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Sparkles, Brain, Zap, Eye, EyeOff } from 'lucide-react'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/dashboard'
  const { toast } = useToast()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      toast('Bem-vindo de volta!', 'success')
      window.location.href = returnTo
    } catch (error) {
      console.error(error)
      const msg = error instanceof Error ? error.message : ''
      if (msg.includes('Invalid login credentials')) {
        toast('Email ou senha incorretos.', 'error')
      } else if (msg.includes('User already registered')) {
        toast('Este email já está cadastrado.', 'error')
      } else if (msg.includes('Email not confirmed')) {
        toast('Confirme seu email antes de entrar.', 'error')
      } else {
        toast('Ocorreu um erro. Tente novamente.', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
      },
    })
  }

  return (
    <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600 rounded-full blur-[100px] opacity-10 translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10">
          <Image src="/AxonIQ.png" alt="AxonIQ" width={140} height={40} className="h-10 w-auto object-contain" />
        </div>

        <div className="relative z-10 max-w-md">
          <blockquote className="text-xl font-medium leading-relaxed text-zinc-300">
            &quot;A simplificação é o passo final da arte. A suprema sofisticação é a simplicidade.&quot;
          </blockquote>
          <cite className="mt-4 block text-sm text-zinc-500 not-italic">— Leonardo da Vinci</cite>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} AxonIQ. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-8 bg-[var(--background)]">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="lg:hidden mb-8 flex justify-center">
            <Image src="/AxonIQ.png" alt="AxonIQ" width={140} height={40} className="h-8 w-auto object-contain" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Acesse a plataforma
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Digite suas credenciais para continuar.
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-medium uppercase text-[var(--muted-foreground)] tracking-wider">
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
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-medium uppercase text-[var(--muted-foreground)] tracking-wider">
                Senha
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3 pr-10 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-100 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base" isLoading={isLoading}>
              Entrar
            </Button>
          </form>

          <div className="flex items-center justify-between">
            <div className="h-px flex-1 bg-[var(--border)]"></div>
            <span className="px-4 text-xs text-[var(--muted-foreground)] uppercase">OU</span>
            <div className="h-px flex-1 bg-[var(--border)]"></div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12"
            isLoading={isLoading}
          >
            Entrar com Google
          </Button>

          <div className="text-center text-sm space-y-2">
            <a href="/forgot-password" className="block text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-xs">
              Esqueceu a senha?
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-500">Preparando acesso...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
