# Plano de Tráfego e Escala — CorretorPRO

> Documento de estratégia para lançamento e escala do CorretorPRO.
> Produto: SaaS de geração de propostas para corretores. Ticket: R$67/mês ou R$497/ano.
> Público: corretores de imóveis e profissionais de imobiliária no Brasil.

---

## TL;DR — as 4 decisões estratégicas

1. **Começar pelo META ADS (Instagram/Facebook), não Google.** O corretor não pesquisa "gerador de proposta" no Google — ele nem sabe que isso existe. É demanda **latente**, que se cria com vídeo no feed/reels. Google entra na Fase 3, só para capturar quem já busca.
2. **SIM, criar um perfil no Instagram antes de anunciar — mas o mínimo viável.** Não atrase o lançamento por causa disso. 1 dia de trabalho (perfil + bio + 6 a 9 posts) já basta. Quem vê o anúncio clica no perfil; perfil vazio = desconfiança = venda perdida.
3. **Rodar landing + anúncios em paralelo com o perfil.** Não espere "ter audiência" para anunciar. Tráfego pago não depende de seguidores.
4. **Instalar rastreamento ANTES do primeiro real gasto.** Meta Pixel na landing + Pixel ligado na Hotmart. Sem isso você queima dinheiro sem saber o que converte.

---

## Por que Meta antes de Google

| Critério | Meta Ads | Google Search |
|----------|----------|---------------|
| Tipo de demanda | Latente (cria desejo) | Ativa (captura busca) |
| O corretor está lá? | Sim, vive no Instagram | Pouca gente busca o termo |
| Custo inicial | CPM baixo, bom para testar criativo | CPC pode ser alto e volume baixo |
| Melhor para | **Lançar e escalar volume** | Complementar, fundo de funil |

**Veredito:** 80% do orçamento inicial no Meta. Google entra depois com campanha de Search pequena nos termos "modelo de proposta imóvel", "proposta comercial corretor", "app para corretor de imóveis".

---

## FASE 0 — Pré-lançamento (1 a 2 dias)

Antes de gastar com anúncio:

### 0.1 Perfil de Instagram (mínimo viável)
- **@usuario:** algo como `@corretorpro.app` ou `@usecorretorpro`
- **Foto:** o logo CorretorPRO (fundo navy)
- **Bio:** `Propostas imobiliárias profissionais com a sua marca em 60s. ⚡ Direto do celular. Teste agora 👇` + link da landing
- **Link:** a landing (`https://usecorretorpro.vercel.app/`) — ou um domínio próprio depois
- **6 a 9 posts iniciais** (carrossséis simples):
  1. Antes/depois de uma proposta (Word vs CorretorPRO)
  2. "3 erros que fazem o corretor perder venda na proposta"
  3. Print do produto gerando uma proposta
  4. Depoimento/print (quando tiver)
  5. "Quanto vale parecer mais profissional?" (preço ancorado no valor da venda)
  6. CTA: "Comece hoje, cancele quando quiser"

> Não precisa ser perfeito. Precisa **existir e parecer sério**.

### 0.2 Rastreamento (obrigatório)
- Criar Meta Pixel no Gerenciador de Eventos.
- Instalar o Pixel na landing (eu faço isso no código).
- Ligar o Pixel na **Hotmart** (painel Hotmart → Ferramentas → Pixel de rastreamento → colar o ID do Pixel). Isso reporta a **compra** de volta ao Meta = otimização para conversão real.
- Eventos a rastrear: `PageView` (landing), `InitiateCheckout` (clique no botão de plano), `Purchase` (via Hotmart).

### 0.3 Conta de anúncios
- Criar Conta de Anúncios no Gerenciador de Negócios (business.facebook.com).
- Configurar forma de pagamento.
- Verificar domínio (se tiver domínio próprio) — melhora entregabilidade e libera otimização.

---

## FASE 1 — Teste de criativo (dias 1 a 7) · R$30–50/dia

**Objetivo:** descobrir qual ângulo/criativo "engata". Não espere lucro ainda — você está comprando dados.

### Estrutura da campanha
```
Campanha (objetivo: Vendas/Conversões, evento: Purchase ou InitiateCheckout)
└── 1 Conjunto de anúncios
    ├── Público: ABERTO (Brasil, 25–55, sem interesses) — deixe o algoritmo achar
    ├── Posicionamento: Advantage+ (automático)
    ├── Orçamento: R$30–50/dia (CBO ou ABO, tanto faz no começo)
    └── 3 a 4 criativos (vídeos diferentes)
```

