import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Achado C5 da auditoria (2026-07-03): este endpoint autenticava com a
// SERVICE ROLE KEY passada como query param (?token=) — a chave mais
// poderosa do projeto (bypass total de RLS + admin de Auth) trafegando em
// URL, que fica gravada em histórico de navegador, logs de acesso do
// Vercel/proxies, e qualquer lugar por onde a URL passe. Um vazamento ali
// seria comprometimento total do banco.
//
// Agora usa um token DEDICADO (ADMIN_API_TOKEN — gere um valor aleatório
// próprio, não reaproveite nenhuma outra chave) e SÓ via header. O suporte
// a query string foi removido de propósito: se você colava a URL direto no
// navegador, troque por curl -H "x-admin-token: ..." (já é como o POST
// sempre foi documentado — ver docs/email-acesso-setup.md).
function checkAuth(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  return !!process.env.ADMIN_API_TOKEN && token === process.env.ADMIN_API_TOKEN
}

function getAppUrl() {
  return (
    (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '') ||
    'https://selosales.com.br'
  )
}

type ActionLinkData = { properties?: { action_link?: string } }

// Achado C6 da auditoria: caminho rápido via função SQL indexada
// (cpr_user_id_by_email); o scan paginado fica só como fallback
// pré-migração.
async function findUser(supabase: ReturnType<typeof getSupabase>, email: string) {
  const alvo = email.toLowerCase()
  const rpc = await supabase.rpc('cpr_user_id_by_email', { p_email: alvo })
  if (!rpc.error) {
    if (!rpc.data) return undefined
    const { data, error } = await supabase.auth.admin.getUserById(String(rpc.data))
    if (!error && data?.user) return data.user
    return undefined
  }
  console.error('[admin/invite] rpc cpr_user_id_by_email indisponível, usando scan:', rpc.error.message)
  const perPage = 200
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) break
    const users = data?.users ?? []
    const found = users.find((u) => (u.email ?? '').toLowerCase() === alvo)
    if (found) return found
    if (users.length < perPage) break
  }
  return undefined
}

// GET /api/admin/invite?email=X[&mode=send|link][&plan=...]
// Autentica via header x-admin-token (ver checkAuth) — nunca por query
// string. Use curl: veja docs/email-acesso-setup.md para os comandos.
//   - sem mode: só consulta o status do usuário
//   - mode=send: garante a conta ativa e DISPARA o email de definir senha (Brevo)
//   - mode=link: garante a conta ativa e RETORNA o actionLink (envio manual)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const emailParam = params.get('email')
  if (!emailParam) {
    return NextResponse.json({ error: 'Missing email param' }, { status: 400 })
  }
  const email = emailParam.toLowerCase()
  const mode = params.get('mode')
  const plan = params.get('plan') ?? 'corretorpro'

  const supabase = getSupabase()
  const setPasswordUrl = `${getAppUrl()}/definir-senha`

  // Sem ação: apenas consulta
  if (mode !== 'send' && mode !== 'link') {
    const user = await findUser(supabase, email)
    if (!user) return NextResponse.json({ found: false, email })
    return NextResponse.json({
      found: true,
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed: !!user.email_confirmed_at,
      banned_until: (user as { banned_until?: string }).banned_until ?? null,
      app_metadata: user.app_metadata,
    })
  }

  // Garante que o usuário existe e está ativo (cria se não existir — simula a compra)
  let user = await findUser(supabase, email)
  if (!user) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { subscription_status: 'active', plan },
    })
    if (createErr && !/already|registered|exist/i.test(createErr.message)) {
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }
    user = created?.user ?? (await findUser(supabase, email))
  } else {
    await supabase.auth.admin.updateUserById(user.id, {
      ban_duration: 'none',
      app_metadata: { ...(user.app_metadata ?? {}), subscription_status: 'active', plan },
    })
  }
  if (!user) {
    return NextResponse.json({ error: 'Não foi possível criar/localizar o usuário' }, { status: 500 })
  }

  if (mode === 'link') {
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: setPasswordUrl },
    })
    if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })
    return NextResponse.json({
      ok: true,
      action: 'link_generated',
      userId: user.id,
      actionLink: (linkData as ActionLinkData)?.properties?.action_link,
    })
  }

  // mode === 'send' — dispara o email de definir senha pelo Brevo
  const { error: mailErr } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: setPasswordUrl,
  })
  return NextResponse.json({
    ok: true,
    action: 'email_sent',
    userId: user.id,
    emailSent: !mailErr,
    emailError: mailErr?.message,
    note: mailErr
      ? 'Falha no envio pelo Brevo — veja emailError.'
      : 'Email disparado pelo Brevo. Confira a caixa de entrada E o spam.',
  })
}

// POST /api/admin/invite — cria/ativa o comprador e dispara o email de definir
// senha pelo SMTP do Supabase (Brevo).
//
// Body: { "email": "...", "name"?: "...", "plan"?: "mensal|anual|corretorpro",
//         "mode"?: "link" }
//   - mode ausente: envia o email via Brevo (resetPasswordForEmail).
//   - mode "link":  NÃO envia email; retorna o actionLink para envio manual
//                   (WhatsApp). Use quando o email não estiver entregando.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { email?: string; name?: string; plan?: string; mode?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  const supabase = getSupabase()
  const email = body.email.toLowerCase()
  const setPasswordUrl = `${getAppUrl()}/definir-senha`
  const plan = body.plan ?? 'corretorpro'
  const modoLink = body.mode === 'link'

  // Garante que o usuário existe e está ativo
  let user = await findUser(supabase, email)
  if (!user) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: body.name ?? '', plan },
      app_metadata: { subscription_status: 'active', plan },
    })
    if (createErr && !/already|registered|exist/i.test(createErr.message)) {
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }
    user = created?.user ?? (await findUser(supabase, email))
  } else {
    await supabase.auth.admin.updateUserById(user.id, {
      ban_duration: 'none',
      app_metadata: { ...(user.app_metadata ?? {}), subscription_status: 'active', plan },
    })
  }

  if (!user) {
    return NextResponse.json({ error: 'Não foi possível criar/localizar o usuário' }, { status: 500 })
  }

  // Já tem senha definida? Então é só logar.
  if (user.last_sign_in_at) {
    return NextResponse.json({
      ok: true,
      action: 'access_reactivated',
      userId: user.id,
      loginUrl: `${getAppUrl()}/acesso`,
      note: 'Usuário já definiu senha. Acesso reativado — basta logar em loginUrl.',
    })
  }

  // Modo link: retorna o action_link para envio manual (não dispara email)
  if (modoLink) {
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: setPasswordUrl },
    })
    if (linkErr) {
      return NextResponse.json({ error: linkErr.message }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      action: 'link_generated',
      userId: user.id,
      actionLink: (linkData as ActionLinkData)?.properties?.action_link,
      note: 'Envie o actionLink direto pro comprador (WhatsApp). Abre a tela de definir senha.',
    })
  }

  // Modo padrão: dispara o email de definir senha via Brevo
  const { error: mailErr } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: setPasswordUrl,
  })

  return NextResponse.json({
    ok: true,
    action: 'email_sent',
    userId: user.id,
    emailSent: !mailErr,
    emailError: mailErr?.message,
    note: mailErr
      ? 'Falha ao enviar email pelo Brevo. Use mode:"link" para gerar o link e enviar manual.'
      : 'Email de definir senha enviado pelo Brevo.',
  })
}
