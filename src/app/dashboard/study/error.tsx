'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCw, AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Study Page Error:', error)
  }, [error])

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#09090B] p-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mb-8">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Algo deu errado na sessão</h2>
      <p className="text-zinc-500 mb-8 max-w-sm">
        Ocorreu um erro inesperado ao carregar seus flashcards. Isso pode acontecer por uma falha na conexão ou sincronização.
      </p>

      <div className="flex gap-4">
        <Button 
          onClick={() => reset()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 rounded-2xl font-bold"
        >
          <RotateCw className="mr-2 h-4 w-4" /> Tentar Novamente
        </Button>
        <Button 
          variant="ghost"
          onClick={() => window.location.href = '/dashboard'}
          className="text-zinc-400 hover:text-white"
        >
          Voltar ao Painel
        </Button>
      </div>
    </div>
  )
}
