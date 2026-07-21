import { describe, it, expect } from "vitest";
import { decidirElegibilidade } from "../elegibilidade";
import type { PerfilEmpresa } from "../../../types";

function perfilBase(over: Partial<PerfilEmpresa> = {}): PerfilEmpresa {
  return {
    nomeEmpresa: "Empresa Teste",
    faturamentoAnual: 600000,
    anexo: "III",
    aliquotaEfetivaSimples: 0.12,
    percReceitaB2B: 80,
    percCustosComCredito: 60,
    margem: 0.35,
    ano: 2027,
    ...over,
  };
}

describe("decidirElegibilidade — três galhos da árvore", () => {
  it("perfil claramente B2C fica no Simples puro", () => {
    const r = decidirElegibilidade(perfilBase({ percReceitaB2B: 10 }));
    expect(r.categoria).toBe("B2C_fica_puro");
    expect(r.elegivel).toBe(false);
    expect(r.justificativa).toContain("consumidor final");
  });

  it("perfil B2B com crédito baixo é provável puro", () => {
    const r = decidirElegibilidade(perfilBase({ percReceitaB2B: 80, percCustosComCredito: 20 }));
    expect(r.categoria).toBe("B2B_credito_baixo_provavel_puro");
    expect(r.elegivel).toBe(false);
  });

  it("perfil B2B com muito crédito é candidato ao híbrido", () => {
    const r = decidirElegibilidade(perfilBase({ percReceitaB2B: 80, percCustosComCredito: 60 }));
    expect(r.categoria).toBe("candidato_hibrido");
    expect(r.elegivel).toBe(true);
  });

  it("respeita limiares customizados (override)", () => {
    // Com limiar B2B em 90%, um perfil de 80% B2B cai para B2C.
    const r = decidirElegibilidade(perfilBase({ percReceitaB2B: 80 }), { limiarB2B: 90 });
    expect(r.categoria).toBe("B2C_fica_puro");
  });

  it("aplica limite exatamente na fronteira (>= limiar passa)", () => {
    // percReceitaB2B == limiar (50) não deve cair no galho B2C.
    const r = decidirElegibilidade(
      perfilBase({ percReceitaB2B: 50, percCustosComCredito: 60 }),
      { limiarB2B: 50, limiarCredito: 40 },
    );
    expect(r.categoria).toBe("candidato_hibrido");
  });
});
