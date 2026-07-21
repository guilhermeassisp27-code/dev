"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PerfilEmpresa, OverridesMotor, CategoriaElegibilidade } from "../../types";
import { rodarMotor } from "../../lib/engine";
import { REFORMA, ALIQUOTA_EFETIVA_DEFAULT_ANEXO, LIMIARES } from "../../config/reforma";
import { formatBRL, formatPct } from "../../lib/format";
import { markdownToHtml } from "../../lib/markdown";
import { carregarPerfil, salvarLaudo } from "../../lib/storage";

const ROTULO_CATEGORIA: Record<CategoriaElegibilidade, string> = {
  B2C_fica_puro: "Ficar no Simples puro",
  B2B_credito_baixo_provavel_puro: "Provável Simples puro",
  candidato_hibrido: "Candidato ao híbrido",
};

function parseNum(s: string): number {
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function ResultadoPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilEmpresa | null>(null);

  // Campos editáveis das premissas (strings para input fluido).
  const [aliqSimplesPct, setAliqSimplesPct] = useState("");
  const [aliqCombinadaPct, setAliqCombinadaPct] = useState("");
  const [fator, setFator] = useState("");
  const [limiarB2B, setLimiarB2B] = useState("");
  const [limiarCredito, setLimiarCredito] = useState("");

  const [laudo, setLaudo] = useState("");
  const [gerando, setGerando] = useState(false);
  const [erroLaudo, setErroLaudo] = useState("");

  useEffect(() => {
    const p = carregarPerfil();
    if (!p) {
      router.replace("/");
      return;
    }
    setPerfil(p);
    const cfg = REFORMA[p.ano];
    const aliqSimples = p.aliquotaEfetivaSimples ?? ALIQUOTA_EFETIVA_DEFAULT_ANEXO[p.anexo].valor;
    setAliqSimplesPct(String(+(aliqSimples * 100).toFixed(4)));
    setAliqCombinadaPct(cfg ? String(+(cfg.aliquotaCombinada.valor * 100).toFixed(4)) : "");
    setFator(cfg ? String(cfg.fatorReducaoSimplesHibrido.valor) : "");
    setLimiarB2B(String(LIMIARES.LIMIAR_B2B.valor));
    setLimiarCredito(String(LIMIARES.LIMIAR_CREDITO.valor));
  }, [router]);

  const overrides: OverridesMotor = useMemo(
    () => ({
      limiares: {
        limiarB2B: parseNum(limiarB2B),
        limiarCredito: parseNum(limiarCredito),
      },
      reforma: {
        aliquotaEfetivaSimples: parseNum(aliqSimplesPct) / 100,
        aliquotaCombinada: parseNum(aliqCombinadaPct) / 100,
        fatorReducaoSimplesHibrido: parseNum(fator),
      },
    }),
    [limiarB2B, limiarCredito, aliqSimplesPct, aliqCombinadaPct, fator],
  );

  const resultado = useMemo(() => (perfil ? rodarMotor(perfil, overrides) : null), [perfil, overrides]);

  if (!perfil || !resultado) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500">Carregando…</main>;
  }

  const { elegibilidade, simulacao } = resultado;
  const hibridoMaisCaro = simulacao.delta > 0;

  async function gerarLaudo() {
    if (!perfil || !resultado) return;
    setGerando(true);
    setErroLaudo("");
    try {
      const resp = await fetch("/api/laudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil, resultado }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.erro || "Falha ao gerar o laudo.");
      setLaudo(data.laudoMarkdown || "");
    } catch (e) {
      setErroLaudo(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setGerando(false);
    }
  }

  function irParaLaudo() {
    if (!perfil || !resultado) return;
    salvarLaudo({ perfil, resultado, overrides, laudoMarkdown: laudo });
    router.push("/laudo");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <button onClick={() => router.push("/")} className="mb-4 text-sm text-slate-500 hover:text-navy">
        ← Novo diagnóstico
      </button>

      <header className="mb-6">
        <p className="text-sm font-medium text-ambar">Resultado</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">{perfil.nomeEmpresa}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ano-base {perfil.ano} · Anexo {perfil.anexo} · {perfil.percReceitaB2B}% B2B ·{" "}
          {perfil.percCustosComCredito}% custos com crédito · margem {formatPct(perfil.margem)}
        </p>
      </header>

      {/* Recomendação */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
            {ROTULO_CATEGORIA[elegibilidade.categoria]}
          </span>
          <span className="text-xs text-slate-500">
            {elegibilidade.elegivel ? "Elegível ao híbrido — quantificar" : "Não elegível ao híbrido"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{elegibilidade.justificativa}</p>
      </section>

      {/* Comparativo */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card titulo="Simples puro" valor={formatBRL(simulacao.totalPuro)} />
        <Card titulo="Regime híbrido" valor={formatBRL(simulacao.totalHibrido)} />
        <Card
          titulo={hibridoMaisCaro ? "Híbrido custa a mais" : "Híbrido economiza"}
          valor={formatBRL(Math.abs(simulacao.delta))}
          destaque={hibridoMaisCaro ? "ruim" : "bom"}
        />
      </section>

      <p className="mb-6 text-sm text-slate-600">
        Crédito de IBS/CBS gerado para os clientes PJ (competitividade B2B):{" "}
        <strong className="text-navy">{formatBRL(simulacao.creditoParaCliente)}</strong>.
      </p>

      {/* Conta linha a linha */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-navy">Conta linha a linha (auditável)</h2>
        <table className="w-full text-sm">
          <tbody>
            {simulacao.linhas.map((l) => (
              <tr key={l.rotulo} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4">
                  <div className="text-slate-800">{l.rotulo}</div>
                  {l.detalhe && <div className="text-xs text-slate-400">{l.detalhe}</div>}
                </td>
                <td className="py-2 text-right font-medium tabular-nums text-slate-900">
                  {formatBRL(l.valor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Premissas editáveis */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-navy">Premissas (editáveis)</h2>
        <p className="mb-4 text-xs text-slate-500">
          Todo valor é de referência da transição da Reforma e exige confirmação na fonte oficial
          (LC 214/2025 e CGSN). Ajuste e o resultado recalcula automaticamente.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoNum label="Alíquota efetiva do Simples (%)" value={aliqSimplesPct} onChange={setAliqSimplesPct} />
          <CampoNum label={`Alíquota combinada IBS/CBS ${perfil.ano} (%)`} value={aliqCombinadaPct} onChange={setAliqCombinadaPct} />
          <CampoNum label={`Fator de redução do Simples no híbrido ${perfil.ano}`} value={fator} onChange={setFator} />
          <div />
          <CampoNum label="Limiar B2B para elegibilidade (%)" value={limiarB2B} onChange={setLimiarB2B} />
          <CampoNum label="Limiar de crédito para elegibilidade (%)" value={limiarCredito} onChange={setLimiarCredito} />
        </div>

        <div className="mt-4 space-y-1 text-xs text-slate-500">
          {simulacao.premissas.map((p) => (
            <div key={p.chave} className="flex justify-between gap-4">
              <span>
                {p.rotulo}
                {p.verificar && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700">VERIFICAR</span>}
              </span>
              <span className="tabular-nums text-slate-600">
                {p.formato === "fator" ? p.valor : formatPct(p.valor)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Laudo */}
      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">Rascunho do laudo</h2>
          <button
            onClick={gerarLaudo}
            disabled={gerando}
            className="rounded-lg bg-ambar px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-ambar/90 disabled:opacity-50"
          >
            {gerando ? "Gerando…" : laudo ? "Regerar com a IA" : "Gerar com a IA"}
          </button>
        </div>

        {erroLaudo && <p className="mb-3 text-sm text-red-600">{erroLaudo}</p>}

        {laudo ? (
          <>
            <textarea
              value={laudo}
              onChange={(e) => setLaudo(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs outline-none focus:border-navy"
            />
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-slate-500">Pré-visualizar</summary>
              <div
                className="prose-laudo mt-2 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(laudo) }}
              />
            </details>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            A IA redige a narrativa em cima dos números acima — nenhum valor sai da IA. Gere o
            rascunho, edite o texto e depois exporte o PDF.
          </p>
        )}
      </section>

      <button
        onClick={irParaLaudo}
        disabled={!laudo}
        className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90 disabled:opacity-50"
      >
        Abrir laudo para impressão / PDF
      </button>
      {!laudo && (
        <p className="mt-2 text-center text-xs text-slate-400">Gere o rascunho do laudo para habilitar a exportação.</p>
      )}
    </main>
  );
}

function Card({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: "bom" | "ruim" }) {
  const cor = destaque === "ruim" ? "text-red-600" : destaque === "bom" ? "text-emerald-600" : "text-navy";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{titulo}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${cor}`}>{valor}</p>
    </div>
  );
}

function CampoNum({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums outline-none focus:border-navy focus:ring-1 focus:ring-navy"
      />
    </label>
  );
}
