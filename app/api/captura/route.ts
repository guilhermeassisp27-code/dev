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
    cor: String(perfil.cor ?? '#0F2D4A'),
    logo: (perfil.logo as string | null) ?? null,
  }
}

// Confirma que o dono do slug ainda tem assinatura ativa antes de expor a
// página/aceitar leads — sem isso, um corretor banido (cancelamento/reembolso)
// continuava captando leads que ele nunca veria.
async function comAssinaturaAtiva(supabase: ReturnType<typeof admin>, row: OwnerRow) {
  const { data, error } = await supabase.auth.admin.getUserById(row.user_id)
  if (error || !data?.user) return null
  const status = (data.user.app_metadata as Record<string, unknown> | undefined)?.subscription_status
  if (status !== 'active') return null
  return brandFrom(row)
}

// Resolve o slug público -> dono (user_id) + branding visível ao cliente.
// Usa a função SQL cpr_resolve_slug (supabase-setup.sql), que de fato
// exercita o índice em perfil->>'slug' — o filtro direto via .filter() do
// postgrest-js se mostrou pouco confiável neste projeto (retornou "não
// encontrado" para slugs reais em produção). Mantém o scan como fallback
// defensivo só para o caso da função ainda não existir no banco.
async function resolveSlug(slug: string) {
  const supabase = admin()

  const rpc = await supabase.rpc('cpr_resolve_slug', { p_slug: slug })
  if (rpc.error) {
    console.error('[captura] rpc cpr_resolve_slug falhou:', rpc.error.message)
  } else if (rpc.data && rpc.data.length > 0) {
    return await comAssinaturaAtiva(supabase, rpc.data[0] as OwnerRow)
  }

  console.error('[captura] usando fallback de scan para resolver slug — verifique se cpr_resolve_slug existe no banco')
  const scan = await supabase.from('cpr_user_data').select('user_id, perfil').limit(2000)
  if (scan.error) {
    console.error('[captura] scan falhou:', scan.error.message)
    return null
  }
  const match = (scan.data ?? []).find(
    (r) => String((r.perfil as Record<string, unknown> | null)?.slug ?? '') === slug
  )
  return match ? await comAssinaturaAtiva(supabase, match as OwnerRow) : null
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

  // Evita duplicar o mesmo lead na caixa de entrada do corretor se o cliente
  // reenviar o formulário (refresh, duplo clique, ou revisita ao link) — em
  // vez de criar outro card "pendente", atualiza o que já existe pra esse
  // telefone e renova a data, como se tivesse acabado de chegar.
  if (telefone) {
    const { data: existing } = await supabase
      .from('cpr_public_leads')
      .select('id')
      .eq('owner_id', owner.ownerId)
      .eq('telefone', telefone)
      .eq('status', 'pendente')
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('cpr_public_leads')
        .update({ nome, imovel, mensagem, created_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) {
        console.error('[captura] update de lead existente falhou:', error.message)
        return NextResponse.json({ error: 'falha ao registrar' }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }
  }

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
