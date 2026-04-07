'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle, Loader2, Sparkles, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isAlpha, setIsAlpha] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 1. Ouvinte simples para habilitar o formulário
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsReady(true)
        if (session?.user) {
          setUserEmail(session.user.email || '')
          setIsAlpha(!!session.user.user_metadata?.is_alpha)
        }
      }
    })

    // 2. Backup imediato se houver hash na URL
    if (window.location.hash.includes('access_token')) {
      setIsReady(true)
    }

    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Sua chave de acesso precisa de pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As chaves inseridas estão diferentes.')
      return
    }

    setIsLoading(true)

    try {
      // 1. Tenta recuperar a sessão atual
      let { data: { session } } = await supabase.auth.getSession()

      // 2. Fallback Manual: Se a sessão não subiu sozinha mas o token está na URL
      if (!session && window.location.hash.includes('access_token')) {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        
        if (access_token && refresh_token) {
          const { data: setData } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })
          session = setData.session
        }
      }

      // 3. Update the user password - O Supabase agora terá a sessão garantida (manual ou automática)
      const { data, error: updateError } = await supabase.auth.updateUser({ password })
      
      if (updateError) throw updateError
      
      console.log('Senha atualizada com sucesso para:', data.user?.email)
      
      // 4. IMPORTANT: Terminate current session to force a clean re-login
      await supabase.auth.signOut()

      setSuccess(true)
      setTimeout(() => router.push('/login'), 3500)
    } catch (err) {
      console.error('Reset error:', err)
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('New password should be different')) {
        setError('A nova senha não pode ser igual à anterior.')
      } else if (msg.includes('Auth session missing')) {
        setError('Sessão expirada. Solicite um novo link de acesso.')
      } else {
        setError('Ops! Não foi possível salvar sua senha. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Aurora Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-600/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <motion.img 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            src="/AxonIQ.png" 
            alt="Axoniq Logo" 
            className="w-40 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-4"
          />
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-10 text-center space-y-6 border border-emerald-500/20 bg-emerald-500/5"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <CheckCircle size={40} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Tudo pronto!</h1>
                <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
                  Sua nova chave de acesso foi configurada com sucesso. Direcionando você para a plataforma...
                </p>
              </div>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          ) : !isReady ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto opacity-50" />
              <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-medium">
                Conectando ao Axoniq...
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 border border-zinc-800/50 relative overflow-hidden"
            >
              {/* Subtle top light effect */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

              <div className="mb-8 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  {isAlpha ? <Sparkles size={16} className="animate-pulse" /> : <Lock size={16} />}
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {isAlpha ? 'Ativação Alpha' : 'Redefinição de Senha'}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                  {isAlpha ? 'Defina sua Senha' : 'Crie sua Nova Senha'}
                </h1>
                <p className="text-zinc-500 text-sm">
                  {isAlpha 
                    ? `Crie sua chave de segurança para o acesso: ` 
                    : `Configure uma nova chave de acesso para: `}
                  <span className="text-blue-400/80 font-medium">{userEmail}</span>
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em] ml-1">
                    Nova Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800/50 focus:border-blue-500/50 rounded-2xl py-3 pl-12 pr-12 text-sm text-zinc-100 placeholder:text-zinc-700 transition-all outline-none focus:ring-4 focus:ring-blue-500/5"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-blue-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em] ml-1">
                    Confirmar Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors">
                      <ShieldCheck size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repita sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800/50 focus:border-blue-500/50 rounded-2xl py-3 pl-12 pr-12 text-sm text-zinc-100 placeholder:text-zinc-700 transition-all outline-none focus:ring-4 focus:ring-blue-500/5"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-blue-500 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-[11px] text-red-500 flex items-center gap-2"
                  >
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" />
                    {error}
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 border-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Salvar e Entrar
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-8 text-[10px] text-zinc-600 text-center uppercase tracking-widest leading-relaxed">
                Segurança de nível clínico • Criptografia ponta a ponta
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
