// Tipos compartilhados entre o motor determinístico, a API e a UI.

export type Anexo = "I" | "II" | "III" | "IV" | "V";

export interface PerfilEmpresa {
  nomeEmpresa: string;
  cnpj?: string;
  /** Faturamento anual em reais. */
  faturamentoAnual: number;
  anexo: Anexo;
  /**
   * Alíquota efetiva atual do Simples, como fração (ex.: 0.12 = 12%).
   * Se omitida, o motor usa o default do anexo (config/reforma.ts).
   */
  aliquotaEfetivaSimples?: number;
  /** % da receita que é B2B (vendas para outras empresas). 0 a 100. */
  percReceitaB2B: number;
  /** % dos custos/compras que gerariam crédito de IBS/CBS. 0 a 100. */
  percCustosComCredito: number;
  /** Margem aproximada, como fração (ex.: 0.35 = 35%). */
  margem: number;
  /** Ano-base da simulação. */
  ano: number;
}

export type CategoriaElegibilidade =
  | "B2C_fica_puro"
  | "B2B_credito_baixo_provavel_puro"
  | "candidato_hibrido";

export interface ResultadoElegibilidade {
  elegivel: boolean;
  categoria: CategoriaElegibilidade;
  justificativa: string;
}

/** Uma linha auditável da conta (rótulo + valor calculado). */
export interface LinhaConta {
  rotulo: string;
  valor: number;
  detalhe?: string;
}

/** Uma premissa (alíquota/fator/limiar) usada no cálculo, com fonte e flag. */
export interface PremissaUsada {
  chave: string;
  rotulo: string;
  /** Valor efetivamente usado. Para alíquotas/fatores é fração; para limiares é %. */
  valor: number;
  /** Formato de exibição/edição do valor. */
  formato: "percentual" | "fator" | "limiar_percentual";
  fonte: string;
  dataRevisao: string;
  verificar: boolean;
  /** Se true, o motor usa este valor como override editável. */
  editavel: boolean;
}

export interface ResultadoSimulacao {
  totalPuro: number;
  totalHibrido: number;
  delta: number;
  creditoParaCliente: number;
  linhas: LinhaConta[];
  premissas: PremissaUsada[];
}

export interface ResultadoMotor {
  elegibilidade: ResultadoElegibilidade;
  simulacao: ResultadoSimulacao;
}

/** Overrides editáveis pelo contador na tela de resultado. */
export interface OverridesLimiares {
  limiarB2B?: number;
  limiarCredito?: number;
}

export interface OverridesReforma {
  aliquotaEfetivaSimples?: number;
  aliquotaCombinada?: number;
  fatorReducaoSimplesHibrido?: number;
}

export interface OverridesMotor {
  limiares?: OverridesLimiares;
  reforma?: OverridesReforma;
}
