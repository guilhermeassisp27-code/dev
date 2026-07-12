import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

// ============================================================
// Backend do Embedded Signup do WhatsApp (F1, item 3).
// Chamado pelo tool.html (app.selosales.com.br) com o JWT do corretor
// logado, depois que o popup do FB SDK devolve o código de autorização.
//
//   POST { code, phoneNumberId, wabaId }
//     1. valida o JWT e a assinatura ATIVA (gate server-side — o gate do
//        client é cosmético: qualquer um chama este endpoint direto)
//     2. troca o code pelo business token do corretor (permanente)
//     3. confere que o token realmente enxerga o número informado
//     4. inscreve o app no WABA (subscribed_apps) — armadilha 2 da seção 0
//        do plano: sem isso o webhook nunca recebe evento desse número
//     5. registra o número na Cloud API (best-effort; número em
//        coexistência já vem registrado e o register falha sem problema)
//     6. grava tudo em cpr_wa_numbers — o webhook passa a atender na hora
//
// Kill-switch operacional: WHATSAPP_APP_ID fica FORA do Vercel até a Meta
// aprovar a Verificação de Empresa + App Review. Sem a env, o endpoint
// responde 503 e nada é provisionado — dá pra fazer deploy do código já.
// ============================================================

const GRAPH_VERSION = 'v21.0'
const TOOL_ORIGIN = (process.env.NEXT_PUBLIC_TOOL_URL ?? 'https://app.selosales.com.br').replace(/\/$/, '')

function cors<T extends NextResponse>(res: T): T {
  res.headers.set('Access-Control-Allow-Origin', TOOL_ORIGIN)
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'authorization, content-type')
  return res
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// PIN de 6 dígitos do registro na Cloud API, derivado (HMAC) do app secret +
// phone_number_id. Determinístico de propósito: se um dia for preciso
// re-registrar o número, o PIN é recomputável — sem coluna nova, sem PIN
// perdido. Nunca vaza pro client.
function pinDoNumero(phoneNumberId: string): string {
  const h = createHmac('sha256', process.env.WHATSAPP_APP_SECRET ?? '')
    .update(`register:${phoneNumberId}`)
    .digest()
  return String(h.readUInt32BE(0) % 1_000_000).padStart(6, '0')
}

// Mesma regra das chamadas Graph em lib/whatsapp.ts: request externo
// pendurado não pode segurar a função serverless até o timeout do Vercel.
async function graph(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
    signal: AbortSignal.timeout(8000),
    ...init,
  })
}

// Loga o erro da Graph API sem nunca ecoar token (nem o nosso app secret,
// que a Meta às vezes devolve mascarado em mensagens de erro de OAuth).
async function logGraphErro(etapa: string, resp: Response): Promise<void> {
  let detalhe = ''
  try {
    const j = await resp.json()
    detalhe = String(j?.error?.message ?? '')
  } catch {
    /* corpo não-JSON — só o status já ajuda */
  }
  console.error(`[whatsapp-connect] ${etapa} falhou:`, resp.status, detalhe)
}

