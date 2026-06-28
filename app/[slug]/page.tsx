import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getVitrine, type Vitrine, type ImovelPublico } from '@/lib/corretor'

// Dados mudam quando o corretor publica/despublica — sempre SSR fresco.
export const dynamic = 'force-dynamic'

// ── Paleta do kit Selo ──
const NAVY = '#0F2D4A'
const AMBER = '#C9882A'
const SURFACE = '#F5F0E8'
const INK = '#15202B'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const v = await getVitrine(params.slug)
  if (!v) return { title: 'Corretor não encontrado | Selo', robots: { index: false } }
  const titulo = `Imóveis de ${v.nome || 'Corretor'}`
  const desc = v.imoveis.length
    ? `${v.imoveis.length} ${v.imoveis.length === 1 ? 'imóvel disponível' : 'imóveis disponíveis'}. Fale direto com ${(v.nome || 'o corretor').split(' ')[0]}.`
    : `Confira os imóveis de ${v.nome || 'nosso corretor'}.`
  return {
    title: `${titulo} | Selo`,
    description: desc,
    openGraph: { title: titulo, description: desc, type: 'website' },
    twitter: { card: 'summary_large_image', title: titulo, description: desc },
  }
}

export default async function VitrinePage({ params }: { params: { slug: string } }) {
  const v = await getVitrine(params.slug)
  if (!v) notFound()

  const cor = v.cor || NAVY
  const primeiro = v.nome ? v.nome.split(' ')[0] : 'o corretor'
  const zap = soDigitos(v.tel)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: SURFACE,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: INK,
      }}
    >
      {/* Cabeçalho branded */}
      <header
        style={{
          background: NAVY,
          color: '#fff',
          padding: '40px 20px 48px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {v.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={v.logo}
              alt={v.nome}
              style={{ maxHeight: 64, maxWidth: 220, objectFit: 'contain', marginBottom: 14 }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: cor,
                color: '#fff',
                fontSize: 28,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              {(v.nome || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.01em' }}>
            {v.nome || 'Corretor de Imóveis'}
          </h1>
          {v.creci && (
            <div style={{ marginTop: 6, fontSize: 13, color: '#8FA0B2', fontWeight: 600 }}>
              CRECI {v.creci}
            </div>
          )}
          <p style={{ marginTop: 14, fontSize: 15, color: '#C5D0DB', maxWidth: 440, marginInline: 'auto', lineHeight: 1.5 }}>
            {v.imoveis.length
              ? 'Confira os imóveis disponíveis na minha carteira. Achou algo? Fale comigo.'
              : `Em breve novos imóveis por aqui. Quer adiantar? Fale com ${primeiro}.`}
          </p>
        </div>
      </header>

      {/* Catálogo */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px 64px' }}>
        {v.imoveis.length === 0 ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid #E7E0D4',
              borderRadius: 16,
              padding: 40,
              textAlign: 'center',
              color: '#64748B',
              fontSize: 15,
            }}
          >
            Nenhum imóvel publicado no momento.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 18,
            }}
          >
            {v.imoveis.map((im) => (
              <Card key={im.id} im={im} slug={v.slug} cor={cor} />
            ))}
          </div>
        )}
      </main>

      {/* Botão flutuante de WhatsApp */}
      {zap && (
        <a
          href={`https://wa.me/55${zap}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            right: 18,
            bottom: 18,
            background: '#25D366',
            color: '#fff',
            borderRadius: 100,
            padding: '12px 18px',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.477-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z"/></svg>
          Falar no WhatsApp
        </a>
      )}

      {/* Rodapé — aquisição orgânica */}
      <footer style={{ textAlign: 'center', padding: '24px 16px 32px', color: '#94A3B8', fontSize: 12 }}>
        <a
          href="https://selosales.com.br"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#94A3B8', textDecoration: 'none' }}
        >
          Feito com <span style={{ fontWeight: 800, color: AMBER }}>Selo</span> — crie o seu site de imóveis
        </a>
      </footer>
    </div>
  )
}

function Card({ im, slug, cor }: { im: ImovelPublico; slug: string; cor: string }) {
  const valor = formatarValor(im)
  const local = [im.bairro, im.cidade].filter(Boolean).join(' · ')
  const specs: string[] = []
  if (im.area) specs.push(`${im.area} m²`)
  if (im.dorms) specs.push(`${im.dorms} dorm.`)
  if (im.vagas) specs.push(`${im.vagas} vaga${im.vagas === '1' ? '' : 's'}`)
  const interesse = `/captura/${encodeURIComponent(slug)}?imovel=${encodeURIComponent(
    [im.tipo, im.bairro].filter(Boolean).join(' — ')
  )}`

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E7E0D4',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 10px rgba(15,45,74,0.05)',
      }}
    >
      <div
        style={{
          aspectRatio: '4 / 3',
          background: '#EEE7DA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {im.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={im.foto} alt={im.tipo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#B7AC97" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
        )}
        {im.status === 'reservado' && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: AMBER,
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            Reservado
          </span>
        )}
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: cor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {im.tipo || 'Imóvel'}
          {im.finalidade ? ` · ${im.finalidade === 'locacao' ? 'Locação' : im.finalidade === 'permuta' ? 'Permuta' : 'Venda'}` : ''}
        </span>
        {local && <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{local}</div>}
        {specs.length > 0 && <div style={{ fontSize: 12.5, color: '#64748B' }}>{specs.join(' · ')}</div>}
        <div style={{ fontSize: 19, fontWeight: 800, color: INK, marginTop: 2 }}>{valor}</div>
        <a
          href={interesse}
          style={{
            marginTop: 'auto',
            background: cor,
            color: '#fff',
            textAlign: 'center',
            textDecoration: 'none',
            borderRadius: 10,
            padding: '11px 12px',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Tenho interesse
        </a>
      </div>
    </div>
  )
}

function formatarValor(im: ImovelPublico): string {
  if (!im.valor) return 'Consulte'
  const sufixo = im.finalidade === 'locacao' ? '/mês' : ''
  return `R$ ${im.valor}${sufixo}`
}

function soDigitos(s: string): string {
  return (s || '').replace(/\D/g, '')
}
