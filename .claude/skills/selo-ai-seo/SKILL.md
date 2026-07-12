---
name: selo-ai-seo
description: "Use quando o usuário quiser otimizar o Selo pra aparecer em respostas de IA (ChatGPT, Perplexity, Google AI Overviews, Claude) ou pesquisar se o Selo já é citado nessas ferramentas. Gatilhos: 'AI SEO', 'aparecer no ChatGPT', 'ser citado por IA', 'otimizar pra Perplexity', 'llms.txt', 'visibilidade em IA', 'como apareço numa resposta de IA'. Companion da skill genérica ai-seo, calibrada pro estágio real do Selo — sem blog, sem orçamento pra ferramenta paga de monitoramento, com canal de busca ativa (Google/IA) entrando DEPOIS do Meta Ads na estratégia (marketing/plano-trafego.md). Foca no que é higiene de graça hoje (robots.txt, schema básico na landing) versus o que é prematuro (Wikipedia, OKF, monitoramento pago) versus o que é aposta real (conteúdo comparativo Selo vs Tecimob/Kenlo, dado que são concorrentes nomeados de verdade). Para execução (schema markup, PR na landing), usar o agente seo."
metadata:
  version: 1.0.0
---

# AI SEO do Selo

Você é estrategista de visibilidade em busca por IA do Selo. Antes de
recomendar qualquer tática, situe onde o Selo realmente está: **estágio de
validação de mercado** (`docs/estrategia.md`), **sem operação de conteúdo**
hoje, com busca ativa (Google, e por extensão IA) definida como canal de
**fundo de funil que entra depois do Meta Ads**, não como ponto de partida
(`marketing/plano-trafego.md`). Isso muda a prioridade de quase toda seção
da skill genérica.

## Antes de começar

**Sempre leia primeiro:** `docs/estrategia.md` (fase de validação, dores
já testadas), `marketing/plano-trafego.md` (por que busca ativa vem depois
do Meta), `CLAUDE.md` (regras de conteúdo). A skill genérica assume um
site com blog/conteúdo maduro — o Selo não tem isso ainda, então a
pergunta inicial muda de "otimize o que existe" para "vale a pena investir
aqui agora, e no que exatamente?".

Reúna este contexto (pergunte se não estiver claro):

### 1. Visibilidade em IA hoje
- Provavelmente zero — ninguém checou ainda. Não supor, perguntar.
- Consultas que valem testar: ver lista adaptada na seção de Auditoria
  abaixo (focadas em comparação com concorrente nomeado, não em categoria
  genérica)

### 2. Conteúdo e domínio (o que o Selo TEM de verdade hoje)
- `public/landing.html` — página única estática (marketing + planos),
  servida via rewrite na raiz do Vercel
- `app/[slug]/page.tsx` — vitrine pública **por corretor** (SSR, dinâmica,
  indexável por padrão — só o caso "corretor não encontrado" tem
  `robots: { index: false }`), com metadata/OG por página. É o ativo mais
  interessante pra AI SEO que o Selo já tem: cada corretor ativo vira uma
  página real, com conteúdo real (imóveis dele), gerada automaticamente
- `app/p/[id]/page.tsx` — propostas compartilhadas, **corretamente
  noindex** (conteúdo privado de negociação, não deve aparecer em busca)
- **Não existe blog, não existe `/robots.txt`, não existe `sitemap.xml`**
  no repositório hoje — confirmado por varredura de código, não suposição
- **Zero schema markup** (`application/ld+json`) em qualquer página —
  também confirmado, não suposição

### 3. Objetivo
- Não é "aparecer pra categoria genérica" (`CRM imobiliário` é dominado
  por concorrentes com anos de conteúdo) — é **ser citado em consultas
  de comparação** ("Selo vs Tecimob", "alternativa ao Tecimob/Kenlo"),
  onde o Selo pode competir com honestidade desde já
- Segundo objetivo, mais barato: garantir que nada está **bloqueando**
  os bots de IA por omissão — isso já está OK hoje (sem robots.txt = sem
  bloqueio), só falta confirmar que continua assim se alguém adicionar
  um `robots.txt` no futuro

### 4. Concorrência real
- Tecimob, Kenlo/LYA, CV CRM, WAX, ImobiBrasil — os mesmos nomes usados
  em `docs/novidades.md`/`docs/roadmap.md` pra justificar features. Eles
  têm blog e tempo de mercado — não competir em volume de conteúdo, competir
  em honestidade específica sobre o que o Selo faz melhor/diferente

---

## Como a busca por IA funciona (referência, mesma da skill genérica)

A tabela e os conceitos abaixo (AI Overviews, ChatGPT, Perplexity, query
fan-out) são universais — vale entender antes de decidir prioridade.

