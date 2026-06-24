# Roadmap CorretorPRO

Lista priorizada de melhorias da ferramenta. O agente `produto` escolhe daqui
o próximo item (alto impacto, baixo risco), cruza com dores reais de corretor
pesquisadas na internet, e implementa um por vez.

> Edite livremente: adicione ideias, reordene, marque o que já saiu.
> Cada item tem a **dor do corretor** que ele resolve — é o que justifica construir.

## Próximas (prioridade)

1. **Exportar proposta em PDF**
   _Dor:_ o corretor precisa mandar a proposta por email/WhatsApp num formato que o cliente abra em qualquer lugar e que pareça profissional. Hoje depende de print.
   _Valor:_ baixar a proposta pronta como PDF com a marca (logo/CRECI/cor).

2. **Compartilhar por link / WhatsApp**
   _Dor:_ o corretor quer enviar a proposta na hora, direto no WhatsApp, sem anexar arquivo pesado.
   _Valor:_ gerar um link público da proposta + botão "Enviar no WhatsApp" com mensagem pronta.

3. **Cálculo de financiamento aprimorado (SAC + Price)**
   _Dor:_ cliente sempre pergunta "quanto fica a parcela?"; o corretor perde tempo simulando à parte.
   _Valor:_ mostrar SAC e Price lado a lado dentro da proposta.

4. **Galeria de fotos do imóvel na proposta**
   _Dor:_ proposta sem foto não vende; o corretor monta isso manualmente em outro lugar.
   _Valor:_ anexar 3–5 fotos do imóvel que aparecem na proposta/PDF.

## Ideias (a avaliar)

- **Link de proposta para o cliente preencher** — corretor envia um link e o próprio cliente formaliza a proposta. _Dor (validada na conversa com Isaac, 2026-06-08): cliente fica mais à vontade para abrir valores reais; corretor não "condiciona" a proposta sem perceber._
- **Qualificação/triagem de lead** — separar interessado real de "curioso". _Dor (validada na conversa com Kono, 2026-06-08): perder tempo com quem não vai fechar._
- **Logo/cores aplicados automaticamente** em toda proposta a partir do perfil.
- **Campo de observações livres** por proposta.
- **Comparativo de imóveis** — montar uma proposta com 2–3 opções para o mesmo cliente.
- **Assinatura/validade da proposta** — data de validade e espaço para aceite do cliente.
- **Histórico por cliente** — agrupar todas as propostas de um mesmo cliente.

## Já entregue
- **Dashboard — visão geral cruzando leads, imóveis e vendas — 4º módulo do pivô para CRM completo**
  _Dor:_ corretor controla seus números "de cabeça" ou em telas separadas (Funil, Imóveis, Vendas), sem visão rápida de gargalo (lead esfriando, estoque curto, mês fraco de comissão) — pesquisa de mercado mostra demanda crescente por dashboards/indicadores em CRM imobiliário justamente por isso.
  _Valor:_ tela inicial com KPIs (leads ativos, leads em alerta, imóveis disponíveis, vendas e comissão do mês/ano), gráfico de vendas dos últimos 6 meses (SVG puro), resumo do Funil por estágio e lista dos 5 leads mais críticos com atalho pro follow-up — tudo calculado em cima dos dados já existentes, sem array novo. (2026-06-24)
- **Vendas — registro de comissão e resumo comercial — 3º módulo do pivô para CRM completo**
  _Dor:_ corretor autônomo ainda controla vendas e comissões em planilha de Excel separada do CRM (modelos de "planilha de controle de vendas/comissão para corretor" amplamente usados no mercado) — retrabalho de digitar tudo de novo, risco de erro no cálculo manual da comissão (padrão de mercado ~6%, Cofeci) e nenhuma visão automática de "quanto fechei esse mês".
  _Valor:_ ao mover um lead para "Venda fechada" no Funil, modal pede valor, % de comissão e data, calcula a comissão automaticamente, e registra no novo array `vendas`. Nova aba lista todas as vendas com totais de mês/ano, permite editar/excluir, e sugere marcar o imóvel do catálogo como vendido/locado. (2026-06-24)
