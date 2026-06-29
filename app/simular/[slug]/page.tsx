'use client'
import { useEffect, useMemo, useState } from 'react'

type Branding = { nome: string; creci: string; cor: string; logo: string | null }
type TaxaBanco = { banco: string; taxaAnual: number }
type Taxas = { taxas: TaxaBanco[]; ref: string; fonte: string; aoVivo: boolean }

// Matemática idêntica à da ferramenta (Tabela Price).
function parcelaPrice(pv: number, taxaAnual: number, meses: number): number {
  const i = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1
  if (i <= 0) return pv / meses
  return (pv * (i * Math.pow(1 + i, meses))) / (Math.pow(1 + i, meses) - 1)
}
const brl = (n: number) =>
  'R$ ' + Math.round(n).toLocaleString('pt-BR')

export default function SimularPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const [branding, setBranding] = useState<Branding | null>(null)
  const [taxas, setTaxas] = useState<Taxas | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)

  const [valor, setValor] = useState('500000')
  const [entrada, setEntrada] = useState('20')
  const [anos, setAnos] = useState('30')

  const [querContato, setQuerContato] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/captura?slug=${encodeURIComponent(slug)}`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.status)
      ),
      fetch('/api/taxas').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([b, t]) => {
        setBranding(b)
        setTaxas(t)
      })
      .catch(() => setNaoEncontrado(true))
      .finally(() => setCarregando(false))
  }, [slug])

  const cor = branding?.cor || '#0F2D4A'
  const valorNum = Math.max(0, Number(String(valor).replace(/\D/g, '')) || 0)
  const entradaPct = Math.min(90, Math.max(0, Number(entrada) || 0))
  const meses = Math.max(12, (Number(anos) || 30) * 12)
  const financiado = Math.round(valorNum * (1 - entradaPct / 100))

  const linhas = useMemo(() => {
    if (!taxas || !financiado) return []
    return taxas.taxas
      .map((t) => ({
        banco: t.banco,
        taxa: t.taxaAnual,
        parcela: parcelaPrice(financiado, t.taxaAnual, meses),
      }))
      .sort((a, b) => a.parcela - b.parcela)
  }, [taxas, financiado, meses])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) return setErro('Informe seu nome.')
    if (!telefone.trim()) return setErro('Informe seu WhatsApp.')
    setEnviando(true)
    const melhor = linhas[0]
    const resumo =
      `Simulou financiamento: imóvel ${brl(valorNum)} · entrada ${entradaPct}% (${brl(
        valorNum - financiado
      )}) · ${Number(anos)} anos. ` +
      (melhor
        ? `Melhor estimativa: ${melhor.banco} ${melhor.taxa}% a.a. → ${brl(
            melhor.parcela
          )}/mês.`
        : '')
    try {
      const resp = await fetch('/api/captura', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug,
          nome,
          telefone,
          imovel: 'Simulação de financiamento',
          mensagem: resumo,
          origem: 'simulacao',
          website,
        }),
      })
      if (!resp.ok) throw new Error()
      setEnviado(true)
    } catch {
      setErro('Não foi possível enviar agora. Tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando)
    return (
      <Shell>
        <p style={{ color: '#64748B', fontSize: 14, textAlign: 'center' }}>Carregando...</p>
      </Shell>
    )

  if (naoEncontrado)
    return (
      <Shell>
        <p style={{ color: '#0F172A', fontSize: 15, fontWeight: 600, textAlign: 'center' }}>
          Link indisponível
        </p>
        <p style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 6 }}>
          Esta simulação não está mais ativa.
        </p>
      </Shell>
    )

  if (enviado)
    return (
      <Shell cor={cor} branding={branding}>
        <div style={{ textAlign: 'center' }}>
          <div style={dot(cor)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <p style={{ color: '#0F172A', fontSize: 17, fontWeight: 700 }}>Simulação enviada!</p>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            {branding?.nome ? `${branding.nome.split(' ')[0]} vai` : 'O corretor vai'} te chamar no
            WhatsApp pra te ajudar a conseguir a melhor taxa.
          </p>
        </div>
      </Shell>
    )

  return (
    <Shell cor={cor} branding={branding}>
      <p style={{ color: '#0F172A', fontSize: 18, fontWeight: 800, marginBottom: 3 }}>
        Simule seu financiamento
      </p>
      <p style={{ color: '#64748B', fontSize: 13, marginBottom: 18, lineHeight: 1.5 }}>
        Veja a parcela estimada nos principais bancos. Em segundos, sem compromisso.
      </p>

      <Campo label="Valor do imóvel" value={valor} onChange={(v) => setValor(v.replace(/\D/g, ''))} prefix="R$" cor={cor} mostrar={valorNum ? valorNum.toLocaleString('pt-BR') : ''} />
      <div style={{ display: 'flex', gap: 12 }}>
        <Campo label="Entrada (%)" value={entrada} onChange={setEntrada} cor={cor} type="number" />
        <Campo label="Prazo (anos)" value={anos} onChange={setAnos} cor={cor} type="number" />
      </div>

      {financiado > 0 && (
        <div style={{ fontSize: 12.5, color: '#64748B', margin: '2px 0 16px' }}>
          Financiando <b style={{ color: '#0F172A' }}>{brl(financiado)}</b> em {Number(anos)} anos
          ({meses}x).
        </div>
      )}

      {/* Comparativo multibancos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {linhas.map((l, idx) => (
          <div
            key={l.banco}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 12,
              border: `1px solid ${idx === 0 ? cor : '#E2E8F0'}`,
              background: idx === 0 ? hex(cor, 0.06) : '#fff',
            }}
          >
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>
                {l.banco}
                {idx === 0 && (
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, color: cor, background: hex(cor, 0.14), padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    Melhor
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{l.taxa}% a.a.</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>{brl(l.parcela)}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>/mês (Price)</div>
            </div>
          </div>
        ))}
      </div>

      {taxas && (
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 12, lineHeight: 1.5 }}>
          Taxas médias de mercado · fonte: <b>{taxas.fonte}</b>
          {taxas.ref ? ` · ref. ${taxas.ref}` : ''}. Estimativa — a taxa final depende da análise e
          aprovação do banco.
        </p>
      )}

      {!querContato ? (
        <button onClick={() => setQuerContato(true)} style={botao(cor)}>
          Quero ajuda pra conseguir a melhor taxa
        </button>
      ) : (
        <form onSubmit={enviar} style={{ marginTop: 18 }}>
          <Campo label="Seu nome *" value={nome} onChange={setNome} placeholder="Nome completo" cor={cor} />
          <Campo label="Seu WhatsApp *" value={telefone} onChange={setTelefone} placeholder="(11) 99999-9999" cor={cor} type="tel" />
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} aria-hidden="true" />
          {erro && <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>{erro}</p>}
          <button type="submit" disabled={enviando} style={{ ...botao(cor), opacity: enviando ? 0.6 : 1 }}>
            {enviando ? 'Enviando...' : 'Enviar pro corretor'}
          </button>
        </form>
      )}
    </Shell>
  )
}

const hex = (c: string, a: number) => {
  const m = c.replace('#', '')
  const n = parseInt(m.length === 3 ? m.replace(/(.)/g, '$1$1') : m, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
const dot = (cor: string): React.CSSProperties => ({ width: 56, height: 56, borderRadius: '50%', background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' })
const botao = (cor: string): React.CSSProperties => ({ width: '100%', background: cor, color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 18 })

function Shell({ children, cor, branding }: { children: React.ReactNode; cor?: string; branding?: Branding | null }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {branding && (
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            {branding.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logo} alt={branding.nome} style={{ maxHeight: 56, maxWidth: 180, objectFit: 'contain', marginBottom: 8 }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 14, background: cor, color: '#fff', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                {(branding.nome || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ color: '#0F172A', fontSize: 16, fontWeight: 700 }}>{branding.nome}</div>
            {branding.creci && <div style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>CRECI {branding.creci}</div>}
          </div>
        )}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 26, boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>{children}</div>
        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 14 }}>
          Feito com <span style={{ fontWeight: 700, color: '#C9882A' }}>Selo</span>
        </p>
      </div>
    </div>
  )
}

function Campo({ label, value, onChange, placeholder, cor, type = 'text', prefix, mostrar }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; cor: string; type?: string; prefix?: string; mostrar?: string }) {
  const base: React.CSSProperties = { width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 13px', color: '#0F172A', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
  return (
    <div style={{ marginBottom: 14, flex: 1 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 14 }}>{prefix}</span>}
        <input
          type={type === 'number' ? 'tel' : type}
          inputMode={type === 'number' ? 'numeric' : undefined}
          value={mostrar !== undefined && mostrar !== '' ? mostrar : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...base, paddingLeft: prefix ? 34 : 13 }}
          onFocus={(e) => (e.target.style.borderColor = cor)}
          onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
        />
      </div>
    </div>
  )
}
