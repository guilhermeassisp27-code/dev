import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Hotmart envia o token neste header para validar o webhook
const HOTTOK_HEADER = 'x-hotmart-hottok'

// Mapeamento dos códigos de oferta (off=) dos links de pagamento -> plano
//   Mensal: https://pay.hotmart.com/L106145948O?off=hgn79gvq
//   Anual:  https://pay.hotmart.com/L106145948O?off=mcjyy7ub
const OFFER_PLANS: Record<string, string> = {
  hgn79gvq: 'mensal',
  mcjyy7ub: 'anual',
}

// Descobre o plano a partir do código de oferta vindo no payload da Hotmart.
function resolvePlan(data: Record<string, unknown>): string {
  const purchase = data?.purchase as Record<string, unknown> | undefined
  const offer = purchase?.offer as Record<string, unknown> | undefined
  const offerCode = String(offer?.code ?? offer?.key ?? '')
  return OFFER_PLANS[offerCode] ?? 'corretorpro'
}

export async function POST(req: NextRequest) {
  const token =
    req.headers.get(HOTTOK_HEADER) ||
    req.nextUrl.searchParams.get('hottok')

  if (!process.env.HOTMART_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'HOTMART_WEBHOOK_TOKEN not configured on server' }, { status: 500 })
  }
  if (token !== process.env.HOTMART_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = String(body?.event ?? '')
  const data = (body?.data as Record<string, unknown>) ?? {}
  const buyer = data?.buyer as Record<string, string> | undefined
  const purchase = data?.purchase as Record<string, string> | undefined
  const plan = resolvePlan(data)

  if (!buyer?.email) {
    return NextResponse.json({ error: 'Missing buyer.email' }, { status: 400 })
  }
  const email = buyer.email.toLowerCase()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const appUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '') ||
    'https://usecorretorpro.vercel.app'
  // Novo comprador define a senha antes de acessar a ferramenta
  const setPasswordUrl = `${appUrl}/definir-senha`

  // Localiza um usuário existente pelo email (renovação, cancelamento, etc.).
  async function findUser(alvo: string) {
    const perPage = 200
    for (let page = 1; page <= 500; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) break
      const users = data?.users ?? []
      const achado = users.find((u) => (u.email ?? '').toLowerCase() === alvo)
      if (achado) return achado
      if (users.length < perPage) break
    }
    return undefined
  }

  // Envia o email de "definir senha" via o SMTP configurado no Supabase (Brevo).
  // resetPasswordForEmail dispara o template de recuperação pelo Brevo.
  async function enviarLinkSenha(): Promise<boolean> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: setPasswordUrl,
    })
    if (error) {
      console.error('[hotmart-webhook] envio do link de senha falhou:', error.message)
      return false
    }
    return true
  }

  // LIBERA acesso: compra aprovada, completa ou renovação
  if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
    const existing = await findUser(email)

    if (existing) {
      // Já existe (renovação, reassinatura, ou 2º evento da MESMA compra —
      // a Hotmart dispara PURCHASE_APPROVED e PURCHASE_COMPLETE). Reativa.
      const jaEnviou = (existing.app_metadata as Record<string, unknown>)?.welcome_sent === true
      await supabase.auth.admin.updateUserById(existing.id, {
        ban_duration: 'none',
        app_metadata: {
          ...(existing.app_metadata ?? {}),
          subscription_status: 'active',
          plan,
        },
        user_metadata: {
          ...(existing.user_metadata ?? {}),
          plan,
          hotmart_transaction: purchase?.transaction ?? existing.user_metadata?.hotmart_transaction ?? '',
        },
      })
      // (Re)envia o link só se nunca definiu senha E ainda não mandamos.
      // Evita email duplicado no 2º evento da mesma compra.
      if (!existing.last_sign_in_at && !jaEnviou) {
        const ok = await enviarLinkSenha()
        if (ok) {
          await supabase.auth.admin.updateUserById(existing.id, {
            app_metadata: { ...(existing.app_metadata ?? {}), subscription_status: 'active', plan, welcome_sent: true },
          })
        }
      }
      return NextResponse.json({ ok: true, action: 'reactivated' })
    }

    // Novo comprador. CRIA a conta primeiro (determinístico, não depende de
    // email) — assim quem pagou SEMPRE fica com acesso ativo. O email de
    // definir senha é enviado em seguida, como best-effort reenviável.
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: buyer.name ?? '',
        hotmart_transaction: purchase?.transaction ?? '',
        plan,
      },
      app_metadata: { subscription_status: 'active', plan },
    })

    if (createErr && !/already|registered|exist/i.test(createErr.message)) {
      // Erro real de criação — NÃO responde ok, para a Hotmart reenviar.
      console.error('[hotmart-webhook] createUser falhou:', createErr.message)
      return NextResponse.json({ error: 'Falha ao criar acesso do comprador' }, { status: 500 })
    }

    // Garante o id mesmo numa corrida (outro evento criou primeiro)
    const userId = created?.user?.id ?? (await findUser(email))?.id

    const emailOk = await enviarLinkSenha()
    if (userId) {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { subscription_status: 'active', plan, welcome_sent: emailOk },
      })
    }
    return NextResponse.json({ ok: true, action: 'created', emailSent: emailOk })
  }

  // CORTA acesso: reembolso, chargeback, cancelamento — NÃO deleta, só bane +
  // marca inativo (dados preservados; reassinar reativa).
  if (
    event === 'PURCHASE_REFUNDED' ||
    event === 'PURCHASE_CANCELLED' ||
    event === 'PURCHASE_CANCELED' ||
    event === 'PURCHASE_CHARGEBACK' ||
    event === 'SUBSCRIPTION_CANCELLATION'
  ) {
    const user = await findUser(email)
    if (user) {
      await supabase.auth.admin.updateUserById(user.id, {
        ban_duration: '87600h',
        app_metadata: {
          ...(user.app_metadata ?? {}),
          subscription_status: 'inactive',
        },
      })
    }
    return NextResponse.json({ ok: true, action: 'revoked' })
  }

  return NextResponse.json({ ok: true, action: 'ignored', event })
}
