---
name: selo-cro
description: "Use quando o usuário quiser melhorar a conversão da landing do Selo, do formulário de captação de leads do corretor, ou entender por que uma página não está convertendo. Gatilhos: 'CRO', 'melhorar conversão', 'essa página não converte', 'aumentar conversão', 'por que não tá funcionando', 'landing page fraca', 'abandono de formulário', 'ninguém converte', 'taxa de conversão baixa'. Companion da skill genérica cro, calibrada pra realidade real do funil do Selo — uma única landing (public/landing.html) em vez de site com 5 páginas, checkout no Hotmart (fora do controle do Selo), modo demo (?demo=1) como alavanca própria que a maioria dos playbooks de CRO não tem, e dois funis DIFERENTES que não podem ser confundidos: a conversão do Selo (visitante → assinante) e a conversão do corretor (cliente do corretor → lead em /captura/{slug}). Para reescrever a copy em si, ver selo-copywriting; para decidir o que testar, ver selo-marketing-ideas."
metadata:
  version: 1.0.0
---

# CRO do Selo

Você é especialista em otimização de conversão do Selo. Antes de recomendar
qualquer mudança, identifique **qual dos dois funis** está em jogo — são
páginas, públicos e donos de decisão diferentes, e misturar os dois produz
recomendação errada.

## Os dois funis do Selo (não confundir)

| | Funil do Selo | Funil do corretor |
|---|---|---|
| Página | `public/landing.html` (landing única) | `/captura/{slug}` (página pública do corretor) |
| Quem converte | Corretor visitante → assinante | Cliente do corretor → lead |
| Meta | Clique em `#planos` → checkout Hotmart, ou `?demo=1` | Preencher o formulário público |
| Quem decide mudar | Fundador do Selo | Ninguém "otimiza" isso caso a caso — é o produto, igual pra todo corretor |

**Se o pedido não deixar claro qual funil é, perguntar antes de analisar.**
O resto desta skill foca no funil do Selo (landing) — é o de maior
alavancagem de negócio e o que normalmente se quer dizer com "CRO".

## Avaliação inicial

**Sempre ler primeiro:** `public/landing.html` (a página real, não supor
estrutura), `marketing/plano-trafego.md` (de onde vem o tráfego e o
ângulo de cada criativo), `docs/estrategia.md` (fase de validação, árvore
de decisão já definida), `marketing/logo/selo/brand-tokens.json` (tagline
oficial: "Comissão blindada, do primeiro contato à assinatura").

Antes de recomendar, identificar:

1. **Tipo de página**: hoje só existe **uma** — `public/landing.html`.
   Não existe pricing page separada (o plano está na seção `#planos` da
   mesma página), não existe feature page, não existe blog.
2. **Meta de conversão primária**: duas metas reais coexistem na mesma
   página —
   - `InitiateCheckout` → `#planos` → checkout no Hotmart (`Purchase`,
     rastreado via Pixel conforme `marketing/plano-trafego.md`)
   - `?demo=1` → modo demo sem cadastro, pra quem ainda não decidiu — é
     uma alavanca que a maioria dos playbooks de CRO não tem por padrão,
     usar isso a favor em vez de ignorar
3. **Contexto de tráfego**: hoje majoritariamente **Meta Ads** (Instagram/
   Facebook), com 4 ângulos de criativo definidos em
   `marketing/plano-trafego.md` — o headline da landing precisa casar com
   o ângulo do anúncio que trouxe a pessoa, não só com "a mensagem geral"

## Um limite importante: onde o controle do Selo termina

O CRO da skill genérica assume controle total do funil até a conversão
final. No Selo, **o checkout em si roda no Hotmart**, fora do código do
produto — a página de pagamento, os campos do formulário de cartão, a
UX de checkout não são editáveis aqui. O trabalho de CRO do Selo tem
fronteira clara: **influenciar até `InitiateCheckout`** (tudo que acontece
em `public/landing.html`) — a partir daí, a taxa de `InitiateCheckout` →
`Purchase` depende parcialmente da experiência do Hotmart, que é dado a
observar, não a mudar por aqui.

---

## Framework de análise de CRO

Analisar a página nestas dimensões, em ordem de impacto — usando a
estrutura real que a landing já tem hoje (`public/landing.html`, ~1500
linhas, seções: hero → "toda venda perdida tem a mesma história" → "as
dores que deram origem ao produto" → "apresento o Selo" → demo sem
cadastro → features → Registro de Visita/proteção jurídica →
posicionamento → planos → FAQ → CTA final).

### 1. Clareza da proposta de valor (maior impacto)

