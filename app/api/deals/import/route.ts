import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { calcularScore, calcularCurvaABC } from '@/lib/scoring'
import type { Deal } from '@/types'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { deals: rawDeals } = body as {
      deals: Omit<Deal, 'id' | 'user_id' | 'importado_em' | 'updated_at'>[]
    }

    if (!rawDeals || !Array.isArray(rawDeals)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Fetch existing deals to recalculate Curva ABC
    const { data: existingDeals } = await supabase
      .from('deals')
      .select('id, valor, curva_abc, score')
      .eq('user_id', user.id)

    // Prepare new deals with scores
    const newDeals = rawDeals.map(deal => ({
      ...deal,
      user_id: user.id,
      score: calcularScore(deal).total,
      importado_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Insert new deals
    const { data: insertedDeals, error } = await supabase
      .from('deals')
      .insert(newDeals)
      .select()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Recalculate Curva ABC for all deals
    const allDeals = [
      ...(existingDeals ?? []),
      ...(insertedDeals ?? []),
    ] as Deal[]

    if (allDeals.length > 0) {
      const curvaMap = calcularCurvaABC(allDeals)

      // Update curva_abc for all deals
      const updatePromises = allDeals.map(deal =>
        supabase
          .from('deals')
          .update({ curva_abc: curvaMap.get(deal.id) ?? 'C' })
          .eq('id', deal.id)
      )
      await Promise.all(updatePromises)
    }

    return NextResponse.json({
      imported: insertedDeals?.length ?? 0,
      message: `${insertedDeals?.length ?? 0} deals importados com sucesso`,
    })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
