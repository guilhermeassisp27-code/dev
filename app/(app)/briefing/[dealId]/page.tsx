export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BriefingForm } from '@/components/briefing/BriefingForm'
import { Badge } from '@/components/ui/badge'
import { DealScore } from '@/components/deals/DealScore'
import { ArrowLeft, Building2, MapPin, User, DollarSign } from 'lucide-react'
import Link from 'next/link'
import type { Deal, Briefing } from '@/types'

interface Props {
  params: { dealId: string }
}

export default async function BriefingDealPage({ params }: Props) {
  const supabase = createServerClient()

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', params.dealId)
    .single()

  if (!deal) notFound()

  const { data: briefing } = await supabase
    .from('briefings')
    .select('*')
    .eq('deal_id', params.dealId)
    .single()

  const typedDeal = deal as Deal
  const typedBriefing = briefing as Briefing | null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link href="/briefing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para Briefing
      </Link>

      {/* Deal header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground mb-2">{typedDeal.cliente}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{typedDeal.ramo ?? typedDeal.etapa}</span>
              </div>
              {(typedDeal.cidade || typedDeal.estado) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{[typedDeal.cidade, typedDeal.estado].filter(Boolean).join('/')}</span>
                </div>
              )}
              {typedDeal.contato_nome && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{typedDeal.contato_nome}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 shrink-0" />
                <span>R$ {typedDeal.valor.toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="outline" className="text-xs">{typedDeal.etapa}</Badge>
              <Badge variant="outline" className="text-xs">{typedDeal.probabilidade}% prob.</Badge>
              <Badge variant="outline" className="text-xs capitalize">{typedDeal.temperatura}</Badge>
              <Badge variant="outline" className="text-xs">Curva {typedDeal.curva_abc}</Badge>
            </div>
          </div>
          <DealScore score={typedDeal.score} size="lg" />
        </div>
      </div>

      {/* Briefing Form */}
      <BriefingForm deal={typedDeal} initialBriefing={typedBriefing} />
    </div>
  )
}
