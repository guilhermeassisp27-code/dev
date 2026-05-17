'use client'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Info, RefreshCw, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { calcularCurvaABC } from '@/lib/scoring'
import type { Deal } from '@/types'

export default function ConfigPage() {
  const [recalculating, setRecalculating] = useState(false)
  const [lastRecalc, setLastRecalc] = useState<Date | null>(null)
  const supabase = createClient()

  async function handleRecalcCurvaABC() {
    setRecalculating(true)
    try {
      const { data } = await supabase.from('deals').select('*')
      if (!data) return

      const deals = data as Deal[]
      const curvaMap = calcularCurvaABC(deals)

      // Update each deal
      const updates = deals.map(deal => ({
        id: deal.id,
        curva_abc: curvaMap.get(deal.id) ?? 'C',
      }))

      for (const update of updates) {
        await supabase
          .from('deals')
          .update({ curva_abc: update.curva_abc })
          .eq('id', update.id)
      }

      setLastRecalc(new Date())
    } catch (err) {
      console.error('Error recalculating Curva ABC:', err)
    } finally {
      setRecalculating(false)
    }
  }

  const curvaRules = [
    {
      curva: 'A',
      description: 'Top 80% do valor acumulado do pipeline',
      badge: 'bg-green-500/20 text-green-400 border-green-500/30',
      details: 'Deals mais estratégicos — máxima atenção e recursos',
    },
    {
      curva: 'B',
      description: '80% a 95% do valor acumulado',
      badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      details: 'Deals importantes — acompanhar regularmente',
    },
    {
      curva: 'C',
      description: 'Últimos 5% do valor acumulado',
      badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      details: 'Deals de menor prioridade — automatizar ou delegar',
    },
  ]

  const scoringRules = [
    { dimension: 'Valor do Deal', weight: '30 pts', description: '≥R$1M=30, ≥R$500k=25, ≥R$200k=20, ≥R$100k=15, ≥R$50k=10, ≥R$20k=5, <R$20k=2' },
    { dimension: 'Dias Parado', weight: '25 pts', description: '≤7d=25, ≤14d=20, ≤30d=15, ≤60d=8, ≤90d=3, >90d=0' },
    { dimension: 'Temperatura', weight: '20 pts', description: 'Quente=20, Morna=12, Fria=4' },
    { dimension: 'Probabilidade', weight: '15 pts', description: 'Proporcional à probabilidade de fechamento (0-15)' },
    { dimension: 'Curva ABC', weight: '10 pts', description: 'A=10, B=6, C=2' },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Regras de classificação e scoring do pipeline</p>
      </div>

      {/* Curva ABC */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Curva ABC de Clientes</CardTitle>
          <CardDescription>
            Classificação automática baseada no valor acumulado do pipeline (método de Pareto)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {curvaRules.map((rule) => (
            <div key={rule.curva} className="flex items-start gap-3">
              <Badge variant="outline" className={`text-sm font-bold shrink-0 mt-0.5 ${rule.badge}`}>
                {rule.curva}
              </Badge>
              <div>
                <p className="text-sm font-medium text-foreground">{rule.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rule.details}</p>
              </div>
            </div>
          ))}

          <Separator className="my-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Recalcule a Curva ABC após importar novos deals ou alterar valores.</span>
            </div>
            <div className="flex items-center gap-3">
              {lastRecalc && (
                <span className="text-xs text-muted-foreground">
                  Atualizado às {lastRecalc.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <Button onClick={handleRecalcCurvaABC} disabled={recalculating} variant="outline" className="border-border shrink-0">
                {recalculating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Recalcular Curva ABC
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Sistema de Scoring</CardTitle>
          <CardDescription>
            Como o score de 0 a 100 é calculado para priorização dos deals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scoringRules.map((rule) => (
              <div key={rule.dimension} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{rule.dimension}</span>
                  <Badge variant="secondary" className="text-xs">{rule.weight}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rule.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs font-medium text-foreground">Score Alto (70-100) — Prioridade máxima</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-xs font-medium text-foreground">Score Médio (45-69) — Acompanhamento regular</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-xs font-medium text-foreground">Score Baixo (0-44) — Revisar estratégia</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Sobre o Sales Co-Pilot</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Sales Co-Pilot é uma ferramenta de inteligência de vendas B2B desenvolvida para a Becomex.</p>
          <p>Powered by Claude (Anthropic) para geração de insights, mensagens e briefings personalizados.</p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="text-xs">v0.1.0</Badge>
            <Badge variant="outline" className="text-xs">Next.js 14</Badge>
            <Badge variant="outline" className="text-xs">Claude Sonnet</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
