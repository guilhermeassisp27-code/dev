import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildRelatorioPrompt } from '@/lib/ai/prompts'
import type { Deal } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { deals, periodo, tipo } = await request.json() as {
      deals: Deal[]
      periodo: string
      tipo: 'semanal' | 'mensal' | 'trimestral'
    }

    if (!deals || deals.length === 0) {
      return NextResponse.json({ error: 'No deals provided' }, { status: 400 })
    }

    const prompt = buildRelatorioPrompt(deals, periodo, tipo)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    await supabase.from('historico').insert({
      user_id: user.id,
      acao: 'ai_relatorio',
      detalhe: `Relatório ${tipo} gerado para ${periodo}`,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ content })
  } catch (err) {
    console.error('AI relatorio error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
