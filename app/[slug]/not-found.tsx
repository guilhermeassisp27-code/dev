export default function VitrineNaoEncontrada() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F0E8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 380 }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#C9882A', marginBottom: 10 }}>Selo</div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#15202B', margin: '0 0 8px' }}>
          Página indisponível
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
          Este site de corretor não existe ou não está mais ativo.
        </p>
        <a
          href="https://selosales.com.br"
          style={{
            display: 'inline-block',
            marginTop: 22,
            background: '#0F2D4A',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 10,
            padding: '11px 20px',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Conhecer o Selo
        </a>
      </div>
    </div>
  )
}
