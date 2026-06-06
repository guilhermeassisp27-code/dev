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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: '#EEF2FF' }}>
            Corretor<span style={{ color: '#4D7EFF' }}>PRO</span>
          </div>
          <p style={{ color: '#7B93B8', fontSize: '13px', marginTop: '6px' }}>Defina sua senha</p>
        </div>

        <div
          style={{
            background: '#050E1B',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            padding: '28px',
          }}
        >
          {verificando ? (
            <p style={{ color: '#7B93B8', fontSize: '13px', textAlign: 'center' }}>
              Verificando link...
            </p>
          ) : !temSessao ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#EEF2FF', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Link inválido ou expirado
              </p>
              <p style={{ color: '#7B93B8', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                Solicite um novo link de acesso na tela de login.
              </p>
              <a
                href="/acesso"
                style={{ color: '#4D7EFF', fontSize: '13px', textDecoration: 'none' }}
              >
                Ir para o login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Nova senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#4D7EFF')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />

              <label style={labelStyle}>Confirmar senha</label>
              <input
                type="password"
                value={confirma}
                onChange={(e) => setConfirma(e.target.value)}
                required
                placeholder="Repita a senha"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#4D7EFF')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />

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
                {loading ? 'Salvando...' : 'Salvar e entrar'}
              </button>
            </form>
          )}
        </div>
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
