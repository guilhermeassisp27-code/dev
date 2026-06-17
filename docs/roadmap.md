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

- **Lembrete de follow-up** — aviso para retomar contato com o cliente em X dias. _Dor: o dinheiro está no follow-up, e ele esquece._
- **Link de proposta para o cliente preencher** — corretor envia um link e o próprio cliente formaliza a proposta. _Dor (validada na conversa com Isaac, 2026-06-08): cliente fica mais à vontade para abrir valores reais; corretor não "condiciona" a proposta sem perceber._
- **Qualificação/triagem de lead** — separar interessado real de "curioso". _Dor (validada na conversa com Kono, 2026-06-08): perder tempo com quem não vai fechar._
- **Logo/cores aplicados automaticamente** em toda proposta a partir do perfil.
- **Campo de observações livres** por proposta.
- **Comparativo de imóveis** — montar uma proposta com 2–3 opções para o mesmo cliente.
- **Assinatura/validade da proposta** — data de validade e espaço para aceite do cliente.
- **Histórico por cliente** — agrupar todas as propostas de um mesmo cliente.

## Já entregue
- **Modelos de proposta (Clássico, Moderno, Minimalista)** — seletor em Configurações que troca o visual da proposta gerada, salvo no perfil junto com logo/cor. _Dor:_ corretores têm estilos diferentes; um único layout não serve para todos os imóveis (alto padrão vs popular). (2026-06-17)
- **Agenda de Visitas / funil de leads** — cadastro do lead antes da visita (nome, telefone, imóvel, data/hora), lista priorizada por atraso/hoje/agendada, e "Marcar como realizada" que pré-preenche Registro de Visita e Proposta. _Dor validada via pesquisa em CRMs imobiliários: follow-up esquecido é causa recorrente de venda perdida._ (2026-06-17)
- **Registro de Visita** — termo com amparo legal (arts. 722–729 CC) que comprova a intermediação do corretor, com assinaturas, PDF e WhatsApp. _Gatilho de assinatura validado na conversa com Isaac (2026-06-08)._ (2026-06-09)
- **CRM leve / status da negociação** — badge de status por proposta (Nova / Enviada / Em negociação / Fechada / Perdida) com painel de contagem e filtro rápido por fase. _Atende o desejo de "BI/organização dos dados" do Isaac._ (2026-06-09)
- **Busca/filtro no histórico** — campo de busca em "Minhas Propostas" para encontrar propostas antigas por cliente, tipo de imóvel ou endereço. (2026-06-06)
- **Duplicar proposta** — botão nas propostas salvas que pré-preenche o formulário para agilizar uma nova proposta similar. (2026-06-06)
