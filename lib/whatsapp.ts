// Cliente mínimo da WhatsApp Business Cloud API (Meta Graph API).
// F0: um único access token no env (número do piloto). Multi-tenant
// (token por corretor via Embedded Signup) entra na F1.

const GRAPH_VERSION = 'v21.0'

export async function sendWhatsAppText(
  phoneNumberId: string,
  to: string,
  body: string
): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!token) {
    console.error('[whatsapp] WHATSAPP_ACCESS_TOKEN não configurado')
    return false
  }
  try {
    const resp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        // Mesma regra do webhook Hotmart: chamada externa pendurada não pode
        // segurar a função serverless até o timeout do Vercel.
        signal: AbortSignal.timeout(8000),
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body },
        }),
      }
    )
    if (!resp.ok) {
      console.error('[whatsapp] envio falhou:', resp.status, await resp.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[whatsapp] erro ao chamar Graph API:', err)
    return false
  }
}

// Formas do payload de webhook da Meta que o handler consome.
export interface WaInboundMessage {
  id: string
  from: string
  type: string
  text?: { body: string }
}

export interface WaChangeValue {
  metadata?: { phone_number_id?: string }
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>
  messages?: WaInboundMessage[]
}

export interface WaWebhookBody {
  object?: string
  entry?: Array<{
    changes?: Array<{ field?: string; value?: WaChangeValue }>
  }>
}
