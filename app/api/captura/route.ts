import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rota pública de captação de leads. O corretor compartilha o link
//   /captura/<slug>
// O cliente preenche o formulário (sem login) e o lead cai na tabela
// cpr_public_leads, atrelado ao corretor dono do slug. A inserção usa o
// service role (ignora RLS) — não há superfície de escrita anônima direta.

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Resolve o slug público -> dono (user_id) + branding visível ao cliente.
async function resolveSlug(slug: string) {
  const supabase = admin()
  const { data, error } = await supabase
    .from('cpr_user_data')
    .select('user_id, perfil')
    .eq('perfil->>slug', slug)
    .maybeSingle()
  if (error || !data) return null
  const perfil = (data.perfil ?? {}) as Record<string, unknown>
  return {
    ownerId: data.user_id as string,
    nome: String(perfil.nome ?? ''),
    creci: String(perfil.creci ?? ''),
    cor: String(perfil.cor ?? '#4D7EFF'),
    logo: (perfil.logo as string | null) ?? null,
  }
}

// GET /api/captura?slug=... -> branding público do corretor (sem PII sensível)
export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get('slug') ?? '').trim().toLowerCase()
  if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 })

  const owner = await resolveSlug(slug)
  if (!owner) return NextResponse.json({ error: 'not found' }, { status: 404 })

  return NextResponse.json({
    nome: owner.nome,
    creci: owner.creci,
    cor: owner.cor,
    logo: owner.logo,
  })
}

// POST /api/captura -> grava o lead para o corretor dono do slug
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  // Honeypot anti-spam: campo oculto que humano nunca preenche.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true }) // finge sucesso, descarta
  }

  const slug = String(body.slug ?? '').trim().toLowerCase()
  const nome = String(body.nome ?? '').trim().slice(0, 80)
  const telefone = String(body.telefone ?? '').trim().slice(0, 30)
  const imovel = String(body.imovel ?? '').trim().slice(0, 120)
  const mensagem = String(body.mensagem ?? '').trim().slice(0, 500)

  if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 })
  if (!nome) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 })

  const owner = await resolveSlug(slug)
  if (!owner) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const supabase = admin()
  const { error } = await supabase.from('cpr_public_leads').insert({
    owner_id: owner.ownerId,
    nome,
    telefone,
    imovel,
    mensagem,
    origem: 'captura',
    status: 'pendente',
  })

  if (error) {
    console.error('[captura] insert falhou:', error.message)
    return NextResponse.json({ error: 'falha ao registrar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
