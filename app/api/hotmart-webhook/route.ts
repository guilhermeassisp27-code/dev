import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Hotmart envia o token neste header para validar o webhook
const HOTTOK_HEADER = 'x-hotmart-hottok'

// Mapeamento dos códigos de oferta (off=) dos links de pagamento -> plano
//   Produto novo (Selo):
//     Mensal: https://pay.hotmart.com/Y106494635I?off=35qlpvdb
//     Anual:  https://pay.hotmart.com/Y106494635I?off=xs8grn1m
//   Produto antigo (CorretorPRO — mantido para assinantes já ativos):
//     Mensal: https://pay.hotmart.com/L106145948O?off=hgn79gvq
//     Anual:  https://pay.hotmart.com/L106145948O?off=mcjyy7ub
const OFFER_PLANS: Record<string, string> = {
  '35qlpvdb': 'mensal',
  'xs8grn1m': 'anual',
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

// Escapa HTML básico — buyer.name vem direto do que o comprador digitou no
// checkout da Hotmart, não confiar nele cru dentro do htmlContent do email.
function escHtmlEmail(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Email de recuperação de carrinho abandonado, via API transacional da
// Brevo (mesmo provedor já usado para o SMTP do Supabase, agora chamado
// direto pela API — requer BREVO_API_KEY e BREVO_SENDER_EMAIL no Vercel).
async function enviarEmailRecuperacao(destino: string, nome: string, plano: string): Promise<boolean> {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.error('[hotmart-webhook] BREVO_API_KEY ou BREVO_SENDER_EMAIL não configurados — pulando email de recuperação')
    return false
  }
  const primeiroNome = escHtmlEmail(nome.split(' ')[0] || 'tudo bem')
  const offerCode = plano === 'anual' ? 'xs8grn1m' : '35qlpvdb'
  const checkoutUrl = `https://pay.hotmart.com/Y106494635I?off=${offerCode}`

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Selo', email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email: destino, name: nome || undefined }],
        subject: 'Você quase assinou — e agora o Selo faz ainda mais',
        htmlContent: `
          <p>Oi, ${primeiroNome}!</p>
          <p>Vi que você começou a assinar o Selo e não finalizou — sem problema. Queria te contar uma novidade que talvez mude a sua decisão.</p>
          <p>Agora o Selo cobre <b>toda a jornada do corretor autônomo</b>, num lugar só:</p>
          <ul>
            <li><b>Capta o cliente</b> — um link com a sua marca pra bio do Instagram e status do WhatsApp; o lead cai direto na sua agenda, até enquanto você dorme.</li>
            <li><b>Organiza a visita</b> — Agenda de Visitas pra você nunca mais perder um follow-up.</li>
            <li><b>Protege a sua comissão</b> — Registro de Visita com amparo legal, assinado na hora.</li>
            <li><b>Fecha com proposta profissional</b> — com o seu logo e CRECI, em 60 segundos, pronta pro WhatsApp.</li>
          </ul>
          <p>Sozinho, com a estrutura de uma imobiliária inteira. Garantia incondicional de 7 dias.</p>
          <p><a href="${checkoutUrl}">Voltar e finalizar minha assinatura</a></p>
          <p>Ficou alguma dúvida — preço, a ferramenta ou só não era o momento? É só responder este email que eu te ajudo pessoalmente.</p>
        `,
      }),
    })
    if (!resp.ok) {
      console.error('[hotmart-webhook] envio Brevo falhou:', resp.status, await resp.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[hotmart-webhook] erro ao chamar Brevo:', err)
    return false
  }
}

