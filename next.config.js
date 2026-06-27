/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      // A raiz serve a landing estática (marketing), sem expor usuário do GitHub.
      beforeFiles: [{ source: '/', destination: '/landing.html' }],
    }
  },
  // Headers de segurança (achado da auditoria: não havia nenhum). Conservadores
  // para não quebrar o fluxo cross-domain Vercel↔GitHub Pages nem o Meta Pixel.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
