/* ============================================================
   Selo — service worker (PWA offline)
   Estratégia:
   - Navegação (abrir o app): network-first com fallback no cache —
     online sempre pega a versão nova; offline abre a última em cache.
   - supabase-js (CDN): cache-first — biblioteca versionada, muda raro.
   - NUNCA intercepta chamadas de dados (supabase.co, /api/) nem
     métodos além de GET: dados dinâmicos não podem vir de cache.
   Para publicar uma versão nova do shell, o network-first já resolve;
   o nome do cache muda apenas em mudança estrutural do SW.

   Achado C8 da auditoria (2026-07-03): a URL do CDN usava a tag flutuante
   "@2" — a PRIMEIRA versão 2.x que um PWA instalado cacheava ficava presa
   ali PARA SEMPRE (cache-first nunca revalida), inclusive correções de
   segurança do supabase-js publicadas depois. Corrigido fixando a versão
   exata (mesma do tool.html) e bumpando o nome do cache para v2 — isso
   invalida o cache antigo de qualquer PWA já instalado, forçando o
   download da versão pinada no próximo fetch. Da próxima vez que a versão
   do supabase-js mudar de propósito, repita os dois passos juntos: mude a
   URL AQUI E em tool.html, e bump o CACHE de novo.
   ============================================================ */
const CACHE = 'selo-pwa-v2'
const PRECACHE = [
  '/',
  '/tool.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.4/dist/umd/supabase.min.js',
]

self.addEventListener('install', (ev) => {
  // Precache tolerante: um item indisponível (ex.: CDN fora do ar) não pode
  // impedir a instalação — o que faltar entra no cache em runtime, no primeiro
  // fetch bem-sucedido.
  ev.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (ev) => {
  const req = ev.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Dados dinâmicos: nunca tocar (Supabase, APIs do app Next)
  if (url.hostname.endsWith('.supabase.co')) return
  if (url.pathname.startsWith('/api/')) return

  // Abrir o app: rede primeiro (atualizações), cache como fallback offline.
  // Achado M15: só grava no cache se a resposta for OK — um deploy quebrado
  // (404/500 temporário do GitHub Pages) não pode substituir o último shell
  // bom em cache, senão o fallback offline passa a servir a página de erro.
  if (req.mode === 'navigate') {
    ev.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp.ok) {
            const copia = resp.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
          }
          return resp
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('/tool.html')).then((hit) => hit || caches.match('/'))
        )
    )
    return
  }

  // Biblioteca do CDN: cache-first (mesma cautela do resp.ok acima).
  if (url.hostname === 'cdn.jsdelivr.net') {
    ev.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((resp) => {
            if (resp.ok) {
              const copia = resp.clone()
              caches.open(CACHE).then((c) => c.put(req, copia))
            }
            return resp
          })
      )
    )
  }
})
