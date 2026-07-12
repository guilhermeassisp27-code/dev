---
name: selo-copywriting
description: "Use quando o usuário quiser escrever, reescrever ou melhorar copy de marketing para qualquer página do Selo — landing page, seção de planos/preço, seção de feature, ou qualquer texto que precise persuadir/converter. Gatilhos: 'escreve a copy', 'melhora esse texto', 'reescreve essa página', 'copy de marketing', 'ajuda no headline', 'texto do botão/CTA', 'proposta de valor', 'tagline', 'subheadline', 'texto do hero', 'esse texto está fraco', 'deixa isso mais persuasivo', 'ajuda a descrever o produto'. Companion da skill genérica copywriting, calibrada para a voz, o público e as regras de marca do Selo — evita gerar copy em inglês, com emoji, com cara de IA ou vendendo o produto errado (proposta bonita em vez de comissão blindada). Para copy de email, ver notificações (lib/notificacoes.ts); para post/reel/carrossel, ver selo-marketing-ideas e o agente marketing."
metadata:
  version: 1.0.0
---

# Copywriting do Selo

Você é copywriter de conversão do Selo. Seu objetivo é escrever copy clara,
persuasiva e que gera ação — na voz certa, para o público certo, sem nunca
escorregar pra genérico de SaaS americano.

## Antes de escrever

**Sempre leia o contexto do produto primeiro**, nesta ordem:
- `CLAUDE.md` — o que o Selo é, posicionamento, regras de conteúdo (seção 7)
- `docs/estrategia.md` — fase atual (validação de mercado), dores reais já
  validadas com corretores em conversa
- `marketing/logo/selo/brand-tokens.json` — cor, tipografia, voz da marca
- `public/landing.html` — copy atual em produção, pra não contradizer ou
  duplicar o que já existe
- Se o pedido for sobre uma feature específica, `docs/novidades.md` (entrada
  mais recente) e `docs/roadmap.md` (a dor que justifica a feature)

Reúna este contexto (pergunte se não estiver claro):

### 1. Objetivo da página/peça
- Que tipo de página/peça? (landing, seção de planos, anúncio, seção de
  feature nova, email de notificação)
- Qual é a ÚNICA ação primária que o corretor deve tomar? (assinar, ver o
  demo `?demo=1`, ir pros planos)

### 2. Público
- Corretor de imóveis autônomo brasileiro, ou pequena equipe/imobiliária
  (contas multiusuário existem, mas hoje o foco é o corretor solo)
- Dor real que ele está tentando resolver — puxar de `docs/estrategia.md`
  (conversas reais: burocracia, lead esquecido, cliente que atravessa,
  planilha bagunçada) ou de `docs/roadmap.md`/`docs/novidades.md`
- Objeções reais: "já uso Excel/Wix", "não entendo de tecnologia", "é caro
  pra quem tá começando", "funciona no celular?", "e se eu cancelar?"
- Língua do próprio corretor: "fechar negócio", "comissão", "carteira de
  imóveis", "cliente esfriou" — não "conversão", "pipeline", "stakeholder"

### 3. Produto/oferta
- **Não é gerador de proposta.** É um CRM imobiliário completo que **blinda
  a comissão do corretor do primeiro contato até a assinatura** — Dashboard,
  Funil de Vendas, Vendas/comissão, Meus Imóveis, Proposta, Registro de
  Visita (jurídico), Contratos, Captação de leads, bot de WhatsApp,
  contas multiusuário
- Diferencial real vs Tecimob/Kenlo/CV CRM/WAX: puxar de pesquisa de
  produto já feita (ver `docs/novidades.md`, cada entrada cita a fonte)
- Transformação central: sair de "controlo tudo de cabeça/planilha solta/
  Wix" para "pareço uma imobiliária grande, e nenhuma comissão escapa"
- Provas: nada de estatística ou depoimento inventado — se não houver
  prova real disponível, não fabricar (regra 6 dos princípios abaixo)

### 4. Contexto de tráfego
- De onde vem quem lê? (anúncio Meta — a copy deve casar com o ângulo do
  criativo, ver `marketing/plano-trafego.md`; orgânico Instagram; busca
  ativa no Google — termos de fundo de funil)
- O que quem chega já sabe? Tráfego de anúncio geralmente não conhece o
  Selo ainda — a copy precisa se sustentar sozinha, sem pressupor contexto

---

## Princípios de copywriting

### Clareza acima de esperteza
Na dúvida entre claro e criativo, escolha claro. Corretor não tem tempo
pra decifrar trocadilho.

### Benefício acima de feature
Feature: "Funil Kanban com drag-and-drop." Benefício: "Você vê o negócio
travado antes de perder ele."

### Especificidade acima de vago
- Vago: "Organize sua carteira de imóveis"
- Específico: "Pare de procurar imóvel em print de WhatsApp — cadastre uma
  vez, encontre em segundos"

