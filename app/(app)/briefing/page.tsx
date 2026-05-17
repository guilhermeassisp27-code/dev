'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DealScore } from '@/components/deals/DealScore'
import { Search, FileText, ChevronRight } from 'lucide-react'
import type { Deal } from '@/types'

export default function BriefingPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('deals')
      .select('*')
      .order('score', { ascending: false })
      .then(({ data }) => {
        setDeals((data as Deal[]) ?? [])
        setLoading(false)
      })
  }, [supabase])

  const filtered = deals.filter(d =>
    !search ||
    d.cliente.toLowerCase().includes(search.toLowerCase()) ||
    (d.etapa ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Briefing</h1>
        <p className="text-muted-foreground text-sm mt-1">Prepare-se para suas reuniões de vendas</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-input border-border max-w-md"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhum deal encontrado</p>
          <p className="text-sm mt-1">Importe deals no Pipeline primeiro</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(deal => (
            <Link key={deal.id} href={`/briefing/${deal.id}`}>
              <Card className="border-border bg-card hover:bg-accent/30 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <DealScore score={deal.score} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{deal.cliente}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">{deal.etapa}</span>
                          <Badge variant="outline" className="text-xs">
                            R$ {deal.valor.toLocaleString('pt-BR')}
                          </Badge>
                          {deal.contato_nome && (
                            <span className="text-xs text-muted-foreground">{deal.contato_nome}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
