'use client'
import { useEffect } from 'react'

// Dispara a contagem de abertura UMA vez, no navegador real do cliente.
// O crawler de preview do WhatsApp/Facebook não roda JS → não conta abertura.
export default function TrackView({ id }: { id: string }) {
  useEffect(() => {
    const chave = 'cpp_seen_' + id
    try {
      if (sessionStorage.getItem(chave)) return
      sessionStorage.setItem(chave, '1')
    } catch {
      /* sessionStorage indisponível — segue e conta mesmo assim */
    }
    fetch('/api/proposta-view', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
      keepalive: true,
    }).catch(() => {})
  }, [id])
  return null
}
