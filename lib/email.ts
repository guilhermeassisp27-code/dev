// Envio de email transacional via Resend (API REST, sem SDK).
//
// Por que Resend e nao o email embutido do Supabase:
//   - O email padrao do Supabase tem rate limit baixo (poucos por hora) e
//     entregabilidade ruim (cai em spam). Inaceitavel para vendas em escala.
//   - Aqui controlamos remetente, dominio (SPF/DKIM) e template.
//
// Variaveis de ambiente necessarias (configurar no Vercel):
//   RESEND_API_KEY   -> chave da conta Resend (re_...)
//   RESEND_FROM      -> remetente verificado, ex: "CorretorPRO <acesso@seudominio.com.br>"
//                       IMPORTANTE: o dominio precisa estar verificado no Resend
//                       (DNS: SPF + DKIM). Sem dominio verificado o Resend so
//                       entrega para o email dono da conta (modo teste).
//   RESEND_REPLY_TO  -> (opcional) email de suporte para respostas

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export type SendResult =
  | { sent: true; id: string }
  | { sent: false; reason: string }

function isConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM
}

async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<SendResult> {
  if (!isConfigured()) {
    return {
      sent: false,
      reason: 'RESEND_API_KEY ou RESEND_FROM nao configurados no ambiente',
    }
  }

  try {
    const payload: Record<string, unknown> = {
      from: process.env.RESEND_FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }
    if (process.env.RESEND_REPLY_TO) {
      payload.reply_to = process.env.RESEND_REPLY_TO
    }

    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { sent: false, reason: `Resend ${res.status}: ${text.slice(0, 300)}` }
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string }
    return { sent: true, id: data.id ?? '' }
  } catch (err) {
    return { sent: false, reason: `fetch error: ${(err as Error).message}` }
  }
}

// Email de boas-vindas com o link para definir a senha (action_link gerado
// pelo Supabase via admin.generateLink). Envia a primeira credencial de acesso.
export async function sendWelcomeEmail(opts: {
  to: string
  actionLink: string
  name?: string
}): Promise<SendResult> {
  const nome = (opts.name ?? '').trim().split(' ')[0]
  const saudacao = nome ? `Bem-vindo(a), ${nome}!` : 'Bem-vindo(a) ao CorretorPRO!'

  return sendEmail({
    to: opts.to,
    subject: 'Seu acesso ao CorretorPRO — defina sua senha',
    html: welcomeHtml(opts.actionLink, saudacao),
  })
}

// Reenvio de acesso (mesma carta, assunto deixa claro que e um reenvio).
export async function resendAccessEmail(opts: {
  to: string
  actionLink: string
  name?: string
}): Promise<SendResult> {
  const nome = (opts.name ?? '').trim().split(' ')[0]
  const saudacao = nome ? `Olá, ${nome}!` : 'Olá!'

  return sendEmail({
    to: opts.to,
    subject: 'Seu link de acesso ao CorretorPRO',
    html: welcomeHtml(opts.actionLink, saudacao),
  })
}

function welcomeHtml(actionLink: string, saudacao: string): string {
  const link = escapeHtml(actionLink)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#040D1C;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#040D1C;padding:32px 16px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0A1628;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <tr>
          <td align="center" style="padding:40px 32px 24px;">
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#EEF2FF;">
              Corretor<span style="color:#4D7EFF;">PRO</span>
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 40px;">
            <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#FFFFFF;font-weight:700;">
              ${escapeHtml(saudacao)}
            </h1>
            <p style="margin:0;font-size:15px;line-height:1.6;color:#9FB3D1;">
              Sua compra foi aprovada. Você agora tem acesso à ferramenta que cria
              propostas comerciais profissionais para imóveis em segundos.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:8px 0;font-size:14px;color:#C7D6EC;line-height:1.5;">&#10003;&nbsp;&nbsp;Propostas prontas em segundos, com sua marca</td></tr>
              <tr><td style="padding:8px 0;font-size:14px;color:#C7D6EC;line-height:1.5;">&#10003;&nbsp;&nbsp;Cálculo automático de financiamento e parcelas</td></tr>
              <tr><td style="padding:8px 0;font-size:14px;color:#C7D6EC;line-height:1.5;">&#10003;&nbsp;&nbsp;Histórico de propostas salvo na nuvem</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 0;">
            <p style="margin:0;font-size:14px;line-height:1.6;color:#9FB3D1;">
              Para começar, defina sua senha de acesso clicando no botão abaixo:
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 40px 8px;">
            <a href="${link}" style="display:inline-block;background:#4D7EFF;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;">
              Definir minha senha
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:8px 40px 32px;">
            <p style="margin:0;font-size:12px;color:#5A7396;line-height:1.5;">
              Se o botão não funcionar, copie e cole este link no navegador:<br>
              <span style="color:#4D7EFF;word-break:break-all;">${link}</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.08);">
            <p style="margin:0;font-size:12px;color:#5A7396;line-height:1.6;text-align:center;">
              Você recebeu este email porque adquiriu o CorretorPRO.<br>
              Em caso de dúvidas, responda este email que ajudamos você.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