- **Funil de Vendas (Kanban) — 2º módulo do pivô para CRM completo**
  _Dor:_ a maior queda do funil imobiliário acontece entre "Proposta enviada" e "Negociação", em grande parte por falta de follow-up estruturado e por não existir uma visão clara de em que etapa cada lead está — hoje o corretor controla isso "de cabeça" ou em planilha solta, desconectada da agenda.
  _Valor:_ quadro Kanban com 6 estágios (Novo contato → Visita agendada → Visita realizada → Proposta enviada → Negociação → Venda fechada), cards com cliente/imóvel/valor/alerta de dias sem contato, e botão simples para mover o lead de estágio. Reaproveita o mesmo array `leads` (jsonb) e mapeia automaticamente os leads antigos para o novo funil, sem quebrar a Agenda de Visitas.
- **Gestão de Imóveis (catálogo) — 1º módulo do pivô para CRM completo**
  _Dor:_ corretor autônomo ainda controla a carteira de imóveis em "Wix + WhatsApp + planilha" — bagunça de disponibilidade/reservas e tabela de vendas desatualizada são queixas recorrentes do mercado.
  _Valor:_ cadastro de imóvel (tipo, finalidade, endereço, valor, área, dorms, vagas, status) com foto de capa, listado em grid de cards com badge de status; editar e excluir. Base para os próximos módulos do pivô (Funil de Vendas, Gestão de Vendas, Dashboard). (2026-06-24)
- **Gerador de descrição do imóvel com IA** — botão "✨ Gerar descrição com IA" no formulário de proposta que preenche o campo de condições/observações com um parágrafo comercial por template local (sem API paga), citando os diferenciais reais informados. _Dor:_ paridade competitiva — Tecimob e Kenlo (LYA) já têm camada de IA visível no cadastro de imóvel; sem isso o CorretorPRO parecia datado na comparação, além de resolver o "não saber por onde começar a descrição". (2026-06-24)
- **Alerta de lead esquecido + sugestão de follow-up no WhatsApp** — badge de "X dias sem contato" nos leads parados (3d atenção, 7d+ crítico) e mensagem de retomada gerada por template local, com botão "Enviar no WhatsApp" pré-preenchido. _Dor:_ o dinheiro está no follow-up, e ele esquece — confirmada como dor #1 do corretor autônomo em pesquisa de mercado (WAX, Tecimob já resolvem com lembretes automáticos). (2026-06-24)
- **Modelos de proposta (Clássico, Moderno, Minimalista)** — seletor em Configurações que troca o visual da proposta gerada, salvo no perfil junto com logo/cor. _Dor:_ corretores têm estilos diferentes; um único layout não serve para todos os imóveis (alto padrão vs popular). (2026-06-17)
- **Agenda de Visitas / funil de leads** — cadastro do lead antes da visita (nome, telefone, imóvel, data/hora), lista priorizada por atraso/hoje/agendada, e "Marcar como realizada" que pré-preenche Registro de Visita e Proposta. _Dor validada via pesquisa em CRMs imobiliários: follow-up esquecido é causa recorrente de venda perdida._ (2026-06-17)
- **Registro de Visita** — termo com amparo legal (arts. 722–729 CC) que comprova a intermediação do corretor, com assinaturas, PDF e WhatsApp. _Gatilho de assinatura validado na conversa com Isaac (2026-06-08)._ (2026-06-09)
- **CRM leve / status da negociação** — badge de status por proposta (Nova / Enviada / Em negociação / Fechada / Perdida) com painel de contagem e filtro rápido por fase. _Atende o desejo de "BI/organização dos dados" do Isaac._ (2026-06-09)
- **Busca/filtro no histórico** — campo de busca em "Minhas Propostas" para encontrar propostas antigas por cliente, tipo de imóvel ou endereço. (2026-06-06)
- **Duplicar proposta** — botão nas propostas salvas que pré-preenche o formulário para agilizar uma nova proposta similar. (2026-06-06)
