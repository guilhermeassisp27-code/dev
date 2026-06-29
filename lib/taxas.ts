// ============================================================
// Taxas de financiamento imobiliário POR BANCO — fonte oficial.
// Busca as taxas médias de mercado (PF) na API pública do Banco
// Central (Olinda), com cache diário. Se a API estiver indisponível,
// cai numa tabela de referência datada (nunca quebra a simulação).
// "Sem achismo": os números são oficiais; sempre exibidos como
// ESTIMATIVA sujeita à análise e aprovação do banco.
// ============================================================

export type TaxaBanco = { banco: string; taxaAnual: number }
export type TaxasResult = {
  taxas: TaxaBanco[]
  ref: string // data/período de referência
  fonte: string
  aoVivo: boolean // true = veio da API do BC; false = tabela de reserva
}

// Reserva (atualizar periodicamente pelo ranking do BC em
// bcb.gov.br/estabilidadefinanceira/txjuros). Datar SEMPRE.
const FALLBACK: TaxasResult = {
  taxas: [
    { banco: 'Caixa', taxaAnual: 11.0 },
    { banco: 'Banco do Brasil', taxaAnual: 11.3 },
    { banco: 'Bradesco', taxaAnual: 11.8 },
    { banco: 'Itaú', taxaAnual: 11.9 },
    { banco: 'Santander', taxaAnual: 12.0 },
  ],
  ref: 'referência de mercado',
  fonte: 'Banco Central do Brasil (taxas médias de mercado)',
  aoVivo: false,
}

// Bancos que queremos exibir (os maiores em crédito imobiliário PF).
const ALVO: Record<string, string> = {
  caixa: 'Caixa',
  'banco do brasil': 'Banco do Brasil',
  bradesco: 'Bradesco',
  itau: 'Itaú',
  santander: 'Santander',
}

export async function getTaxas(): Promise<TaxasResult> {
  try {
    const modalidade =
      "Financiamento imobiliário com taxas de mercado - Pré-fixado"
    const url =
      'https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/' +
      'TaxasJurosDiarioPorInicioPeriodo?$top=400&$orderby=InicioPeriodo desc&$format=json' +
      '&$select=InstituicaoFinanceira,TaxaJurosAoAno,InicioPeriodo&$filter=' +
      encodeURIComponent(`Modalidade eq '${modalidade}'`)

    // Cache diário (revalidate) — não bate no BC a cada acesso.
    const r = await fetch(url, { next: { revalidate: 86400 } })
    if (!r.ok) return FALLBACK
    const json = (await r.json()) as { value?: Array<Record<string, unknown>> }
    const rows = json.value ?? []
    if (!rows.length) return FALLBACK

    const ref = String(rows[0]?.InicioPeriodo ?? '').slice(0, 10)
    const escolhido = new Map<string, number>()
    for (const row of rows) {
      const nome = String(row.InstituicaoFinanceira ?? '').toLowerCase()
      const taxa = Number(row.TaxaJurosAoAno)
      if (!isFinite(taxa) || taxa <= 0) continue
      for (const chave of Object.keys(ALVO)) {
        if (nome.includes(chave) && !escolhido.has(chave)) {
          escolhido.set(chave, taxa)
        }
      }
    }
    if (!escolhido.size) return FALLBACK

    const taxas = Array.from(escolhido.entries())
      .map(([k, v]) => ({ banco: ALVO[k], taxaAnual: Math.round(v * 100) / 100 }))
      .sort((a, b) => a.taxaAnual - b.taxaAnual)

    return { taxas, ref, fonte: 'Banco Central do Brasil', aoVivo: true }
  } catch {
    return FALLBACK
  }
}

// ── Matemática idêntica à da ferramenta (tool.html: calcParcela/calcSAC) ──
export function parcelaPrice(pv: number, taxaAnual: number, meses: number): number {
  const i = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1
  if (i === 0) return pv / meses
  return (pv * (i * Math.pow(1 + i, meses))) / (Math.pow(1 + i, meses) - 1)
}

export function sac(pv: number, taxaAnual: number, meses: number) {
  const i = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1
  const amort = pv / meses
  return {
    primeira: amort + pv * i,
    ultima: amort + amort * i,
  }
}
