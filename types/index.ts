export type CurvaABC = 'A' | 'B' | 'C'
export type Temperatura = 'quente' | 'morna' | 'fria'
export type Prioridade = 'alta' | 'media' | 'baixa'
export type StatusTarefa = 'pendente' | 'concluida'
export type Canal = 'email' | 'whatsapp' | 'linkedin'
export type TipoMensagem = 'primeiro_contato' | 'followup' | 'reativacao'

export interface Deal {
  id: string
  user_id: string
  cliente: string
  cnpj?: string
  descricao?: string
  oferta?: string
  cidade?: string
  estado?: string
  ramo?: string
  porte?: string
  cnae?: string
  valor: number
  valor_previsto?: number
  valor_recorrente?: number
  probabilidade: number
  status?: string
  etapa: string
  temperatura: Temperatura
  origem_lead?: string
  origem_oportunidade?: string
  contato_nome?: string
  contato_cargo?: string
  contato_email?: string
  contato_telefone?: string
  vendedor?: string
  prospector?: string
  data_registro?: string
  data_ultimo_movimento?: string
  data_previsao?: string
  dias_parado: number
  agenda_titulo?: string
  agenda_status?: string
  agenda_data?: string
  curva_abc: CurvaABC
  score: number
  importado_em?: string
  updated_at?: string
}

export interface DealScore {
  total: number
  valor: number
  diasParado: number
  temperatura: number
  probabilidade: number
  curvaABC: number
}

export interface Briefing {
  id: string
  user_id?: string
  deal_id: string
  sobre_empresa?: string
  decisor_perfil?: string
  dores_conhecidas?: string
  solucao_becomex?: string
  ultima_interacao?: string
  proximo_passo?: string
  objecoes?: string
  notas?: string
  created_at?: string
  updated_at: string
}

export interface Tarefa {
  id: string
  user_id?: string
  titulo: string
  descricao?: string
  origem: 'chefe' | 'cliente' | 'interna' | 'propria' | 'sdr'
  prioridade: Prioridade
  status: StatusTarefa
  prazo?: string
  deal_id?: string
  concluida_em?: string
  created_at: string
}

export interface MensagemGerada {
  id: string
  user_id?: string
  deal_id: string
  canal: Canal
  tipo: TipoMensagem
  assunto?: string
  corpo: string
  copiada: boolean
  created_at: string
}

export interface Historico {
  id: string
  user_id?: string
  acao: string
  detalhe?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Profile {
  id: string
  nome?: string
  email?: string
  empresa?: string
  cargo?: string
  avatar_url?: string
  created_at?: string
}
