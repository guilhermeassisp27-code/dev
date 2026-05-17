import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildInsightsPrompt } from '@/lib/ai/prompts'
import type { Deal } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { deals } = await request.json() as { deals: Deal[] }

    if (!deals || deals.length === 0) {
      return NextResponse.json({ error: 'No deals provided' }, { status: 400 })
    }

    const prompt = buildInsightsPrompt(deals)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    // Log to historico
    await supabase.from('historico').insert({
      user_id: user.id,
      acao: 'ai_insights',
      detalhe: `Insights gerados para ${deals.length} deals`,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ content })
  } catch (err) {
    console.error('AI insights error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