> **Não micro-segmente.** Em 2024+ o algoritmo do Meta acha o público sozinho quando o criativo é bom. Público aberto > interesses, na maioria dos casos.

### Os 4 ângulos de criativo para testar
1. **Velocidade:** "Proposta profissional em 60 segundos, direto do celular."
2. **Antes/depois:** "Sua proposta hoje (Word) vs com o CorretorPRO." (screen recording)
3. **Dor/concorrência:** "Enquanto você formata no Word, o concorrente já mandou a proposta dele."
4. **Demonstração crua:** gravação de tela gerando uma proposta de verdade, sem narração polida.

### O que olhar (e quando matar)
| Métrica | Sinal bom | Mate se… |
|---------|-----------|----------|
| CTR (link) | > 1,5% | < 0,8% após R$30 gastos |
| CPM | < R$30 | (depende do nicho) |
| Custo por InitiateCheckout | < R$15 | > R$30 sem nenhuma venda |
| Custo por venda (CPA) | < R$67 | > R$100 após R$150 gastos |

Pause os criativos ruins, deixe rodar os bons.

---

## FASE 2 — Validação e otimização (dias 8 a 21) · R$50–100/dia

Quando 1 ou 2 criativos provarem CPA abaixo de ~R$67:

- **Concentre o orçamento** nos vencedores.
- **Crie variações** do criativo vencedor (mesma ideia, ganchos/aberturas diferentes).
- Suba o orçamento **devagar**: +20% a cada 2–3 dias. Subir rápido demais "reseta" o aprendizado.
- Comece a montar **públicos de retargeting**: quem visitou a landing e não comprou → anúncio com prova social + reforço da garantia de 7 dias.

### Funil de retargeting (Fase 2+)
```
Topo (frio)     → vídeo de ângulo vencedor → landing
Meio (visitou)  → anúncio "ainda na dúvida? garantia de 7 dias" → checkout
Fundo (checkout abandonado) → "termine sua assinatura" + depoimento
```

---

## FASE 3 — Escala (semana 4 em diante) · R$100+/dia

Só escale o que está lucrativo. Regra de ouro: **escale o que funciona, não conserte o que não funciona.**

- **Escala vertical:** sobe orçamento do conjunto vencedor (+20–30% a cada poucos dias).
- **Escala horizontal:** duplica o conjunto vencedor para novos públicos (lookalike de compradores 1–3%, interesses de imobiliário, etc.).
- **Lookalike de compradores:** quando tiver ~50–100 compradores, crie um Lookalike 1% — costuma ser o público mais lucrativo.
- **Entra o Google Ads:** campanha de Search pequena (R$20–30/dia) nos termos de fundo de funil. Captura quem já está procurando solução.
- **Renove criativo:** todo criativo "fadiga" (CTR cai, CPA sobe). Tenha sempre 2–3 criativos novos por semana na fila.

---

## Orçamento sugerido (primeiro mês)

| Fase | Período | Diário | Total aprox. | Objetivo |
|------|---------|--------|--------------|----------|
| Teste | Dias 1–7 | R$30–50 | ~R$280 | Achar criativo vencedor |
| Validação | Dias 8–21 | R$50–100 | ~R$1.050 | Provar CPA < ticket |
| Escala | Dias 22–30 | R$100+ | ~R$900+ | Volume lucrativo |

> Se o caixa for curto, comece com **R$30/dia** e só escale com lucro reinvestido. O produto se paga no 1º mês de cada cliente — é um modelo que se autofinancia se o CPA ficar abaixo do ticket.

---

## Anual vs Mensal nos anúncios

- **Anuncie o MENSAL (R$67)** como porta de entrada — barreira de entrada baixa converte mais no anúncio.
- **Ofereça o ANUAL (R$497) na landing e no pós-compra** como upgrade ("economize R$307"). Caixa imediato + retenção travada por 12 meses.
- No e-mail de boas-vindas, considere um upsell para o anual.

---

## KPIs para acompanhar (dashboard mental diário)

1. **CPA (custo por venda)** — o número mais importante. Meta: < R$67.
2. **CTR do link** — saúde do criativo. Meta: > 1,5%.
3. **Custo por InitiateCheckout** — saúde da landing. Meta: < R$15.
4. **Taxa de conversão da landing** (checkouts ÷ visitantes). Meta: > 2%.
5. **Retenção / churn** — quantos meses o cliente fica. Define o LTV e quanto você pode pagar por venda.

---

## Erros caros a evitar

