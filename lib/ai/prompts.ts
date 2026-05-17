import type { Deal, Briefing, Canal, TipoMensagem } from '@/types'

export const SYSTEM_PROMPT_BASE = `Você é o Sales Co-Pilot da Becomex, especialista em vendas B2B consultivas de serviços tributários e aduaneiros no Brasil.
Você ajuda vendedores a priorizar oportunidades, preparar reuniões, criar mensagens personalizadas e analisar o pipeline.
Responda sempre em português brasileiro, de forma objetiva e prática.
Foco em ações concretas e insights acionáveis.`

export function buildMensagemPrompt(deal: Deal, canal: Canal, tipo: TipoMensagem): string {
  const canalLabel: Record<Canal, string> = {
    email: 'E-mail',
    whatsapp: 'WhatsApp',
    linkedin: 'LinkedIn',
  }
  const tipoLabel: Record<TipoMensagem, string> = {
    primeiro_contato: 'Primeiro Contato',
    followup: 'Follow-up',
    reativacao: 'Reativação de oportunidade',
  }

  return `${SYSTEM_PROMPT_BASE}

Gere uma mensagem de vendas B2B para o canal ${canalLabel[canal]} com o objetivo de ${tipoLabel[tipo]}.

INFORMAÇÕES DO PROSPECT:
- Empresa: ${deal.cliente}
- CNPJ: ${deal.cnpj ?? 'não informado'}
- Ramo: ${deal.ramo ?? 'não informado'}
- Porte: ${deal.porte ?? 'não informado'}
- Cidade/Estado: ${[deal.cidade, deal.estado].filter(Boolean).join('/') || 'não informado'}
- Oferta Becomex: ${deal.oferta ?? 'Consultoria Tributária/Aduaneira'}
- Valor estimado: R$ ${deal.valor.toLocaleString('pt-BR')}
- Contato: ${deal.contato_nome ?? 'não informado'} ${deal.contato_cargo ? `(${deal.contato_cargo})` : ''}
- Temperatura: ${deal.temperatura}
- Etapa: ${deal.etapa}
- Dias sem movimentação: ${deal.dias_parado}

DIRETRIZES:
${canal === 'email' ? `- Inclua um assunto impactante (linha "ASSUNTO: ...")
- Estrutura: abertura personalizada, proposta de valor, CTA claro
- Máximo 200 palavras no corpo` : ''}
${canal === 'whatsapp' ? `- Mensagem curta e direta (máximo 150 palavras)
- Tom informal mas profissional
- Use emojis com moderação
- CTA direto para reunião` : ''}
${canal === 'linkedin' ? `- Tom profissional e consultivo (máximo 120 palavras)
- Conectar com a realidade do setor da empresa
- Mencionar credibilidade da Becomex` : ''}

${tipo === 'reativacao' ? `- Esta é uma reativação após ${deal.dias_parado} dias sem contato
- Reconheça o silêncio de forma elegante
- Traga um novo ângulo ou novidade` : ''}

Gere apenas a mensagem, sem explicações adicionais.`
}

