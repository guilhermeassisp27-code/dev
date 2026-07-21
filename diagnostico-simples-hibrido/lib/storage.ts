// Estado em sessão (sem banco): passa dados entre as telas do fluxo.
import type { PerfilEmpresa, ResultadoMotor, OverridesMotor } from "../types";

const KEY_PERFIL = "dsh:perfil";
const KEY_LAUDO = "dsh:laudo";

export function salvarPerfil(perfil: PerfilEmpresa) {
  sessionStorage.setItem(KEY_PERFIL, JSON.stringify(perfil));
}

export function carregarPerfil(): PerfilEmpresa | null {
  const raw = sessionStorage.getItem(KEY_PERFIL);
  return raw ? (JSON.parse(raw) as PerfilEmpresa) : null;
}

/** Pacote levado para a tela de impressão do laudo. */
export interface PacoteLaudo {
  perfil: PerfilEmpresa;
  resultado: ResultadoMotor;
  overrides: OverridesMotor;
  laudoMarkdown: string;
}

export function salvarLaudo(pacote: PacoteLaudo) {
  sessionStorage.setItem(KEY_LAUDO, JSON.stringify(pacote));
}

export function carregarLaudo(): PacoteLaudo | null {
  const raw = sessionStorage.getItem(KEY_LAUDO);
  return raw ? (JSON.parse(raw) as PacoteLaudo) : null;
}