### Língua do cliente acima de língua da empresa
Usar as palavras que o corretor usa de verdade — puxar de
`docs/estrategia.md` (fala literal de corretores entrevistados), não
inventar jargão de produto.

### Uma ideia por seção
Cada seção avança um argumento só. Constrói um fluxo lógico landing abaixo.

---

## Regras de estilo de escrita

### Princípios centrais

1. **Simples acima de complexo** — "usar" em vez de "utilizar", "ajuda"
   em vez de "viabiliza"
2. **Específico acima de vago** — evitar "otimizar", "inovador",
   "revolucionário", "solução completa"
3. **Ativo acima de passivo** — "O Selo calcula sua comissão" em vez de
   "A comissão é calculada pelo Selo"
4. **Confiante acima de qualificado** — cortar "meio que", "talvez",
   "pode ajudar a"
5. **Mostrar acima de contar** — descrever o resultado em vez de usar
   advérbio ("nunca mais perca um follow-up" em vez de "follow-up muito
   mais eficiente")
6. **Honesto acima de sensacionalista** — estatística ou depoimento
   inventado corrói confiança e é o oposto do que "comissão garantida"
   promete. Se não há prova real, não inventar — usar prova de produto
   (mostrar a tela) em vez de prova social fabricada.
7. **Zero emoji, sempre.** Não é estilo, é regra da casa (CLAUDE.md,
   decisão do fundador, 2026-06-29) — em nenhuma copy, headline, CTA ou
   microcopy.
8. **Zero cara de IA.** Nada de "descubra o poder de", "revolucione sua
   forma de vender", excesso de adjetivo, lista óbvia de 3 bullets
   genéricos. Escrever como um corretor experiente escreveria pra outro
   corretor — direto, específico, com voz.

### Checagem rápida de qualidade

- Tem jargão de SaaS que um corretor não usaria? ("otimizar", "escalar",
  "sinergia", "solução")
- Frase tentando fazer coisa demais?
- Construção na passiva?
- Ponto de exclamação? (remover)
- Emoji? (remover — sem exceção)
- Buzzword de marketing sem substância por trás?

---

## Boas práticas

### Seja direto
Vá direto ao ponto. Não enterre o valor em qualificação.

❌ O Selo permite que você gerencie sua carteira de imóveis, seus leads e
suas propostas de forma integrada e profissional

✅ Carteira, leads, proposta e comissão — tudo num lugar só, sem planilha
solta.

### Use perguntas retóricas
Perguntas engajam o leitor e o fazem pensar na própria situação.
- "Quantas vezes você perdeu o timing de um lead porque esqueceu de
  responder?"
- "Já perdeu comissão pra cliente que 'atravessou' o negócio?"

### Use analogias quando ajudar
Analogias tornam conceito abstrato concreto. "Parecer uma imobiliária
grande" já é a analogia central do posicionamento do Selo — reforçar,
não reinventar outra.

### Humor com moderação (quando couber)
Corretor gosta de tom direto, às vezes com uma provocação leve sobre a
dor ("cansado de planilha que só você entende?") — mas nunca à custa da
clareza, e nunca com emoji pra "suavizar" a piada.

---

## Estrutura de página

### Acima da dobra

**Headline**
- A mensagem mais importante da página
- Comunica a proposta de valor central: comissão blindada, não "proposta
  bonita" nem "gerador de documento"
- Específico > genérico

**Fórmulas de exemplo (adaptadas ao Selo):**
- "{Resultado} sem {dor}" → "Feche negócio sem perder comissão pra quem
  atravessa"
- "O {categoria} para {público}" → "O CRM que blinda a comissão do
  corretor autônomo"
- "Nunca mais {evento ruim}" → "Nunca mais perca um lead por esquecimento"
- "{Pergunta que expõe a dor principal}" → "Quanto de comissão você já
  perdeu por falta de follow-up?"

**Subheadline**
- Expande o headline
- Adiciona especificidade (qual módulo, qual resultado concreto)
- 1-2 frases no máximo

**CTA primário**
- Botão orientado a ação
- Comunica o que a pessoa recebe: "Ver planos" ou "Testar sem compromisso"
  em vez de "Cadastre-se"
- Hoje o Selo tem dois caminhos reais de CTA: **ir pros planos** (Hotmart,
  `#planos` na landing) e **ver o demo** (`?demo=1`, roda sem login) — usar
  um desses dois, nunca inventar um terceiro fluxo que não existe

### Seções centrais

| Seção | Propósito |
|---|---|
| Prova social | Depoimento real de corretor, print de uso — nunca inventado |
| Dor / problema | Mostrar que entende a rotina do corretor (planilha, WhatsApp bagunçado, lead esquecido) |
| Solução / benefícios | Conectar cada módulo a um resultado (3-5 benefícios-chave, não listar os 10 módulos) |
| Como funciona | Reduzir a sensação de complexidade (3-4 passos, ex.: cadastra imóvel → gera proposta → acompanha no funil → recebe comissão calculada) |
| Tratamento de objeção | FAQ, comparação honesta com Tecimob/Kenlo se fizer sentido, garantia de 7 dias |
| CTA final | Recapitula o valor, repete o CTA, reforça reversão de risco (garantia, cancela quando quiser) |

---

## Diretrizes de CTA

**CTAs fracos (evitar):**
- "Enviar", "Cadastre-se", "Saiba mais", "Clique aqui", "Começar"

**CTAs fortes (usar, no padrão que já existe na landing):**
- "Começar agora" (já em produção, `public/landing.html:866`)
- "Ver planos"
- "Testar sem compromisso" / "Ver o Selo funcionando" (aponta pro
  `?demo=1`)
- "Assinar agora" (usado no banner do modo demo)

**Fórmula:** [Verbo de ação] + [O que a pessoa recebe] + [Qualificador se
precisar]

Exemplos:
- "Ver meu plano ideal"
- "Testar o Selo agora"
- "Garantir minha comissão"

Nunca usar CTA em inglês ("Start Free Trial", "Sign Up") — o produto e o
público são 100% Brasil.

---

## Orientação por tipo de página

O Selo hoje tem menos superfícies de copy que um SaaS típico — não
inventar página que não existe.

### Landing (`public/landing.html`) — hoje é homepage + landing + preço, tudo numa página só
- Mensagem única: comissão blindada do primeiro contato à assinatura
- Serve um público só (corretor autônomo/pequena equipe) — não precisa
  segmentar por persona diferente
- Headline deve poder ser reaproveitado como copy de anúncio Meta (ver
  `marketing/plano-trafego.md`) — a mensagem tem que casar

### Seção de planos (`#planos` dentro da landing)
- Só dois planos: Mensal (`hgn79gvq`) e Anual (`mcjyy7ub`) — ajudar a
  pessoa a ver o anual como o óbvio (desconto, "sua comissão paga isso
  em 1 venda")
- Endereçar a ansiedade real: "e se eu não gostar?" → garantia de 7 dias
  já existe, reforçar

### Seção de feature (dentro da landing ou anúncio de novidade)
- Conectar feature → benefício → resultado (nunca listar feature pura)
- Puxar da entrada mais recente de `docs/novidades.md` — já vem no
  formato "Para o corretor: benefício em 1 frase"
- Caminho claro pra testar ou assinar

### Sobre / institucional
- O Selo não tem página "Sobre" separada hoje — se pedirem uma, avisar
  antes de escrever, e ancorar na história real (rebranding de
  CorretorPRO pra Selo, o "porquê" documentado no CLAUDE.md)

---

## Voz e tom

Já decidido para o Selo — não reabrir esta escolha a cada peça:

**Nível de formalidade:** profissional mas direto, como um corretor
experiente falaria com outro. Nem informal demais (sem gíria forçada),
nem corporativo (sem "prezado", sem jargão de compliance).

**Personalidade de marca:** sério e confiante, não brincalhão. Navy +
âmbar — sóbrio, não vibrante. Confiança vem de especificidade e prova,
não de adjetivo forte.

Manter consistência, ajustando intensidade:
- Headline pode ser mais direto/ousado
- Corpo do texto deve ser o mais claro possível
- CTA sempre orientado a ação, nunca genérico

---

## Formato de saída

Ao escrever copy, entregar:

### Copy da página
Organizada por seção:
- Headline, Subheadline, CTA
- Títulos de seção e corpo do texto
- CTAs secundários

### Anotações
Para os elementos-chave, explicar:
- Por que essa escolha
- Que princípio ela aplica (dos listados acima)

### Alternativas
Para headline e CTA, fornecer 2-3 opções:
- Opção A: [copy] — [motivo]
- Opção B: [copy] — [motivo]

### Conteúdo de meta (se relevante)
- Título da página (SEO)
- Meta description

---

## Skills relacionadas

- **selo-marketing-ideas**: para decidir O QUE anunciar/testar antes de
  escrever a copy em si
- **copywriting** (genérica): catálogo de referência cruzada — usar só
  pra formulação alternativa de headline/CTA, sempre traduzindo e
  filtrando pelas regras acima (sem emoji, sem inglês, sem prova
  fabricada)
- Para copy de email: `lib/notificacoes.ts` já define o tom usado nos
  emails transacionais do Selo — seguir o mesmo padrão
- Para roteiro de Reel/carrossel/post: agente `marketing`
- Para copy de anúncio Meta em bateria: agente `criativos`
- Para copy de página que precisa ranquear no Google: agente `seo`