export function buildInsightsPrompt(deals: Deal[]): string {
  const totalValor = deals.reduce((acc, d) => acc + d.valor, 0)
  const dealsByEtapa = deals.reduce((acc, d) => {
    acc[d.etapa] = (acc[d.etapa] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const dealsByTemp = deals.reduce((acc, d) => {
    acc[d.temperatura] = (acc[d.temperatura] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const parados = deals.filter(d => d.dias_parado > 30)
  const topDeals = [...deals].sort((a, b) => b.score - a.score).slice(0, 5)

  return `${SYSTEM_PROMPT_BASE}

Analise o pipeline de vendas abaixo e forneça insights estratégicos acionáveis.

RESUMO DO PIPELINE:
- Total de oportunidades: ${deals.length}
- Valor total em pipeline: R$ ${totalValor.toLocaleString('pt-BR')}
- Distribuição por etapa: ${JSON.stringify(dealsByEtapa)}
- Distribuição por temperatura: ${JSON.stringify(dealsByTemp)}
- Deals parados >30 dias: ${parados.length}
- Top 5 deals por score: ${topDeals.map(d => `${d.cliente} (score: ${d.score}, valor: R$ ${d.valor.toLocaleString('pt-BR')})`).join(', ')}

Forneça:
1. **3 Riscos Críticos** no pipeline atual
2. **3 Oportunidades Imediatas** para aceleração
3. **Recomendação de Foco** para esta semana (máximo 3 deals para priorizar)
4. **Alerta de Saúde** do pipeline (1-2 frases)

Seja específico, mencione empresas pelo nome quando relevante. Formato markdown.`
}

export function buildBriefingPrompt(deal: Deal, briefing: Partial<Briefing>): string {
  return `${SYSTEM_PROMPT_BASE}

Prepare um briefing executivo completo para reunião de vendas B2B.

DADOS DA OPORTUNIDADE:
- Empresa: ${deal.cliente}
- CNPJ: ${deal.cnpj ?? 'N/A'}
- Ramo: ${deal.ramo ?? 'N/A'}
- Porte: ${deal.porte ?? 'N/A'}
- Cidade: ${deal.cidade ?? 'N/A'} / ${deal.estado ?? 'N/A'}
- Oferta: ${deal.oferta ?? 'Consultoria Tributária/Aduaneira'}
- Valor: R$ ${deal.valor.toLocaleString('pt-BR')}
- Probabilidade: ${deal.probabilidade}%
- Etapa: ${deal.etapa}
- Contato: ${deal.contato_nome ?? 'N/A'} - ${deal.contato_cargo ?? 'N/A'}

CONTEXTO FORNECIDO PELO VENDEDOR:
- Sobre a empresa: ${briefing.sobre_empresa ?? 'Não informado'}
- Perfil do decisor: ${briefing.decisor_perfil ?? 'Não informado'}
- Dores conhecidas: ${briefing.dores_conhecidas ?? 'Não informado'}
- Solução Becomex proposta: ${briefing.solucao_becomex ?? 'Não informado'}
- Última interação: ${briefing.ultima_interacao ?? 'Não informado'}
- Objeções: ${briefing.objecoes ?? 'Não informado'}

Estruture o briefing com:
1. **Resumo Executivo** (2-3 frases)
2. **Contexto do Cliente** (setor, desafios típicos de empresas deste porte/ramo)
3. **Posicionamento Becomex** (como conectar nossa solução às dores)
4. **Perguntas Estratégicas** para fazer na reunião (5 perguntas)
5. **Possíveis Objeções e Respostas** (3 objeções com contrapontos)
6. **Próximos Passos Sugeridos** após a reunião

Formato markdown, tom consultivo e profissional.`
}

export function buildProximoPassoPrompt(deal: Deal, briefing: Partial<Briefing>): string {
  return `${SYSTEM_PROMPT_BASE}

Com base nas informações abaixo, sugira o próximo passo ideal para avançar esta oportunidade.

DEAL: ${deal.cliente} | Etapa: ${deal.etapa} | Valor: R$ ${deal.valor.toLocaleString('pt-BR')} | Prob: ${deal.probabilidade}% | Dias parado: ${deal.dias_parado}
Temperatura: ${deal.temperatura} | Contato: ${deal.contato_nome ?? 'N/A'} (${deal.contato_cargo ?? 'N/A'})

CONTEXTO:
- Última interação: ${briefing.ultima_interacao ?? 'Não informado'}
- Próximo passo atual: ${briefing.proximo_passo ?? 'Não definido'}
- Dores: ${briefing.dores_conhecidas ?? 'Não informado'}
- Objeções: ${briefing.objecoes ?? 'Nenhuma registrada'}

Sugira:
1. **Ação Imediata** (o que fazer nos próximos 2 dias)
2. **Canal e Abordagem** (como e por onde contatar)
3. **Objetivo do Contato** (qual resultado esperado)
4. **Prazo Sugerido** para o próximo milestone

Responda em 3-4 parágrafos, direto ao ponto.`
}

export function buildRelatorioPrompt(
  deals: Deal[],
  periodo: string,
  tipo: 'semanal' | 'mensal' | 'trimestral'
): string {
  const fechados = deals.filter(d => d.etapa.toLowerCase().includes('fechad') || d.probabilidade === 100)
  const perdidos = deals.filter(d => d.etapa.toLowerCase().includes('perd') || d.probabilidade === 0)
  const ativos = deals.filter(d => !fechados.includes(d) && !perdidos.includes(d))
  const totalValor = ativos.reduce((acc, d) => acc + d.valor, 0)
  const mediaScore = ativos.length > 0 ? ativos.reduce((acc, d) => acc + d.score, 0) / ativos.length : 0

  return `${SYSTEM_PROMPT_BASE}

Gere um relatório executivo de vendas ${tipo} para o período: ${periodo}.

MÉTRICAS DO PERÍODO:
- Deals ativos: ${ativos.length}
- Deals fechados: ${fechados.length}
- Deals perdidos: ${perdidos.length}
- Valor em pipeline: R$ ${totalValor.toLocaleString('pt-BR')}
- Score médio do pipeline: ${mediaScore.toFixed(1)}/100
- Deals quentes: ${deals.filter(d => d.temperatura === 'quente').length}
- Deals parados >30 dias: ${deals.filter(d => d.dias_parado > 30).length}

TOP DEALS ATIVOS:
${ativos.sort((a, b) => b.valor - a.valor).slice(0, 10).map(d =>
  `- ${d.cliente}: R$ ${d.valor.toLocaleString('pt-BR')} | ${d.etapa} | ${d.probabilidade}%`
).join('\n')}

Estruture o relatório com:
1. **Resumo Executivo**
2. **Performance ${tipo === 'semanal' ? 'da Semana' : tipo === 'mensal' ? 'do Mês' : 'do Trimestre'}**
3. **Análise do Pipeline**
4. **Destaques e Alertas**
5. **Recomendações para o próximo período**

Formato markdown, objetivo e executivo.`
}
