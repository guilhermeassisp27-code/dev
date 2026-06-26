'use client'
import { useEffect, useState } from 'react'

type Branding = { nome: string; creci: string; cor: string; logo: string | null }

export default function CapturaPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const [branding, setBranding] = useState<Branding | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [imovel, setImovel] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/captura?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((b: Branding) => setBranding(b))
      .catch(() => setNaoEncontrado(true))
      .finally(() => setCarregando(false))
  }, [slug])

  const cor = branding?.cor || '#0F2D4A'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) {
      setErro('Por favor, informe seu nome.')
      return
    }
    setEnviando(true)
    try {
      const resp = await fetch('/api/captura', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, nome, telefone, imovel, mensagem, website }),
      })
      if (!resp.ok) throw new Error()
      setEnviado(true)
    } catch {
      setErro('Não foi possível enviar agora. Tente novamente em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <Shell>
        <p style={{ color: '#64748B', fontSize: 14, textAlign: 'center' }}>Carregando...</p>
      </Shell>
    )
  }

  if (naoEncontrado) {
    return (
      <Shell>
        <p style={{ color: '#0F172A', fontSize: 15, fontWeight: 600, textAlign: 'center' }}>
          Link indisponível
        </p>
        <p style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 6 }}>
          Este link de contato não está mais ativo.
        </p>
      </Shell>
    )
  }

  if (enviado) {
    return (
      <Shell cor={cor} branding={branding}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: cor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <p style={{ color: '#0F172A', fontSize: 17, fontWeight: 700 }}>Contato enviado!</p>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            {branding?.nome ? `${branding.nome} vai` : 'O corretor vai'} receber seus dados e entrar
            em contato em breve.
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell cor={cor} branding={branding}>
      <p style={{ color: '#0F172A', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
        Tenho interesse
      </p>
      <p style={{ color: '#64748B', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
        Deixe seus dados que {branding?.nome ? branding.nome.split(' ')[0] : 'o corretor'} entra em
        contato com você.
      </p>

      <form onSubmit={handleSubmit}>
        <Campo label="Seu nome *" value={nome} onChange={setNome} placeholder="Nome completo" cor={cor} />
        <Campo label="WhatsApp / Telefone" value={telefone} onChange={setTelefone} placeholder="(11) 99999-9999" cor={cor} type="tel" />
        <Campo label="Imóvel de interesse" value={imovel} onChange={setImovel} placeholder="Ex: Apartamento 2 quartos, Pinheiros" cor={cor} />
        <Campo label="Mensagem (opcional)" value={mensagem} onChange={setMensagem} placeholder="Conte o que procura" cor={cor} textarea />

        {/* honeypot — invisível para humanos */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
          aria-hidden="true"
        />

        {erro && <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 12 }}>{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          style={{
            width: '100%',
            background: cor,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: 13,
            fontSize: 15,
            fontWeight: 700,
            cursor: enviando ? 'not-allowed' : 'pointer',
            opacity: enviando ? 0.6 : 1,
            fontFamily: 'inherit',
            marginTop: 4,
          }}
        >
          {enviando ? 'Enviando...' : 'Enviar contato'}
        </button>
      </form>
    </Shell>
  )
}

function Shell({
  children,
  cor,
  branding,
}: {
  children: React.ReactNode
  cor?: string
  branding?: Branding | null
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        {branding && (
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            {branding.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logo}
                alt={branding.nome}
                style={{ maxHeight: 56, maxWidth: 180, objectFit: 'contain', marginBottom: 8 }}
              />
            ) : (
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: cor,
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                }}
              >
                {(branding.nome || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ color: '#0F172A', fontSize: 16, fontWeight: 700 }}>{branding.nome}</div>
            {branding.creci && (
              <div style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>CRECI {branding.creci}</div>
            )}
          </div>
        )}

        <div
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
          }}
        >
          {children}
        </div>

        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 14 }}>
          Gerado com <span style={{ fontWeight: 700, color: '#C9882A' }}>Selo</span>
        </p>
      </div>
    </div>
  )
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  cor,
  type = 'text',
  textarea = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  cor: string
  type?: string
  textarea?: boolean
}) {
  const base: React.CSSProperties = {
    width: '100%',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    padding: '11px 13px',
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    marginBottom: 14,
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  }
  return (
    <>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: '#475569',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...base, resize: 'vertical' }}
          onFocus={(e) => (e.target.style.borderColor = cor)}
          onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={base}
          onFocus={(e) => (e.target.style.borderColor = cor)}
          onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
        />
      )}
    </>
  )
}
