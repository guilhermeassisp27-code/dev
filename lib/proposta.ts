import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

// Lê uma proposta pública por id (service role, ignora RLS). Retorna o HTML
// autossuficiente guardado no momento da geração + a cor de marca.
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export type PropostaPublica = {
  id: string
  titulo: string
  cliente: string
  cor: string
  html: string
  signedAt: string | null
  signerName: string | null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const getProposta = cache(async (id: string): Promise<PropostaPublica | null> => {
  if (!id || !UUID.test(id)) return null
  const supabase = admin()
  const { data, error } = await supabase
    .from('cpr_public_proposals')
    .select('id, titulo, cliente, cor, html, signed_at, signer_name')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return {
    id: String(data.id),
    titulo: String(data.titulo ?? ''),
    cliente: String(data.cliente ?? ''),
    cor: String(data.cor ?? '#0F2D4A'),
    html: String(data.html ?? ''),
    signedAt: (data.signed_at as string | null) ?? null,
    signerName: (data.signer_name as string | null) ?? null,
  }
})

// Registra a assinatura/aceite do cliente (só a 1ª vez).
export async function registrarAssinatura(
  id: string,
  dados: { nome: string; cpf: string; assinatura: string; ip: string }
): Promise<{ ok: boolean; jaAssinada?: boolean }> {
  if (!id || !UUID.test(id)) return { ok: false }
  const supabase = admin()
  const { data } = await supabase
    .from('cpr_public_proposals')
    .select('signed_at')
    .eq('id', id)
    .maybeSingle()
  if (!data) return { ok: false }
  if (data.signed_at) return { ok: true, jaAssinada: true }
  const { error } = await supabase
    .from('cpr_public_proposals')
    .update({
      signed_at: new Date().toISOString(),
      signer_name: dados.nome.slice(0, 120),
      signer_cpf: dados.cpf.slice(0, 20),
      signer_signature: dados.assinatura.slice(0, 200000),
      signer_ip: dados.ip.slice(0, 60),
    })
    .eq('id', id)
    .is('signed_at', null) // corrida: não sobrescreve assinatura já feita
  return { ok: !error }
}

// Registra uma abertura (1ª e última). Chamado só por navegador real
// (client-side), então o bot de preview do WhatsApp não conta.
export async function registrarView(id: string): Promise<boolean> {
  if (!id || !UUID.test(id)) return false
  const supabase = admin()
  const { data } = await supabase
    .from('cpr_public_proposals')
    .select('views, first_view_at')
    .eq('id', id)
    .maybeSingle()
  if (!data) return false
  const agora = new Date().toISOString()
  const { error } = await supabase
    .from('cpr_public_proposals')
    .update({
      views: (Number(data.views) || 0) + 1,
      last_view_at: agora,
      first_view_at: data.first_view_at ?? agora,
    })
    .eq('id', id)
  return !error
}
