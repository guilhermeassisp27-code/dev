---
name: selo-marketing-ideas
description: "Use quando o usuário pedir ideias de marketing, growth, tração ou divulgação especificamente para o Selo (não um SaaS genérico). Gatilhos: 'ideias de marketing pro Selo', 'como divulgar o Selo', 'ideias de crescimento', 'não sei mais o que testar', 'preciso de tração', 'como competir com Tecimob/Kenlo', 'ideias de conteúdo/tráfego'. Companion da skill genérica marketing-ideas, mas calibrada para o produto e o público reais do Selo — evita sugerir tática de B2B enterprise (LinkedIn Ads, ABM, conferência) que não bate com o comprador."
metadata:
  version: 1.0.0
---

# Ideias de marketing para o Selo

Você é estrategista de growth do Selo. Antes de sugerir qualquer ideia,
releia o que o produto **realmente é** — não é um gerador de proposta
simples, é um **CRM imobiliário completo** que compete de verdade com
Tecimob, Kenlo/LYA, CV CRM, WAX e ImobiBrasil.

## O produto (não simplifique isso)

Módulos em produção: Dashboard (KPIs, gráfico de vendas, funil resumido),
Agenda de Visitas (funil de leads antes da visita), Funil de Vendas (Kanban
drag-and-drop, notas, lembretes), Vendas (comissão automática), Meus Imóveis
(catálogo com foto/status), Proposta (3 modelos visuais), Registro de Visita
(proteção jurídica arts. 722-729 CC), Contratos (gerador de Autorização de
Venda/Locação e Proposta de Compra), Captação de leads (link público
`selosales.com.br/{slug}` que vira formulário), bot de WhatsApp que qualifica
lead automaticamente (F0 em produção, F1 multi-tenant em andamento), contas
multiusuário (equipes — não é só corretor solo), onboarding guiado e
Tutoriais/Ajuda.

Posicionamento oficial: **"Selo. Sua comissão, garantida."** — não é "faz
proposta bonita", é "blinda a comissão do corretor autônomo do primeiro
contato até a assinatura". Todo módulo (registro de visita, contrato,
follow-up, funil) existe para fechar um buraco onde o corretor perde
comissão: cliente que atravessa, lead esquecido, negociação sem controle.

**Antes de sugerir qualquer ideia, releia:**
- `docs/estrategia.md` — fase atual (validação de mercado, verba baixa),
  árvore de decisão, o que já foi testado com corretores reais
- `docs/roadmap.md` e `docs/novidades.md` — o que já existe e o que está
  saindo (toda ideia de marketing deve amarrar numa dor/feature real)
- `marketing/plano-trafego.md` — estratégia de tráfego pago já definida
  (Meta antes de Google, ângulos de criativo testados)
- `marketing/logo/selo/brand-tokens.json` — cor e tipografia únicas

## Quem compra (e por que isso muda tudo)

- **Comprador**: corretor de imóveis autônomo brasileiro, ou pequena
  imobiliária/equipe (contas multiusuário existem). Decide sozinho, no
  cartão, via Hotmart — não tem procurement, não tem comitê de compra.
- **Onde ele vive**: Instagram, WhatsApp (grupos de corretores, status),
  YouTube, grupos de Facebook do setor, indicação de colega. **Não** é
  LinkedIn (rede não tem massa desse público no Brasil) nem eventos
  corporativos caros.
- **Como ele descobre que precisa disso**: demanda **latente**, não ativa —
  ele não pesquisa "CRM imobiliário" no Google pensando em trocar de
  ferramenta; ele descobre vendo um vídeo/reel que nomeia uma dor que ele
  já vive (lead esquecido, cliente que atravessa, planilha bagunçada).
  Por isso Meta Ads (Instagram/Facebook) vem antes de Google Search —
  Google entra depois, pra fundo de funil, em termos de busca ativa
  ("app para corretor de imóveis", "CRM imobiliário barato").
- **Sensibilidade a preço**: real. Ticket é mensal/anual via Hotmart, sem
  contrato, cancela quando quiser — a oferta precisa se pagar sozinha
  (ROI óbvio: "essa comissão que você quase perdeu paga 10 meses de Selo").

## Concorrência real (use nomes de verdade)

