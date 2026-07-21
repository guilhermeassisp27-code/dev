import { describe, it, expect } from "vitest";
import { simular } from "../simulacao";
import type { PerfilEmpresa } from "../../../types";

function perfilExemplo(over: Partial<PerfilEmpresa> = {}): PerfilEmpresa {
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

describe("simular — formato e conta linha a linha", () => {
  const r = simular(perfilExemplo(), 2027);

  it("retorna todos os campos do contrato do motor", () => {
    expect(r).toHaveProperty("totalPuro");
    expect(r).toHaveProperty("totalHibrido");
    expect(r).toHaveProperty("delta");
    expect(r).toHaveProperty("creditoParaCliente");
    expect(Array.isArray(r.linhas)).toBe(true);
    expect(r.linhas.length).toBeGreaterThan(0);
    expect(Array.isArray(r.premissas)).toBe(true);
  });

  it("calcula os valores esperados (config 2027 padrão)", () => {
    // comprasComCredito = 600000 * 0.65 * 0.60 = 234000
    // totalPuro = 600000 * 0.12 = 72000
    // simplesReduzido = 72000 * 0.72 = 51840
    // debito = 600000 * 0.089 = 53400 ; credito = 234000 * 0.089 = 20826
    // ibsCbsLiquido = 32574 ; totalHibrido = 84414 ; delta = 12414
    expect(r.totalPuro).toBeCloseTo(72000, 2);
    expect(r.totalHibrido).toBeCloseTo(84414, 2);
    expect(r.delta).toBeCloseTo(12414, 2);
    expect(r.creditoParaCliente).toBeCloseTo(53400, 2);
  });

  it("todas as premissas carregam fonte e flag verificar", () => {
    for (const p of r.premissas) {
      expect(p.fonte.length).toBeGreaterThan(0);
      expect(p.verificar).toBe(true);
      expect(typeof p.valor).toBe("number");
    }
  });

  it("IBS/CBS líquido nunca é negativo (muito crédito)", () => {
    const alto = simular(perfilExemplo({ percCustosComCredito: 100, margem: 0.05 }), 2027);
    const linha = alto.linhas.find((l) => l.rotulo.startsWith("IBS/CBS líquido"));
    expect(linha).toBeDefined();
    expect(linha!.valor).toBeGreaterThanOrEqual(0);
  });

  it("usa o default do anexo quando a alíquota efetiva não é informada", () => {
    const semAliquota = perfilExemplo();
    delete semAliquota.aliquotaEfetivaSimples;
    const s = simular(semAliquota, 2027);
    const p = s.premissas.find((x) => x.chave === "aliquotaEfetivaSimples");
    expect(p!.valor).toBeCloseTo(0.12, 4); // default Anexo III
    expect(p!.fonte).toContain("Default do Anexo III");
  });

  it("aplica overrides de premissa e recalcula", () => {
    const s = simular(perfilExemplo(), 2027, { aliquotaCombinada: 0.2 });
    // debito = 600000 * 0.2 = 120000 ; credito = 234000 * 0.2 = 46800
    // ibsCbsLiquido = 73200 ; totalHibrido = 51840 + 73200 = 125040
    expect(s.totalHibrido).toBeCloseTo(125040, 2);
  });

  it("lança erro para ano sem configuração", () => {
    expect(() => simular(perfilExemplo({ ano: 2099 }), 2099)).toThrow(/Sem configuração/);
  });
});
