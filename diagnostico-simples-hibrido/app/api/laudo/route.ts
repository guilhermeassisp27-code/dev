import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { PerfilEmpresa, ResultadoMotor } from "../../../types";
import { formatBRL, formatPct } from "../../../lib/format";

export const runtime = "nodejs";

// Modelo escolhido no brief: redação da narrativa, temperatura baixa, ~1500 tokens.
const MODELO = "claude-sonnet-4-6";

const SYSTEM_PROMPT = [
  "Você redige um laudo de diagnóstico tributário para o dono de uma micro ou pequena empresa,",
  "em português do Brasil claro e sem juridiquês.",
  "Use SOMENTE os números fornecidos no objeto de dados. NÃO invente, altere ou recalcule nenhum valor.",
  "NÃO cite leis, artigos ou alíquotas que não estejam nos dados fornecidos.",
  "Sem emoji. Escreva direto e específico, como um contador escreveria — evite entusiasmo artificial e jargão.",
  "Estruture o texto em Markdown com estas seções, nesta ordem:",
  "1. A situação da empresa em uma frase.",
  "2. A recomendação (ficar no Simples puro ou avaliar o híbrido) com o porquê em linguagem simples.",
  "3. O comparativo de imposto (puro × híbrido) e, se for candidato ao híbrido, o crédito que os clientes PJ poderão aproveitar.",
  "4. Uma seção 'O que fazer até 30/09'.",
  "5. Um aviso de que os valores são estimativas com base nos dados informados e dependem de validação do contador responsável.",
].join(" ");

function montarDadosParaIA(perfil: PerfilEmpresa, resultado: ResultadoMotor) {
  const { elegibilidade, simulacao } = resultado;
  return {
    empresa: {
      nome: perfil.nomeEmpresa,
      faturamentoAnual: formatBRL(perfil.faturamentoAnual),
      anexo: perfil.anexo,
      percReceitaB2B: `${perfil.percReceitaB2B}%`,
      percCustosComCredito: `${perfil.percCustosComCredito}%`,
      margem: formatPct(perfil.margem),
      anoBase: perfil.ano,
    },
    recomendacao: {
      categoria: elegibilidade.categoria,
      elegivelAoHibrido: elegibilidade.elegivel,
      justificativa: elegibilidade.justificativa,
    },
    comparativoImposto: {
      totalSimplesPuro: formatBRL(simulacao.totalPuro),
      totalHibrido: formatBRL(simulacao.totalHibrido),
      diferencaHibridoMenosPuro: formatBRL(simulacao.delta),
      hibridoEhMaisCaro: simulacao.delta > 0,
      creditoGeradoParaClientePJ: formatBRL(simulacao.creditoParaCliente),
    },
    contaLinhaALinha: simulacao.linhas.map((l) => ({ item: l.rotulo, valor: formatBRL(l.valor) })),
  };
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { erro: "ANTHROPIC_API_KEY não configurada no servidor (.env.local)." },
      { status: 500 },
    );
  }

  let perfil: PerfilEmpresa;
  let resultado: ResultadoMotor;
  try {
    const body = await req.json();
    perfil = body.perfil;
    resultado = body.resultado;
    if (!perfil || !resultado) throw new Error("payload incompleto");
  } catch {
    return NextResponse.json({ erro: "Requisição inválida: envie { perfil, resultado }." }, { status: 400 });
  }

  const dados = montarDadosParaIA(perfil, resultado);

  try {
    const client = new Anthropic({ apiKey });
    const resposta = await client.messages.create({
      model: MODELO,
      max_tokens: 1500,
      temperature: 0.2,
      thinking: { type: "disabled" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content:
            "Redija o laudo em Markdown a partir destes dados (todos os números já vêm prontos, não recalcule):\n\n" +
            JSON.stringify(dados, null, 2),
        },
      ],
    });

    const laudoMarkdown = resposta.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return NextResponse.json({ laudoMarkdown });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    return NextResponse.json({ erro: `Falha ao gerar o laudo: ${msg}` }, { status: 502 });
  }
}
