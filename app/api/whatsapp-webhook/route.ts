import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { sendWhatsAppText, WaWebhookBody, WaChangeValue } from '@/lib/whatsapp'
import { generateBotTurn, HistoryMessage, LeadData } from '@/lib/leadbot'
import { notificarHandoffPorEmail } from '@/lib/notificacoes'

// Webhook da WhatsApp Business Cloud API (Meta).
// GET  = verificação do endpoint (hub.challenge) na configuração do app.
// POST = eventos: mensagens de leads e ecos de mensagens enviadas pelo
//        corretor no app (modo coexistência).

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
type AdminClient = ReturnType<typeof adminClient>

// Resume os dados coletados pelo bot numa frase curta — vira o campo
// "mensagem" do card no inbox de leads do Selo (mesmo componente usado pela
// captura pública).
function resumoLead(lead: LeadData): string {
  const partes = [lead.intencao, lead.tipo_imovel, lead.regiao && `região: ${lead.regiao}`, lead.faixa_preco && `faixa: ${lead.faixa_preco}`, lead.prazo && `prazo: ${lead.prazo}`]
    .filter((p): p is string => Boolean(p))
  return partes.join(' · ')
}

// Registra o lead do WhatsApp no mesmo inbox (cpr_public_leads) que já
// alimenta a tela "Leads recebidos" do Selo — o corretor vê e decide aceitar
// ou descartar, igual à captação pública. Mesmo padrão de dedupe por
// telefone usado em app/api/captura/route.ts: atualiza o card pendente já
// existente em vez de duplicar a cada mensagem nova da mesma conversa.
async function registrarLeadNoInbox(
  supabase: AdminClient,
  ownerId: string,
  leadPhone: string,
  leadName: string | null,
  lead: LeadData,
  textoBruto?: string
): Promise<void> {
  const telefone = `+${leadPhone}`
  const nome = leadName || 'Lead do WhatsApp'
  const mensagem = resumoLead(lead) || textoBruto || 'Conversa em andamento pelo WhatsApp.'
  const imovel = lead.tipo_imovel ?? ''

  const { data: existing } = await supabase
    .from('cpr_public_leads')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('telefone', telefone)
    .eq('status', 'pendente')
    .maybeSingle()

  if (existing) {
    await supabase
      .from('cpr_public_leads')
      .update({ nome, imovel, mensagem, created_at: new Date().toISOString() })
      .eq('id', existing.id)
    return
  }

  await supabase.from('cpr_public_leads').insert({
    owner_id: ownerId,
    nome,
    telefone,
    imovel,
    mensagem,
    origem: 'whatsapp',
    status: 'pendente',
  })
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  if (
    verifyToken &&
    params.get('hub.mode') === 'subscribe' &&
    params.get('hub.verify_token') === verifyToken
  ) {
    return new NextResponse(params.get('hub.challenge') ?? '', { status: 200 })
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// A Meta assina o corpo cru com o app secret (X-Hub-Signature-256).
// Mesma razão do hottok no webhook Hotmart: sem isso, qualquer um posta
// eventos falsos e conversa com os leads em nome do corretor.
function assinaturaValida(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret || !header?.startsWith('sha256=')) return false
  const esperado = createHmac('sha256', secret).update(rawBody).digest('hex')
  const recebido = header.slice('sha256='.length)
  const ba = Buffer.from(esperado)
  const bb = Buffer.from(recebido)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

const PAUSA_CORRETOR_HORAS = 24
const HISTORICO_MAX = 30

async function processarMensagens(
  supabase: AdminClient,
  value: WaChangeValue,
  ehEcoDoCorretor: boolean
): Promise<void> {
  const phoneNumberId = value.metadata?.phone_number_id
  if (!phoneNumberId || !value.messages?.length) return

  const { data: numero, error: numeroErr } = await supabase
    .from('cpr_wa_numbers')
    .select('user_id, bot_enabled, access_token')
    .eq('phone_number_id', phoneNumberId)
    .maybeSingle()
  if (numeroErr) {
    console.error('[whatsapp-webhook] erro ao consultar cpr_wa_numbers:', phoneNumberId, numeroErr.message)
    return
  }
  if (!numero) {
    console.error('[whatsapp-webhook] phone_number_id sem corretor cadastrado:', phoneNumberId)
    return
  }

  const leadName = value.contacts?.[0]?.profile?.name ?? null

  for (const msg of value.messages) {
    if (msg.type !== 'text' || !msg.text?.body) continue

    // No eco, `from` é o número do negócio; o lead é o destinatário.
    const leadPhone = ehEcoDoCorretor
      ? String((msg as unknown as Record<string, unknown>).to ?? '')
      : msg.from
    if (!leadPhone) continue

    const { data: conv, error: convErr } = await supabase
      .from('cpr_wa_conversations')
      .upsert(
        {
          user_id: numero.user_id,
          phone_number_id: phoneNumberId,
          lead_phone: leadPhone,
          ...(leadName ? { lead_name: leadName } : {}),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone_number_id,lead_phone' }
      )
      .select('id, status, paused_until, lead_data')
      .single()
    if (convErr || !conv) {
      console.error('[whatsapp-webhook] upsert de conversa falhou:', convErr?.message)
      continue
    }

    // Idempotência: a Meta reenvia eventos em falha; o unique em
    // wa_message_id garante que a retentativa não gera resposta duplicada.
    const { error: insErr } = await supabase.from('cpr_wa_messages').insert({
      conversation_id: conv.id,
      wa_message_id: msg.id,
      direction: ehEcoDoCorretor ? 'corretor' : 'inbound',
      body: msg.text.body,
    })
    if (insErr) {
      if (insErr.code !== '23505') {
        console.error('[whatsapp-webhook] insert de mensagem falhou:', insErr.message)
      }
      continue // duplicada (ou erro): não responde de novo
    }

    // Corretor respondeu manualmente pelo app: o bot sai da conversa por
    // 24h para não atropelar o atendimento humano (regra do piloto).
    if (ehEcoDoCorretor) {
      await supabase
        .from('cpr_wa_conversations')
        .update({
          status: 'paused',
          paused_until: new Date(Date.now() + PAUSA_CORRETOR_HORAS * 3600_000).toISOString(),
        })
        .eq('id', conv.id)
      continue
    }

    if (!numero.bot_enabled) continue
    if (conv.status === 'handoff') continue
    if (conv.status === 'paused' && conv.paused_until && new Date(conv.paused_until) > new Date()) {
      continue
    }

    const { data: hist } = await supabase
      .from('cpr_wa_messages')
      .select('direction, body')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(HISTORICO_MAX)
    const history = ((hist ?? []) as HistoryMessage[]).reverse()

    const { data: u } = await supabase.auth.admin.getUserById(numero.user_id)
    const corretorNome =
      String((u?.user?.user_metadata as Record<string, unknown>)?.full_name ?? '') || 'corretor'

    const turn = await generateBotTurn(
      corretorNome,
      history,
      (conv.lead_data ?? {}) as LeadData
    )

    // Registra/atualiza o lead no inbox do Selo a cada turno — o corretor
    // precisa ver o lead assim que ele manda mensagem, mesmo que a IA ou o
    // envio da resposta falhem em seguida (por isso vem antes do `continue`).
    await registrarLeadNoInbox(
      supabase,
      numero.user_id,
      leadPhone,
      leadName,
      turn?.lead ?? ((conv.lead_data ?? {}) as LeadData),
      turn?.lead ? undefined : msg.text.body
    )

    if (!turn?.reply) continue

    const enviado = await sendWhatsAppText(
      phoneNumberId,
      leadPhone,
      turn.reply,
      (numero as { access_token?: string | null }).access_token
    )
    if (!enviado) continue

    await supabase.from('cpr_wa_messages').insert({
      conversation_id: conv.id,
      direction: 'outbound',
      body: turn.reply,
    })
    await supabase
      .from('cpr_wa_conversations')
      .update({
        lead_data: turn.lead,
        ...(turn.handoff ? { status: 'handoff' } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conv.id)

    // Notifica o corretor no handoff — o momento em que o lead está pronto
    // e esfria rápido. Dispara só na TRANSIÇÃO: o guard de status handoff
    // lá em cima impede que a conversa gere outro turno do bot depois, então
    // este ponto roda uma única vez por conversa. Best-effort: falha de
    // email não derruba o webhook (o lead já está no inbox de todo jeito).
    if (turn.handoff && u?.user?.email) {
      await notificarHandoffPorEmail({
        para: u.user.email,
        corretorNome,
        leadNome: leadName || 'Lead do WhatsApp',
        leadPhone,
        resumo: resumoLead(turn.lead),
      })
    }
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  if (!assinaturaValida(rawBody, req.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: WaWebhookBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (body.object !== 'whatsapp_business_account') {
    return NextResponse.json({ ok: true, action: 'ignored' })
  }

  const supabase = adminClient()

  // Erros de processamento são logados mas respondem 200: o unique de
  // wa_message_id já protege contra retentativa duplicada da Meta, e um
  // retry storm de eventos com falha permanente só amplificaria o problema.
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (!change.value) continue
      try {
        if (change.field === 'messages') {
          await processarMensagens(supabase, change.value, false)
        } else if (change.field === 'smb_message_echoes') {
          await processarMensagens(supabase, change.value, true)
        }
      } catch (err) {
        console.error('[whatsapp-webhook] processamento falhou:', err)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
