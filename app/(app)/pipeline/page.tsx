'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DealCard } from '@/components/deals/DealCard'
import { PipelineFunnel } from '@/components/deals/PipelineFunnel'
import { ImportCSV } from '@/components/deals/ImportCSV'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, TrendingUp, DollarSign, Target, Clock, Search, Loader2 } from 'lucide-react'
import type { Deal } from '@/types'

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTemp, setFilterTemp] = useState<string>('all')
  const [filterCurva, setFilterCurva] = useState<string>('all')
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const supabase = createClient()

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('deals')
      .select('*')
      .order('score', { ascending: false })
    setDeals((data as Deal[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  async function handleAIInsights() {
    setLoadingAI(true)
    setAiInsights(null)
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deals }),
      })
      const data = await response.json()
      setAiInsights(data.content)
    } catch (err) {
      console.error('Error getting AI insights:', err)
    } finally {
      setLoadingAI(false)
    }
  }

  const filtered = deals.filter(d => {
    const matchSearch = !search || d.cliente.toLowerCase().includes(search.toLowerCase()) ||
      (d.etapa ?? '').toLowerCase().includes(search.toLowerCase())
    const matchTemp = filterTemp === 'all' || d.temperatura === filterTemp
    const matchCurva = filterCurva === 'all' || d.curva_abc === filterCurva
    return matchSearch && matchTemp && matchCurva
  })

  const totalValor = deals.reduce((acc, d) => acc + d.valor, 0)
  const mediaScore = deals.length > 0 ? deals.reduce((acc, d) => acc + d.score, 0) / deals.length : 0
  const dealsQuentes = deals.filter(d => d.temperatura === 'quente').length
  const dealsParados = deals.filter(d => d.dias_parado > 30).length

  const kpis = [
    {
      label: 'Total em Pipeline',
      value: `R$ ${(totalValor / 1_000_000).toFixed(1)}M`,
      sub: `${deals.length} oportunidades`,
      icon: DollarSign,
      color: 'text-green-400',
    },
    {
      label: 'Score Médio',
      value: mediaScore.toFixed(1),
      sub: 'de 100 pontos',
      icon: Target,
      color: 'text-primary',
    },
    {
      label: 'Deals Quentes',
      value: dealsQuentes,
      sub: 'temperatura alta',
      icon: TrendingUp,
      color: 'text-red-400',
    },
    {
      label: 'Parados +30d',
      value: dealsParados,
      sub: 'precisam de ação',
      icon: Clock,
      color: 'text-yellow-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão de oportunidades de vendas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleAIInsights}
            disabled={loadingAI || deals.length === 0}
            className="border-border"
          >
            {loadingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2 text-primary" />}
            Insights IA
          </Button>
          <ImportCSV onImported={fetchDeals} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</span>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Análise do Pipeline — IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">{aiInsights}</pre>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {deals.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Valor por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineFunnel deals={deals} />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa ou etapa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-border"
          />
        </div>
        <Select value={filterTemp} onValueChange={setFilterTemp}>
          <SelectTrigger className="w-full sm:w-40 bg-input border-border">
            <SelectValue placeholder="Temperatura" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="quente">Quente</SelectItem>
            <SelectItem value="morna">Morna</SelectItem>
            <SelectItem value="fria">Fria</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCurva} onValueChange={setFilterCurva}>
          <SelectTrigger className="w-full sm:w-36 bg-input border-border">
            <SelectValue placeholder="Curva ABC" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="A">Curva A</SelectItem>
            <SelectItem value="B">Curva B</SelectItem>
            <SelectItem value="C">Curva C</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deal List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhum deal encontrado</p>
          <p className="text-sm mt-1">Importe um CSV ou ajuste os filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{filtered.length} deal{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.map(deal => <DealCard key={deal.id} deal={deal} />)}
        </div>
      )}
    </div>
  )
}
