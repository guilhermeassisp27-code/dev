'use client'
import { useRef, useState, useEffect } from 'react'

function fmtData(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function Sign({
  id,
  cor,
  cliente,
  signedAt,
  signerName,
}: {
  id: string
  cor: string
  cliente: string
  signedAt: string | null
  signerName: string | null
}) {
  const [nome, setNome] = useState(cliente || '')
  const [cpf, setCpf] = useState('')
  const [aceite, setAceite] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [feitoEm, setFeitoEm] = useState<string | null>(signedAt)
  const [feitoPor, setFeitoPor] = useState<string | null>(signerName)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desenhou = useRef(false)
  const desenhando = useRef(false)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0F172A'
    const pos = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height }
    }
    const down = (e: PointerEvent) => {
      desenhando.current = true
      desenhou.current = true
      const p = pos(e)
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      c.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!desenhando.current) return
      const p = pos(e)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    }
    const up = () => {
      desenhando.current = false
    }
    c.addEventListener('pointerdown', down)
    c.addEventListener('pointermove', move)
    c.addEventListener('pointerup', up)
    c.addEventListener('pointerleave', up)
    return () => {
      c.removeEventListener('pointerdown', down)
      c.removeEventListener('pointermove', move)
      c.removeEventListener('pointerup', up)
      c.removeEventListener('pointerleave', up)
    }
  }, [])

  function limpar() {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height)
    desenhou.current = false
  }

  async function assinar() {
    setErro('')
    if (!nome.trim()) return setErro('Informe seu nome completo.')
    if (cpf.replace(/\D/g, '').length < 11) return setErro('Informe um CPF válido.')
    if (!desenhou.current) return setErro('Faça sua assinatura no quadro acima.')
    if (!aceite) return setErro('Marque que você leu e concorda com a proposta.')
    setEnviando(true)
    const assinatura = canvasRef.current?.toDataURL('image/png') || ''
    try {
      const r = await fetch('/api/proposta-sign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, nome, cpf, assinatura }),
      })
      if (!r.ok) throw new Error()
      setFeitoEm(new Date().toISOString())
      setFeitoPor(nome)
    } catch {
      setErro('Não foi possível registrar agora. Tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  // Já assinada (no servidor ou agora)
  if (feitoEm) {
    return (
      <div style={card(cor)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={selo(cor)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Proposta aceita e assinada</div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
              Por <b>{feitoPor}</b> · {fmtData(feitoEm)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={card(cor)}>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Aceite e assinatura</div>
      <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: '0 0 16px' }}>
        Concordou com a proposta? Assine abaixo. Sua assinatura é registrada com data e hora.
      </p>

      <Campo label="Nome completo *" value={nome} onChange={setNome} cor={cor} placeholder="Seu nome" />
      <Campo
        label="CPF *"
        value={cpf}
        onChange={(v) => setCpf(v.replace(/[^\d.\-]/g, '').slice(0, 14))}
        cor={cor}
        placeholder="000.000.000-00"
      />

      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
        Sua assinatura *
      </label>
      <div style={{ position: 'relative', border: '1px dashed #CBD5E1', borderRadius: 10, background: '#F8FAFC', marginBottom: 6 }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={170}
          style={{ width: '100%', height: 150, touchAction: 'none', display: 'block', cursor: 'crosshair' }}
        />
        <button
          type="button"
          onClick={limpar}
          style={{ position: 'absolute', top: 8, right: 8, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 7, padding: '4px 10px', fontSize: 12, color: '#64748B', cursor: 'pointer' }}
        >
          Limpar
        </button>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '12px 0', cursor: 'pointer' }}>
        <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} style={{ marginTop: 2, width: 17, height: 17, accentColor: cor }} />
        <span>Li e estou de acordo com os termos desta proposta.</span>
      </label>

      {erro && <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>{erro}</p>}

      <button
        onClick={assinar}
        disabled={enviando}
        style={{ width: '100%', background: cor, color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.6 : 1 }}
      >
        {enviando ? 'Registrando...' : 'Aceitar e assinar'}
      </button>
      <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 10, lineHeight: 1.5, textAlign: 'center' }}>
        Assinatura eletrônica simples, registrada com data, hora e IP (Lei 14.063/2020).
      </p>
    </div>
  )
}

const card = (cor: string): React.CSSProperties => ({
  maxWidth: 760,
  margin: '20px auto 0',
  background: '#fff',
  border: `1px solid ${cor}33`,
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
})
const selo = (cor: string): React.CSSProperties => ({ width: 44, height: 44, borderRadius: '50%', background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 })

function Campo({ label, value, onChange, cor, placeholder }: { label: string; value: string; onChange: (v: string) => void; cor: string; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 13px', color: '#0F172A', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        onFocus={(e) => (e.target.style.borderColor = cor)}
        onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
      />
    </div>
  )
}
