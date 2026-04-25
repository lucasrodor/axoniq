'use client'

import { createCheckoutSession } from '@/app/actions/stripe-actions'

export default function TestPaymentPage() {
  const priceMonthly = 'price_1TQ5rKDGo6c9XEzCjUnL9wb9' // Seu ID de teste

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4">
      <div className="glass-panel p-8 max-w-md w-full text-center space-y-6 border border-zinc-800">
        <h1 className="text-2xl font-bold">Teste de Pagamento 💳</h1>
        <p className="text-zinc-400 text-sm">
          Clique no botão abaixo para abrir o Checkout da Stripe no modo de teste.
        </p>
        
        <button
          onClick={() => createCheckoutSession(priceMonthly)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          Assinar Plano Pro (Teste)
        </button>
        
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
          Modo: Stripe Test Mode
        </p>
      </div>
    </div>
  )
}
