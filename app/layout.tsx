import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Selo. Sua comissão, garantida.',
  description:
    'Selo é a plataforma que blinda a comissão do corretor de imóveis autônomo, do primeiro contato até a assinatura.',
  openGraph: {
    title: 'Selo. Sua comissão, garantida.',
    description:
      'Selo é a plataforma que blinda a comissão do corretor de imóveis autônomo, do primeiro contato até a assinatura.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
