import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 0. Deixar rotas de auth passarem livremente
  if (pathname.startsWith('/auth') || pathname.startsWith('/reset-password')) {
    return response
  }

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Proteger /dashboard
  if (pathname.startsWith('/dashboard') && !user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Proteger /admin
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Verificação extra para admin (pode ser pelo email ou pela tabela profiles)
    // Como aqui é o middleware e queremos performance, vamos usar o email do admin principal por enquanto
    const adminEmails = ['lucasrodor@gmail.com'] // Adicione outros se precisar
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 3. Se estiver logado e tentar ir para login/signup, manda pro dashboard
  if ((pathname === '/login' || pathname === '/sign-up') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/sign-up',
  ],
}