**Checar:**
- Em 5 segundos, dá pra entender que o Selo é "comissão blindada", ou o
  visitante sai achando que é "gerador de proposta"? Isso importa porque
  o posicionamento oficial da marca (`brand-tokens.json`: "Comissão
  blindada, do primeiro contato à assinatura") pode não estar 100%
  refletido no H1 atual — **checar o headline em produção contra a
  tagline oficial antes de assumir que já está alinhado**, e sinalizar
  ao fundador se houver desalinho, não corrigir sozinho sem confirmar
- Está na língua do corretor (comissão, carteira, fechar negócio), não
  em jargão de SaaS ("solução", "plataforma completa")

**Problemas comuns no material do Selo:**
- Focar em "gerar proposta bonita" em vez de "proteger a comissão" —
  volta pro produto errado, o mesmo risco descrito em `selo-copywriting`
- Listar módulo demais (Dashboard, Funil, Vendas, Imóveis, Contratos...)
  sem amarrar em 3-5 benefícios centrais

### 2. Eficácia do headline

**Avaliar:**
- Bate com a tagline oficial da marca?
- É específico (nomeia a dor: "cliente que atravessa", "lead esquecido")
  em vez de vago ("organize seu negócio")?
- Casa com o ângulo do anúncio Meta que trouxe a pessoa (ver os 4 ângulos
  em `marketing/plano-trafego.md`)?

### 3. Posicionamento, copy e hierarquia de CTA

**CTAs reais que já existem na landing (não inventar um terceiro):**
- Primário: "Começar agora" → `#planos`
- Alternativo/soft: ir pro `?demo=1` — testar sem compromisso, sem
  cadastro

**Avaliar:**
- O CTA de demo está visível o bastante pra quem ainda não decidiu, sem
  competir com o CTA de assinar?
- CTA repete nos pontos certos (depois do bloco de dor, depois das
  features, na seção de planos, no fechamento)?

### 4. Hierarquia visual e escaneabilidade

Igual ao framework genérico — mas checar especificamente se a seção
"Registro de Visita / proteção jurídica" (que é o gancho mais forte e
diferenciado do Selo — comissão blindada de verdade, não metáfora) tem
destaque visual proporcional à importância dela no posicionamento, ou
está perdida no meio da lista de features.

### 5. Sinais de confiança e prova social

**Estado real hoje** (checado no código, não suposto): existe CSS de
`.testimonials` na landing, mas **nenhum depoimento está publicado ainda**
— é scaffold pronto pra quando houver prova real, não uma seção ativa.

**Nunca fabricar depoimento ou estatística pra preencher esse espaço** —
mesma regra 6 de `selo-copywriting`. Sinais reais que já existem e podem
ser reforçados:
- Garantia de 7 dias (já existe, conforme `docs/novidades.md`
  [2026-06-17]) — reforçar contraste visual perto do CTA
- O próprio modo demo — deixar experimentar antes de pagar é prova de
  confiança em si, sem precisar de depoimento
- Quando houver depoimento real de corretor (`docs/estrategia.md`
  registra conversas, mas ainda não virou depoimento publicável),
  avisar que a seção `.testimonials` já está pronta pra receber

### 6. Tratamento de objeção

A landing **já tem seção de FAQ** (`#faq` em `public/landing.html`) —
não é gap a criar do zero, é conteúdo a auditar/reforçar. Checar se
cobre as objeções reais registradas em `docs/estrategia.md` ("pagaria
dependendo da funcionalidade", incerteza sobre curva de aprendizado) e
não só objeção genérica de SaaS.

### 7. Pontos de fricção

No funil do Selo, **não existe formulário de cadastro próprio** — o
caminho é direto pra checkout do Hotmart (que coleta os dados de
pagamento) ou pro demo sem cadastro nenhum. Fricção aqui não é "campo
de formulário demais" (padrão comum de CRO), é:
- Hesitação antes do clique em `#planos` (preço, política de
  cancelamento, "e se eu não gostar" — tratados por FAQ/garantia)
- Tempo de carregamento da landing (é HTML estático — deveria ser rápido;
  checar se algo pesado foi adicionado)
- Experiência mobile — a maioria do tráfego de Meta Ads chega por celular

**Se o pedido for sobre fricção de formulário de verdade**, é o outro
funil — `/captura/{slug}` (formulário de captação do corretor) — ver
seção "Os dois funis" no topo antes de aplicar recomendação de campo/
multi-step aqui.

---

## Formato de saída

Mesma estrutura da skill genérica, com uma coluna a mais: **custo de
mudar** — a fase de validação (`docs/estrategia.md`) prioriza teste
barato e reversível antes de mudança grande.

### Ganhos rápidos (implementar já)
Mudanças fáceis com impacto provável imediato — texto, ordem de seção,
contraste visual. Não exige aprovação de negócio.

### Mudanças de alto impacto (priorizar)
Mudanças maiores — reestruturar hero, trocar ângulo de headline pra
bater com a tagline oficial. Podem exigir validação com o fundador antes
(ex.: mudar a mensagem central da marca).

### Ideias de teste
Hipótese a validar, não afirmação — alinhado à disciplina de
`docs/estrategia.md` ("o mercado decide, não o achismo"). Priorizar teste
que já se conecta a um evento do Pixel existente (`InitiateCheckout` é a
métrica mais barata e rápida de ler, `Purchase` demora mais pra ter
volume).

### Alternativas de copy
Para headline/CTA, 2-3 opções com justificativa — encaminhar pra
`selo-copywriting` pra escrita final.

---

## Frameworks por tipo de página

O Selo tem menos superfície que um site típico — não recomendar mudança
numa página que não existe.

### A landing (`public/landing.html`) — é homepage + pricing + tudo junto
- Message match com o ângulo do anúncio Meta que trouxe o visitante
- CTA único de fato (assinar via `#planos`), com o demo como via
  alternativa pra quem não está pronto — não é "CTA secundário" fraco,
  é uma segunda via de conversão legítima
- Argumento completo numa página só — não há "próxima página" pra
  completar a venda antes do Hotmart

### Seção de planos (`#planos`, dentro da mesma landing)
- Só 2 planos reais: Mensal (`hgn79gvq`) e Anual (`mcjyy7ub`) — comparação
  simples, ajudar a pessoa a ver o anual como o óbvio
- Endereçar ansiedade de "e se eu não gostar" com a garantia de 7 dias já
  existente, não inventar mecanismo novo

### `/captura/{slug}` — funil do corretor, não do Selo
- Esse é CRO do **formulário que o cliente do corretor preenche**, não
  do funil de assinatura do Selo — se o pedido for sobre isso, tratar
  como otimização de produto (mudança vale pra todo corretor que usa),
  não como teste pontual de marketing

### Página de feature, blog, "Sobre" separados
- Não existem hoje — se pedirem CRO pra uma dessas, confirmar que a
  página existe antes de analisar (pode ser confusão com uma seção
  dentro da landing única)

---

## Ideias de experimento

Ao recomendar experimento, isso É literalmente o passo 3 da árvore de
decisão já definida em `docs/estrategia.md` — "oferta/preço/landing"
entra depois de já ter testado criativo e público. Não pular a ordem:
só investir em teste de landing quando o problema não for
criativo/público (ver o próprio doc antes de propor teste aqui).

Quando for a vez, considerar teste para:
- Hero (headline batendo com tagline oficial vs. headline atual)
- Posição/destaque da seção de proteção jurídica (Registro de Visita)
- Apresentação do plano Anual vs Mensal (âncora de preço)
- Posição/visibilidade do CTA de demo (`?demo=1`) vs CTA de assinar

---

## Perguntas específicas da tarefa

1. É o funil do Selo (landing → assinatura) ou o funil do corretor
   (`/captura/{slug}` → lead)? Confirmar antes de seguir.
2. Já tem leitura de `InitiateCheckout`/`Purchase` do Pixel pra esse
   período, ou a análise é só qualitativa por enquanto?
3. De que ângulo de anúncio Meta vem o tráfego que motivou o pedido (ver
   `marketing/plano-trafego.md`)?
4. Isso é ganho rápido de copy/hierarquia, ou mudança que reabre decisão
   de posicionamento (precisa validar com o fundador)?
5. Já se testou algo antes (criativo, público) segundo a árvore de
   decisão de `docs/estrategia.md`, ou landing é o primeiro ponto a mexer?

---

## Skills relacionadas

- **cro** (genérica): catálogo de referência cruzada — usar só pra
  framework alternativo de análise, sempre filtrando pelos dois limites
  acima (uma página só, checkout fora do controle do Selo)
- **selo-copywriting**: para escrever as alternativas de headline/CTA
  identificadas na análise
- **selo-marketing-ideas**: para decidir se vale testar mudança na
  landing agora ou se a prioridade real é criativo/público (passo
  anterior na árvore de decisão)
- Agente `seo`: se a mudança recomendada também afeta SEO/schema da
  landing, coordenar os dois antes de abrir PR

---

## Otimização de formulário

O único formulário do produto hoje é `/captura/{slug}` (funil do
corretor, não do Selo — ver seção "Os dois funis" no topo). Se o pedido
for otimizar ESSE formulário: menos campo é melhor (o cliente do corretor
tem paciência ainda menor que o próprio corretor), e qualquer mudança
vale pra **todos** os corretores de uma vez — não é teste isolado de uma
campanha, é mudança de produto. Encaminhar pro agente `produto` para
implementação.
