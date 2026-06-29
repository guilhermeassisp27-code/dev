import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Destino do usuário autenticado: a ferramenta CorretorPRO (GitHub Pages)
const TOOL_URL =
  process.env.NEXT_PUBLIC_TOOL_URL ||
  'https://app.selosales.com.br'

// Rotas do app que pertencem ao CorretorPRO (auth). Tudo fora disso é legado.
const CPR_AUTH_ROUTES = ['/acesso', '/definir-senha', '/callback', '/login']

// Páginas públicas (landing de marketing e páginas legais) — não exigem login.
// Servidas como estáticas pela própria Vercel, sem expor o usuário do GitHub.
const PUBLIC_PATHS = new Set([
  '/',
  '/landing.html',
  '/termos.html',
  '/privacidade.html',
  '/og-image.png',
  '/og-image.svg',
])

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Arquivos estáticos (imagens, css, js, fontes etc.) são servidos direto,
  // sem redirecionar para o login. Evita que assets do public/ (ex.: prints
  // da landing) caiam na regra de auth e sejam mandados para /acesso.
  if (/\.(png|jpe?g|gif|svg|webp|ico|css|js|txt|xml|woff2?|ttf|mp4|webm|mov|m4v|mp3|wav|pdf)$/i.test(pathname)) {
    return NextResponse.next()
  }

  // Landing e páginas legais: liberadas para qualquer visitante (inclusive sem sessão).
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // Captação pública de leads: /captura/<slug> é uma página de contato que o
  // corretor compartilha com clientes — precisa abrir sem login.
  // /simular/<slug> é a simulação de financiamento self-service (mesma ideia).
  if (pathname.startsWith('/captura/') || pathname.startsWith('/simular/')) {
    return NextResponse.next()
  }

  // Site público do corretor: /<slug> (vitrine de imóveis, SSR) é PÚBLICO —
  // abre sem login para qualquer visitante (e também para o corretor logado,
  // que quer ver o próprio site). Qualquer caminho de segmento único que não
  // seja rota de auth é tratado como slug; a própria página [slug] resolve 404
  // para slugs inexistentes/reservados.
  const segmentoUnico = /^\/[^/]+$/.test(pathname)
  const ehRotaAuth = CPR_AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )
  if (segmentoUnico && !ehRotaAuth) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

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
