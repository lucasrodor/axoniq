import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Public routes that don't need auth
    const publicPaths = ['/login', '/forgot-password', '/reset-password', '/auth']
    const isPublicPath = pathname === '/' || publicPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
    const isApiPath = pathname.startsWith('/api/')

    // Skip middleware for public paths and API routes
    if (isPublicPath || isApiPath) {
      if (pathname === '/login') {
        let response = NextResponse.next({ request: { headers: request.headers } })
        
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
              cookies: {
                get(name: string) { return request.cookies.get(name)?.value },
                set(name: string, value: string, options: CookieOptions) {
                  request.cookies.set({ name, value, ...options })
                  response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                  request.cookies.set({ name, value: '', ...options })
                  response.cookies.set({ name, value: '', ...options })
                },
              },
            }
          )
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
        }
        return response
      }
      return NextResponse.next()
    }

    // Protected routes — check auth
    let response = NextResponse.next({ request: { headers: request.headers } })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // If no env vars, fallback to redirect to login so it doesn't crash protected routes
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return response
  } catch (error) {
    console.error('Middleware execution failed:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
