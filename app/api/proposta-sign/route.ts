import { NextRequest, NextResponse } from 'next/server'
import { registrarAssinatura } from '@/lib/proposta'

// POST /api/proposta-sign { id, nome, cpf, assinatura } -> registra o aceite/assinatura.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const id = String(body.id ?? '')
  const nome = String(body.nome ?? '').trim()
  const cpf = String(body.cpf ?? '').trim()
  const assinatura = String(body.assinatura ?? '')
  if (!nome) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 })
  if (cpf.replace(/\D/g, '').length < 11)
    return NextResponse.json({ error: 'cpf inválido' }, { status: 400 })
  // exige uma assinatura de imagem real (bloqueia POST direto sem rabisco)
  if (!assinatura.startsWith('data:image/') || assinatura.length < 200)
    return NextResponse.json({ error: 'assinatura obrigatória' }, { status: 400 })

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    ''

  const r = await registrarAssinatura(id, { nome, cpf, assinatura, ip })
  if (!r.ok) return NextResponse.json({ error: 'falha ao registrar' }, { status: 500 })
  return NextResponse.json({ ok: true, jaAssinada: r.jaAssinada ?? false })
}
