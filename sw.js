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
   ============================================================ */
const CACHE = 'selo-pwa-v1'
const PRECACHE = [
  '/',
  '/tool.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
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

  // Abrir o app: rede primeiro (atualizações), cache como fallback offline
  if (req.mode === 'navigate') {
    ev.respondWith(
      fetch(req)
        .then((resp) => {
          const copia = resp.clone()
          caches.open(CACHE).then((c) => c.put(req, copia))
          return resp
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('/tool.html')).then((hit) => hit || caches.match('/'))
        )
    )
    return
  }

  // Biblioteca do CDN: cache-first
  if (url.hostname === 'cdn.jsdelivr.net') {
    ev.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((resp) => {
            const copia = resp.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
            return resp
          })
      )
    )
  }
})
