'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AcessoPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const params = new URLSearchParams(window.location.search)
    const redirectTo =
      params.get('redirect_to') ||
      process.env.NEXT_PUBLIC_TOOL_URL ||
      'https://guilhermeassisp27-code.github.io/dev/tool.html'

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      setErro('Erro ao enviar link. Verifique o email e tente novamente.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#040D1C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: '#EEF2FF',
            }}
          >
            Corretor<span style={{ color: '#4D7EFF' }}>PRO</span>
          </div>
          <p style={{ color: '#7B93B8', fontSize: '13px', marginTop: '6px' }}>
            Acesse sua conta
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#050E1B',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            padding: '28px',
          }}
        >
          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(34,197,94,0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2
                style={{
                  color: '#EEF2FF',
                  fontSize: '16px',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                Link enviado!
              </h2>
              <p style={{ color: '#7B93B8', fontSize: '13px', lineHeight: 1.6 }}>
                Enviamos um link de acesso para{' '}
                <strong style={{ color: '#EEF2FF' }}>{email}</strong>.
                <br />
                Verifique sua caixa de entrada.
              </p>
              <button
                onClick={() => setSent(false)}
                style={{
                  marginTop: '20px',
                  background: 'none',
                  border: 'none',
                  color: '#4D7EFF',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Tentar com outro email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#7B93B8',
                  marginBottom: '6px',
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                style={{
                  width: '100%',
                  background: '#081526',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#EEF2FF',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  marginBottom: '16px',
                  transition: 'border-color .15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4D7EFF')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />

              {erro && (
                <p
                  style={{
                    color: '#EF4444',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}
                >
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: '#4D7EFF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontFamily: 'inherit',
                  transition: 'background .15s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.currentTarget.style.background = '#3567E8')
                }}
                onMouseLeave={(e) => {
                  if (!loading) (e.currentTarget.style.background = '#4D7EFF')
                }}
              >
                {loading ? 'Enviando...' : 'Enviar link de acesso'}
              </button>
            </form>
          )}
        </div>

        <p
          style={{
            textAlign: 'center',
            color: '#3D5470',
            fontSize: '12px',
            marginTop: '20px',
          }}
        >
          Acesso exclusivo para assinantes CorretorPRO
        </p>
      </div>
    </div>
  )
}
