import type {
  PerfilEmpresa,
  ResultadoSimulacao,
  OverridesReforma,
  LinhaConta,
  PremissaUsada,
} from "../../types";
import { REFORMA, ALIQUOTA_EFETIVA_DEFAULT_ANEXO } from "../../config/reforma";

/**
 * Simulação comparativa Simples puro x Simples híbrido.
 * Função pura e auditável: cada passo vira uma linha rotulada em `linhas`, e
 * cada alíquota/fator usado vira uma entrada em `premissas` (com fonte + flag).
 *
 * Os `overrides` permitem ao contador ajustar premissas na tela de resultado e
 * recalcular. Se um override não for informado, usa-se o valor da config.
 */
export function simular(
  perfil: PerfilEmpresa,
  ano: number,
  overrides: OverridesReforma = {},
): ResultadoSimulacao {
  const cfg = REFORMA[ano];
  if (!cfg) {
    throw new Error(
      `Sem configuração da Reforma para o ano ${ano}. Anos disponíveis: ${Object.keys(REFORMA).join(", ")}.`,
    );
  }

  const faturamento = perfil.faturamentoAnual;
  const margem = perfil.margem;
  const percCredito = perfil.percCustosComCredito / 100;

  // Alíquota efetiva do Simples: override > perfil > default do anexo.
  const defaultAnexo = ALIQUOTA_EFETIVA_DEFAULT_ANEXO[perfil.anexo];
  const aliquotaEfetivaSimples =
    overrides.aliquotaEfetivaSimples ?? perfil.aliquotaEfetivaSimples ?? defaultAnexo.valor;
  const aliquotaEfetivaVeioDoDefault =
    overrides.aliquotaEfetivaSimples === undefined && perfil.aliquotaEfetivaSimples === undefined;

  const aliquotaCombinada = overrides.aliquotaCombinada ?? cfg.aliquotaCombinada.valor;
  const fatorReducao =
    overrides.fatorReducaoSimplesHibrido ?? cfg.fatorReducaoSimplesHibrido.valor;

  // --- Cálculo (cada linha documentada) ---
  const comprasComCredito = faturamento * (1 - margem) * percCredito;

  // Cenário Simples puro
  const totalPuro = faturamento * aliquotaEfetivaSimples;

  // Cenário híbrido
  const simplesReduzido = faturamento * aliquotaEfetivaSimples * fatorReducao;
  const debitoIbsCbs = faturamento * aliquotaCombinada;
  const creditoIbsCbs = comprasComCredito * aliquotaCombinada;
  const ibsCbsLiquido = Math.max(0, debitoIbsCbs - creditoIbsCbs);
  const totalHibrido = simplesReduzido + ibsCbsLiquido;

  // Benefício de competitividade para o cliente PJ
  const creditoParaCliente = debitoIbsCbs;

  const delta = totalHibrido - totalPuro;

  const linhas: LinhaConta[] = [
    {
      rotulo: "Compras que geram crédito",
      valor: comprasComCredito,
      detalhe: "faturamento × (1 − margem) × % dos custos com crédito",
    },
    {
      rotulo: "Total no Simples puro",
      valor: totalPuro,
      detalhe: "faturamento × alíquota efetiva do Simples",
    },
    {
      rotulo: "Simples reduzido (parte que fica no DAS)",
      valor: simplesReduzido,
      detalhe: "faturamento × alíquota efetiva × fator de redução",
    },
    {
      rotulo: "Débito de IBS/CBS",
      valor: debitoIbsCbs,
      detalhe: "faturamento × alíquota combinada IBS/CBS",
    },
    {
      rotulo: "Crédito de IBS/CBS",
      valor: creditoIbsCbs,
      detalhe: "compras com crédito × alíquota combinada IBS/CBS",
    },
    {
      rotulo: "IBS/CBS líquido (débito − crédito, mínimo 0)",
      valor: ibsCbsLiquido,
      detalhe: "max(0, débito − crédito)",
    },
    {
      rotulo: "Total no regime híbrido",
      valor: totalHibrido,
      detalhe: "Simples reduzido + IBS/CBS líquido",
    },
    {
      rotulo: "Crédito gerado para o cliente PJ",
      valor: creditoParaCliente,
      detalhe: "débito de IBS/CBS destacado na nota (competitividade B2B)",
    },
    {
      rotulo: "Diferença (híbrido − puro)",
      valor: delta,
      detalhe: "positivo = híbrido é mais caro; negativo = híbrido economiza",
    },
  ];

  const premissas: PremissaUsada[] = [
    {
      chave: "aliquotaEfetivaSimples",
      rotulo: "Alíquota efetiva do Simples (atual)",
      valor: aliquotaEfetivaSimples,
      formato: "percentual",
      fonte: aliquotaEfetivaVeioDoDefault
        ? `Default do Anexo ${perfil.anexo} — ${defaultAnexo.fonte}`
        : "Informada no perfil da empresa",
      dataRevisao: defaultAnexo.dataRevisao,
      verificar: true,
      editavel: true,
    },
    {
      chave: "aliquotaCombinada",
      rotulo: `Alíquota combinada IBS/CBS ${ano}`,
      valor: aliquotaCombinada,
      formato: "percentual",
      fonte: cfg.aliquotaCombinada.fonte,
      dataRevisao: cfg.aliquotaCombinada.dataRevisao,
      verificar: true,
      editavel: true,
    },
    {
      chave: "fatorReducaoSimplesHibrido",
      rotulo: `Fator de redução do Simples no híbrido ${ano}`,
      valor: fatorReducao,
      formato: "fator",
      fonte: cfg.fatorReducaoSimplesHibrido.fonte,
      dataRevisao: cfg.fatorReducaoSimplesHibrido.dataRevisao,
      verificar: true,
      editavel: true,
    },
    {
      chave: "aliquotaCBS",
      rotulo: `Alíquota CBS ${ano} (referência)`,
      valor: cfg.aliquotaCBS.valor,
      formato: "percentual",
      fonte: cfg.aliquotaCBS.fonte,
      dataRevisao: cfg.aliquotaCBS.dataRevisao,
      verificar: true,
      editavel: false,
    },
    {
      chave: "aliquotaIBS",
      rotulo: `Alíquota IBS ${ano} (referência)`,
      valor: cfg.aliquotaIBS.valor,
      formato: "percentual",
      fonte: cfg.aliquotaIBS.fonte,
      dataRevisao: cfg.aliquotaIBS.dataRevisao,
      verificar: true,
      editavel: false,
    },
  ];

  return {
    totalPuro,
    totalHibrido,
    delta,
    creditoParaCliente,
    linhas,
    premissas,
  };
}
