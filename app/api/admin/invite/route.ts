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

// POST /api/admin/invite — convida ou reenvia o email de definir senha
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
  const appUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '') ||
    'https://usecorretorpro.vercel.app'
  const setPasswordUrl = `${appUrl}/definir-senha`
  const plan = body.plan ?? 'corretorpro'

  const existing = await findUser(supabase, body.email)

  if (existing) {
    // Garante que o acesso está ativo e sem ban
    await supabase.auth.admin.updateUserById(existing.id, {
      ban_duration: 'none',
      app_metadata: {
        ...(existing.app_metadata ?? {}),
        subscription_status: 'active',
        plan,
      },
    })

    if (!existing.last_sign_in_at) {
      // Nunca fez login — tenta reenviar o convite
      const { data: resent, error: resendErr } = await supabase.auth.admin.inviteUserByEmail(
        body.email,
        {
          data: {
            full_name: body.name ?? (existing.user_metadata?.full_name as string) ?? '',
            plan,
          },
          redirectTo: setPasswordUrl,
        }
      )

      if (resendErr) {
        // Fallback: gera link de recovery e retorna para o admin enviar manualmente
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: body.email,
          options: { redirectTo: setPasswordUrl },
        })
        return NextResponse.json({
          ok: true,
          action: 'recovery_link_generated',
          userId: existing.id,
          setPasswordUrl: (linkData as { properties?: { action_link?: string } })?.properties?.action_link,
          note: 'Invite email could not be resent automatically. Share the setPasswordUrl link directly with the buyer.',
        })
      }

      return NextResponse.json({
        ok: true,
        action: 'invite_resent',
        userId: resent?.user?.id ?? existing.id,
      })
    }

    return NextResponse.json({
      ok: true,
      action: 'access_reactivated',
      userId: existing.id,
      note: 'User already set a password. Access reactivated — they can log in normally.',
    })
  }

  // Novo usuário — convida
  const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
    body.email,
    {
      data: { full_name: body.name ?? '', plan },
      redirectTo: setPasswordUrl,
    }
  )

  if (inviteErr) {
    return NextResponse.json({ error: inviteErr.message }, { status: 500 })
  }

  if (invited?.user?.id) {
    await supabase.auth.admin.updateUserById(invited.user.id, {
      app_metadata: { subscription_status: 'active', plan },
    })
  }

  return NextResponse.json({
    ok: true,
    action: 'invited_new_user',
    userId: invited?.user?.id,
  })
}
