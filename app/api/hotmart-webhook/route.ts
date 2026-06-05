import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Hotmart sends the token in this header for webhook validation
const HOTTOK_HEADER = 'x-hotmart-hottok'

// Mapeamento dos códigos de oferta (off=) dos links de pagamento -> plano
//   Mensal: https://pay.hotmart.com/L106145948O?off=hgn79gvq
//   Anual:  https://pay.hotmart.com/L106145948O?off=mcjyy7ub
const OFFER_PLANS: Record<string, string> = {
  hgn79gvq: 'mensal',
  mcjyy7ub: 'anual',
}

// Descobre o plano a partir do código de oferta vindo no payload da Hotmart.
// A Hotmart pode enviar o código em data.purchase.offer.code (compra)
// ou em data.subscription.plan / data.purchase.offer (assinatura).
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
  const data = (body?.data as Record<string, unknown>) ?? {}
  const buyer = data?.buyer as Record<string, string> | undefined
  const purchase = data?.purchase as Record<string, string> | undefined
  const plan = resolvePlan(data)

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

  // Localiza um usuário existente pelo email (renovação, cancelamento, etc.)
  async function findUser(email: string) {
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    return users.find((u) => u.email === email)
  }

  // Eventos que LIBERAM acesso: nova assinatura, compra aprovada ou renovação
  if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
    const existing = await findUser(buyer.email)

    if (existing) {
      // Já tem conta (renovação ou reassinatura após cancelar) — reativa o acesso
      await supabase.auth.admin.updateUserById(existing.id, {
        ban_duration: 'none',
        user_metadata: {
          ...(existing.user_metadata ?? {}),
          plan,
          hotmart_transaction: purchase?.transaction ?? existing.user_metadata?.hotmart_transaction ?? '',
        },
      })
      // Só envia link de senha se a conta ainda não foi ativada (sem senha definida)
      const semSenha = !existing.last_sign_in_at
      if (semSenha) {
        await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: buyer.email,
          options: { redirectTo: setPasswordUrl },
        })
      }
    } else {
      // Novo comprador — convida a definir a senha
      await supabase.auth.admin.inviteUserByEmail(buyer.email, {
        data: {
          full_name: buyer.name ?? '',
          hotmart_transaction: purchase?.transaction ?? '',
          plan,
        },
        redirectTo: setPasswordUrl,
      })
    }
  }

  // Eventos que CORTAM acesso: reembolso, chargeback, cancelamento da assinatura
  if (
    event === 'PURCHASE_REFUNDED' ||
    event === 'PURCHASE_CANCELLED' ||   // grafia BR usada em alguns planos
    event === 'PURCHASE_CANCELED' ||    // grafia EN usada em outros eventos Hotmart
    event === 'PURCHASE_CHARGEBACK' ||
    event === 'SUBSCRIPTION_CANCELLATION'
  ) {
    const user = await findUser(buyer.email)
    if (user) {
      // Banimento de ~10 anos (efetivamente permanente até reassinar)
      await supabase.auth.admin.updateUserById(user.id, { ban_duration: '87600h' })
    }
  }

  return NextResponse.json({ ok: true })
}
