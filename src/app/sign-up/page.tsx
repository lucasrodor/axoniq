'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Sparkles, Brain, Zap, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName.trim(),
          },
        },
      })
      if (error) throw error
      toast('Cadastro realizado com sucesso!', 'success')
      router.push('/login')
    } catch (error) {
      console.error(error)
      const msg = error instanceof Error ? error.message : ''
      if (msg.includes('User already registered')) {
        toast('Este email já está cadastrado.', 'error')
      } else {
        toast('Ocorreu um erro ao criar conta. Tente novamente.', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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

        <div className="relative z-10 space-y-8">
          <h2 className="text-2xl font-bold text-white">
            Tudo o que você precisa para dominar a medicina.
          </h2>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-semibold text-white">Geração com IA</p>
                <p className="text-sm text-zinc-400">Envie um PDF ou áudio e gere flashcards, quizzes e mapas mentais automaticamente.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <Brain size={20} />
              </div>
              <div>
                <p className="font-semibold text-white">Repetição Espaçada</p>
                <p className="text-sm text-zinc-400">Algoritmo que mostra os cards na hora certa, antes de você esquecer.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <p className="font-semibold text-white">Análise de Desempenho</p>
                <p className="text-sm text-zinc-400">Descubra quais especialidades dominar e onde reforçar.</p>
              </div>
            </div>
          </div>
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
              Crie sua conta
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Comece a estudar de forma inteligente.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="fullName" className="text-xs font-medium uppercase text-[var(--muted-foreground)] tracking-wider">
                Nome Completo
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:border-transparent transition-all"
                required
                autoFocus
              />
            </div>

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
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3 pr-10 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:border-transparent transition-all"
                  required
                  minLength={6}
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
              Criar minha conta
            </Button>
          </form>

          <div className="flex items-center justify-between">
            <div className="h-px flex-1 bg-[var(--border)]"></div>
            <span className="px-4 text-xs text-[var(--muted-foreground)] uppercase">OU</span>
            <div className="h-px flex-1 bg-[var(--border)]"></div>
          </div>

          <Button
            onClick={handleGoogleSignUp}
            variant="outline"
            className="w-full h-12"
            isLoading={isLoading}
          >
            Cadastrar com Google
          </Button>

          <div className="text-center text-sm space-y-2">
            <p className="text-[var(--muted-foreground)]">
              Já tem conta?{' '}
              <Link href="/login" className="font-semibold text-[var(--foreground)] hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