export async function POST(req: NextRequest) {
  // Kill-switch: sem o app id, o Embedded Signup ainda não foi liberado
  // pela Meta — recusa antes de qualquer trabalho.
  const appId = process.env.WHATSAPP_APP_ID
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appId || !appSecret) {
    return cors(NextResponse.json({ error: 'not_available' }, { status: 503 }))
  }

  // 1. Autenticação: JWT do corretor logado no tool.html.
  const jwt = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!jwt) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
  const supabase = admin()
  const { data: auth, error: authErr } = await supabase.auth.getUser(jwt)
  if (authErr || !auth?.user) {
    return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
  }

  // Gate de assinatura SERVER-SIDE. Mesma regra do authGate do tool.html:
  // bloqueia 'inactive' (cancelou/reembolsou) em vez de exigir === 'active',
  // porque contas criadas fora do fluxo Hotmart (fundador, membros de equipe
  // convidados) não têm o campo — e app_metadata não é editável pelo client,
  // então a checagem é confiável.
  const subStatus = (auth.user.app_metadata as Record<string, unknown>)?.subscription_status
  if (subStatus === 'inactive') {
    return cors(NextResponse.json({ error: 'subscription_inactive' }, { status: 403 }))
  }
  const userId = auth.user.id

  // 2. Payload do popup do Embedded Signup: o FB SDK devolve o code no
  // FB.login e o phone_number_id/waba_id chegam pela message do popup.
  let body: { code?: string; phoneNumberId?: string; wabaId?: string }
  try {
    body = await req.json()
  } catch {
    return cors(NextResponse.json({ error: 'invalid_json' }, { status: 400 }))
  }
  const code = String(body.code ?? '').trim()
  const phoneNumberId = String(body.phoneNumberId ?? '').trim()
  const wabaId = String(body.wabaId ?? '').trim()
  // Ids da Meta são numéricos — barra cedo qualquer coisa que pudesse
  // virar path traversal na URL da Graph API.
  if (!code || !/^\d+$/.test(phoneNumberId) || !/^\d+$/.test(wabaId)) {
    return cors(NextResponse.json({ error: 'missing_fields' }, { status: 400 }))
  }

  // Número já conectado por OUTRO corretor: não deixa "roubar" — a Meta até
  // permitiria (o token novo enxergaria o número), mas o dono do row é quem
  // conectou primeiro. Caso legítimo de troca de dono passa por suporte.
  const { data: existente, error: exErr } = await supabase
    .from('cpr_wa_numbers')
    .select('user_id')
    .eq('phone_number_id', phoneNumberId)
    .maybeSingle()
  if (exErr) {
    console.error('[whatsapp-connect] consulta cpr_wa_numbers falhou:', exErr.message)
    return cors(NextResponse.json({ error: 'internal' }, { status: 500 }))
  }
  if (existente && existente.user_id !== userId) {
    return cors(NextResponse.json({ error: 'number_taken' }, { status: 409 }))
  }

  try {
    // 3. Troca o code pelo business token do corretor. Token de Embedded
    // Signup não expira (armadilha 1 da seção 0: o que expira é o token
    // temporário do painel — este fluxo não passa por ele).
    const tokenResp = await graph(
      `oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`
    )
    if (!tokenResp.ok) {
      await logGraphErro('troca do code', tokenResp)
      return cors(NextResponse.json({ error: 'code_exchange_failed' }, { status: 502 }))
    }
    const accessToken = String((await tokenResp.json())?.access_token ?? '')
    if (!accessToken) {
      console.error('[whatsapp-connect] troca do code retornou sem access_token')
      return cors(NextResponse.json({ error: 'code_exchange_failed' }, { status: 502 }))
    }
    const authHeader = { authorization: `Bearer ${accessToken}` }

    // 4. Confere que o token enxerga o número informado — impede um corretor
    // logado de mandar o phone_number_id de outra pessoa junto de um code
    // válido do próprio WhatsApp. De quebra, traz o número de exibição.
    const phoneResp = await graph(
      `${phoneNumberId}?fields=display_phone_number,verified_name`,
      { headers: authHeader }
    )
    if (!phoneResp.ok) {
      await logGraphErro('validação do número', phoneResp)
      return cors(NextResponse.json({ error: 'phone_not_accessible' }, { status: 403 }))
    }
    const displayNumber = String((await phoneResp.json())?.display_phone_number ?? '') || null

    // 5. Inscreve o app no WABA do corretor — sem isso, o webhook nunca
    // recebe evento desse número (armadilha 2 da seção 0 do plano).
    const subResp = await graph(`${wabaId}/subscribed_apps`, {
      method: 'POST',
      headers: authHeader,
    })
    if (!subResp.ok) {
      await logGraphErro('subscribed_apps', subResp)
      return cors(NextResponse.json({ error: 'subscribe_failed' }, { status: 502 }))
    }

    // 6. Registra o número na Cloud API. Best-effort: número que entra em
    // coexistência (mantendo o app do celular) já chega registrado e este
    // POST falha — não é erro do fluxo, então só loga e segue.
    let registered = true
    const regResp = await graph(`${phoneNumberId}/register`, {
      method: 'POST',
      headers: { ...authHeader, 'content-type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        pin: pinDoNumero(phoneNumberId),
      }),
    })
    if (!regResp.ok) {
      registered = false
      await logGraphErro('register (best-effort)', regResp)
    }

    // 7. Persiste — a partir daqui o webhook atende o número com o token
    // do próprio corretor (fallback de env nunca é usado pra ele).
    const { error: upErr } = await supabase.from('cpr_wa_numbers').upsert(
      {
        phone_number_id: phoneNumberId,
        user_id: userId,
        display_number: displayNumber,
        access_token: accessToken,
        waba_id: wabaId,
        bot_enabled: true,
      },
      { onConflict: 'phone_number_id' }
    )
    if (upErr) {
      console.error('[whatsapp-connect] upsert cpr_wa_numbers falhou:', upErr.message)
      return cors(NextResponse.json({ error: 'internal' }, { status: 500 }))
    }

    return cors(NextResponse.json({ ok: true, phoneNumberId, displayNumber, registered }))
  } catch (err) {
    // Timeout/rede da Graph API — nada foi persistido, o corretor tenta de novo.
    console.error('[whatsapp-connect] erro inesperado:', err)
    return cors(NextResponse.json({ error: 'internal' }, { status: 500 }))
  }
}
