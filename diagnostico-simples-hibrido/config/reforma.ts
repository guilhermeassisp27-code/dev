import type { Anexo } from "../types";

/**
 * TODO NÚMERO TRIBUTÁRIO É PLACEHOLDER A CONFIRMAR NA FONTE OFICIAL.
 *
 * As alíquotas e fatores da Reforma Tributária estão em transição e mudam por
 * ano. Todo valor aqui é de REFERÊNCIA e carrega `verificar: true`. O contador
 * responsável (CRC) deve confirmar cada número contra a LC 214/2025 e as
 * resoluções do CGSN antes de usar num laudo real. Não hardcode números soltos
 * fora deste arquivo.
 */

export interface ValorVerificavel {
  /** Alíquota/fator como fração (0.089 = 8,9%) ou limiar em % (50 = 50%). */
  valor: number;
  fonte: string;
  dataRevisao: string;
  verificar: boolean;
}

export interface ConfigReformaAno {
  aliquotaCBS: ValorVerificavel;
  aliquotaIBS: ValorVerificavel;
  /** Alíquota combinada IBS+CBS efetivamente usada pelo motor. */
  aliquotaCombinada: ValorVerificavel;
  /** Fração do Simples que permanece no DAS quando o IBS/CBS é recolhido por fora. */
  fatorReducaoSimplesHibrido: ValorVerificavel;
}

const FONTE = "LC 214/2025 e resoluções do CGSN — valor de referência, confirmar na fonte oficial";
const DATA_REVISAO = "2026-07-21";

function ref(valor: number): ValorVerificavel {
  return { valor, fonte: FONTE, dataRevisao: DATA_REVISAO, verificar: true };
}

/**
 * Configuração por ano-base. Valores ILUSTRATIVOS da transição:
 * - 2026: alíquota-teste combinada ~1% (CBS 0,9% + IBS 0,1%).
 * - 2027: CBS entra "cheia", IBS ainda inicial.
 * - 2033: carga cheia combinada de referência.
 */
export const REFORMA: Record<number, ConfigReformaAno> = {
  2026: {
    aliquotaCBS: ref(0.009),
    aliquotaIBS: ref(0.001),
    aliquotaCombinada: ref(0.01),
    fatorReducaoSimplesHibrido: ref(0.97),
  },
  2027: {
    aliquotaCBS: ref(0.088),
    aliquotaIBS: ref(0.001),
    aliquotaCombinada: ref(0.089),
    fatorReducaoSimplesHibrido: ref(0.72),
  },
  2033: {
    aliquotaCBS: ref(0.088),
    aliquotaIBS: ref(0.177),
    aliquotaCombinada: ref(0.265),
    fatorReducaoSimplesHibrido: ref(0.3),
  },
};

export const ANOS_DISPONIVEIS: number[] = Object.keys(REFORMA)
  .map(Number)
  .sort((a, b) => a - b);

export const ANO_PADRAO = 2027;

/**
 * Limiares da árvore de elegibilidade (em %). Ajustáveis.
 * - LIMIAR_B2B: abaixo disso, a empresa é tratada como B2C (fica no puro).
 * - LIMIAR_CREDITO: abaixo disso, o crédito gerado é baixo demais (provável puro).
 */
export const LIMIARES: { LIMIAR_B2B: ValorVerificavel; LIMIAR_CREDITO: ValorVerificavel } = {
  LIMIAR_B2B: {
    valor: 50,
    fonte: "Regra de negócio do diagnóstico — ajustável pelo contador",
    dataRevisao: DATA_REVISAO,
    verificar: true,
  },
  LIMIAR_CREDITO: {
    valor: 40,
    fonte: "Regra de negócio do diagnóstico — ajustável pelo contador",
    dataRevisao: DATA_REVISAO,
    verificar: true,
  },
};

/**
 * Alíquota efetiva atual de referência por anexo do Simples (fração).
 * Usada quando o contador não informa a alíquota efetiva no formulário.
 */
export const ALIQUOTA_EFETIVA_DEFAULT_ANEXO: Record<Anexo, ValorVerificavel> = {
  I: ref(0.09),
  II: ref(0.1),
  III: ref(0.12),
  IV: ref(0.15),
  V: ref(0.18),
};