- ❌ Anunciar sem Pixel/rastreamento → otimização cega.
- ❌ Micro-segmentar público no começo → algoritmo sem espaço para otimizar.
- ❌ Julgar criativo com R$10 gastos → precisa de dados (mín. ~R$30–50 por criativo).
- ❌ Escalar orçamento de uma vez (ex: R$30 → R$150) → reseta aprendizado.
- ❌ 1 criativo só → quando fadigar, a conta morre. Tenha sempre fila de criativos.
- ❌ Mandar tráfego frio direto pro checkout → a landing aquece e qualifica.

---

## Checklist de lançamento

- [ ] Perfil de Instagram criado (foto, bio, link, 6–9 posts)
- [ ] Meta Pixel criado e instalado na landing
- [ ] Pixel ligado na Hotmart (rastreia compra)
- [ ] Conta de anúncios + pagamento configurados
- [ ] Domínio próprio (opcional, recomendado antes de escalar)
- [ ] 3–4 criativos de vídeo prontos
- [ ] 4–5 copies de anúncio prontas
- [ ] Campanha de teste no ar (R$30–50/dia)
- [ ] Rotina diária de leitura de métricas definida

---

## Diagnóstico de Campanha — Relatório 16/05/2026 a 14/06/2026

> Anúncio: "Reels Judicial" | Conjunto: CorretorPRO - Corretores - Brasil | Gasto: R$145 (~30 dias)

### Números brutos

| Métrica | Valor |
|---|---|
| Gasto total | R$145 |
| Impressões | 2.989 |
| Alcance | 1.825 |
| InitiateCheckouts | 4 |
| Custo por InitiateCheckout | R$36,25 |
| CPM implícito | ~R$48,50 |
| Freq. média | 1,64 |
| Classificação qualidade | Na média |
| Classificação engajamento | Acima da média |
| Classificação conversão | Acima da média |
| Tipo de lance | ABSOLUTE_OCPM |
| Última edição significativa | 09/06/2026 |

### 1. Diagnóstico geral

A campanha está **abaixo do potencial, não quebrada**. Os sinais de qualidade são positivos (dois rankings acima da média), mas o volume é insuficiente para o algoritmo operar. R$145 em 30 dias equivale a ~R$4,80/dia — menos de 10% do orçamento mínimo viável para campanhas de conversão. O algoritmo está em modo de sobrevivência, não de otimização.

Diagnóstico resumido: **criativo promissor, estrutura correta, verba insuficiente.**

### 2. CTR implícito e análise do funil

Não há dado direto de cliques no relatório, mas é possível inferir:

- CPM implícito: R$145 / 2.989 impressões × 1.000 = **~R$48,50 CPM**
- Para chegar em 4 checkouts com R$36,25 cada, o funil precisou de pelo menos 4 cliques na landing. Com CPM de R$48, um CTR de 1% geraria ~30 cliques.
- Taxa de checkout implícita: 4 checkouts / ~30 cliques = **~13%** — número alto, indica que quem clicou estava qualificado.
- O problema não é a conversão pós-clique. O problema é o **volume de cliques** — que é uma função direta do orçamento.

CPM de R$48 está acima da média para Brasil (referência: R$20–35 para nichos B2B/profissional no Meta). Isso pode ser efeito do lance ABSOLUTE_OCPM com limite restritivo ou do volume muito baixo (poucas impressões = CPM mais caro por falta de otimização).

### 3. Custo por checkout R$36,25 — está bom ou ruim?

Para o produto com ticket mensal de R$67:

- R$36,25 por checkout (não por venda) está **dentro da faixa aceitável**, mas alto para o estágio atual.
- O plano previa custo por InitiateCheckout < R$15 na Fase 1. Estamos em R$36,25 — o dobro.
- Porém, com apenas 4 checkouts, a margem de erro estatística é enorme. Esse número não é conclusivo.
- Se a taxa de conversão checkout → compra for ~30% (razoável para SaaS), o CPA estimado seria ~R$120 — acima do ticket mensal, mas abaixo do LTV de 3 meses (R$201).
- **Veredito:** não está bom, não está catastrófico. Está inconclusivo por falta de volume.

Benchmark de referência: CPA médio para SaaS no Meta Ads fica entre R$50–R$150 dependendo do ticket e do público. Para ticket de R$67, o CPA-alvo deve ficar abaixo de R$67 (payback no 1º mês) ou no máximo R$100–134 (payback em 1,5–2 meses se a retenção for boa).

### 4. Rankings acima da média — o que significam na prática

