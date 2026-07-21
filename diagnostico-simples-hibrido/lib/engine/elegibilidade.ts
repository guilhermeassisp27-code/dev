import type { PerfilEmpresa, ResultadoElegibilidade, OverridesLimiares } from "../../types";
import { LIMIARES } from "../../config/reforma";

/**
 * Árvore de decisão de elegibilidade ao regime híbrido.
 * Função pura: dados o perfil e os limiares, decide a categoria.
 *
 * Galhos:
 *  1. B2B baixo  -> B2C_fica_puro (cliente não usa crédito; híbrido não ajuda)
 *  2. Crédito baixo -> B2B_credito_baixo_provavel_puro (gera pouco crédito)
 *  3. Caso contrário -> candidato_hibrido (rodar simulação para quantificar)
 */
export function decidirElegibilidade(
  perfil: PerfilEmpresa,
  overrides: OverridesLimiares = {},
): ResultadoElegibilidade {
  const limiarB2B = overrides.limiarB2B ?? LIMIARES.LIMIAR_B2B.valor;
  const limiarCredito = overrides.limiarCredito ?? LIMIARES.LIMIAR_CREDITO.valor;

  if (perfil.percReceitaB2B < limiarB2B) {
    return {
      elegivel: false,
      categoria: "B2C_fica_puro",
      justificativa:
        `Apenas ${perfil.percReceitaB2B}% da receita é para outras empresas (abaixo do limiar de ${limiarB2B}%). ` +
        "Como a maior parte das vendas é para consumidor final, o crédito de IBS/CBS que a empresa passaria a destacar " +
        "não beneficia o cliente, e o imposto total tende a ficar maior no híbrido. Recomendação: ficar no Simples puro.",
    };
  }

  if (perfil.percCustosComCredito < limiarCredito) {
    return {
      elegivel: false,
      categoria: "B2B_credito_baixo_provavel_puro",
      justificativa:
        `A empresa vende bastante para outras empresas (${perfil.percReceitaB2B}% B2B), mas apenas ` +
        `${perfil.percCustosComCredito}% dos custos gerariam crédito de IBS/CBS (abaixo do limiar de ${limiarCredito}%). ` +
        "Com pouco crédito para compensar o débito, a conta do híbrido tende a não fechar. Recomendação provável: Simples puro.",
    };
  }

  return {
    elegivel: true,
    categoria: "candidato_hibrido",
    justificativa:
      `A empresa vende para outras empresas (${perfil.percReceitaB2B}% B2B) e tem base de crédito relevante ` +
      `(${perfil.percCustosComCredito}% dos custos). Vale rodar a simulação completa para quantificar se o híbrido compensa.`,
  };
}
