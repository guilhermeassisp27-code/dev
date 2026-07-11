// Motor de conversa do atendimento de leads por WhatsApp.
// O bot só qualifica e agenda — nunca informa preço, condição de imóvel
// ou comissão (risco jurídico para o corretor). Regras duras no prompt.

import Anthropic from '@anthropic-ai/sdk'

// Modelo definido no plano (docs/plano-whatsapp-leads.md): Haiku mantém o
// custo por corretor na casa de centavos. Sobreponível via env para testes.
const MODEL = process.env.LEADBOT_MODEL || 'claude-haiku-4-5'

export interface LeadData {
  intencao?: string | null
  tipo_imovel?: string | null
  regiao?: string | null
  faixa_preco?: string | null
  prazo?: string | null
}

export interface BotTurn {
  reply: string
  handoff: boolean
  lead: LeadData
}

export interface HistoryMessage {
  direction: 'inbound' | 'outbound' | 'corretor'
  body: string
}

const OUTPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    reply: {
      type: 'string',
      description: 'Resposta a enviar ao lead pelo WhatsApp. Curta, natural, sem emoji.',
    },
    handoff: {
      type: 'boolean',
      description:
        'true quando o lead está qualificado (intenção + região + faixa coletadas) ou pediu para falar com o corretor.',
    },
    lead: {
      type: 'object',
      description: 'Dados coletados até aqui. null para o que ainda não se sabe.',
      properties: {
        intencao: { type: ['string', 'null'] },
        tipo_imovel: { type: ['string', 'null'] },
        regiao: { type: ['string', 'null'] },
        faixa_preco: { type: ['string', 'null'] },
        prazo: { type: ['string', 'null'] },
      },
      required: ['intencao', 'tipo_imovel', 'regiao', 'faixa_preco', 'prazo'],
      additionalProperties: false,
    },
  },
  required: ['reply', 'handoff', 'lead'],
  additionalProperties: false,
}

function systemPrompt(corretorNome: string): string {
  return `Você é o assistente de atendimento do corretor de imóveis ${corretorNome}, respondendo leads pelo WhatsApp dele.

Identidade:
- Na PRIMEIRA mensagem da conversa, apresente-se como assistente do ${corretorNome} e deixe claro que é um atendimento virtual (obrigação legal).
- Nunca mencione nenhuma plataforma, empresa de software ou IA por trás do serviço.

Sua única função é qualificar o lead e preparar o terreno para o corretor:
1. Descobrir a intenção (comprar ou alugar).
2. Tipo de imóvel procurado.
3. Região ou bairro de interesse.
4. Faixa de preço.
5. Prazo (quando pretende fechar / se já visitou imóveis).

Faça UMA pergunta por vez. Mensagens curtas, tom profissional e cordial de atendimento imobiliário brasileiro. Sem emoji. Sem listas numeradas.

Regras invioláveis:
- NUNCA informe preço, condição, disponibilidade ou característica de nenhum imóvel específico. Você não tem acesso ao catálogo. Se perguntarem, diga que o ${corretorNome} confirma esses detalhes e siga qualificando.
- NUNCA negocie valores, prometa desconto, condição de pagamento ou prazo de resposta.
- NUNCA fale sobre comissão, contrato ou termos jurídicos.
- NUNCA invente informação. Se não sabe, diga que o corretor responde.
- Se o lead pedir para falar com uma pessoa, atenda imediatamente: confirme que o ${corretorNome} vai assumir a conversa e marque handoff.

Quando intenção, região e faixa de preço estiverem coletadas (ou o lead pedir humano), marque handoff=true e avise o lead que o ${corretorNome} continua o atendimento em breve.`
}

export async function generateBotTurn(
  corretorNome: string,
  history: HistoryMessage[],
  leadSoFar: LeadData
): Promise<BotTurn | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[leadbot] ANTHROPIC_API_KEY não configurada')
    return null
  }
  const client = new Anthropic()

  // Histórico vira turnos user/assistant. Mensagem manual do corretor entra
  // como contexto no lado assistant (o lead a recebeu como resposta).
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
    content: m.direction === 'corretor' ? `[mensagem enviada pelo próprio corretor] ${m.body}` : m.body,
  }))

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        { type: 'text', text: systemPrompt(corretorNome), cache_control: { type: 'ephemeral' } },
        {
          type: 'text',
          text: `Dados já coletados sobre este lead: ${JSON.stringify(leadSoFar)}`,
        },
      ],
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      messages,
    })

    if (response.stop_reason === 'refusal') {
      console.error('[leadbot] resposta recusada pelo modelo')
      return null
    }
    const text = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === 'text'
    )?.text
    if (!text) return null
    return JSON.parse(text) as BotTurn
  } catch (err) {
    console.error('[leadbot] chamada ao modelo falhou:', err)
    return null
  }
}
