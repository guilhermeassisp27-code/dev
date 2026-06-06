import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email'

// Hotmart sends the token in this header for webhook validation
const HOTTOK_HEADER = 'x-hotmart-hottok'

// Mapeamento dos códigos de oferta (off=) dos links de pagamento -> plano
//   Mensal: https://pay.hotmart.com/L106145948O?off=hgn79gvq
//   Anual:  https://pay.hotmart.com/L106145948O?off=mcjyy7ub
const OFFER_PLANS: Record<string, string> = {
  hgn79gvq: 'mensal',
  mcjyy7ub: 'anual',
}

// Formato do retorno de admin.generateLink (contém o link de ação pronto)
type ActionLinkData = { properties?: { action_link?: string } }

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const appUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '') ||
    'https://usecorretorpro.vercel.app'
  // Novo comprador é convidado a DEFINIR A SENHA antes de acessar a ferramenta
  const setPasswordUrl = `${appUrl}/definir-senha`

  // Localiza um usuário existente pelo email (renovação, cancelamento, etc.).
  // Pagina a lista para funcionar mesmo acima de 1000 usuários.
  async function findUser(email: string) {
    const alvo = email.toLowerCase()
    const perPage = 200
    for (let page = 1; page <= 500; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) break
      const users = data?.users ?? []
      const achado = users.find((u) => (u.email ?? '').toLowerCase() === alvo)
      if (achado) return achado
      if (users.length < perPage) break // última página
    }
    return undefined
  }

  // Eventos que LIBERAM acesso: nova assinatura, compra aprovada ou renovação
  if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
    const existing = await findUser(buyer.email)

    if (existing) {
      // Já tem conta (renovação, reassinatura, ou 2º evento da MESMA compra —
      // a Hotmart dispara PURCHASE_APPROVED e PURCHASE_COMPLETE). Reativa acesso.
      // O status fica em app_metadata (NÃO editável pelo usuário) — é o que a
      // ferramenta consulta para liberar o uso.
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
      // (Re)envia o link só se a conta nunca foi ativada (sem senha) E ainda não
      // enviamos o email de acesso. Isso evita email duplicado quando a Hotmart
      // manda dois eventos para a mesma compra, e não incomoda quem já tem senha.
      if (!existing.last_sign_in_at && !jaEnviou) {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: buyer.email,
          options: { redirectTo: setPasswordUrl },
        })
        const actionLink = (linkData as ActionLinkData)?.properties?.action_link
        if (actionLink) {
          const r = await sendWelcomeEmail({ to: buyer.email, actionLink, name: buyer.name })
          if (r.sent) {
            await supabase.auth.admin.updateUserById(existing.id, {
              app_metadata: {
                ...(existing.app_metadata ?? {}),
                subscription_status: 'active',
                plan,
                welcome_sent: true,
              },
            })
          } else {
            console.error('[hotmart-webhook] welcome email falhou (existing):', r.reason)
          }
        }
      }
    } else {
      // Novo comprador — generateLink type:invite CRIA o usuário e retorna o
      // action_link, SEM disparar o email do Supabase. Nós enviamos via Resend
      // (controle total de entregabilidade) logo em seguida.
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email: buyer.email,
        options: {
          data: {
            full_name: buyer.name ?? '',
            hotmart_transaction: purchase?.transaction ?? '',
            plan,
          },
          redirectTo: setPasswordUrl,
        },
      })

      if (linkErr) {
        // Corrida rara: dois eventos simultâneos, o outro já criou o usuário.
        // "already registered" não é erro real — o próximo evento/retry resolve.
        if (/already|registered|exist/i.test(linkErr.message)) {
          return NextResponse.json({ ok: true, note: 'user already created by concurrent event' })
        }
        console.error('[hotmart-webhook] generateLink invite falhou:', linkErr.message)
        return NextResponse.json({ error: 'Falha ao criar acesso do comprador' }, { status: 500 })
      }

      const actionLink = (linkData as ActionLinkData)?.properties?.action_link
      const newUserId = (linkData as { user?: { id?: string } })?.user?.id

      // Envia o email primeiro para gravar o resultado em welcome_sent.
      let emailOk = false
      if (actionLink) {
        const r = await sendWelcomeEmail({ to: buyer.email, actionLink, name: buyer.name })
        emailOk = r.sent
        if (!r.sent) {
          // Não derruba o webhook: o usuário foi criado. Logamos para reenvio
          // manual via /api/admin/invite caso o email não saia.
          console.error('[hotmart-webhook] welcome email falhou (novo):', r.reason)
        }
      }

      // Marca assinatura ativa em app_metadata (generateLink grava só
      // user_metadata; o status seguro precisa ir em app_metadata).
      if (newUserId) {
        await supabase.auth.admin.updateUserById(newUserId, {
          app_metadata: { subscription_status: 'active', plan, welcome_sent: emailOk },
        })
      }
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
      // Marca como inativo (a ferramenta bloqueia na hora) E bane a conta
      // (~10 anos) para impedir refresh/login até reassinar.
      await supabase.auth.admin.updateUserById(user.id, {
        ban_duration: '87600h',
        app_metadata: {
          ...(user.app_metadata ?? {}),
          subscription_status: 'inactive',
        },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
