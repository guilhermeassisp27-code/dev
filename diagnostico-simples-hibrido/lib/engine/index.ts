import type { PerfilEmpresa, ResultadoMotor, OverridesMotor } from "../../types";
import { decidirElegibilidade } from "./elegibilidade";
import { simular } from "./simulacao";

export { decidirElegibilidade } from "./elegibilidade";
export { simular } from "./simulacao";

/**
 * Roda o motor completo: elegibilidade + simulação comparativa.
 * `overrides` permite recalcular com premissas/limiares ajustados pelo contador.
 */
export function rodarMotor(perfil: PerfilEmpresa, overrides: OverridesMotor = {}): ResultadoMotor {
  const elegibilidade = decidirElegibilidade(perfil, overrides.limiares);
  const simulacao = simular(perfil, perfil.ano, overrides.reforma);
  return { elegibilidade, simulacao };
}