O Meta compara o anúncio com outros anúncios competindo pelo mesmo público no mesmo leilão.

- **Classificação de engajamento acima da média:** o Reels gera mais curtidas, comentários, compartilhamentos e visualizações completas do que a maioria dos concorrentes disputando o mesmo corretor. O gancho "O cliente visitou o imóvel com você. FECHOU DIRETO COM O DONO." está funcionando — para e gera reação.
- **Classificação de conversão acima da média:** quem chega na landing a partir deste anúncio converte em checkout melhor do que a média dos anúncios concorrentes. A qualidade do público entregue está boa.
- **Classificação de qualidade na média:** a experiência pós-clique (landing) está OK, sem penalidade. Mas há espaço para melhorar.

**Conclusão prática:** o criativo e o direcionamento estão funcionando. O algoritmo está entregando para as pessoas certas. O problema é o volume, não a qualidade.

### 5. Orçamento de R$145 em 30 dias — o algoritmo está aprendendo?

Não. O algoritmo do Meta precisa de **50 eventos de otimização em 7 dias** por conjunto de anúncios para sair da fase de aprendizado. Com evento de otimização = InitiateCheckout:

- R$36,25 por checkout × 50 eventos = R$1.812 necessários em 7 dias para completar o aprendizado.
- Isso equivale a ~R$259/dia apenas para o aprendizado básico.
- A campanha gerou 4 checkouts em 30 dias — 1,25% do mínimo de aprendizado.

Resultado: a campanha **nunca saiu da fase de aprendizado**. O algoritmo está essencialmente chutando a cada entrega, sem histórico suficiente para otimizar.

A edição significativa em 09/06 reiniciou o aprendizado — o que significa que os últimos 5 dias do período estão com um algoritmo ainda mais "cru" do que o restante.

**Orçamento mínimo funcional para esta configuração (otimização em InitiateCheckout):**
- Conservador: R$30/dia (~R$900/mês) — algoritmo aprende devagar, mas aprende.
- Funcional: R$50/dia (~R$1.500/mês) — sai do aprendizado em ~3–4 semanas.
- Ideal para escala: R$100/dia (~R$3.000/mês) — aprende em 7–10 dias.

### 6. O que fazer agora

**Prioridade imediata — antes de qualquer outra decisão:**

a) **Verificar se o Pixel está rastreando compras (não só checkouts).** Se o Meta não vê compras, não pode otimizar para compras. Ir em Gerenciador de Eventos → verificar se o evento `Purchase` aparece com dados vindos da Hotmart. Se não aparecer, o rastreamento está quebrado e isso é a causa raiz do CPM alto e do CPA ruim.

b) **Mudar o evento de otimização de InitiateCheckout para Purchase** — mas somente se o Pixel estiver registrando compras. Otimizar para checkout quando o objetivo é venda é subótimo; o algoritmo vai priorizar quem clica no checkout, não quem compra.

c) **Aumentar o orçamento diário para no mínimo R$30/dia (R$900/mês).** Abaixo disso, está pagando para veicular anúncio sem que o algoritmo aprenda nada. É o patamar mínimo para ter dados úteis.

**O que NÃO fazer agora:**
- Não pausar o "Reels Judicial" — o criativo tem sinais positivos.
- Não mexer no público ainda — conjunto aberto Brasil + nicho corretor está bem.
- Não trocar o criativo antes de dar volume ao atual.
- Não criar novos conjuntos de anúncios dentro da mesma campanha CBO sem orçamento para suportar (fragmenta o aprendizado).

### 7. Plano de ação — próximos 30 dias

**Semana 1 (ação imediata):**

1. Auditar rastreamento: confirmar que evento `Purchase` chega ao Meta via Hotmart.
2. Se Purchase rastreado: duplicar o conjunto atual e mudar evento de otimização para `Purchase`. Pausar o conjunto com InitiateCheckout.
3. Subir orçamento diário para R$30/dia no mínimo. Ideal: R$50/dia se o caixa permitir.
4. Não fazer nenhuma edição significativa por pelo menos 7 dias após a mudança — deixar o algoritmo aprender sem interrupção.

**Semana 2–3 (coleta de dados):**

5. Acompanhar diariamente: CTR do link, CPA (compras), CPM.
6. Se após 7 dias sem nenhuma compra com R$30/dia: o problema está na landing ou no checkout. Testar novo hook no vídeo.
7. Se CPA aparecer acima de R$134 (2x o ticket): pausar o conjunto, criar variação do criativo com ângulo diferente (ex.: demonstração de tela em vez do gancho judicial).