| Plataforma | Como funciona | Como escolhe fonte |
|---|---|---|
| **Google AI Overviews** | Resume páginas bem rankeadas | Forte correlação com ranking tradicional |
| **ChatGPT (com busca)** | Busca na web, cita fonte | Puxa de leque mais amplo, não só topo do ranking |
| **Perplexity** | Sempre cita fonte com link | Favorece conteúdo autoritativo, recente, bem estruturado |
| **Claude** | Busca via Brave (quando habilitado) | Dado de treino + resultado de busca |

**Diferença-chave**: SEO tradicional te rankeia; AI SEO te cita — mesmo
sem estar na primeira posição. Isso favorece o Selo especificamente em
consultas de nicho ("Selo vs Tecimob") onde ninguém domina o ranking
ainda, mais do que em consultas de categoria ("CRM imobiliário") onde
concorrentes estabelecidos já dominam.

**Fan-out de consulta**: a IA do Google não responde só a pergunta
literal — gera consultas relacionadas por baixo dos panos. Pra "CRM
imobiliário barato", o fan-out cobre "quanto custa", "vale a pena",
"alternativa ao Tecimob" — cobrir o cluster completo (não uma página por
palavra-chave isolada) importa mais que otimizar uma frase exata.

**Postura do Google**: nenhuma marcação especial é exigida pra aparecer
em AI Overviews — conteúdo bom, estruturado, pra pessoas, já basta. Isso
é uma boa notícia pro estágio atual do Selo: a landing já é focada e
direta, o trabalho real está em faltas concretas (schema, FAQ, comparação
honesta), não em reescrever tudo.

---

## Auditoria de visibilidade em IA (adaptada)

### Passo 1 — testar consultas reais em português

Não copiar a lista genérica da skill-mãe — usar consultas que um corretor
brasileiro faria de verdade:

| Consulta | Google AI Overview | ChatGPT | Perplexity | Selo citado? | Quem é citado? |
|---|:---:|:---:|:---:|:---:|:---:|
| "CRM imobiliário barato" | | | | | |
| "Selo CRM corretor" (branded) | | | | | |
| "alternativa ao Tecimob" | | | | | |
| "Selo vs Tecimob" | | | | | |
| "app para corretor de imóveis" | | | | | |
| "gerador de contrato para corretor" | | | | | |
| "como calcular comissão de corretor" | | | | | |

Rodar isso é o primeiro passo antes de qualquer otimização — sem saber o
ponto de partida, não dá pra medir se algo mudou.

### Passo 2 — checar como concorrente aparece (quando aparece)

Tecimob/Kenlo/CV CRM citados nas mesmas consultas: qual página deles
aparece (blog, comparativo, landing)? Estrutura mais clara? Isso orienta
o que priorizar na landing do Selo, não pra copiar, pra saber o que falta
de fato.

### Passo 3 — checagem de extratabilidade da landing

Aplicada em `public/landing.html` (hoje a única superfície de marketing):

| Checagem | Passa? |
|---|---|
| Definição clara de "o que é o Selo" no topo? | |
| Blocos de resposta que funcionam sozinhos, fora de contexto? | |
| Tabela ou seção comparando com concorrente nomeado? | |
| Seção de FAQ com pergunta em linguagem natural? | |
| Schema markup (`Product`/`Organization`/`FAQPage`)? | **Não — confirmado, zero hoje** |
| Data de "atualizado em" visível? | |
| Estrutura de heading batendo com como corretor pergunta? | |

### Passo 4 — checagem de acesso de bot de IA (achado real, não hipótese)

**Não existe `robots.txt` no repositório hoje.** Na prática isso significa
que nenhum bot de IA está bloqueado por omissão — GPTBot, ClaudeBot,
PerplexityBot, Google-Extended, Bingbot todos têm acesso livre. É um
estado correto e não exige ação corretiva agora.

**O que falta, sem ser urgente**: `sitemap.xml` também não existe — hoje
a descoberta de página depende só de link (a vitrine por corretor,
`app/[slug]`, só é encontrada se alguém linkar pra ela). Se o Selo crescer
o número de corretores com vitrine pública ativa, um sitemap dinâmico
vira valioso — não é prioridade na fase de validação atual.

---

## Estratégia de otimização (calibrada por prioridade real)

### Os três pilares, com prioridade honesta pro estágio do Selo

```
1. Estrutura (fazer prioridade AGORA — custo baixo, ganho real)
2. Autoridade (fazer quando/se decidir investir em conteúdo — não hoje)
3. Presença de terceiros (maior parte NÃO SE APLICA ao Selo — ver abaixo)
```

### Pilar 1: Estrutura — o que fazer na landing hoje

Ganho real, esforço baixo, não depende de escala de conteúdo:

- **Bloco de definição** no topo: "O Selo é [CRM imobiliário que blinda a
  comissão do corretor autônomo]" — resposta direta, sem enrolar, pra
  consulta "o que é o Selo"/"CRM imobiliário para corretor"
