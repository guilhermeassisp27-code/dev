import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

// ============================================================
// Resolver do site público do corretor (vitrine de imóveis).
// Lê o perfil + imóveis PUBLICADOS por slug, com service role
// (ignora RLS). Reusa o mesmo padrão do /api/captura: resolve o
// slug -> dono, confirma assinatura ativa, e projeta apenas os
// campos seguros (nada de cliente/lead, nada de endereço completo).
// ============================================================

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export type ImovelPublico = {
  id: string
  tipo: string
  finalidade: string
  valor: string
  bairro: string
  cidade: string
  area: string
  dorms: string
  vagas: string
  status: string
  foto: string | null
}

export type Vitrine = {
  ownerId: string
  slug: string
  nome: string
  creci: string
  cor: string
  logo: string | null
  tel: string
  imoveis: ImovelPublico[]
}

// Rotas reservadas do app — nunca tratadas como slug de corretor.
const RESERVADOS = new Set([
  'acesso', 'definir-senha', 'callback', 'captura', 'api', 'termos',
  'privacidade', 'landing', 'favicon.ico', 'robots.txt', 'sitemap.xml',
  '_next', 'og-image', 'tool', 'index',
])

// Extrai só "Cidade, UF" do endereço completo — o endereço com rua/número
// NUNCA é exposto ao público (decisão de produto: protege o corretor de ser
// contornado e respeita imóveis sem divulgação exata).
function cidadeDe(end: string): string {
  if (!end) return ''
  const partes = end.split(/[—–-]/)
  if (partes.length < 2) return ''
  return partes[partes.length - 1].trim()
}

function projetar(im: Record<string, unknown>): ImovelPublico {
  return {
    id: String(im.id ?? ''),
    tipo: String(im.tipo ?? ''),
    finalidade: String(im.finalidade ?? ''),
    valor: String(im.valor ?? ''),
    bairro: String(im.bairro ?? ''),
    cidade: cidadeDe(String(im.end ?? '')),
    area: String(im.area ?? ''),
    dorms: String(im.dorms ?? ''),
    vagas: String(im.vagas ?? ''),
    status: String(im.status ?? 'disponivel'),
    foto: (im.foto as string | null) ?? null,
  }
}

type OwnerRow = { user_id: string; perfil: Record<string, unknown> | null }

async function resolveOwner(
  supabase: ReturnType<typeof admin>,
  slug: string
): Promise<OwnerRow | null> {
  // Caminho principal: função SQL que usa o índice em perfil->>'slug'.
  const rpc = await supabase.rpc('cpr_resolve_slug', { p_slug: slug })
  if (!rpc.error && Array.isArray(rpc.data) && rpc.data.length > 0) {
    return rpc.data[0] as OwnerRow
  }
  if (rpc.error) {
    console.error('[vitrine] rpc cpr_resolve_slug falhou:', rpc.error.message)
  }
  // Fallback defensivo (mesma estratégia do /api/captura).
  const scan = await supabase.from('cpr_user_data').select('user_id, perfil').limit(2000)
  if (scan.error) {
    console.error('[vitrine] scan falhou:', scan.error.message)
    return null
  }
  const match = (scan.data ?? []).find(
    (r) => String((r.perfil as Record<string, unknown> | null)?.slug ?? '') === slug
  )
  return (match as OwnerRow) ?? null
}

async function assinaturaAtiva(
  supabase: ReturnType<typeof admin>,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data?.user) return false
  const status = (data.user.app_metadata as Record<string, unknown> | undefined)
    ?.subscription_status
  return status === 'active'
}

// `cache()` evita buscar duas vezes quando generateMetadata e a página
// pedem a mesma vitrine no mesmo request.
export const getVitrine = cache(async (slugRaw: string): Promise<Vitrine | null> => {
  const slug = (slugRaw ?? '').trim().toLowerCase()
  if (!slug || RESERVADOS.has(slug)) return null

  const supabase = admin()

  const owner = await resolveOwner(supabase, slug)
  if (!owner) return null
  if (!(await assinaturaAtiva(supabase, owner.user_id))) return null

  const perfil = (owner.perfil ?? {}) as Record<string, unknown>

  const { data: row, error } = await supabase
    .from('cpr_user_data')
    .select('imoveis')
    .eq('user_id', owner.user_id)
    .maybeSingle()
  if (error) console.error('[vitrine] leitura de imóveis falhou:', error.message)

  const todos = Array.isArray(row?.imoveis) ? (row!.imoveis as Record<string, unknown>[]) : []
  const imoveis = todos
    .filter((im) => {
      if (!im || im.publicado !== true) return false
      const st = String(im.status ?? 'disponivel')
      // Não expõe vendido/locado na vitrine — só o que ainda está em oferta.
      return st === 'disponivel' || st === 'reservado'
    })
    .map(projetar)

  return {
    ownerId: owner.user_id,
    slug,
    nome: String(perfil.nome ?? ''),
    creci: String(perfil.creci ?? ''),
    cor: String(perfil.cor ?? '#0F2D4A'),
    logo: (perfil.logo as string | null) ?? null,
    tel: String(perfil.tel ?? ''),
    imoveis,
  }
})