**Semana 3–4 (decisão de escala):**

8. Se CPA < R$100: aumentar orçamento +20% a cada 3 dias até R$100/dia.
9. Se CPA entre R$100–R$134: manter volume e testar novo criativo em paralelo (segundo conjunto, mesmo orçamento dividido 50/50).
10. Se CPA > R$134 após 3 compras: pausar conjunto, lançar novo criativo com ângulo diferente.

**Critério de corte definitivo:** pausar o conjunto se CPA > R$150 após 5 compras registradas. Esse número representa payback de 2,2 meses — tolerável apenas com retenção boa; inaceitável se o churn for alto.

**Criativo novo a testar (paralelo, não substituto):**
- Ângulo: demonstração crua de tela — gravar o fluxo completo de gerar uma proposta em tempo real, sem corte, com narração "eu gero uma proposta profissional em menos de 2 minutos". Esse ângulo prova o produto, não só a dor.
- Passar briefing completo para o agente `marketing` quando aprovado.

### Resumo executivo

| Ponto | Status | Ação |
|---|---|---|
| Criativo (engajamento) | Bom | Manter |
| Direcionamento (público) | Bom | Manter |
| Volume / orçamento | Crítico | Aumentar para min. R$30/dia |
| Rastreamento de compras | Desconhecido | Auditar urgente |
| Evento de otimização | Subótimo (checkout) | Mudar para Purchase se rastreado |
| Fase de aprendizado | Nunca completada | Resolver com volume |
| CPA atual | Inconclusivo (4 eventos) | Aguardar dados com volume correto |

---

**Proxima acao para o Guilherme:**

1. Abrir Gerenciador de Eventos do Meta → verificar se o evento `Purchase` está chegando com dados da Hotmart. Se não estiver, esse é o problema número 1 a resolver.
2. Subir o orçamento diário da campanha para R$30/dia (mínimo) ou R$50/dia (recomendado). Não fazer nenhuma outra edição além dessa — deixar o algoritmo correr por 7 dias sem interrupção.
3. Confirmar aprovação antes de qualquer mudança no evento de otimização ou criação de novo conjunto.

---

## Log de execução — 15/06/2026

Auditoria do Gerenciador de Eventos + ajustes de checkout e verba executados.

### Rastreamento (Gerenciador de Eventos) — RESOLVIDO/ESCLARECIDO
- 426 eventos nos últimos 28 dias; dados fluindo normalmente.
- Domínios enviando eventos, todos "Permitido": `usecorretorpro.vercel.app` (376),
  `guilhermeassisp27-code.github.io` (16), `pay.hotmart.com` (7).
- **Purchase ESTÁ sendo rastreado** (fonte: pay.hotmart.com). O alerta do Meta é de
  *qualidade* dos dados de preço do Purchase (falta value/currency corretos), não de ausência.
- Decisão: NÃO mudar otimização para Purchase ainda — volume insuficiente (~50 compras/sem
  exigidas). Manter otimização em InitiateCheckout por ora. Arrumar preço do Purchase na
  Hotmart é higiene de baixa prioridade.

### Checkout Hotmart — OTIMIZADO
- Pix confirmado ativo.
- Campos: Nome + Email + Celular (mantido, fricção baixa).
- Suporte: Email + WhatsApp ligados (sinal de confiança).
- Pagamento híbrido (recuperador de vendas) ligado.
- Cupom de desconto desligado (remove fricção de "procurar código").
- Preço parcelado em destaque mantido ligado.
- Página de obrigado: mantida na Hotmart (não quebrar fluxo webhook → Supabase).

### Landing — OTIMIZADA (PR #31 mergeada, em produção)
- Message match com o anúncio, prova social honesta, vídeo demo, âncora de ROI, bloco de confiança.

### Verba — EM ESCALONAMENTO
- 15/06: R$20 → **R$25/dia** (feito).
- 16/06: subir para R$30/dia.
- Meta: chegar a R$50/dia em degraus de ~20-30% (não resetar aprendizado).
- NÃO fazer nenhuma outra edição significativa por 7 dias.

### Próxima leitura: 22/06/2026
Reler CTR, custo por InitiateCheckout, CPM e primeiras vendas com a landing nova rodando.
Critério de corte: pausar se CPA > R$150 após 5 compras registradas.

---

## Checkpoints do teste de validação (definidos 15/06/2026)