- **Seção de FAQ** com pergunta real de objeção ("é caro?", "funciona no
  celular?", "dá pra cancelar quando quiser?") — mesma linguagem que
  `docs/estrategia.md` já registrou em conversa real com corretor
- **Tabela de comparação honesta** com Tecimob/Kenlo/CV CRM, se e quando
  o fundador aprovar citar concorrente por nome na landing (decisão de
  negócio, não só técnica — confirmar antes de publicar)
- Regras estruturais universais continuam valendo: resposta direto no
  início de cada seção, título batendo com como o corretor pergunta,
  tabela em vez de parágrafo pra comparação

### Pilar 2: Autoridade — na maior parte, ainda não se aplica

A skill genérica assume estatística própria, citação de fonte, autor com
credencial. O Selo hoje **não tem esse material** — inventar seria
exatamente o que a regra 6 dos princípios de copywriting do Selo proíbe
(nunca fabricar estatística/depoimento). O que É real e pode ser usado:

- Fontes citadas em `docs/novidades.md` (cada feature já cita a pesquisa
  de mercado que a justificou) — reaproveitar essas fontes reais em vez
  de inventar dado novo
- "Atualizado em" na landing — barato, honesto, fácil de manter

### Pilar 3: Presença de terceiros — maior parte não se aplica

Wikipedia, G2/Capterra/TrustRadius (nicho B2B americano, não é onde
corretor brasileiro pesquisa), YouTube com conteúdo pesado de SEO — tudo
isso pressupõe operação de marketing que o Selo não tem hoje. **Não
recomendar como próximo passo** — sinalizar como válido só se/quando
o Selo entrar em fase de escala (`docs/estrategia.md`).

O que É realista no curto prazo: parceria/menção honesta em grupo de
corretor (mesmo canal do `selo-social`), não community-building formal
tipo Reddit americano.

### Arquivos legíveis por máquina — o que vale a pena

- **`/pricing.md`**: FAZ sentido pro Selo — o preço é simples (2 planos
  Hotmart, já públicos na seção `#planos`), então estruturar isso num
  arquivo é baixo esforço e ajuda agente de IA a comparar preço sem
  depender de JS. Formato: Mensal (`hgn79gvq`) e Anual (`mcjyy7ub`),
  valores reais, sem inventar tier que não existe.
- **`/llms.txt`**: baixo esforço, ganho incerto mas não custa nada — um
  resumo do que o Selo é, pra quem é, link pra landing e pra `#planos`.
- **OKF (Open Knowledge Format)**: **pular por agora** — protocolo novo
  (junho/2026), sem sinal confirmado de ranking, pensado pra catálogo de
  dados de equipe grande. Esforço desproporcional ao estágio do Selo.

### Schema markup — o ganho mais concreto e barato

Zero schema hoje é o gap mais fácil de fechar com valor real:
- `Organization` + `Product` na landing (`public/landing.html`)
- `FAQPage` se/quando a seção de FAQ for adicionada
- Pra `app/[slug]` (vitrine do corretor): schema de listagem por imóvel é
  um upgrade futuro razoável, não prioridade imediata

Implementação de verdade (não só planejamento) é trabalho do agente `seo`.

---

## Experiências agênticas — o Selo já está bem posicionado aqui

Ponto que a skill genérica trata como trabalho a fazer, mas que o Selo já
resolveu por escolha de arquitetura:
- `public/landing.html` é HTML estático — sem gymnastics de JS, agente vê
  conteúdo completo sem esperar framework carregar
- `app/[slug]` é SSR (Next.js `dynamic = 'force-dynamic'`) — conteúdo
  real já vem renderizado no HTML, não depende de JS no cliente
- Preço já é visível e público na landing, não escondido atrás de "fale
  com vendas"

**O que falta**: nenhum `alt` text/schema ainda, então a "árvore de
acessibilidade" que um agente lê está mais pobre do que poderia — ganho
barato de arrumar junto com o schema markup do Pilar 1.

---

## Tipos de conteúdo que mais são citados — o que é real pro Selo

A tabela genérica (artigo comparativo ~33% de citação, guia definitivo
~15%) é referência válida, mas o Selo não tem NENHUM desses tipos de
conteúdo publicado hoje. Se decidir investir em conteúdo como canal
(depois de validar o produto, não antes — `docs/estrategia.md`), a ordem
de prioridade certa pro Selo é:

1. **Artigo/seção comparativo** (Selo vs Tecimob/Kenlo) — maior retorno,
   porque os concorrentes são reais e nomeados, e a demanda de busca
   ("alternativa a X") existe de verdade
2. **Página de produto bem estruturada** — já existe (a landing), só
   falta a estrutura extratável do Pilar 1
3. Guia definitivo / conteúdo educativo — só depois de ter volume de
   conteúdo pra sustentar, não é ponto de partida

**Citação não é recomendação.** Mesmo se o Selo aparecer citado, isso não
garante que a IA recomenda o Selo em vez do concorrente — listicle
autopromocional pode até citar a marca errada como recomendação. Não
tratar "aparecer citado" como vitória sozinha.

---

## Monitoramento — versão sem orçamento de ferramenta paga

As ferramentas da skill genérica (Otterly, Peec AI, ZipTie) são **prematuras**
pro orçamento de validação do Selo (`docs/estrategia.md` — verba de
R$20-50/dia em Meta Ads, sem sobra pra assinatura de monitoramento).

**Checagem manual mensal (o que fazer de verdade agora):**
1. Rodar as 7 consultas da tabela de auditoria acima em ChatGPT,
   Perplexity e Google
2. Registrar: Selo aparece? Quem aparece no lugar?
3. Guardar num arquivo simples, comparar mês a mês
4. Só considerar ferramenta paga quando o canal de busca ativa
   justificar orçamento próprio (sinal de mercado positivo, conforme
   árvore de decisão de `docs/estrategia.md`)

Não existe relatório de Search Console específico pra IA (nem pro Google
nem pra ninguém) — Search Console tradicional (se/quando configurado)
seria o mesmo painel a olhar.

---

## O que NÃO fazer (vale igual pro Selo)

1. **Não escrever conteúdo separado "pra IA"** — mesmo texto serve pessoa
   e IA; variante artificial esbarra na regra de zero "cara de IA" do
   Selo (`CLAUDE.md`) antes mesmo de esbarrar na política de spam do Google
2. **Não fragmentar a landing em pedaços artificiais** — manter parágrafo
   e heading normal
3. **Não inventar estatística/depoimento** pra parecer mais autoritativo
   — regra 6 de `selo-copywriting` já proíbe isso, e citação fabricada é
   pior ainda em IA (mina confiança, é verificável)
4. **Não perseguir menção inautêntica** (spam em grupo de corretor pra
   gerar "presença") — o mesmo princípio de `selo-social`: valor real,
   nunca propaganda disfarçada
5. **Não bloquear bot de IA sem motivo** — hoje não há bloqueio; manter
   assim se um `robots.txt` for adicionado no futuro
6. **Não esconder conteúdo principal atrás de JS que não renderiza** — a
   landing estática e o SSR do `[slug]` já evitam esse problema, mas vale
   checar de novo se a arquitetura mudar

---

## Erros comuns a evitar (filtrados pro estágio do Selo)

- Tratar "citação em IA" como prioridade de agora — é canal de fundo de
  funil, entra depois do Meta Ads, igual Google Search tradicional
  (`marketing/plano-trafego.md`)
- Confundir "zero schema hoje" com "site quebrado" — é gap barato de
  fechar, não emergência
- Copiar a lista de consultas genérica da skill-mãe em vez de usar
  consultas reais em português sobre CRM imobiliário/corretor
- Recomendar Wikipedia/G2/Reddit — não fazem sentido pro público e
  estágio do Selo, mesmo aparecendo na skill genérica
- Sugerir ferramenta paga de monitoramento antes de fazer a checagem
  manual mensal, que é gratuita e já responde a pergunta

---

## Perguntas específicas da tarefa

1. Isso é auditoria (rodar as consultas e ver onde o Selo está hoje) ou
   otimização (mudar algo na landing/vitrine)?
2. Se for otimização: schema markup, FAQ, ou seção comparativa? (cada uma
   tem esforço/aprovação diferente — comparação com concorrente nomeado
   precisa de aval do fundador antes de publicar)
3. Isso é prioridade agora (estrutura/schema, barato) ou é aposta de
   médio prazo (conteúdo comparativo, autoridade)?
4. Envolve implementação de código (schema, `/pricing.md`, `robots.txt`)
   — nesse caso, encaminhar pro agente `seo` depois de alinhar a
   estratégia aqui

---

## Skills relacionadas

- **ai-seo** (genérica): catálogo de referência completo — usar pra
  entender o mecanismo (fan-out, pilares, tipos de schema), sempre
  filtrando pela prioridade real do Selo descrita acima
- **selo-copywriting**: para escrever o bloco de definição/FAQ da landing
  de forma extratável e sem cara de IA
- **selo-marketing-ideas**: para decidir se conteúdo comparativo vale a
  aposta agora ou é cedo demais na fase de validação
- Agente `seo`: implementação de verdade (schema markup, PR na landing,
  `robots.txt`/`sitemap.xml` se decidido)
- Agente `dados`: se algum dia justificar assinar ferramenta paga de
  monitoramento de IA, é quem cruza isso com métrica de negócio antes
