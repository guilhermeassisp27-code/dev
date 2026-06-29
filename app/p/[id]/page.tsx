import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProposta } from '@/lib/proposta'
import TrackView from './track'
import Sign from './sign'

// Proposta muda de status (visualizada) — sempre fresca; e nunca indexar
// (é um link privado entre corretor e cliente).
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const p = await getProposta(params.id)
  if (!p) return { title: 'Proposta | Selo', robots: { index: false, follow: false } }
  return {
    title: `${p.titulo || 'Proposta comercial'} | Selo`,
    description: p.cliente ? `Proposta para ${p.cliente}.` : 'Proposta comercial.',
    robots: { index: false, follow: false },
  }
}

export default async function PropostaPage({ params }: { params: { id: string } }) {
  const p = await getProposta(params.id)
  if (!p) notFound()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#EEF1F4',
        padding: '28px 16px 48px',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* HTML autossuficiente da proposta (CSS inline gerado no momento) */}
        <div dangerouslySetInnerHTML={{ __html: p.html }} />

        {/* Aceite / assinatura eletrônica do cliente */}
        <Sign
          id={p.id}
          cor={p.cor}
          cliente={p.cliente}
          signedAt={p.signedAt}
          signerName={p.signerName}
        />

        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 22 }}>
          <a
            href="https://selosales.com.br"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#94A3B8', textDecoration: 'none' }}
          >
            Documento gerado com <span style={{ fontWeight: 800, color: '#C9882A' }}>Selo</span>
          </a>
        </p>
      </div>

      {/* registra a abertura (só navegador real — filtra o bot do WhatsApp) */}
      <TrackView id={p.id} />
    </div>
  )
}
