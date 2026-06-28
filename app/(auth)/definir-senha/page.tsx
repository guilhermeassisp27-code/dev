'use client'
import { useState, useEffect } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function createImplicitClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'implicit', persistSession: true, detectSessionInUrl: true } }
  )
}

const TOOL_URL =
  process.env.NEXT_PUBLIC_TOOL_URL ||
  'https://guilhermeassisp27-code.github.io/dev/tool.html'

function irParaFerramenta(session: {
  access_token: string
  refresh_token: string
  expires_in: number
}) {
  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: String(session.expires_in),
    token_type: 'bearer',
    type: 'signin',
  }).toString()
  window.location.href = `${TOOL_URL}#${hash}`
}

export default function DefinirSenhaPage() {
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [temSessao, setTemSessao] = useState(false)
  const [modoSenha, setModoSenha] = useState(false) // false = entrar direto (magic link); true = definir senha
  const [erro, setErro] = useState('')

  // O link do email (convite/recuperação) traz os tokens no hash → estabelece sessão
  useEffect(() => {
    const supabase = createImplicitClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setTemSessao(true)
        // Limpa o hash da URL por segurança
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname + window.location.search)
        }
      }
      setVerificando(false)
    })
  }, [])

  // Magic link: o próprio link do email já estabelece a sessão. Aqui só a
  // reusamos para entrar direto na ferramenta, sem obrigar a definir senha
  // antes (remove um passo do funil de ativação). Quem nunca define senha
  // continua entrando pelo "esqueci minha senha", que cai aqui de novo.
  async function entrarAgora() {
    setErro('')
    setLoading(true)
    const supabase = createImplicitClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      irParaFerramenta(session)
    } else {
      setErro('Sua sessão expirou. Solicite um novo link na tela de login.')
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirma) {
      setErro('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const supabase = createImplicitClient()
    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro('Não foi possível salvar a senha. O link pode ter expirado — solicite um novo.')
      setLoading(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      irParaFerramenta(session)
    } else {
      // Senha salva mas sem sessão — manda para o login
      window.location.href = '/acesso'
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
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
            {verificando ? 'Verificando seu acesso' : !temSessao ? 'Acesso' : modoSenha ? 'Defina sua senha' : 'Sua conta está pronta'}
          </p>
        </div>

        <div className="auth-card">
          {verificando ? (
            <p className="auth-verifying">Verificando link...</p>
          ) : !temSessao ? (
            <div className="auth-success">
              <p className="auth-success-title">Link inválido ou expirado</p>
              <p className="auth-success-text" style={{ marginBottom: '18px' }}>
                Solicite um novo link de acesso na tela de login.
              </p>
              <a href="/acesso" className="auth-link-btn auth-link-inline">
                Ir para o login
              </a>
            </div>
          ) : !modoSenha ? (
            <div className="auth-success">
              <h2 className="auth-success-title">Tudo pronto, sua conta foi ativada!</h2>
              <p className="auth-success-text" style={{ marginBottom: '20px' }}>
                Entre agora e comece a usar. Você pode criar uma senha quando quiser, para os próximos acessos.
              </p>

              {erro && <p className="auth-error">{erro}</p>}

              <button onClick={entrarAgora} disabled={loading} className="auth-submit">
                {loading ? 'Entrando...' : 'Entrar na ferramenta →'}
              </button>

              <div className="auth-switch">
                <button type="button" onClick={() => { setErro(''); setModoSenha(true) }} className="auth-link-btn">
                  Prefiro criar uma senha agora
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="auth-label">Nova senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
                className="auth-input"
              />

              <label className="auth-label">Confirmar senha</label>
              <input
                type="password"
                value={confirma}
                onChange={(e) => setConfirma(e.target.value)}
                required
                placeholder="Repita a senha"
                className="auth-input"
              />

              {erro && <p className="auth-error">{erro}</p>}

              <button type="submit" disabled={loading} className="auth-submit">
                {loading ? 'Salvando...' : 'Salvar e entrar'}
              </button>

              <div className="auth-switch">
                <button type="button" onClick={() => { setErro(''); setModoSenha(false) }} className="auth-link-btn">
                  Voltar e entrar sem senha
                </button>
              </div>
            </form>
          )}
        </div>
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

        .auth-link-btn {
          background: none;
          border: none;
          color: var(--brand);
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 500;
          transition: opacity 0.15s ease;
          text-decoration: none;
        }

        .auth-link-btn:hover {
          opacity: 0.75;
        }

        .auth-link-inline {
          display: inline-block;
        }

        .auth-verifying {
          color: var(--text-2);
          font-size: 14px;
          text-align: center;
        }

        .auth-success {
          text-align: center;
          padding: 8px 0;
        }

        .auth-success-title {
          color: var(--text);
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .auth-success-text {
          color: var(--text-2);
          font-size: 14px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  )
}
