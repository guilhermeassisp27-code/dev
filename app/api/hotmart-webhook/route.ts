import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Hotmart sends the token in this header for webhook validation
const HOTTOK_HEADER = 'x-hotmart-hottok'

export async function POST(req: NextRequest) {
  const token =
    req.headers.get(HOTTOK_HEADER) ||
    req.nextUrl.searchParams.get('hottok')

  if (!process.env.HOTMART_WEBHOOK_TOKEN || token !== process.env.HOTMART_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = String(body?.event ?? '')
  const buyer = (body?.data as Record<string, unknown>)?.buyer as Record<string, string> | undefined
  const purchase = (body?.data as Record<string, unknown>)?.purchase as Record<string, string> | undefined

  if (!buyer?.email) {
    return NextResponse.json({ error: 'Missing buyer.email' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const appUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? '') ||
    'https://corretorpro-dusky.vercel.app'
  // Novo comprador é convidado a DEFINIR A SENHA antes de acessar a ferramenta
  const setPasswordUrl = `${appUrl}/definir-senha`

  if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
    const { error } = await supabase.auth.admin.inviteUserByEmail(buyer.email, {
      data: {
        full_name: buyer.name ?? '',
        hotmart_transaction: purchase?.transaction ?? '',
        plan: 'corretorpro',
      },
      redirectTo: setPasswordUrl,
    })

    // Usuário já existe (recompra/renovação) — reenvia link para redefinir a senha
    if (error) {
      await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: buyer.email,
        options: { redirectTo: setPasswordUrl },
      })
    }
  }

  if (
    event === 'PURCHASE_REFUNDED' ||
    event === 'PURCHASE_CANCELLED' ||
    event === 'PURCHASE_CHARGEBACK'
  ) {
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const user = users.find((u) => u.email === buyer.email)
    if (user) {
      // Ban for ~10 years (effectively permanent)
      await supabase.auth.admin.updateUserById(user.id, { ban_duration: '87600h' })
    }
  }

  return NextResponse.json({ ok: true })
}
