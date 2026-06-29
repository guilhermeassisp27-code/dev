'use client'
import { useRef } from 'react'

// Renderiza o HTML do documento num iframe SANDBOX (sem allow-scripts):
// qualquer <script> embutido NÃO executa — neutraliza XSS — enquanto o CSS
// estático da proposta/contrato continua valendo. `allow-same-origin` permite
// ler a altura do conteúdo (srcDoc é mesma origem) para ajustar o iframe.
export default function DocFrame({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null)

  function ajustar() {
    const f = ref.current
    if (!f) return
    try {
      const doc = f.contentWindow?.document
      if (doc) {
        const h = Math.max(doc.documentElement?.scrollHeight || 0, doc.body?.scrollHeight || 0)
        if (h) f.style.height = h + 'px'
      }
    } catch {
      /* origem isolada — ignora */
    }
  }

  return (
    <iframe
      ref={ref}
      sandbox="allow-same-origin allow-popups"
      srcDoc={html}
      title="Documento"
      onLoad={() => {
        ajustar()
        // re-ajusta após imagens (logo/foto base64) assentarem o layout
        setTimeout(ajustar, 250)
      }}
      style={{ width: '100%', border: 'none', display: 'block', background: 'transparent' }}
    />
  )
}
