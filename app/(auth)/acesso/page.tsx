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
    <div className="auth-page">
      <div className="auth-shell">
        {/* Logo */}
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="150" height="40" viewBox="0 0 300 80" fill="none" role="img" aria-label="Selo" style={{ color: 'var(--text)' }}>
              <g transform="translate(10,12) scale(0.875)">
                <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="1.4" strokeDasharray="1.4 5.1" strokeLinecap="round" />
                <circle cx="32" cy="32" r="23.5" stroke="currentColor" strokeWidth="2.4" />
                <path d="M22.5 32.8l6.2 6.2 12.4-14.6" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <text x="86" y="53" textAnchor="start" fontFamily="Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" fontWeight="600" fontSize="40" letterSpacing="6" fill="currentColor">SELO</text>
            </svg>
          </div>
          <p className="auth-subtitle">
            {modo === 'login' ? 'Acesse sua conta' : 'Recuperar senha'}
          </p>
        </div>

        {/* Card */}
        <div className="auth-card">
          {modo === 'recuperar' && recEnviado ? (
            <div className="auth-success">
              <div className="auth-success-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="auth-success-title">Email enviado!</h2>
              <p className="auth-success-text">
                Enviamos um link para redefinir a senha de{' '}
                <strong>{email}</strong>.
                <br />
                Verifique sua caixa de entrada.
              </p>
              <button
                onClick={() => {
                  setModo('login')
                  setRecEnviado(false)
                  setErro('')
                }}
                className="auth-link-btn"
              >
                Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={modo === 'login' ? handleLogin : handleRecuperar}>
              <label className="auth-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="auth-input"
              />

              {modo === 'login' && (
                <>
                  <label className="auth-label">Senha</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="auth-input"
                  />
                </>
              )}

              {erro && <p className="auth-error">{erro}</p>}

              <button type="submit" disabled={loading} className="auth-submit">
                {loading
                  ? modo === 'login'
                    ? 'Entrando...'
                    : 'Enviando...'
                  : modo === 'login'
                    ? 'Entrar'
                    : 'Enviar link de recuperação'}
              </button>

              <div className="auth-switch">
                <button
                  type="button"
                  onClick={() => {
                    setModo(modo === 'login' ? 'recuperar' : 'login')
                    setErro('')
                  }}
                  className="auth-link-btn"
                >
                  {modo === 'login' ? 'Esqueci minha senha' : 'Voltar para o login'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="auth-footer-note">Acesso exclusivo para assinantes Selo</p>
      </div>

      <style jsx>{`
        .auth-page {
          --bg: #0a2138;
          --bg-2: #0f2d4a;
          --surface: #152538;
          --text: #e8edf2;
          --text-2: #8fa0b2;
          --border: rgba(232, 237, 242, 0.08);
          --brand: #c9882a;
          --brand-2: #d6a24a;

          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: radial-gradient(120% 120% at 50% -10%, var(--bg-2), var(--bg));
          font-family: Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
        }

        @media (prefers-color-scheme: light) {
          .auth-page {
            --bg: #f5f0e8;
            --bg-2: #f5f0e8;
            --surface: #ffffff;
            --text: #15202b;
            --text-2: #5b6b7a;
            --border: rgba(15, 45, 74, 0.1);
          }
        }

        .auth-shell {
          width: 100%;
          max-width: 380px;
          animation: auth-rise 0.5s ease both;
        }

        @keyframes auth-rise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-brand {
          text-align: center;
          margin-bottom: 36px;
        }

        .auth-logo {
          display: flex;
          justify-content: center;
        }

        .auth-subtitle {
          color: var(--text-2);
          font-size: 15px;
          margin-top: 8px;
          letter-spacing: -0.01em;
        }

        .auth-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 32px 28px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
        }

        @media (prefers-color-scheme: light) {
          .auth-card {
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
          }
        }

        .auth-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-2);
          margin-bottom: 8px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .auth-input {
          width: 100%;
          background: rgba(127, 127, 127, 0.08);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 13px 14px;
          color: var(--text);
          font-size: 15px;
          font-family: inherit;
          outline: none;
          margin-bottom: 18px;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
          box-sizing: border-box;
        }

        .auth-input::placeholder {
          color: var(--text-2);
        }

        .auth-input:focus {
          border-color: var(--brand);
          box-shadow: 0 0 0 4px rgba(201, 136, 42, 0.16);
        }

        .auth-error {
          color: #ff6b6b;
          font-size: 13px;
          margin: -4px 0 14px;
        }

        .auth-submit {
          width: 100%;
          background: linear-gradient(135deg, var(--brand), var(--brand-2));
          color: #fff;
          border: none;
          border-radius: 980px;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: -0.01em;
          transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
          box-shadow: 0 12px 28px rgba(201, 136, 42, 0.3);
        }

        .auth-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-submit:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 34px rgba(201, 136, 42, 0.4);
        }

        .auth-switch {
          text-align: center;
          margin-top: 20px;
        }

        .auth-link-btn {
          background: none;
          border: none;
          color: var(--brand);
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 500;
          transition: opacity 0.15s ease;
        }

        .auth-link-btn:hover {
          opacity: 0.75;
        }

        .auth-success {
          text-align: center;
          padding: 8px 0;
        }

        .auth-success-icon {
          width: 52px;
          height: 52px;
          background: rgba(34, 197, 94, 0.12);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
        }

        .auth-success-title {
          color: var(--text);
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .auth-success-text {
          color: var(--text-2);
          font-size: 14px;
          line-height: 1.6;
        }

        .auth-success-text strong {
          color: var(--text);
        }

        .auth-footer-note {
          text-align: center;
          color: var(--text-2);
          font-size: 12px;
          margin-top: 24px;
          opacity: 0.75;
        }
      `}</style>
    </div>
  )
}
