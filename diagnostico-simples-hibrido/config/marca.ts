// Dados do contador para o cabeçalho e rodapé do laudo.
// Ajuste com os dados reais do responsável técnico (CRC).

export interface Marca {
  contador: string;
  crc: string;
  escritorio: string;
  contato: string;
  cidade: string;
  /** URL opcional de logo (deixe vazio para não exibir). */
  logoUrl?: string;
}

export const MARCA: Marca = {
  contador: "Nome do Contador Responsável",
  crc: "CRC 0-000000/O-0",
  escritorio: "Nome do Escritório de Contabilidade",
  contato: "contato@seuescritorio.com.br · (00) 00000-0000",
  cidade: "Cidade / UF",
  logoUrl: "",
};
