"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Anexo, PerfilEmpresa } from "../types";
import { ANOS_DISPONIVEIS, ANO_PADRAO } from "../config/reforma";
import { salvarPerfil } from "../lib/storage";

const ANEXOS: Anexo[] = ["I", "II", "III", "IV", "V"];

export default function FormularioPage() {
  const router = useRouter();
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [faturamentoAnual, setFaturamentoAnual] = useState("");
  const [anexo, setAnexo] = useState<Anexo>("III");
  const [aliquotaEfetiva, setAliquotaEfetiva] = useState(""); // em %, opcional
  const [percReceitaB2B, setPercReceitaB2B] = useState("50");
  const [percCustosComCredito, setPercCustosComCredito] = useState("40");
  const [margem, setMargem] = useState("30"); // em %
  const [ano, setAno] = useState(ANO_PADRAO);
  const [erro, setErro] = useState("");

  function num(v: string): number {
    return Number(String(v).replace(/\./g, "").replace(",", "."));
  }

  function processar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    const faturamento = num(faturamentoAnual);
    if (!nomeEmpresa.trim()) return setErro("Informe o nome da empresa.");
    if (!(faturamento > 0)) return setErro("Informe um faturamento anual válido.");

    const perfil: PerfilEmpresa = {
      nomeEmpresa: nomeEmpresa.trim(),
      cnpj: cnpj.trim() || undefined,
      faturamentoAnual: faturamento,
      anexo,
      aliquotaEfetivaSimples: aliquotaEfetiva.trim() ? num(aliquotaEfetiva) / 100 : undefined,
      percReceitaB2B: clamp(num(percReceitaB2B), 0, 100),
      percCustosComCredito: clamp(num(percCustosComCredito), 0, 100),
      margem: clamp(num(margem), 0, 100) / 100,
      ano,
    };

    salvarPerfil(perfil);
    router.push("/resultado");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-ambar">Diagnóstico Simples Híbrido</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">
          Sua empresa deve mudar antes de 30/09?
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Preencha o perfil da empresa cliente. O motor calcula a recomendação e a comparação de
          carga tributária (Simples puro × híbrido) de forma determinística e auditável.
        </p>
      </header>

      <form onSubmit={processar} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Campo label="Nome da empresa">
          <input className={inputCls} value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder="Razão social ou nome fantasia" />
        </Campo>

        <Campo label="CNPJ (opcional)">
          <input className={inputCls} value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
        </Campo>

        <Campo label="Faturamento anual (R$)">
          <input className={inputCls} inputMode="decimal" value={faturamentoAnual} onChange={(e) => setFaturamentoAnual(e.target.value)} placeholder="600000" />
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Anexo do Simples">
            <select className={inputCls} value={anexo} onChange={(e) => setAnexo(e.target.value as Anexo)}>
              {ANEXOS.map((a) => (
                <option key={a} value={a}>Anexo {a}</option>
              ))}
            </select>
          </Campo>

          <Campo label="Alíquota efetiva atual (%) — opcional">
            <input className={inputCls} inputMode="decimal" value={aliquotaEfetiva} onChange={(e) => setAliquotaEfetiva(e.target.value)} placeholder="ex.: 12 (vazio = default do anexo)" />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="% da receita que é B2B">
            <input className={inputCls} inputMode="decimal" value={percReceitaB2B} onChange={(e) => setPercReceitaB2B(e.target.value)} placeholder="0 a 100" />
          </Campo>

          <Campo label="% dos custos com crédito de IBS/CBS">
            <input className={inputCls} inputMode="decimal" value={percCustosComCredito} onChange={(e) => setPercCustosComCredito(e.target.value)} placeholder="0 a 100" />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Margem aproximada (%)">
            <input className={inputCls} inputMode="decimal" value={margem} onChange={(e) => setMargem(e.target.value)} placeholder="ex.: 30" />
          </Campo>

          <Campo label="Ano-base da simulação">
            <select className={inputCls} value={ano} onChange={(e) => setAno(Number(e.target.value))}>
              {ANOS_DISPONIVEIS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Campo>
        </div>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button type="submit" className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90">
          Processar diagnóstico
        </button>
      </form>

      <p className="mt-6 text-xs text-slate-500">
        As alíquotas e fatores usados são valores de referência da transição da Reforma Tributária e
        exigem validação do profissional responsável (CRC) antes de uso num laudo real.
      </p>
    </main>
  );
}

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
