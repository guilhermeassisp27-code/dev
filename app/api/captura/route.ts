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

type OwnerRow = { user_id: string; perfil: Record<string, unknown> | null }

function brandFrom(row: OwnerRow) {
  const perfil = (row.perfil ?? {}) as Record<string, unknown>
  return {
    ownerId: row.user_id,
    nome: String(perfil.nome ?? ''),
    creci: String(perfil.creci ?? ''),
    cor: String(perfil.cor ?? '#4D7EFF'),
    logo: (perfil.logo as string | null) ?? null,
  }
}

// Resolve o slug público -> dono (user_id) + branding visível ao cliente.
// O filtro direto em campo JSONB (perfil->>slug) pode ser codificado de forma
// incompatível pelo postgrest-js em alguns casos, então há um fallback que
// varre as linhas e compara em código (seguro na escala atual de usuários).
async function resolveSlug(slug: string) {
  const supabase = admin()

  // 1) tentativa direta via escape hatch .filter() (sintaxe de JSON)
  const direct = await supabase
    .from('cpr_user_data')
    .select('user_id, perfil')
    .filter('perfil->>slug', 'eq', slug)
    .maybeSingle()
  if (direct.error) console.error('[captura] filtro JSONB falhou:', direct.error.message)
  if (direct.data) return brandFrom(direct.data as OwnerRow)

  // 2) fallback: varre e compara em código
  const scan = await supabase.from('cpr_user_data').select('user_id, perfil').limit(2000)
  if (scan.error) {
    console.error('[captura] scan falhou:', scan.error.message)
    return null
  }
  const match = (scan.data ?? []).find(
    (r) => String((r.perfil as Record<string, unknown> | null)?.slug ?? '') === slug
  )
  return match ? brandFrom(match as OwnerRow) : null
}

// GET /api/captura?slug=... -> branding público do corretor (sem PII sensível)
export async function GET(req: NextRequest) {
  // DIAGNÓSTICO TEMPORÁRIO — remover após resolver a captação.
  // Lista os slugs salvos no banco (sem PII além do primeiro nome).
  if (req.nextUrl.searchParams.get('debug') === 'diag-916a45') {
    const supabase = admin()
    const { data, error } = await supabase.from('cpr_user_data').select('perfil').limit(2000)
    if (error) return NextResponse.json({ debug: true, error: error.message })
    const linhas = (data ?? []).map((r) => {
      const p = (r.perfil ?? {}) as Record<string, unknown>
      return { slug: p.slug ?? null, nome: String(p.nome ?? '').split(' ')[0] }
    })
    return NextResponse.json({ debug: true, total: linhas.length, linhas })
  }

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
