/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      // A raiz serve a landing estática (marketing), sem expor usuário do GitHub.
      beforeFiles: [{ source: '/', destination: '/landing.html' }],
    }
  },
}
module.exports = nextConfig
