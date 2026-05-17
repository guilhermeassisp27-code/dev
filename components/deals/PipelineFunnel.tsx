'use client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Deal } from '@/types'

interface PipelineFunnelProps {
  deals: Deal[]
}

interface EtapaData {
  etapa: string
  count: number
  valor: number
}

export function PipelineFunnel({ deals }: PipelineFunnelProps) {
  const etapaMap = new Map<string, EtapaData>()

  for (const deal of deals) {
    const existing = etapaMap.get(deal.etapa)
    if (existing) {
      existing.count += 1
      existing.valor += deal.valor
    } else {
      etapaMap.set(deal.etapa, {
        etapa: deal.etapa,
        count: 1,
        valor: deal.valor,
      })
    }
  }

  const data = Array.from(etapaMap.values()).sort((a, b) => b.valor - a.valor)

  const formatValue = (value: number) => {
    if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`
    return `R$ ${value.toLocaleString('pt-BR')}`
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const item = data.find(d => d.etapa === label)
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-sm">
          <p className="font-semibold text-foreground mb-1">{label}</p>
          <p className="text-muted-foreground">{item?.count ?? 0} deals</p>
          <p className="text-primary font-medium">{formatValue(payload[0]?.value ?? 0)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="etapa"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
