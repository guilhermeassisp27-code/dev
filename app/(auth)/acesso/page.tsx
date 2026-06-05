'use client'
import { useState } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Implicit flow: precisamos da sessão como tokens para repassar à ferramenta (cross-domain)
function createImplicitClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'implicit', persistSession: false } }
  )
}

const TOOL_URL =
  process.env.NEXT_PUBLIC_TOOL_URL ||
  'https://guilhermeassisp27-code.github.io/dev/tool.html'

// Repassa a sessão para a ferramenta (GitHub Pages) via hash fragment
function irParaFerramenta(session: {
  access_token: string
  refresh_token: string
  expires_in: number
}) {
  const params = new URLSearchParams(window.location.search)
  const base = params.get('redirect_to') || TOOL_URL
  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: String(session.expires_in),
    token_type: 'bearer',
    type: 'signin',
  }).toString()
  window.location.href = `${base}#${hash}`
}

export default function AcessoPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [modo, setModo] = useState<'login' | 'recuperar'>('login')
  const [recEnviado, setRecEnviado] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const supabase = createImplicitClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      if (error.message.includes('Invalid login')) {
        setErro('Email ou senha incorretos.')
      } else if (error.message.includes('not confirmed') || error.message.includes('confirmed')) {
        setErro('Conta ainda não ativada. Verifique seu email para definir a senha.')
      } else {
        setErro('Não foi possível entrar. Tente novamente.')
      }
      setLoading(false)
      return
    }

    if (data.session) {
      irParaFerramenta(data.session)
    } else {
      setErro('Não foi possível iniciar a sessão.')
      setLoading(false)
    }
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const supabase = createImplicitClient()
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/definir-senha`,
    })

    if (error) {
      if (error.message.includes('rate') || error.message.includes('60')) {
        setErro('Aguarde 1 minuto antes de tentar novamente.')
      } else {
        setErro('Erro ao enviar email. Verifique o endereço e tente novamente.')
      }
    } else {
      setRecEnviado(true)
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
          <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: '#EEF2FF' }}>
            Corretor<span style={{ color: '#4D7EFF' }}>PRO</span>
          </div>
          <p style={{ color: '#7B93B8', fontSize: '13px', marginTop: '6px' }}>
            {modo === 'login' ? 'Acesse sua conta' : 'Recuperar senha'}
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
          {modo === 'recuperar' && recEnviado ? (
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
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ color: '#EEF2FF', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                Email enviado!
              </h2>
              <p style={{ color: '#7B93B8', fontSize: '13px', lineHeight: 1.6 }}>
                Enviamos um link para redefinir a senha de{' '}
                <strong style={{ color: '#EEF2FF' }}>{email}</strong>.
                <br />
                Verifique sua caixa de entrada.
              </p>
              <button
                onClick={() => {
                  setModo('login')
                  setRecEnviado(false)
                  setErro('')
                }}
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
                Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={modo === 'login' ? handleLogin : handleRecuperar}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#4D7EFF')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />

              {modo === 'login' && (
                <>
                  <label style={labelStyle}>Senha</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#4D7EFF')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </>
              )}

              {erro && (
                <p style={{ color: '#EF4444', fontSize: '12px', marginBottom: '12px' }}>{erro}</p>
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
                  if (!loading) e.currentTarget.style.background = '#3567E8'
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = '#4D7EFF'
                }}
              >
                {loading
                  ? modo === 'login'
                    ? 'Entrando...'
                    : 'Enviando...'
                  : modo === 'login'
                    ? 'Entrar'
                    : 'Enviar link de recuperação'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setModo(modo === 'login' ? 'recuperar' : 'login')
                    setErro('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4D7EFF',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {modo === 'login' ? 'Esqueci minha senha' : 'Voltar para o login'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#3D5470', fontSize: '12px', marginTop: '20px' }}>
          Acesso exclusivo para assinantes CorretorPRO
        </p>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#7B93B8',
  marginBottom: '6px',
  letterSpacing: '.04em',
  textTransform: 'uppercase',
}

const inputStyle: React.CSSProperties = {
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
  boxSizing: 'border-box',
}
