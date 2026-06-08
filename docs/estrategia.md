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

### Conversas no orgânico (Messenger — perguntando dor + disposição de pagar)

**[2026-06-08] Isaac Mesquita — corretor (compra e venda)**
- **Maiores dores relatadas:** tarefas burocráticas tomam grande parte do tempo
  — termo de autorização de venda, registro de visita com cliente, montagem de
  propostas e gestão de agenda. Boa parte do dia também vai para follow-up e
  contato com novos clientes para marcar agenda.
- **Pagaria?** Sim, "dependendo da funcionalidade da ferramenta".
- **Insight de produto #1 — Registro de visita:** ele considera isso
  "mega importante", pois protege o corretor juridicamente — comprova que foi
  ele quem visitou o imóvel com aquele cliente (proteção contra cliente que
  tenta "atravessar" o corretor ou proprietário que vende por fora).
- **Insight de produto #2 — Proposta preenchida pelo cliente, não pelo corretor:**
  ele relatou conhecer uma operação com +1000 corretores onde, após a visita,
  o corretor envia um **link** para o próprio cliente formalizar a proposta.
  Segundo ele isso (a) agiliza o ciclo em vez de alongar, (b) evita que o
  corretor "condicione a proposta sem perceber" ao preenchê-la, e (c) deixa o
  cliente mais à vontade para abrir valores reais.
- **Follow-up (pergunta: "se tivesse o registro de visita, assinaria?"):**
  Respondeu **"Sim.. claro que um BI e a organização desses dados ajudaria
  muito tmb"** — ou seja, confirmou que **registro de visita é suficiente pra
  fechar**, e adicionou espontaneamente um terceiro desejo: dashboard/BI com
  os dados coletados (visitas, propostas, negociações).
- **Insight de produto #3 — BI e organização dos dados:** quem usa a
  ferramenta quer não só gerar documentos, mas **enxergar os dados**
  (funil, histórico de visitas, negócios abertos/fechados).
- **Possíveis direções de produto sugeridas por essa conversa:**
  1. Função de **"termo/registro de visita"** gerável pela ferramenta
     (proteção jurídica do corretor).
  2. **Link de proposta para o cliente preencher** diretamente.
  3. **Painel/dashboard** com organização dos dados (visitas, propostas,
     status de negociações) — correlaciona com branch não mergeado
     `feat/crm-status-proposta` que já existe no repositório.
- _(continuar coletando mais conversas antes de decidir — uma amostra não é
  sinal; é hipótese a testar contra outras respostas)_

**[2026-06-08] Kono Corretor — apartamentos em SP**
- **Maior dor relatada:** "Cliente que não passa informações exatas e acaba
  perdendo bons negócios" — e, ao ser explorado, ele apontou que considera
  **mais importante ainda** ter uma forma de **encontrar/filtrar clientes em
  potencial**, separando quem está realmente interessado de quem é só
  "curioso" (perde tempo com gente sem intenção real de compra).
- **Pagaria?** Resposta vaga ("Ok") diante da hipótese de uma ferramenta de
  qualificação de lead + montagem rápida de proposta — não deu sinal claro de
  "sim" nem objeção; conversa terminou sem dado de preço/decisão.
- **Insight de produto — Qualificação/triagem de lead:** dor é diferente da
  do Isaac (que falava de burocracia/proposta). Aqui o gargalo apontado é
  **antes** da proposta: identificar quem vale a pena investir tempo, e não
  perder negócio bom por estar ocupado com "curioso".
- _(2 conversas, 2 dores diferentes — ainda é cedo pra apontar padrão; mas já
  vale acompanhar se "achar cliente qualificado" volta a aparecer nas próximas)_

- _(aguardando primeira leitura da campanha — ~14/06/2026)_

---

## Decisões técnicas pendentes

### Migração de infraestrutura — quando tornar o repositório privado

**Situação atual:** repositório público no GitHub. Os segredos reais (chaves
de API, tokens) estão protegidos no Vercel e GitHub Secrets. O que está
visível é o código-fonte, a estratégia de negócio e materiais de marketing.

**Por que ainda não migramos:** a ferramenta (`tool.html`) é servida pelo
GitHub Pages, que exige repositório público no plano gratuito. Tornar privado
desativa o Pages e derruba a ferramenta para os usuários.

**Quando revisar esta decisão (sinais de alerta):**
1. Base de usuários pagantes crescendo e o código vira vantagem competitiva
   real (concorrente pode copiar funcionalidades facilmente)
2. `docs/estrategia.md` passa a conter informações sensíveis de clientes,
   parceiros ou dados financeiros relevantes
3. Qualquer chave, token ou credencial for commitada acidentalmente — agir
   imediatamente nesse caso
4. Produto escala a ponto de justificar ~R$22/mês do GitHub Pro

**O que fazer quando chegar o momento:**
- Opção 1 (mais simples): assinar GitHub Pro → repositório privado com
  GitHub Pages funcionando
- Opção 2 (mais robusta): mover `tool.html` para Vercel (mesmo domínio do
  Next.js) e remover dependência do GitHub Pages — repositório privado sem
  custo adicional
