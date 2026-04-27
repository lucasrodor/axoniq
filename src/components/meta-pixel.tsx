'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Declarando globalmente para o TypeScript não reclamar do window.fbq
declare global {
  interface Window {
    fbq: any
    _fbq: any
  }
}

const PIXEL_ID = '2528943477542294'

export function MetaPixel() {
  const pathname = usePathname()

  // Define as rotas ou prefixos onde o pixel NÃO deve carregar
  const isInternalRoute = pathname?.startsWith('/app') || 
                          pathname?.startsWith('/dashboard') || 
                          pathname?.startsWith('/admin') || 
                          pathname?.startsWith('/workspace')

  // Toda vez que a rota mudar em um ambiente público, rastreamos um PageView
  useEffect(() => {
    if (!isInternalRoute && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView')
    }
  }, [pathname, isInternalRoute])

  if (isInternalRoute) {
    return null
  }

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `,
      }}
    />
  )
}

// Utilitários de Rastreamento (apenas executam se o fbq estiver disponível)
export const trackLead = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead')
  }
}

export const trackCompleteRegistration = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration')
  }
}