Rampa de verba: 15/06 R$25 → 16/06 R$30 → 17/06 R$35 → 18/06 R$40 → 19/06 R$45 → 20/06+ R$50/dia.
Regra: nenhuma edição significativa (criativo/público/posicionamento) durante o teste. Só sobe verba.

| Checkpoint | Data | Gasto acum. aprox. | Decisão |
|---|---|---|---|
| 🚦 CP1 — Sinal de vida | 21/06 | ~R$275-300 | 1+ venda OU início de pagamento → segue. **Zero sinal → PAUSA e diagnostica (stop-loss).** |
| 🚦 CP2 — Resposta parcial | 28/06 | ~R$625 | Calcular CPA real. CPA < R$134 → saudável, continua. CPA > R$150 com 5+ vendas → mata. |
| ✅ CP3 — Resposta confiável | 05/07 | ~R$975 | CPA estável → decidir escalar forte ou encerrar com diagnóstico. |

**Stop-loss absoluto:** não passar de ~R$300 sem NENHUM sinal (venda ou add-payment) no CP1.

**Lembretes (sessão sem agendador automático — Guilherme deve acionar):**
- 22/06 → leitura CP1 + CTR/custo por checkout/CPM com landing nova
- 28/06 → leitura CP2 (CPA)
- 05/07 → leitura CP3 (decisão final de escala)

Sugestão de relatório: filtrar período 15/06 em diante (isolar efeito das mudanças), não o histórico completo.

---

## Expectativa de vendas registrada (cenário conservador — 15/06/2026)

Base: investimento de referência ~R$975 em ~3 semanas (rampa R$25→R$50/dia).

| Premissa | Valor conservador |
|---|---|
| Custo por clique no checkout (InitiateCheckout) | ~R$30 (hoje R$36) |
| Cliques de checkout esperados no período | ~32 |
| Conversão checkout → compra | 10-15% (8% no piso) |
| **Vendas esperadas** | **3 a 5** (piso pessimista: 2-3) |
| **CPA conservador** | **~R$200-325 por venda** |

**Implicação econômica (honesta):**
- Plano mensal (R$67): NÃO se paga na 1ª compra — só com retenção 3-4+ meses.
- Plano anual (R$497): positivo de imediato — 1 venda anual cobre ~1,5-2 CPAs.
- O teste serve para DESCOBRIR se vende e a que custo, não para lucrar de cara.

**Ajuste no CP1 (21/06):** custo por venda conservador (~R$300) ≈ stop-loss (~R$300),
então pode não haver venda fechada ainda no CP1 mesmo com funil saudável. No CP1 avaliar
SINAIS DE AVANÇO (volume de checkout subindo, eventos add-payment, CTR e custo/checkout
melhorando vs. baseline 09/06), não apenas vendas concluídas. Pausar só se tudo estiver parado.

**Baseline para comparação (relatório 16/05-14/06):**
4 InitiateCheckout · R$36,25 cada · R$145 gastos · 2.989 impressões · 1.825 alcance ·
engajamento e conversão acima da média · 0 vendas.

---

## Plano de Otimização — 18/06/2026

> Dados reais da conta `act_2241281872779854`, campanha "CorretorPRO - Campanha 20 reais inicial".
> Estrutura atual: 1 campanha, 1 conjunto, 1 anúncio. Orçamento ~R$20-25/dia (em rampa, ver checkpoints acima).

### Dados de referência

| Período | Gasto | Impressões | Alcance | Cliques | CTR | CPC | CPM | Freq. |
|---|---|---|---|---|---|---|---|---|
| Ontem | R$35,13 | 732 | 634 | 25 | 3,42% | R$1,41 | R$47,99 | 1,15 |
| 7 dias | R$169,65 | 3.635 | 2.272 | 145 | 3,99% | R$1,17 | R$46,67 | 1,60 |
| 30 dias | R$232,14 | 4.907 | 2.814 | 242 | 4,93% | R$0,96 | R$47,31 | 1,74 |

### 1. Diagnóstico curto

- **CTR forte (3,4-4,9%)** — muito acima do benchmark de nicho B2B/profissional (1,5-2%). Criativo e gancho funcionam, isso não é o problema.
- **CPC caindo com o tempo** (R$1,41 → R$0,96 nos 30 dias) — sinal de que o leilão está "aprendendo a entregar" o anúncio, mesmo sem otimizar por conversão ainda.
- **CPM estável e alto (~R$47)** nas três janelas — não é ruído, é estrutural. Com freq. baixa (1,15-1,74) não é fadiga de público, é leilão caro: ou o público está concentrado demais, ou o posicionamento padrão (feed) está puxando o custo, ou o nicho "profissional/imobiliário" tem leilão mais disputado.
- **Gargalo real:** não é o criativo, não é o engajamento — é o custo de entrega (CPM) combinado com volume baixo. A campanha ainda roda com otimização de cliques/checkout, sem aproveitar o Pixel para achar quem de fato assina.
- Isso confirma o que já está registrado no log de 15/06: Purchase é rastreado mas sem volume (~50 compras/semana) pra otimizar por ele ainda. Continuar a rampa de verba é a prioridade, não mudar estrutura.

