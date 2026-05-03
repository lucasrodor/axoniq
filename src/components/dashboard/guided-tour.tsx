'use client'

import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { supabase } from '@/lib/supabase/client'

interface GuidedTourProps {
  userId?: string
  hasCompleted?: boolean
}

export function GuidedTour({ userId, hasCompleted }: GuidedTourProps) {
  const isInitialized = useRef(false)

  useEffect(() => {
    // Evita rodar no SSR
    if (typeof window === 'undefined') return
    // Evita rodar se não tivermos os dados do usuário ou se já completou
    if (!userId || hasCompleted === true) return
    
    // Evita rodar mais de uma vez na mesma sessão
    if (isInitialized.current) return
    isInitialized.current = true

    // Verifica fallback no localStorage (para redundância)
    const localKey = `axoniq-tour-completed-${userId}`
    const hasCompletedLocal = localStorage.getItem(localKey)
    if (hasCompletedLocal === 'true') return

    // Atrasa um pouco para garantir que a UI carregou (os IDs estão na DOM)
    const timer = setTimeout(() => {
      const tour = driver({
        showProgress: true,
        animate: true,
        allowClose: false,
        nextBtnText: 'Próximo',
        prevBtnText: 'Anterior',
        doneBtnText: 'Começar!',
        progressText: '{{current}} de {{total}}',
        onDestroyed: async () => {
          // Salva no localStorage (imediato)
          localStorage.setItem(localKey, 'true')
          
          // Salva no Banco de Dados (persistente entre dispositivos)
          if (userId) {
            await supabase
              .from('profiles')
              .update({ has_completed_tour: true })
              .eq('id', userId)
          }
        },
        steps: [
          {
            element: '#tour-create-btn',
            popover: {
              title: 'Tudo começa aqui! 🚀',
              description: 'Clique aqui para fazer upload de PDFs ou Áudios e deixar a nossa IA gerar seus flashcards, mapas e quizzes automaticamente.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-tabs',
            popover: {
              title: 'Seu Cofre de Conhecimento 📚',
              description: 'Aqui ficam organizados todos os materiais gerados. Navegue entre seus Decks, Quizzes e Mapas Mentais com um clique.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-credits',
            popover: {
              title: 'Acompanhe seus créditos ⚡',
              description: 'Fique de olho nos seus créditos e no status da sua assinatura direto da barra lateral. Pronto para começar?',
              side: 'right',
              align: 'start'
            }
          }
        ]
      })

      tour.drive()
    }, 1500) // Aumentado para 1.5s para garantir carregamento de dados do dashboard

    return () => clearTimeout(timer)
  }, [userId, hasCompleted])

  return null // Componente invisível, apenas injeta lógica
}
