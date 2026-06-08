# Estratégia de Validação e Product-Market Fit — CorretorPRO

> Documento de norte estratégico. O agente `produto` deve ler este arquivo
> junto com `docs/roadmap.md` antes de propor melhorias.

## Princípio central

**O mercado decide.** Não escalamos verba nem assumimos que uma feature é boa
até o corretor sinalizar com dinheiro/uso. Validar primeiro, escalar depois.

## Fase atual: validação (verba baixa)

Campanha de R$20/dia no Meta Ads existe para responder UMA pergunta:
**"Existe corretor disposto a pagar pelo CorretorPRO?"**

- Não mexer na campanha nos primeiros 3 dias (fase de aprendizado do algoritmo).
- Dia 4: ler CTR (criativo está atraindo?).
- Dia 7: leitura completa — CPM, CPC e **custo por InitiateCheckout**.

## Árvore de decisão pós-leitura (dia 7)

1. **Sinal POSITIVO** (custo por checkout saudável + aparecem vendas)
   → escalar verba gradualmente e reforçar o que funciona (criativo/público).

2. **Sinal FRACO/NEGATIVO** (custo alto, sem conversão)
   → **não é fracasso, é informação.** Iterar nesta ordem, do mais barato ao
   mais caro de mudar:
   1. Criativo do anúncio (gancho, formato).
   2. Público/segmentação.
   3. Oferta/preço/landing (proposta de valor, prova, CTA).
   4. **O próprio produto** (ver loop abaixo).

## Loop de evolução do produto (quando o mercado não sinaliza)

Enquanto não encontrarmos algo que escale, repetir:

1. **Pesquisar dores reais do corretor** (agente `produto` com WebSearch):
   o que ele reclama, onde perde tempo/venda, o que pede.
2. **Escolher UMA dor** de alto impacto e implementar a **menor versão** que
   entrega valor na ferramenta (`tool.html`), sem quebrar o fluxo crítico
   (salvar → sair → entrar → persiste).
3. **Anunciar** a novidade (landing + conteúdo) e **medir** a reação.
4. **Repetir** até achar a funcionalidade/ângulo que faz o corretor querer
   pagar e ficar. Cortar o que não engaja; dobrar no que engaja.

## Regras de disciplina

- Persistência: PMF raramente vem na primeira tentativa — iterar várias vezes.
- Frieza com dado: decisão baseada em número, não em achismo.
- Reversibilidade: tudo via PR no `main`; nada quebra sem poder voltar.
- Cada tarefa em um branch novo a partir do `main` (evita confusão).

## Registro de aprendizados

> Anotar aqui cada ciclo: hipótese testada → resultado → decisão.

- _(aguardando primeira leitura da campanha — ~14/06/2026)_
