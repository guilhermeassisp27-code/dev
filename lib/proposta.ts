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
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const getProposta = cache(async (id: string): Promise<PropostaPublica | null> => {
  if (!id || !UUID.test(id)) return null
  const supabase = admin()
  const { data, error } = await supabase
    .from('cpr_public_proposals')
    .select('id, titulo, cliente, cor, html')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return {
    id: String(data.id),
    titulo: String(data.titulo ?? ''),
    cliente: String(data.cliente ?? ''),
    cor: String(data.cor ?? '#0F2D4A'),
    html: String(data.html ?? ''),
  }
})

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
