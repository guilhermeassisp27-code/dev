// Notificações ao corretor (F1, item 5). Canal: email transacional via API
// da Brevo — decisão do fundador (2026-07-12). A Brevo já é o provedor da
// casa (o SMTP de auth do Supabase é Brevo); a regra continua sendo NÃO
// integrar Resend, SendGrid ou similar.
//
// Envio best-effort de propósito: notificação nunca pode derrubar o fluxo
// do webhook — o lead já está gravado no inbox quando este código roda, e o
// corretor o encontra lá mesmo se o email falhar.
//
// Envs (Vercel): BREVO_API_KEY (chave da API, não a de SMTP) e
// BREVO_FROM_EMAIL (remetente VERIFICADO no painel da Brevo — email de
// remetente não verificado é recusado). Sem as duas, o envio vira no-op
// logado — mesmo espírito do kill-switch do whatsapp-connect.

const TOOL_URL = (process.env.NEXT_PUBLIC_TOOL_URL ?? 'https://app.selosales.com.br').replace(/\/$/, '')

export interface HandoffEmail {
  para: string
  corretorNome: string
  leadNome: string
  leadPhone: string // dígitos, sem "+" (formato do webhook da Meta)
  resumo: string
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function notificarHandoffPorEmail(n: HandoffEmail): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY
  const fromEmail = process.env.BREVO_FROM_EMAIL
  if (!apiKey || !fromEmail) {
    console.error('[notificacoes] BREVO_API_KEY/BREVO_FROM_EMAIL ausentes — notificação de handoff não enviada')
    return false
  }

  const waLink = `https://wa.me/${n.leadPhone}`
  const oQueProcura = n.resumo || 'ver a conversa no Selo'

  const texto =
    `${n.corretorNome}, seu assistente terminou a triagem de um lead no WhatsApp e ele está pronto para falar com você.\n\n` +
    `Nome: ${n.leadNome}\n` +
    `WhatsApp: +${n.leadPhone}\n` +
    `O que procura: ${oQueProcura}\n\n` +
    `Chame enquanto está quente: ${waLink}\n\n` +
    `A conversa completa está no Selo, em Leads recebidos: ${TOOL_URL}`

  // HTML mínimo, tudo inline (cliente de email não carrega CSS externo).
  // Navy da marca no botão; sem emoji (regra da casa).
  const html =
    `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px 20px;color:#1d1d1f">` +
      `<div style="font-size:18px;font-weight:700;margin-bottom:18px">Sel<span style="color:#C9882A">o</span></div>` +
      `<p style="font-size:15px;line-height:1.6;margin:0 0 18px">${escapeHtml(n.corretorNome)}, seu assistente terminou a triagem de um lead no WhatsApp e ele está pronto para falar com você.</p>` +
      `<div style="border:1px solid rgba(0,0,0,.12);border-radius:10px;padding:16px 18px;margin-bottom:22px;font-size:14px;line-height:1.7">` +
        `<div><strong>Nome:</strong> ${escapeHtml(n.leadNome)}</div>` +
        `<div><strong>WhatsApp:</strong> +${escapeHtml(n.leadPhone)}</div>` +
        `<div><strong>O que procura:</strong> ${escapeHtml(oQueProcura)}</div>` +
      `</div>` +
      `<a href="${waLink}" style="display:inline-block;background:#0F2D4A;color:#ffffff;text-decoration:none;border-radius:980px;padding:12px 26px;font-size:14px;font-weight:600">Chamar o lead no WhatsApp</a>` +
      `<p style="font-size:13px;color:#6e6e73;line-height:1.6;margin:22px 0 0">Lead esfria rápido — quanto antes você assumir, maior a chance de fechar. A conversa completa está no <a href="${TOOL_URL}" style="color:#0F2D4A">Selo</a>, em Leads recebidos.</p>` +
    `</div>`

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      // Mesma regra das chamadas à Graph API: request externo pendurado não
      // pode segurar a função serverless até o timeout do Vercel.
      signal: AbortSignal.timeout(8000),
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Selo', email: fromEmail },
        to: [{ email: n.para }],
        subject: `Lead pronto para você: ${n.leadNome}`,
        textContent: texto,
        htmlContent: html,
      }),
    })
    if (!resp.ok) {
      console.error('[notificacoes] Brevo recusou o envio:', resp.status, await resp.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[notificacoes] erro ao chamar a API da Brevo:', err)
    return false
  }
}
