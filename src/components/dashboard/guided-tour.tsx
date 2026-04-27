'use client'

import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export function GuidedTour() {
  const isInitialized = useRef(false)

  useEffect(() => {
    // Evita rodar no SSR
    if (typeof window === 'undefined') return
    // Evita rodar mais de uma vez
    if (isInitialized.current) return
    isInitialized.current = true

    // Verifica se o tour já foi feito
    const hasCompletedTour = localStorage.getItem('axoniq-tour-completed')
    if (hasCompletedTour === 'true') return

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
        onDestroyed: () => {
          localStorage.setItem('axoniq-tour-completed', 'true')
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
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return null // Componente invisível, apenas injeta lógica
}
