import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DealScore } from './DealScore'
import { getScoreColor } from '@/lib/scoring'
import { cn } from '@/lib/utils'
import { Building2, MapPin, User, Clock, TrendingUp } from 'lucide-react'
import type { Deal } from '@/types'

interface DealCardProps {
  deal: Deal
}

const temperaturaConfig = {
  quente: { label: 'Quente', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  morna: { label: 'Morna', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  fria: { label: 'Fria', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
}

const curvaConfig = {
  A: { className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  B: { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  C: { className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}

export function DealCard({ deal }: DealCardProps) {
  const temp = temperaturaConfig[deal.temperatura] || temperaturaConfig.fria
  const curva = curvaConfig[deal.curva_abc] || curvaConfig.C
  const scoreColor = getScoreColor(deal.score)

  return (
    <Card className="border-border bg-card hover:bg-accent/30 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Link
                href={`/briefing/${deal.id}`}
                className="text-base font-semibold text-foreground hover:text-primary transition-colors truncate max-w-xs"
              >
                {deal.cliente}
              </Link>
              <Badge variant="outline" className={cn('text-xs shrink-0', temp.className)}>
                {temp.label}
              </Badge>
              <Badge variant="outline" className={cn('text-xs shrink-0', curva.className)}>
                Curva {deal.curva_abc}
              </Badge>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
              {deal.etapa && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span className="truncate">{deal.etapa}</span>
                </div>
              )}
              {(deal.cidade || deal.estado) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{[deal.cidade, deal.estado].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {deal.contato_nome && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">{deal.contato_nome}</span>
                </div>
              )}
              {deal.ramo && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{deal.ramo}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-foreground">
                  R$ {deal.valor.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {deal.probabilidade}% probabilidade
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className={cn('w-3 h-3', deal.dias_parado > 30 ? 'text-red-400' : '')} />
                <span className={deal.dias_parado > 30 ? 'text-red-400' : ''}>
                  {deal.dias_parado}d parado
                </span>
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="shrink-0">
            <DealScore score={deal.score} size="sm" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
