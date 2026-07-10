import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Mesma allowlist do /acesso: sem ela, ?next=https://site-malicioso.com vira
// open redirect autenticado (M11 da auditoria). Só a origem do app e a origem
// da ferramenta (GitHub Pages) são destinos válidos.
function destinoSeguro(raw: string | null, origemApp: string): string {
  const toolUrl = process.env.NEXT_PUBLIC_TOOL_URL || 'https://app.selosales.com.br'
  if (!raw) return new URL('/pipeline', origemApp).toString()
  try {
    const url = new URL(raw, origemApp)
    const permitidos = new Set([origemApp, new URL(toolUrl).origin])
    if (permitidos.has(url.origin)) return url.toString()
  } catch {
    /* URL inválida cai no fallback */
  }
  return new URL('/pipeline', origemApp).toString()
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(destinoSeguro(next, requestUrl.origin))
}
