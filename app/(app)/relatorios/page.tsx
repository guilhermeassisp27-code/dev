'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Sparkles, Loader2, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Deal } from '@/types'

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#06b6d4']

export default function RelatoriosPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'semanal' | 'mensal' | 'trimestral'>('mensal')
  const [aiReport, setAiReport] = useState<string | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('deals').select('*').then(({ data }) => {
      setDeals((data as Deal[]) ?? [])
      setLoading(false)
    })
  }, [supabase])

  async function handleGenerateReport() {
    setLoadingAI(true)
    setAiReport(null)
    try {
      const periodoLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })
      const response = await fetch('/api/ai/relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deals, periodo: periodoLabel, tipo: periodo }),
      })
      const data = await response.json()
      setAiReport(data.content)
    } catch (err) {
      console.error('Error generating report:', err)
    } finally {
      setLoadingAI(false)
    }
  }

  // Build chart data
  const etapaData = deals.reduce((acc, d) => {
    const existing = acc.find(e => e.etapa === d.etapa)
    if (existing) {
      existing.count += 1
      existing.valor += d.valor
    } else {
      acc.push({ etapa: d.etapa, count: 1, valor: d.valor })
    }
    return acc
  }, [] as { etapa: string; count: number; valor: number }[]).sort((a, b) => b.valor - a.valor)

  const temperaturaData = [
    { name: 'Quente', value: deals.filter(d => d.temperatura === 'quente').length },
    { name: 'Morna', value: deals.filter(d => d.temperatura === 'morna').length },
    { name: 'Fria', value: deals.filter(d => d.temperatura === 'fria').length },
  ].filter(d => d.value > 0)

  const curvaData = [
    { name: 'Curva A', value: deals.filter(d => d.curva_abc === 'A').length, valor: deals.filter(d => d.curva_abc === 'A').reduce((a, d) => a + d.valor, 0) },
    { name: 'Curva B', value: deals.filter(d => d.curva_abc === 'B').length, valor: deals.filter(d => d.curva_abc === 'B').reduce((a, d) => a + d.valor, 0) },
    { name: 'Curva C', value: deals.filter(d => d.curva_abc === 'C').length, valor: deals.filter(d => d.curva_abc === 'C').reduce((a, d) => a + d.valor, 0) },
  ]

  const formatValue = (value: number) => {
    if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`
    return `R$ ${value.toLocaleString('pt-BR')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">Análise do seu pipeline de vendas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as 'semanal' | 'mensal' | 'trimestral')}>
            <SelectTrigger className="w-36 bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateReport} disabled={loadingAI || deals.length === 0}>
            {loadingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Gerar Relatório IA
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-lg" />)}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sem dados para exibir</p>
          <p className="text-sm mt-1">Importe deals no Pipeline primeiro</p>
        </div>
      ) : (
        <>
          {/* AI Report */}
          {aiReport && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Relatório {periodo.charAt(0).toUpperCase() + periodo.slice(1)} — IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">{aiReport}</pre>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Etapas chart */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Valor por Etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={etapaData} margin={{ top: 5, right: 5, left: 5, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="etapa"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        tickFormatter={formatValue}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        width={70}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number) => [formatValue(value), 'Valor']}
                      />
                      <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Temperatura pie */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Distribuição por Temperatura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={temperaturaData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {temperaturaData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend
                        formatter={(value) => <span style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Curva ABC */}
            <Card className="border-border bg-card lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Curva ABC — Deals e Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Curva</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Deals</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">Valor Total</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">% do Pipeline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curvaData.map((row, i) => {
                        const totalValor = curvaData.reduce((a, r) => a + r.valor, 0)
                        const pct = totalValor > 0 ? ((row.valor / totalValor) * 100).toFixed(1) : '0'
                        return (
                          <tr key={row.name} className="border-b border-border/50 hover:bg-accent/30">
                            <td className="py-3 px-3">
                              <span className="font-semibold" style={{ color: COLORS[i] }}>{row.name}</span>
                            </td>
                            <td className="py-3 px-3 text-right text-foreground">{row.value}</td>
                            <td className="py-3 px-3 text-right text-foreground">{formatValue(row.valor)}</td>
                            <td className="py-3 px-3 text-right text-muted-foreground">{pct}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
