export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { MensagemBuilder } from '@/components/mensagens/MensagemBuilder'
import type { Deal } from '@/types'

export default async function MensagensPage() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('deals')
    .select('*')
    .order('score', { ascending: false })
  const deals = (data as Deal[]) ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
        <p className="text-muted-foreground text-sm mt-1">Gere mensagens personalizadas para seus prospects com IA</p>
      </div>
      <MensagemBuilder deals={deals} />
    </div>
  )
}
