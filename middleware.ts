import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Destino do usuário autenticado: a ferramenta CorretorPRO (GitHub Pages)
const TOOL_URL =
  process.env.NEXT_PUBLIC_TOOL_URL ||
  'https://guilhermeassisp27-code.github.io/dev/tool.html'

// Rotas do app que pertencem ao CorretorPRO (auth). Tudo fora disso é legado.
const CPR_AUTH_ROUTES = ['/acesso', '/definir-senha', '/callback', '/login']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // /login é legado (marca Sales Co-Pilot) — redireciona para /acesso
  if (pathname === '/login' || pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/acesso', req.url))
  }

  const isAuthPage =
    pathname.startsWith('/acesso') ||
    pathname.startsWith('/definir-senha') ||
    pathname.startsWith('/callback')

  if (!session) {
    // Sem sessão: só as páginas de auth são acessíveis; o resto vai para o login
    if (isAuthPage) return res
    return NextResponse.redirect(new URL('/acesso', req.url))
  }

  // Com sessão: nas páginas de auth, manda direto para a ferramenta
  if (isAuthPage) {
    return NextResponse.redirect(TOOL_URL)
  }

  // Qualquer rota legada do app (pipeline, proposta, briefing, etc.) → ferramenta
  return NextResponse.redirect(TOOL_URL)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
