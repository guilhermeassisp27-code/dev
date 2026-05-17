import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildBriefingPrompt } from '@/lib/ai/prompts'
import type { Deal, Briefing } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { deal, briefing } = await request.json() as {
      deal: Deal
      briefing: Partial<Briefing>
    }

    if (!deal) return NextResponse.json({ error: 'Deal is required' }, { status: 400 })

    const prompt = buildBriefingPrompt(deal, briefing)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    await supabase.from('historico').insert({
      user_id: user.id,
      acao: 'ai_briefing',
      detalhe: `Briefing gerado para ${deal.cliente}`,
      metadata: { deal_id: deal.id },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ content })
  } catch (err) {
    console.error('AI briefing error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
