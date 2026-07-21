// Formatação em português do Brasil.

export function formatBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(valor);
}

/** Fração (0.089) -> "8,9%". */
export function formatPct(fracao: number, casas = 2): string {
  return `${(fracao * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  })}%`;
}

export function formatData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
  return iso;
}

export function dataHojeExtenso(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
