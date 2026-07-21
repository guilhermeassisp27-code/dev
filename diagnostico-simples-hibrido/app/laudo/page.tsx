"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { carregarLaudo, type PacoteLaudo } from "../../lib/storage";
import { markdownToHtml } from "../../lib/markdown";
import { formatBRL, dataHojeExtenso } from "../../lib/format";
import { MARCA } from "../../config/marca";

export default function LaudoPage() {
  const router = useRouter();
  const [pacote, setPacote] = useState<PacoteLaudo | null>(null);

  useEffect(() => {
    const p = carregarLaudo();
    if (!p) {
      router.replace("/");
      return;
    }
    setPacote(p);
  }, [router]);

  if (!pacote) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500">Carregando…</main>;
  }

  const { perfil, resultado, laudoMarkdown } = pacote;

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      {/* Barra de ações — não sai no PDF */}
      <div className="no-print mx-auto mb-6 flex max-w-3xl items-center justify-between px-4">
        <button onClick={() => router.push("/resultado")} className="text-sm text-slate-500 hover:text-navy">
          ← Voltar e editar
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy/90"
        >
          Baixar PDF
        </button>
      </div>

      {/* Laudo */}
      <article className="laudo mx-auto max-w-3xl bg-white px-10 py-10 shadow-sm">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              {MARCA.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={MARCA.logoUrl} alt={MARCA.escritorio} className="mb-2 h-10" />
              ) : (
                <p className="text-lg font-semibold text-navy">{MARCA.escritorio}</p>
              )}
              <p className="text-sm text-slate-600">{MARCA.contador}</p>
              <p className="text-sm text-slate-600">{MARCA.crc}</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>{MARCA.contato}</p>
              <p>{MARCA.cidade}</p>
              <p className="mt-1">{dataHojeExtenso()}</p>
            </div>
          </div>

          <h1 className="mt-6 text-xl font-semibold text-navy">Diagnóstico Simples Híbrido</h1>
          <p className="text-sm text-slate-600">
            {perfil.nomeEmpresa}
            {perfil.cnpj ? ` · CNPJ ${perfil.cnpj}` : ""} · Ano-base {perfil.ano}
          </p>
        </header>

        {/* Comparativo resumido */}
        <section className="mb-8 grid grid-cols-3 gap-4 text-center">
          <ResumoImpressao rotulo="Simples puro" valor={formatBRL(resultado.simulacao.totalPuro)} />
          <ResumoImpressao rotulo="Regime híbrido" valor={formatBRL(resultado.simulacao.totalHibrido)} />
          <ResumoImpressao
            rotulo={resultado.simulacao.delta > 0 ? "Diferença (a mais)" : "Diferença (economia)"}
            valor={formatBRL(Math.abs(resultado.simulacao.delta))}
          />
        </section>

        {/* Texto do laudo (gerado pela IA, editado pelo contador) */}
        {laudoMarkdown ? (
          <section
            className="prose-laudo text-sm leading-relaxed text-slate-800"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(laudoMarkdown) }}
          />
        ) : (
          <p className="text-sm text-slate-500">
            (Sem texto do laudo. Volte e gere o rascunho na tela de resultado.)
          </p>
        )}

        {/* Conta linha a linha */}
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-navy">Memória de cálculo</h2>
          <table className="w-full text-xs">
            <tbody>
              {resultado.simulacao.linhas.map((l) => (
                <tr key={l.rotulo} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-4 text-slate-700">{l.rotulo}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-900">{formatBRL(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Rodapé fixo: aviso de responsabilidade + data */}
        <footer className="mt-10 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
          <p>
            <strong>Aviso.</strong> Os valores apresentados são estimativas com base nos dados
            informados e nas alíquotas/fatores de referência da transição da Reforma Tributária (LC
            214/2025 e resoluções do CGSN), sujeitos a alteração. Este diagnóstico exige validação do
            profissional responsável ({MARCA.crc}) antes de qualquer decisão de opção de regime.
          </p>
          <p className="mt-2">Emitido em {dataHojeExtenso()} por {MARCA.contador}.</p>
        </footer>
      </article>

      <style jsx global>{`
        .prose-laudo h1 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #0f2d4a;
          margin: 1rem 0 0.5rem;
        }
        .prose-laudo h2 {
          font-size: 1rem;
          font-weight: 600;
          color: #0f2d4a;
          margin: 1rem 0 0.4rem;
        }
        .prose-laudo h3 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0f2d4a;
          margin: 0.8rem 0 0.3rem;
        }
        .prose-laudo p {
          margin: 0.5rem 0;
        }
        .prose-laudo ul {
          list-style: disc;
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }
        .prose-laudo li {
          margin: 0.2rem 0;
        }
      `}</style>
    </div>
  );
}

function ResumoImpressao({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-[11px] text-slate-500">{rotulo}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-navy">{valor}</p>
    </div>
  );
}
