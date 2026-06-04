import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Auth pages — accessible without session
  const isAppAuth = pathname.startsWith('/login') || pathname.startsWith('/callback')
  const isCprAuth = pathname.startsWith('/acesso')
  const isAuthPage = isAppAuth || isCprAuth

  // Public routes
  const isPublic = pathname.startsWith('/proposta')

  if (!session) {
    if (isAuthPage || isPublic) return res
    return NextResponse.redirect(new URL('/acesso', req.url))
  }

  // Authenticated users on auth pages
  if (session && isAppAuth) return NextResponse.redirect(new URL('/pipeline', req.url))
  if (session && isCprAuth) {
    const toolUrl = process.env.NEXT_PUBLIC_TOOL_URL || '/pipeline'
    // Only redirect if same origin, otherwise just let them see the login page
    if (!toolUrl.startsWith('http')) {
      return NextResponse.redirect(new URL(toolUrl, req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
