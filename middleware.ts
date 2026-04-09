import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // FAILSAFE 1: Se as variáveis de ambiente não foram lidas pela Edge (Vercel)
    // Nós bloqueamos a execução do Supabase antes dele quebrar (Evita o 500 Fatal)
    if (!supabaseUrl || !supabaseKey) {
      console.warn("⚠️ [Middleware] Supabase ENV missing. Running in failsafe mode.")
      if (pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.next()
    }

    // Import dinâmico do SSR para evitar erro estático do Edge na fase de compilação
    const { createServerClient } = await import('@supabase/ssr')
    
    let response = NextResponse.next({ request: { headers: request.headers } })

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    })

    const { data: { session } } = await supabase.auth.getSession()

    // Regra 1: Está logado tentando acessar tela de login ou cadastro -> Vai direto pro dashboard
    // Nota: Deixamos o /reset-password passar para que convidados alfa definam a senha mesmo já estando "logados" pelo link
    if ((pathname === '/login' || pathname === '/sign-up') && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Regra 2: Está deslogado tentando acessar área restrita -> Vai pro login
    if (pathname.startsWith('/dashboard') && !session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Regra 3: Proteção da rota de ADMIN
    if (pathname.startsWith('/admin')) {
      if (!session || session.user.email !== 'lucasrodor@gmail.com') {
        console.warn(`🚫 [Middleware] Unauthorized admin access attempt to ${pathname} by ${session?.user?.email || 'anonymous'}`)
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // Tudo certo, segue o fluxo normal
    return response

  } catch (error) {
    // FAILSAFE 2: Se qualquer coisa explodir silenciosamente na Edge
    console.error('🚨 [Axoniq] Fatal Error no Middleware:', error)
    
    // A prioridade #1 é NUNCA dar tela branca 500 para o visitante
    // Se quebrou ao abrir o Dashboard, manda pro Login por segurança.
    // Qualquer outra rota deixamos passar (as páginas do Next lidam com o erro localmente).
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  // O segredo do Edge de alta performance: O matcher
  // NÃO intercepte rotas estáticas e NÃO use Regex negativos pesados.
  // Colocamos o pedágio APENAS na porta das rotas que realmente precisam de auth.
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/sign-up',
    '/reset-password'
  ],
}