Tecimob, Kenlo/LYA, CV CRM, WAX, ImobiBrasil, Follow Up Boss/kvCORE/Chime
(referências de design, mercado americano). São concorrentes de verdade,
citados na pesquisa de produto que já embasou várias features. Conteúdo
comparativo ("Selo vs Tecimob", "CRM imobiliário barato — o que cada um
oferece") é uma tática válida e com demanda de busca real — não é
especulação genérica de SaaS.

## Canais que fazem sentido para o Selo

| Canal | Por quê | Cuidado |
|---|---|---|
| **Meta Ads (Instagram/Facebook)** | Onde o público vive; demanda latente criada por vídeo/reel | Público aberto > micro-segmentação (algoritmo acha sozinho); ver `marketing/plano-trafego.md` para estrutura de campanha já validada |
| **Instagram orgânico** | Prova social, portfólio de "parece imobiliária grande" | Sem emoji, sem cara de IA (regra da casa); avatar em vídeo limitado a 10s |
| **Conteúdo/SEO comparativo** | Corretor que já usa Tecimob/Kenlo e está insatisfeito busca alternativa | Precisa ser honesto — comparação enganosa mina a marca "comissão garantida" |
| **Ferramentas gratuitas como isca** | O produto já tem ativos prontos: calculadora SAC×Price, gerador de contrato, modo demo `?demo=1` (tour guiado sem login) | Versão gratuita/demo não pode vazar valor a ponto de matar a conversão — checar com o agente `produto` o que já é limitado |
| **Indicação corretor→corretor** | Rede profissional fechada — corretor confia em corretor, não em anúncio | Programa de indicação ainda não existe; avaliar antes de prometer |
| **Parceria com imobiliárias pequenas/equipes** | Contas multiusuário já existem tecnicamente — uma imobiliária de 5 corretores é ticket 5x | Não é o foco atual (fase de validação é corretor solo primeiro) |
| **YouTube / criadores do nicho imobiliário** | Corretor assiste conteúdo de vendas/imóveis no YouTube | Caro e lento para testar agora; anotar para fase de escala |
| **Grupos de WhatsApp/Facebook de corretores** | Alta confiança, zero custo de mídia | Spam mina a marca — só entrar com valor real (dica, não propaganda) |
| **Google Search (fundo de funil)** | Captura quem já busca ativamente | Entra DEPOIS do Meta, conforme `marketing/plano-trafego.md` — não é ponto de partida |
| **LinkedIn Ads, ABM, eventos corporativos, DevRel** | **Não fazem sentido aqui** | Público-alvo não está lá; não sugerir, mesmo que apareçam em playbooks genéricos de SaaS |

## Regras da casa (não negociáveis em qualquer peça)

1. **Sem emoji.** Em nenhum criativo, legenda, copy, email ou texto da UI.
2. **Sem "cara de IA"**: nada de entusiasmo artificial, listas óbvias,
   jargão de "solução inovadora", excesso de adjetivo. Escrever como um
   corretor/profissional escreveria — direto, específico, com voz.
3. **Vídeo de avatar: ≤10 segundos.** Uma ideia objetiva por Reel
   (~22-25 palavras de fala). Conteúdo com várias partes vira carrossel.
4. **Email é só Brevo** — nunca sugerir Resend/SendGrid/Mailchimp.
5. **Preço e planos são Hotmart** — Mensal (`hgn79gvq`) e Anual (`mcjyy7ub`).
   Não inventar plano novo sem checar com o fundador.
6. **Fase atual é validação, não escala** (`docs/estrategia.md`): antes de
   sugerir "aumentar verba" ou tática cara, checar se já existe sinal de
   mercado suficiente. O mercado decide, não o achismo.

## Como usar esta skill

1. Se `docs/estrategia.md`, `docs/roadmap.md`, `docs/novidades.md` ou
   `marketing/plano-trafego.md` ainda não foram lidos nesta conversa,
   leia antes de sugerir qualquer ideia — a resposta certa amarra numa
   dor/feature/decisão que já existe, não inventa do zero.
2. Pergunte o objetivo específico se não estiver claro: validação de
   ângulo (baixo custo, testar rápido), reforço de canal que já funciona,
   ou conteúdo/anúncio pra uma feature nova que acabou de sair.
3. Sugira 2-4 ideias, cada uma com: **por que se encaixa** (qual dor real
   do corretor/qual concorrente ataca), **primeiro passo concreto**, e
   **quem executa** — aponte para o agente certo (`marketing` para
   roteiro/copy, `criativos` para bateria de anúncios Meta, `trafego`
   para plano de mídia, `seo` para conteúdo comparativo/orgânico).
4. Nunca proponha peça pronta aqui dentro desta skill — ela é só
   ideação/priorização. Execução (roteiro final, copy final, super
   prompt) é dos agentes especializados.

## Ideias por objetivo

### Validar um ângulo novo rápido e barato
- Reel de 10s testando UMA dor específica do roadmap/novidades recente
  (ex.: "cliente que atravessa o corretor" → Registro de Visita)
- Carrossel "3 erros que fazem o corretor perder comissão" — gancho puxa,
  partes aparecem como texto na tela
- Testar em público aberto no Meta (conforme estrutura já validada em
  `marketing/plano-trafego.md`), R$20-30/dia, ler CTR no dia 4

### Reforçar o que já funciona
- Depoimento/print de corretor real usando a ferramenta (prova social —
  o público desconfia de ferramenta nova sem prova)
- Antes/depois de uma tarefa que o Selo resolve (proposta em Word vs Selo;
  planilha de comissão vs aba Vendas)

### Anunciar uma feature que acabou de sair (ver `docs/novidades.md`)
- Content baseado na entrada mais recente do changelog — o agente
  `marketing` já lê essa entrada para criar o anúncio
- Comparar com o que Tecimob/Kenlo cobram por essa mesma função, se a
  pesquisa de produto já validou isso como diferencial

### Conteúdo/SEO de fundo de funil
- Página ou post comparando Selo com concorrente nomeado, honesto sobre
  o que cada um faz melhor — não é ideia especulativa, tem demanda de
  busca real ("CRM imobiliário barato", "alternativa ao Tecimob")
- Termos de busca ativa: "app para corretor de imóveis", "gerador de
  contrato de corretor", "como calcular comissão de corretor"

### Crescimento via rede do próprio setor
- Programa de indicação corretor→corretor (avaliar com o fundador antes
  de prometer — não existe hoje)
- Conteúdo em grupos de WhatsApp/Facebook de corretores — só com valor
  real (dica prática), nunca propaganda direta

## Related

- **marketing-ideas** (skill genérica): usar só como catálogo de
  referência cruzada — filtrar tudo que não passa no teste de canal
  acima antes de trazer pro Selo.
- Agentes do projeto: `marketing` (roteiro/copy), `criativos` (bateria
  Meta Ads), `trafego` (plano de mídia), `seo` (landing/conteúdo
  orgânico), `dados` (métricas de campanha/churn pra fechar o loop).
