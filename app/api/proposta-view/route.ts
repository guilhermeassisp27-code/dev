import { NextRequest, NextResponse } from 'next/server'
import { registrarView } from '@/lib/proposta'

// POST /api/proposta-view { id } -> registra abertura da proposta pública.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const id = String(body.id ?? '')
  const ok = await registrarView(id)
  return NextResponse.json({ ok })
}