### 2. Objetivo da campanha — otimizar por conversão agora?

**Ainda não, pelo critério já registrado:** otimização por Purchase exige histórico mínimo de ~50 conversões/semana para o algoritmo ter dados (mesmo Cost Cap/ROAS Goal). A campanha está longe disso. Trocar agora reseta o aprendizado do conjunto e devolve o leilão para "modo chute" — pior do que manter o que está rodando.

**O que fazer em vez disso:**
- Manter otimização em **InitiateCheckout** (evento intermediário) até acumular volume de checkouts suficiente (referência: ~30-50 checkouts) para então testar Purchase.
- Continuar a rampa de verba já definida (R$25→R$50/dia) sem interromper — é o caminho mais rápido para sair do "modo aprendizado eterno".
- Corrigir paralelamente o `value/currency` do evento Purchase na Hotmart (já identificado como pendência de baixa prioridade) — sem isso, mesmo quando o volume permitir, ROAS Goal não vai funcionar bem.

### 3. Estrutura recomendada

Não mudar estrutura agora — orçamento é baixo demais para fragmentar aprendizado em múltiplos conjuntos. Mas preparar para quando o checkpoint CP2 (28/06) liberar escala:

```
Campanha única (CBO) — Conversões, evento InitiateCheckout (depois Purchase)
└── Conjunto 1 (atual) — público amplo Brasil 25-55, Advantage+ posicionamentos
    └── Anúncio atual ("Reels Judicial") — MANTER, não tocar
```

**Quando liberar 2º conjunto (só após CP2 com CPA saudável):**
```
Campanha CBO
├── Conjunto A — público amplo (controle, o que já roda)
└── Conjunto B — Lookalike 1% de compradores OU retargeting de quem visitou e não comprou
```
CBO porque a verba ainda é pequena (R$50-100/dia) — não dá pra dividir manualmente entre conjuntos sem desperdiçar. ABO só entra quando houver 2+ públicos com sinal validado e verba > R$150/dia para alocar diferente entre eles.

**Sobre testar novos criativos agora:** não. O briefing da "demonstração crua de tela" (já registrado acima) deve ficar em standby até o conjunto atual sair da fase de aprendizado — rodar 2 criativos com volume baixo divide os dados pela metade e atrasa tudo.

### 4. Públicos a testar (assim que houver verba/sinal para isso — não agora)

1. **Lookalike 1% de compradores** (Hotmart → evento Purchase no Pixel) — só pode ser criado com no mínimo ~50-100 compradores na base. Prioridade #1 quando atingir esse volume; histórico mostra que costuma ser o público mais lucrativo.
2. **Retargeting de quem visitou a landing e não assinou** (Custom Audience por PageView/InitiateCheckout, janela 14 dias) — público pequeno mas barato e qualificado, criativo de reforço de garantia/prova social. Pode entrar mais cedo que o lookalike, mesmo com pouco volume, porque o custo por impressão nesse público costuma ser baixo.
3. **Interesse "corretor de imóveis" / "CRECI" / páginas de imobiliária** como teste de controle paralelo ao público amplo — só depois que o público amplo validar CPA, para comparar se segmentar por interesse reduz CPM sem matar o CTR. Não prioritário: o plano original já mostrou que público aberto funciona bem com criativo forte.

### 5. Orçamento e escala

- **Manter a rampa já definida e em curso:** 15/06 R$25 → 16/06 R$30 → 17/06 R$35 → 18/06 R$40 (hoje) → 19/06 R$45 → 20/06+ R$50/dia. Não pular degraus.
- **Regra de escala pós-rampa:** subir em blocos de **+20% a cada 3 dias**, nunca mais que isso de uma vez — saltos maiores resetam o aprendizado do conjunto.
- **Limite para não estourar aprendizado:** nenhuma edição estrutural (criativo, público, posicionamento, evento de otimização) nos próximos 7 dias após qualquer mudança de verba — só ajustar o número do orçamento.
- **Teto até a próxima decisão de escala (CP3, 05/07):** não passar de R$50/dia sem CPA validado. Resistir à tentação de acelerar mesmo com CTR bom — CTR não paga conta, CPA paga.

