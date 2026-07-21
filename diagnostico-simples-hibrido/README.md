# Diagnóstico Simples Híbrido

App web local para o contador gerar um diagnóstico pago, com laudo em PDF, sobre a decisão do
**Simples Híbrido**: a empresa cliente deve, a partir de 2027, recolher IBS/CBS dentro do DAS
("Simples puro") ou por fora, no regime regular ("híbrido")?

**Princípio inegociável:** um motor de cálculo determinístico e auditável calcula os números; a IA
(API da Anthropic) apenas redige a narrativa do laudo em cima dos valores já calculados. Nenhum
número sai da IA.

## ⚠️ As alíquotas são placeholders a verificar

Todos os números tributários (alíquotas de IBS/CBS, fatores de redução, limiares e alíquotas
efetivas por anexo) vivem em `config/reforma.ts`, cada um com `{ valor, fonte, dataRevisao,
verificar: true }`. **São valores de referência da transição da Reforma Tributária e precisam ser
confirmados na fonte oficial (LC 214/2025 e resoluções do CGSN)** antes de usar num laudo real. O
contador é o responsável técnico (assina com o CRC) e revisa/edita o laudo antes de exportar.

## Como rodar

```bash
npm install

# Configure a chave da API (usada só no servidor, nunca no cliente)
cp .env.example .env.local
# edite .env.local e preencha ANTHROPIC_API_KEY=...

npm run dev
# abre em http://localhost:3000
```

Outros comandos:

```bash
npm run test       # testes do motor (Vitest)
npm run build      # build de produção
npm run typecheck  # checagem de tipos
```

## Fluxo

1. **/** — formulário com o perfil da empresa cliente.
2. **/resultado** — recomendação de elegibilidade + comparativo puro × híbrido com a conta linha a
   linha, premissas editáveis (recalculam ao mudar) e o rascunho do laudo gerado pela IA (editável).
3. **/laudo** — layout de impressão branded; botão "Baixar PDF" usa `window.print()`.

## Estrutura

```
/app
  page.tsx                 formulário de entrada
  resultado/page.tsx       resultado + premissas editáveis + laudo
  laudo/page.tsx           layout de impressão
  api/laudo/route.ts       chama a Anthropic (server-side)
/lib/engine
  elegibilidade.ts         árvore de decisão (3 galhos)
  simulacao.ts             simulação comparativa puro × híbrido
  index.ts                 rodarMotor()
  __tests__/               testes do motor
/config
  reforma.ts               alíquotas/fatores/limiares (todos com fonte + verificar:true)
  marca.ts                 dados do contador para o laudo
/lib
  format.ts, markdown.ts, storage.ts
/types.ts
```

## Motor (o que a IA nunca faz)

- `decidirElegibilidade(perfil, limiares?)` — B2C fica puro; B2B com crédito baixo é provável puro;
  senão candidato ao híbrido.
- `simular(perfil, ano, overrides?)` — calcula `totalPuro`, `totalHibrido`, `delta`,
  `creditoParaCliente` e a lista de linhas da conta, com todas as premissas usadas listadas.

A rota `/api/laudo` recebe esse resultado pronto e pede à IA (modelo `claude-sonnet-4-6`,
temperatura 0.2) para escrever o laudo em Markdown, com a instrução explícita de usar apenas os
números fornecidos e não recalcular nada. A chave da API fica em `process.env.ANTHROPIC_API_KEY` e
nunca é exposta no cliente.

## Aviso de responsabilidade

O laudo termina sempre com o aviso de que os valores são estimativas com base nos dados informados e
dependem de validação do contador responsável (CRC), além da data de emissão.
