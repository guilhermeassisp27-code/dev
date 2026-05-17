import Papa from 'papaparse'
import type { Deal, Temperatura, CurvaABC } from '@/types'
import { calcularScore } from './scoring'

type RawRow = Record<string, string>

function parseNumber(val: string | undefined): number {
  if (!val) return 0
  // Remove currency symbols and spaces, replace comma decimal
  const cleaned = val.replace(/[R$\s.]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function parseTemperatura(val: string | undefined): Temperatura {
  const v = (val ?? '').toLowerCase().trim()
  if (v === 'quente' || v === 'hot') return 'quente'
  if (v === 'morna' || v === 'warm') return 'morna'
  return 'fria'
}

function parseDiasParado(val: string | undefined, dataUltimoMov: string | undefined): number {
  if (val) {
    const n = parseInt(val, 10)
    if (!isNaN(n)) return n
  }
  if (dataUltimoMov) {
    const last = new Date(dataUltimoMov)
    if (!isNaN(last.getTime())) {
      return Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24))
    }
  }
  return 0
}

// Map common CSV column names to our field names
const COLUMN_MAP: Record<string, keyof Deal> = {
  'cliente': 'cliente',
  'empresa': 'cliente',
  'razão social': 'cliente',
  'razao social': 'cliente',
  'cnpj': 'cnpj',
  'descrição': 'descricao',
  'descricao': 'descricao',
  'oferta': 'oferta',
  'produto': 'oferta',
  'cidade': 'cidade',
  'estado': 'estado',
  'uf': 'estado',
  'ramo': 'ramo',
  'segmento': 'ramo',
  'porte': 'porte',
  'cnae': 'cnae',
  'valor': 'valor',
  'value': 'valor',
  'valor total': 'valor',
  'valor previsto': 'valor_previsto',
  'valor recorrente': 'valor_recorrente',
  'probabilidade': 'probabilidade',
  'prob': 'probabilidade',
  'status': 'status',
  'etapa': 'etapa',
  'stage': 'etapa',
  'fase': 'etapa',
  'temperatura': 'temperatura',
  'temp': 'temperatura',
  'origem lead': 'origem_lead',
  'origem_lead': 'origem_lead',
  'origem oportunidade': 'origem_oportunidade',
  'origem_oportunidade': 'origem_oportunidade',
  'contato': 'contato_nome',
  'contato nome': 'contato_nome',
  'contato_nome': 'contato_nome',
  'cargo': 'contato_cargo',
  'contato cargo': 'contato_cargo',
  'email': 'contato_email',
  'contato email': 'contato_email',
  'telefone': 'contato_telefone',
  'fone': 'contato_telefone',
  'vendedor': 'vendedor',
  'prospector': 'prospector',
  'data registro': 'data_registro',
  'data_registro': 'data_registro',
  'data ultimo movimento': 'data_ultimo_movimento',
  'data_ultimo_movimento': 'data_ultimo_movimento',
  'data previsao': 'data_previsao',
  'data_previsao': 'data_previsao',
  'dias parado': 'dias_parado',
  'dias_parado': 'dias_parado',
  'agenda titulo': 'agenda_titulo',
  'agenda status': 'agenda_status',
  'agenda data': 'agenda_data',
}

function mapRow(row: RawRow): Partial<Deal> {
  const mapped: Partial<Deal> = {}

  for (const [rawKey, value] of Object.entries(row)) {
    const normalizedKey = rawKey.toLowerCase().trim()
    const field = COLUMN_MAP[normalizedKey]
    if (field) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mapped as any)[field] = value
    }
  }

  return mapped
}

export interface ParseResult {
  deals: Omit<Deal, 'id' | 'user_id' | 'importado_em' | 'updated_at'>[]
  errors: string[]
  total: number
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const deals: Omit<Deal, 'id' | 'user_id' | 'importado_em' | 'updated_at'>[] = []

        results.data.forEach((row, idx) => {
          try {
            const partial = mapRow(row)

            if (!partial.cliente) {
              errors.push(`Linha ${idx + 2}: campo "cliente" obrigatório`)
              return
            }

            const diasParado = parseDiasParado(
              typeof partial.dias_parado === 'number' ? String(partial.dias_parado) : undefined,
              partial.data_ultimo_movimento
            )

            const deal: Omit<Deal, 'id' | 'user_id' | 'importado_em' | 'updated_at'> = {
              cliente: partial.cliente ?? '',
              cnpj: partial.cnpj,
              descricao: partial.descricao,
              oferta: partial.oferta,
              cidade: partial.cidade,
              estado: partial.estado,
              ramo: partial.ramo,
              porte: partial.porte,
              cnae: partial.cnae,
              valor: parseNumber(partial.valor as unknown as string),
              valor_previsto: partial.valor_previsto ? parseNumber(partial.valor_previsto as unknown as string) : undefined,
              valor_recorrente: partial.valor_recorrente ? parseNumber(partial.valor_recorrente as unknown as string) : undefined,
              probabilidade: parseNumber(partial.probabilidade as unknown as string),
              status: partial.status,
              etapa: partial.etapa ?? 'Prospecção',
              temperatura: parseTemperatura(partial.temperatura as unknown as string),
              origem_lead: partial.origem_lead,
              origem_oportunidade: partial.origem_oportunidade,
              contato_nome: partial.contato_nome,
              contato_cargo: partial.contato_cargo,
              contato_email: partial.contato_email,
              contato_telefone: partial.contato_telefone,
              vendedor: partial.vendedor,
              prospector: partial.prospector,
              data_registro: partial.data_registro,
              data_ultimo_movimento: partial.data_ultimo_movimento,
              data_previsao: partial.data_previsao,
              dias_parado: diasParado,
              agenda_titulo: partial.agenda_titulo,
              agenda_status: partial.agenda_status,
              agenda_data: partial.agenda_data,
              curva_abc: 'C' as CurvaABC, // will be recalculated server-side
              score: 0, // will be recalculated
            }

            const scoreResult = calcularScore(deal)
            deal.score = scoreResult.total

            deals.push(deal)
          } catch (err) {
            errors.push(`Linha ${idx + 2}: erro ao processar - ${String(err)}`)
          }
        })

        resolve({ deals, errors, total: results.data.length })
      },
      error: (err) => {
        resolve({ deals: [], errors: [err.message], total: 0 })
      },
    })
  })
}
