import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function checkAuth(req: NextRequest) {
  const token =
    req.headers.get('x-admin-token') ||
    req.nextUrl.searchParams.get('token')
  return (
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    token === process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function getAppUrl() {
  return (
    (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '') ||
    'https://usecorretorpro.vercel.app'
  )
}

type ActionLinkData = { properties?: { action_link?: string } }

async function findUser(supabase: ReturnType<typeof getSupabase>, email: string) {
  const alvo = email.toLowerCase()
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

// GET /api/admin/invite?email=X&token=Y — consulta status do usuário
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'Missing email param' }, { status: 400 })
  }

  const supabase = getSupabase()
  const user = await findUser(supabase, email)

  if (!user) {
    return NextResponse.json({ found: false, email })
  }

  return NextResponse.json({
    found: true,
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    email_confirmed: !!user.email_confirmed_at,
    app_metadata: user.app_metadata,
  })
}

// POST /api/admin/invite — cria/ativa o comprador e SEMPRE retorna o link de
// definir senha (action_link). Assim você nunca depende da entrega de email do
// Supabase: pode mandar o link direto pro comprador por WhatsApp/email.
//
// Body: { "email": "...", "name"?: "...", "plan"?: "mensal|anual|corretorpro" }
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { email?: string; name?: string; plan?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  const supabase = getSupabase()
  const setPasswordUrl = `${getAppUrl()}/definir-senha`
  const plan = body.plan ?? 'corretorpro'

  const existing = await findUser(supabase, body.email)

  if (existing) {
    // Já existe: garante acesso ativo e sem ban
    await supabase.auth.admin.updateUserById(existing.id, {
      ban_duration: 'none',
      app_metadata: {
        ...(existing.app_metadata ?? {}),
        subscription_status: 'active',
        plan,
      },
    })

    if (existing.last_sign_in_at) {
      // Já definiu senha antes — é só logar
      return NextResponse.json({
        ok: true,
        action: 'access_reactivated',
        userId: existing.id,
        loginUrl: `${getAppUrl()}/acesso`,
        note: 'Usuario ja definiu senha. Acesso reativado — basta logar em loginUrl.',
      })
    }

    // Nunca logou — gera link de recovery (serve para definir a senha)
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: body.email,
      options: { redirectTo: setPasswordUrl },
    })

    if (linkErr) {
      return NextResponse.json({ error: linkErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      action: 'recovery_link_generated',
      userId: existing.id,
      actionLink: (linkData as ActionLinkData)?.properties?.action_link,
      note: 'Envie o actionLink direto para o comprador (WhatsApp/email). Ele abre a tela de definir senha.',
    })
  }

  // Novo comprador — generateLink type:invite CRIA o usuario e retorna o link
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: body.email,
    options: {
      data: { full_name: body.name ?? '', plan },
      redirectTo: setPasswordUrl,
    },
  })

  if (linkErr) {
    return NextResponse.json({ error: linkErr.message }, { status: 500 })
  }

  const newUserId = (linkData as { user?: { id?: string } })?.user?.id
  if (newUserId) {
    await supabase.auth.admin.updateUserById(newUserId, {
      app_metadata: { subscription_status: 'active', plan },
    })
  }

  return NextResponse.json({
    ok: true,
    action: 'invited_new_user',
    userId: newUserId,
    actionLink: (linkData as ActionLinkData)?.properties?.action_link,
    note: 'Envie o actionLink direto para o comprador (WhatsApp/email). Ele abre a tela de definir senha.',
  })
}
