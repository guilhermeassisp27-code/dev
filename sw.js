/* ============================================================
   Selo — service worker (PWA offline)
   Estratégia:
   - Navegação (abrir o app): network-first com fallback no cache —
     online sempre pega a versão nova; offline abre a última em cache.
   - supabase-js (auto-hospedado em /vendor/): cache-first — o nome do
     arquivo carrega a versão, então nunca muda por baixo do cache.
   - NUNCA intercepta chamadas de dados (supabase.co, /api/) nem
     métodos além de GET: dados dinâmicos não podem vir de cache.
   Para publicar uma versão nova do shell, o network-first já resolve;
   o nome do cache muda apenas em mudança estrutural do SW.

   Achado C8/M8: supabase-js agora é auto-hospedado em /vendor/ (bytes do
   tarball oficial do npm) — sem CDN de terceiro no caminho. O arquivo é
   versionado no nome, então cache-first é seguro: uma versão nova chega
   com nome novo. Ao atualizar a versão: trocar o arquivo em vendor/,
   atualizar o src no tool.html, este PRECACHE e bumpar o CACHE.
   ============================================================ */
const CACHE = 'selo-pwa-v3'
const PRECACHE = [
  '/',
  '/tool.html',
  '/vendor/supabase-js-2.105.4.js',
  '/vendor/fonts/Geist-Variable.woff2',
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

  // Biblioteca vendorizada (nome versionado): cache-first (mesma cautela do resp.ok acima).
  if (url.origin === self.location.origin && url.pathname.startsWith('/vendor/')) {
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
