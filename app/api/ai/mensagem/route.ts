import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildMensagemPrompt } from '@/lib/ai/prompts'
import type { Deal, Canal, TipoMensagem } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { dealId, canal, tipo } = await request.json() as {
      dealId: string
      canal: Canal
      tipo: TipoMensagem
    }

    const { data: deal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single()

    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

    const prompt = buildMensagemPrompt(deal as Deal, canal, tipo)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    // Save to mensagens_geradas table
    await supabase.from('mensagens_geradas').insert({
      user_id: user.id,
      deal_id: dealId,
      canal,
      tipo,
      corpo: content,
      copiada: false,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ content })
  } catch (err) {
    console.error('AI mensagem error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Mark as copied
export async function PATCH(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { dealId, canal, tipo } = await request.json()

    await supabase
      .from('mensagens_geradas')
      .update({ copiada: true })
      .eq('deal_id', dealId)
      .eq('canal', canal)
      .eq('tipo', tipo)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
