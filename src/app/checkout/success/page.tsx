'use client'

import { useEffect, useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2, ArrowRight, Sparkles, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [isNewUser, setIsNewUser] = useState(searchParams.get('new_user') === 'true')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const emailParam = searchParams.get('email')
  const [emailToSet, setEmailToSet] = useState(emailParam || '')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  const handleSetPassword = async () => {
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const sessionId = searchParams.get('session_id')
      
      // Kirvano fallback ou Stripe session
      if (!sessionId && !emailToSet) {
        throw new Error('Sessão ou e-mail não encontrados. Aguarde o e-mail com suas credenciais.')
      }

      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, password, email: emailToSet })
      })

      const data = await res.json()
      
      if (!res.ok) {
        if (res.status === 403) {
          setShowLoginPrompt(true)
          return
        }
        throw new Error(data.error || 'Erro ao definir senha')
      }

      // 4. Se deu certo, faz o login automático
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: password
      })

      if (loginError) throw loginError

      router.push('/dashboard?welcome=true')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-panel p-10 text-center border border-zinc-800 relative z-10"
      >
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
          Pagamento Confirmado!
        </h1>

        {isLoggedIn ? (
          <div className="space-y-6">
            <p className="text-zinc-400 leading-relaxed">
              Parabéns! Seu pagamento foi processado com sucesso. Todos os recursos já estão liberados.
            </p>

            <Link 
              href="/dashboard" 
              className="group flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black transition-all shadow-lg shadow-blue-600/30"
            >
              Acessar Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : showLoginPrompt ? (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <p className="text-zinc-300 font-bold text-lg">
              Você já possui uma conta!
            </p>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Identificamos que o e-mail informado já tem uma senha cadastrada no nosso sistema. 
              Sua assinatura já foi ativada.
            </p>
            <Link 
              href="/login" 
              className="block w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/30"
            >
              Fazer Login Agora
            </Link>
          </div>
        ) : isNewUser || !searchParams.get('session_id') ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-zinc-200 font-bold">Boas-vindas ao AxonIQ Pro!</p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Crie sua senha abaixo para finalizar seu cadastro e acessar seu painel agora mesmo.
              </p>
            </div>
            
            <div className="space-y-4">
              {!searchParams.get('session_id') && !emailParam && (
                 <div className="space-y-2 text-left">
                   <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Seu E-mail da Compra</label>
                   <input
                     type="email"
                     value={emailToSet}
                     onChange={(e) => setEmailToSet(e.target.value)}
                     placeholder="voce@exemplo.com"
                     className="w-full px-5 py-4 rounded-2xl border border-zinc-800 bg-black/40 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-600"
                   />
                 </div>
              )}

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Defina sua Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-5 py-4 rounded-2xl border border-zinc-800 bg-black/40 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-blue-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 font-bold animate-in fade-in slide-in-from-top-1">{error}</p>
              )}

              <Button 
                onClick={handleSetPassword}
                isLoading={loading}
                className="w-full py-7 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20"
              >
                Concluir e Acessar Painel
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-zinc-400 leading-relaxed">
              Sua conta já está ativa com o plano Pro. Entre agora para começar a estudar.
            </p>
            <Link 
              href="/login" 
              className="block w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all border border-zinc-700"
            >
              Ir para o Login
            </Link>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-zinc-800 flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
          <Sparkles className="w-3 h-3" />
          Powered by Axoniq AI
        </div>
      </motion.div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  )
}
