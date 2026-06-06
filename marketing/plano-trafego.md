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