export async function POST(req: NextRequest) {
  const token =
    req.headers.get(HOTTOK_HEADER) ||
    req.nextUrl.searchParams.get('hottok')

  // Aceita uma lista separada por vírgula: durante a transição CorretorPRO -> Selo,
  // os dois produtos Hotmart (antigo, com assinantes ativos, e o novo) enviam hottoks
  // diferentes para este mesmo endpoint.
  const tokensValidos = (process.env.HOTMART_WEBHOOK_TOKEN ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  if (tokensValidos.length === 0) {
    return NextResponse.json({ error: 'HOTMART_WEBHOOK_TOKEN not configured on server' }, { status: 500 })
  }
  if (!token || !tokensValidos.includes(token)) {
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
  // Eventos de assinatura (ex: SUBSCRIPTION_CANCELLATION) não mandam `buyer`,
  // só `subscriber` — sem esse fallback o webhook de cancelamento retornava
  // 400 antes de chegar na lógica de revogação, e o usuário nunca era banido.
  const subscriber = data?.subscriber as Record<string, string> | undefined
  const purchase = data?.purchase as Record<string, string> | undefined
  const plan = resolvePlan(data)

  const buyerEmail = buyer?.email ?? subscriber?.email
  if (!buyerEmail) {
    return NextResponse.json({ error: 'Missing buyer/subscriber email' }, { status: 400 })
  }
  const email = buyerEmail.toLowerCase()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const appUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '') ||
    'https://selosales.com.br'
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
        full_name: buyer?.name ?? '',
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

  // CARRINHO ABANDONADO: comprador iniciou o checkout e não concluiu.
  // Guarda o lead (não cria conta) e dispara email de recuperação via Brevo.
  if (event === 'PURCHASE_OUT_OF_SHOPPING_CART') {
    const rawDigits = (buyer?.phone ?? '').replace(/\D/g, '')
    // A Hotmart nem sempre manda o DDI junto — quando o número já tem
    // DDD+9 dígitos e começa com 55, ele já está embutido; sem essa checagem
    // o link saía como wa.me/555511999999999 (DDI duplicado, link inválido).
    const phoneDigits = rawDigits.startsWith('55') && rawDigits.length >= 12 ? rawDigits.slice(2) : rawDigits
    const whatsappLink = phoneDigits
      ? `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(
          `Oi ${buyer?.name?.split(' ')[0] ?? ''}! Aqui é do Selo. Vi que você começou a assinar e não finalizou — ficou alguma dúvida? Acabamos de lançar o link de captação de leads: o cliente preenche e cai direto na sua agenda, aí é só agendar a visita, emitir o Registro de Visita (que protege sua comissão) e mandar a proposta. Posso te mostrar funcionando em 2 min?`
        )}`
      : null

    await supabase.from('cpr_abandoned_carts').upsert(
      {
        email,
        name: buyer?.name ?? '',
        phone: buyer?.phone ?? '',
        plan,
        whatsapp_link: whatsappLink,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )

    // Reivindica o envio de forma atômica (update condicional + select dos
    // afetados): se a Hotmart disparar o mesmo evento 2x quase junto, só a
    // requisição que conseguir virar email_sent para true segue pro envio —
    // evita reenviar o email de recuperação duplicado.
    const { data: claimed } = await supabase
      .from('cpr_abandoned_carts')
      .update({ email_sent: true })
      .eq('email', email)
      .or('email_sent.is.null,email_sent.eq.false')
      .select('email')

    if (claimed && claimed.length > 0) {
      const emailOk = await enviarEmailRecuperacao(email, buyer?.name ?? '', plan)
      if (!emailOk) {
        // Envio falhou: libera a reivindicação para uma próxima tentativa.
        await supabase.from('cpr_abandoned_carts').update({ email_sent: false }).eq('email', email)
      }
    }

    return NextResponse.json({ ok: true, action: 'abandoned_cart_logged' })
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
    } else {
      console.error('[hotmart-webhook] cancelamento recebido mas usuário não encontrado:', email, event)
    }
    return NextResponse.json({ ok: true, action: 'revoked' })
  }

  console.error('[hotmart-webhook] evento ignorado (sem handler):', event)
  return NextResponse.json({ ok: true, action: 'ignored', event })
}