### 6. Atacar o CPM ~R$47 — hipóteses e o que testar primeiro

Hipóteses, em ordem de probabilidade:

1. **Volume baixo ainda penaliza o CPM** (a entrega não tem dados suficientes pra o leilão precificar bem o público) — mais provável, dado que CPC caiu enquanto CPM ficou estável: o leilão está aprendendo a quem mostrar, não necessariamente "achatando" o custo de exibição ainda.
2. **Posicionamento:** se o Advantage+ de posicionamentos não está habilitado (ou está restrito a feed), o CPM sobe — feed costuma ser mais caro que Stories/Reels, que têm mais inventário disponível.
3. **Público "profissional/imobiliário" é leilão naturalmente mais caro** (B2B-like) — menos espaço pra reduzir CPM via público amplo, mas ainda é a opção mais barata disponível.
4. **Frequência baixa (1,15-1,74) descarta fadiga de criativo** como causa do CPM alto — não é esse o problema.

**O que testar primeiro (ordem):**
1. Confirmar no conjunto atual que **todos os posicionamentos Advantage+** estão habilitados (Feed, Stories, Reels, Audience Network) — se algo estiver restrito, liberar é a ação de menor risco e maior potencial de queda de CPM. *(Isso é uma checagem de configuração, não uma "edição significativa" — pode ser feito sem reset de aprendizado se não alterar segmentação.)*
2. Deixar a rampa de verba rodar — volume maior tende a estabilizar/reduzir CPM organicamente em 1-2 semanas.
3. Só depois, se CPM continuar > R$45 com volume maior, testar abrir a faixa de idade/gênero (se estiver restrita) para ampliar ainda mais o público e baratear o leilão.

### 7. Metas e benchmarks (próximos 7-14 dias)

| Métrica | Meta | Janela de avaliação |
|---|---|---|
| CTR | manter > 3% (já está ótimo, não deixar cair) | diário |
| CPM | tendência de queda para R$35-40 com volume maior | 14 dias |
| Custo por InitiateCheckout | < R$30 (hoje ~R$36) | 7 dias |
| CPA (1ª venda mensal R$67) | < R$67 ideal / até R$134 aceitável (payback 2 meses) | conforme CP2/CP3 |
| CPA (venda anual R$497) | até R$250 excelente, até R$497 ainda positivo | conforme CP2/CP3 |

Isso está alinhado aos checkpoints já registrados (CP1 21/06, CP2 28/06, CP3 05/07) — este plano não cria nova régua, reforça a existente.

### 8. Checklist priorizado

1. **Hoje (18/06):** confirmar orçamento em R$40/dia conforme rampa — não mais, não menos.
2. **Hoje/amanhã:** checar configuração de posicionamentos (Advantage+ completo, sem Feed-only) — única alteração de "configuração" tolerável sem resetar aprendizado, porque não muda segmentação nem orçamento.
3. **Sem mexer até 21/06:** deixar o conjunto atual rodar sem nenhuma edição significativa — criativo, público e evento de otimização ficam como estão.
4. **21/06 — CP1:** ler CTR, custo por checkout e CPM; aplicar critério de stop-loss já definido (zero sinal após ~R$300 acumulado → pausa e diagnóstica).
5. **28/06 — CP2:** calcular CPA real; se saudável (< R$134), seguir rampa; se CPA > R$150 com 5+ vendas, matar o conjunto e acionar criativo reserva ("demonstração crua de tela").
6. **Quando atingir ~50-100 compradores:** criar Lookalike 1% e Custom Audience de retargeting — só então abrir 2º conjunto na campanha CBO.
7. **05/07 — CP3:** decisão final — escalar em CBO com 2 conjuntos (amplo + lookalike/retargeting) ou encerrar com diagnóstico, conforme CPA acumulado.

---

**Próxima ação para o Guilherme:**
Confirmar que o orçamento está em R$40/dia hoje (conforme rampa já definida) e checar rapidamente no Gerenciador de Anúncios se os posicionamentos Advantage+ estão todos habilitados (Feed, Stories, Reels, Audience Network) — é a única alteração segura a fazer agora. Depois disso, não tocar em mais nada até a leitura do CP1 em 21/06. Qualquer mudança de público, criativo ou evento de otimização precisa de aprovação explícita antes de ser aplicada.
