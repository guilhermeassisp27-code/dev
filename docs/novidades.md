# Novidades CorretorPRO

Changelog das melhorias da ferramenta. O agente `produto` adiciona uma entrada
no TOPO a cada melhoria; o agente `marketing` lê a entrada mais recente para
criar o anúncio aos corretores.

Formato de cada entrada:

```
## [AAAA-MM-DD] Título curto da novidade
**Para o corretor:** o benefício em 1 frase (sem jargão técnico).
**O que mudou:** 1–2 linhas do que foi implementado.
**Status:** proposto | em PR | publicado
```

---

## [2026-06-09] Registro de Visita — proteção jurídica da corretagem
**Para o corretor:** gere em segundos o termo que comprova que foi você quem apresentou o imóvel — sua garantia de receber a comissão caso o negócio feche por fora (arts. 722 a 729 do Código Civil).
**O que mudou:** nova aba "Registro de Visita" gera um termo profissional com a marca do corretor: dados do visitante (nome, CPF), imóvel, data/hora, declaração com amparo legal e campos de assinatura para cliente e corretor. Dá pra copiar, baixar em PDF, enviar por WhatsApp e salvar na nuvem junto com as propostas.
**Status:** publicado

## [2026-06-09] CRM leve — status por proposta e painel de negociações
**Para o corretor:** saiba exatamente em qual fase cada negociação está — do primeiro envio até o fechamento — sem precisar lembrar de cabeça ou manter planilha separada.
**O que mudou:** cada proposta salva ganha um badge de status clicável (Nova / Enviada / Em negociação / Fechada / Perdida). O topo de "Minhas Propostas" exibe um painel com a contagem em cada fase e botões de filtro para o corretor focar no que precisa de atenção. O status persiste no Supabase junto com o restante dos dados.
**Status:** em PR

## [2026-06-07] Simulação de financiamento SAC × Price na proposta
**Para o corretor:** agora a proposta de compra já responde "quanto fica a parcela?" — mostrando SAC e Price lado a lado, com 1ª parcela, última parcela e total pago.
**O que mudou:** novo bloco "Simulação de Financiamento · SAC × Price" nas propostas de Compra (cálculo client-side sobre 80% do valor, com o prazo e a taxa informados). Incluído também no Copiar texto, no PDF e na mensagem de WhatsApp.
**Status:** publicado
## [2026-06-06] Busca no histórico e duplicar proposta
**Para o corretor:** encontre qualquer proposta salva em segundos e reutilize ela como ponto de partida para um novo cliente — sem redigitar tudo do zero.
**O que mudou:** adicionada barra de busca em "Minhas Propostas" que filtra por cliente, tipo de imóvel, endereço ou tipo de negociação em tempo real; adicionado botão "Duplicar" em cada proposta salva que pré-preenche o formulário com os dados daquela proposta para edição imediata.
**Status:** em PR

<!-- Novas entradas vão acima desta linha, sempre no topo -->
