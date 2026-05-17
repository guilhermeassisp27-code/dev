import { getScoreColor, getScoreBg } from '@/lib/scoring'
import { cn } from '@/lib/utils'
import type { DealScore as DealScoreType } from '@/types'

interface DealScoreProps {
  score: number
  breakdown?: DealScoreType
  size?: 'sm' | 'md' | 'lg'
}

export function DealScore({ score, breakdown, size = 'md' }: DealScoreProps) {
  const color = getScoreColor(score)
  const bg = getScoreBg(score)

  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-base px-3 py-1',
    lg: 'text-xl px-4 py-2',
  }

  return (
    <div className="flex flex-col gap-1">
      <div className={cn('inline-flex items-center rounded-full border font-bold', bg, color, sizeClasses[size])}>
        <span>{score}</span>
        <span className={cn('ml-0.5', size === 'sm' ? 'text-xs' : 'text-sm', 'opacity-70')}>/100</span>
      </div>
      {breakdown && (
        <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
          <div className="flex justify-between gap-4">
            <span>Valor</span><span className="font-medium">{breakdown.valor}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Atividade</span><span className="font-medium">{breakdown.diasParado}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Temperatura</span><span className="font-medium">{breakdown.temperatura}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Probabilidade</span><span className="font-medium">{breakdown.probabilidade}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Curva ABC</span><span className="font-medium">{breakdown.curvaABC}</span>
          </div>
        </div>
      )}
    </div>
  )
}
