import type { Deal, DealScore, CurvaABC } from '@/types'

/**
 * Score weights (total = 100 points)
 * valor        → 30 pts  (based on deal value)
 * diasParado   → 25 pts  (fewer days stalled = higher score)
 * temperatura  → 20 pts  (quente/morna/fria)
 * probabilidade→ 15 pts  (0-100%)
 * curvaABC     → 10 pts  (A/B/C)
 */

const VALOR_TIERS = [
  { min: 1_000_000, pts: 30 },
  { min: 500_000, pts: 25 },
  { min: 200_000, pts: 20 },
  { min: 100_000, pts: 15 },
  { min: 50_000, pts: 10 },
  { min: 20_000, pts: 5 },
  { min: 0, pts: 2 },
]

function scoreValor(valor: number): number {
  for (const tier of VALOR_TIERS) {
    if (valor >= tier.min) return tier.pts
  }
  return 0
}

function scoreDiasParado(dias: number): number {
  if (dias <= 7) return 25
  if (dias <= 14) return 20
  if (dias <= 30) return 15
  if (dias <= 60) return 8
  if (dias <= 90) return 3
  return 0
}

function scoreTemperatura(temp: string): number {
  switch (temp) {
    case 'quente': return 20
    case 'morna': return 12
    case 'fria': return 4
    default: return 0
  }
}

function scoreProbabilidade(prob: number): number {
  return Math.round((prob / 100) * 15)
}

function scoreCurvaABC(curva: CurvaABC): number {
  switch (curva) {
    case 'A': return 10
    case 'B': return 6
    case 'C': return 2
    default: return 0
  }
}

export function calcularScore(deal: Partial<Deal>): DealScore {
  const valor = scoreValor(deal.valor ?? 0)
  const diasParado = scoreDiasParado(deal.dias_parado ?? 0)
  const temperatura = scoreTemperatura(deal.temperatura ?? 'fria')
  const probabilidade = scoreProbabilidade(deal.probabilidade ?? 0)
  const curvaABC = scoreCurvaABC(deal.curva_abc ?? 'C')

  return {
    valor,
    diasParado,
    temperatura,
    probabilidade,
    curvaABC,
    total: valor + diasParado + temperatura + probabilidade + curvaABC,
  }
}

export function calcularCurvaABC(deals: Deal[]): Map<string, CurvaABC> {
  const sorted = [...deals].sort((a, b) => b.valor - a.valor)
  const totalValor = sorted.reduce((acc, d) => acc + d.valor, 0)

  let acumulado = 0
  const result = new Map<string, CurvaABC>()

  for (const deal of sorted) {
    acumulado += deal.valor
    const pct = totalValor > 0 ? acumulado / totalValor : 0
    if (pct <= 0.8) {
      result.set(deal.id, 'A')
    } else if (pct <= 0.95) {
      result.set(deal.id, 'B')
    } else {
      result.set(deal.id, 'C')
    }
  }

  return result
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400'
  if (score >= 45) return 'text-yellow-400'
  return 'text-red-400'
}

export function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-green-400/10 border-green-400/20'
  if (score >= 45) return 'bg-yellow-400/10 border-yellow-400/20'
  return 'bg-red-400/10 border-red-400/20'
}
