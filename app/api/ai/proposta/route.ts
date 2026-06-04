import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { servico, cliente, segmento, contexto } = await request.json()

    if (!servico?.trim() || !cliente?.trim()) {
      return NextResponse.json({ error: 'Serviço e cliente são obrigatórios' }, { status: 400 })
    }

    const prompt = `Você é um especialista sênior em vendas consultivas com 20 anos de experiência no mercado brasileiro.
Sua tarefa é gerar uma proposta comercial completa, profissional e personalizada.

DADOS:
- Produto/Serviço: ${servico}
- Cliente: ${cliente}
- Segmento: ${segmento || 'Não informado'}
- Contexto adicional: ${contexto || 'Nenhum'}

INSTRUÇÕES:
1. Gere 3 escopos realistas para este serviço/contexto
2. Sugira investimentos condizentes com o mercado brasileiro (considere segmento, complexidade e porte provável)
3. A proposta_completa deve ser para o escopo "Profissional" (o do meio), em markdown bem formatado com seções: Apresentação, Entendimento do Desafio, Solução Proposta, Metodologia, Entregáveis, Cronograma, Investimento e Condições Comerciais
4. As objeções devem ser específicas para este tipo de venda
5. A mensagem de apresentação deve ser pessoal, direta e profissional

Responda SOMENTE com JSON válido, sem markdown wrapper, sem texto antes ou depois:

{
  "escopos": [
    {
      "nome": "Essencial",
      "descricao": "descrição do escopo básico em 1 frase",
      "entregaveis": ["item 1", "item 2", "item 3"],
      "prazo": "X dias úteis",
      "investimento": "R$ X.XXX",
      "investimento_numero": 0000,
      "destaque": false
    },
    {
      "nome": "Profissional",
      "descricao": "descrição do escopo intermediário em 1 frase",
      "entregaveis": ["item 1", "item 2", "item 3", "item 4", "item 5"],
      "prazo": "X dias úteis",
      "investimento": "R$ X.XXX",
      "investimento_numero": 0000,
      "destaque": true
    },
    {
      "nome": "Premium",
      "descricao": "descrição do escopo completo em 1 frase",
      "entregaveis": ["item 1", "item 2", "item 3", "item 4", "item 5", "item 6"],
      "prazo": "X dias úteis",
      "investimento": "R$ XX.XXX",
      "investimento_numero": 00000,
      "destaque": false
    }
  ],
  "proposta_completa": "proposta em markdown com todas as seções",
  "objecoes": [
    { "objecao": "objeção 1", "resposta": "como rebater de forma consultiva" },
    { "objecao": "objeção 2", "resposta": "como rebater" },
    { "objecao": "objeção 3", "resposta": "como rebater" }
  ],
  "mensagem_apresentacao": "mensagem completa para enviar junto com a proposta"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Resposta inválida da IA')
      parsed = JSON.parse(match[0])
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Proposta AI error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
