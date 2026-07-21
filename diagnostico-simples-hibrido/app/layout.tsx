import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diagnóstico Simples Híbrido",
  description:
    "Diagnóstico determinístico e auditável sobre a decisão do Simples Híbrido (IBS/CBS dentro ou fora do DAS a partir de 2027).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
