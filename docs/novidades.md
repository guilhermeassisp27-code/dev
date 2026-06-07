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

## [2026-06-07] CRM leve — status por proposta e painel de negociações
**Para o corretor:** saiba exatamente em qual fase cada negociação está — do primeiro envio até o fechamento — sem precisar lembrar de cabeca ou manter planilha separada.
**O que mudou:** cada proposta salva ganha um badge de status clicavel (Nova / Enviada / Em negociacao / Fechada / Perdida). O topo de "Minhas Propostas" exibe um painel com a contagem em cada fase e botoes de filtro para o corretor focar no que precisa de atencao. O status persiste no Supabase junto com o restante dos dados.
**Status:** em PR

---

## [2026-06-06] Busca no histórico e duplicar proposta
**Para o corretor:** encontre qualquer proposta salva em segundos e reutilize ela como ponto de partida para um novo cliente — sem redigitar tudo do zero.
**O que mudou:** adicionada barra de busca em "Minhas Propostas" que filtra por cliente, tipo de imóvel, endereço ou tipo de negociação em tempo real; adicionado botão "Duplicar" em cada proposta salva que pré-preenche o formulário com os dados daquela proposta para edição imediata.
**Status:** em PR

<!-- Novas entradas vão acima desta linha, sempre no topo -->
