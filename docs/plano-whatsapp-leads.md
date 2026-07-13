# Plano estratégico — Atendimento de leads por WhatsApp (feature de produto)

Data: 2026-07-10 (plano) · 2026-07-11 (F0 executado)
Status: **F0 concluído e validado em produção** com um número real. Ver seção 0.

## 0. Status do F0 (piloto) — concluído em 2026-07-11

O piloto foi ao ar e validado ponta a ponta com um lead real: mensagem recebida →
bot qualifica sozinho (intenção, tipo de imóvel, região, faixa) → conversa gravada →
lead cai no inbox do Selo já com os dados → handoff para o corretor.

**O que ficou pronto (em produção, `main`):**

- `app/api/whatsapp-webhook/route.ts` — webhook da Meta Cloud API: verificação HMAC,
  idempotência por `wa_message_id`, pausa de 24h quando o corretor responde manualmente
  (eco `smb_message_echoes`), e registro do lead no inbox.
- `lib/leadbot.ts` — motor de conversa (Claude Haiku). Só qualifica; nunca fala preço,
  condição de imóvel ou comissão. Se apresenta como assistente virtual do corretor,
  sem citar o Selo.
- `lib/whatsapp.ts` — envio pela Graph API.
- `supabase-whatsapp-setup.sql` — tabelas `cpr_wa_*`, RLS por corretor, expurgo LGPD
  (180 dias), **GRANT para `service_role`** (sem isso o webhook toma "permission denied").
- Integração com o inbox existente: o lead do WhatsApp entra em `cpr_public_leads`
  (origem `whatsapp`), aparecendo na tela "Leads recebidos" junto com a captação pública;
  "Aceitar" já joga na Agenda de Visitas.

**Armadilhas reais da Meta que atravessamos (para o F1 não repetir):**

1. **Token temporário expira rápido.** O token da "Etapa 1" do painel morre em poucas
   horas (erros 190 / 131005 "Access denied"). Solução: gerar token de **System User**
   (Business Settings → Usuários do sistema → Admin → permissões `whatsapp_business_messaging`
   + `whatsapp_business_management`). Esse não expira.
2. **App precisa estar inscrito no número.** Verificar a URL do webhook não basta — o número
   fica inscrito no app interno "WA DevX Webhook Events 1P App" por padrão. Foi preciso
   `POST /{waba_id}/subscribed_apps` (via Graph API Explorer, app selecionado) para o nosso
   app receber os eventos de mensagem real. No fluxo de registro novo, o toggle
   "Assinar webhooks" já faz isso.
3. **Número de teste sandbox não entrega de verdade.** Ele aceita o envio (200/sucesso) mas
   a mensagem nunca chega no aparelho — nem o template da própria Meta. Só um número real
   entrega. Além disso, o sandbox só envia para números numa "lista de permitidos".
4. **Nono dígito do Brasil.** O webhook manda o `from` **sem** o 9 depois do DDD
   (`553598138726`), mas a lista de permitidos do sandbox guarda com o 9. No sandbox foi
   preciso cadastrar as duas formas. (Em produção não há lista de permitidos, então some.)
5. **Coexistência exige histórico.** Conectar um número que já tem WhatsApp em modo
   coexistência (sem perder o app) só é liberado pela Meta para números com uso/atividade
   real. Um chip novinho é rejeitado. Para um número dedicado só do bot (o caso do piloto),
   o caminho é registrar **direto na Cloud API** (excluir a conta do WhatsApp Business do
   número antes, se houver) — não precisa de coexistência.
6. **Nunca usar o WhatsApp pessoal.** A Meta só oferece "migrar/desconectar", o que tira o
   número do celular. Bot vive em número dedicado (chip reserva / eSIM pré-pago).
7. **GRANT do Supabase.** Toda tabela nova que o webhook (service role) escreve precisa de
   `grant ... to service_role`, senão retorna "permission denied for table" — mesmo caso
   histórico do `cpr_user_data`.

**Variáveis de ambiente (Vercel):** `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`,
`WHATSAPP_ACCESS_TOKEN` (token de System User), `ANTHROPIC_API_KEY`.

**F1 — Embedded Signup (código pronto ponta a ponta, aguardando a Meta):** o endpoint
`POST /api/whatsapp-connect` recebe do tool.html o `code` do popup do FB SDK mais
`phoneNumberId`/`wabaId`, valida JWT + assinatura server-side, troca o code pelo business
token do corretor, confere que o token enxerga o número, inscreve o app no WABA
(`subscribed_apps`), registra o número (best-effort — coexistência já vem registrada) e
grava tudo em `cpr_wa_numbers`. O `GET /api/whatsapp-connect` devolve a config pública
(`appId` + `configId` do Embedded Signup v4) que o tool.html usa pra montar o popup do
FB SDK — nunca o app secret. Front no tool.html: `conectarWhatsapp()` carrega o FB SDK,
chama `FB.login` com o `config_id`, captura o `code` (callback) + `phone_number_id`/`waba_id`
(postMessage do popup) e posta tudo no backend; `renderConectarWhatsapp()` mostra o estado
"conectado" lendo `cpr_wa_numbers` (RLS deixa o corretor ler só display_number/bot_enabled,
nunca o token). CSP do tool.html liberada pro FB SDK (`connect.facebook.net` + iframes
`www.facebook.com`/`staticxx.facebook.com`).

Kill-switch (fonte única): o front não tem app id hardcoded — ele pede a config ao GET, que
só responde quando `WHATSAPP_APP_ID` **e** `WHATSAPP_ES_CONFIG_ID` estão no Vercel. Sem as
duas, o GET dá 503 e o botão informa "em liberação". Ligar o F1 = setar essas duas envs no
Vercel (pós Verificação de Empresa + App Review) — sem redeploy do tool.html, que sai por
gh-pages separado. Falta na Meta: App Review / Advanced Access de `whatsapp_business_messaging`
+ `whatsapp_business_management` e gerar o configuration ID do Embedded Signup v4. A
Verificação de Empresa (pré-requisito) foi aprovada em 2026-07-11.

**Pendências conhecidas do F0 (não bloqueiam, ficam para o F1):**

- Nome do lead depende do que o WhatsApp expõe; sem isso, cai em "Lead do WhatsApp".
- Pergunta de "prazo" às vezes é pulada quando região + faixa já bastam para o handoff.
- ~~Notificação ao corretor no handoff ainda não existe.~~ Feito (2026-07-12): email
  transacional via API da Brevo no momento do handoff (`lib/notificacoes.ts`), com link
  wa.me direto pro lead. Requer `BREVO_API_KEY` + `BREVO_FROM_EMAIL` (remetente verificado
  na Brevo) no Vercel; sem as envs o envio vira no-op logado. Horário de silêncio
  configurável segue pendente (F1).
- Multi-tenant: hoje um único `WHATSAPP_ACCESS_TOKEN` para um número. Vários corretores
  exigem Embedded Signup (token por corretor) — é o coração do F1.

## 1. Por que isso muda o jogo

O posicionamento do Selo é "blinda a comissão do corretor do primeiro contato até a
assinatura". Hoje a plataforma cobre da proposta em diante. O primeiro contato — que é
onde a comissão mais se perde — acontece fora dela, no WhatsApp do corretor, sem registro,
sem qualificação e sem rastro.

Um bot que atende os leads do corretor no WhatsApp dele fecha esse buraco:

- **O primeiro contato passa a acontecer dentro do Selo.** Todo lead que chama no WhatsApp
  fica registrado com data, hora e conteúdo — evidência de captação que protege a comissão
  em disputa com outro corretor ou com a imobiliária.
- **Resposta em segundos, 24/7.** Lead de portal que não é respondido em 5 minutos esfria.
  O bot responde na hora, qualifica (comprar ou alugar, faixa de preço, região, prazo) e
  agenda o corretor humano para o que importa.
- **Da conversa à proposta sem recomeçar.** Os dados que o bot coletou viram o rascunho da
  proposta na ferramenta. O corretor abre o Selo e o trabalho já está meio feito.
- **Retenção e ticket.** Vira o motivo pelo qual o corretor não cancela: cancelar o Selo
  passa a significar perder o atendente que responde os leads dele de madrugada.

## 2. O que o bot faz (escopo por fase)

### Fase 1 — MVP (atendimento reativo)
- Corretor conecta o número de WhatsApp dele ao Selo.
- Lead chama; o bot se apresenta como assistente do corretor (nome e criativo do corretor,
  nunca "sou uma IA da plataforma X").
- Qualificação guiada por IA: intenção (compra/locação), tipo de imóvel, região, faixa de
  preço, forma de pagamento, prazo.
- Registro completo da conversa no Selo (nova aba "Leads" na ferramenta).
- Handoff: quando o lead está qualificado ou pede humano, o bot avisa o corretor
  (notificação + resumo da conversa) e para de responder naquela conversa.
- Horário de silêncio configurável (o bot só assume fora do horário, ou sempre — escolha
  do corretor).

### Fase 2 — Integração com propostas
- "Gerar proposta a partir deste lead": pré-preenche a proposta com os dados coletados.
- Envio da proposta pelo próprio WhatsApp (link rastreável — o Selo sabe quando o lead abriu).
- Follow-up automático com template de utilidade ("sua proposta está disponível") quando a
  janela de 24h fechou.

### Fase 3 — Proatividade
- Lembretes de visita agendada, follow-up de propostas paradas, reaquecimento de leads
  frios (mensagens template pagas, com opt-in do lead — ver LGPD).

O que o bot **não** faz em nenhuma fase: negociar valores, prometer condições, falar de
comissão. Regra dura no prompt e validada em teste.

## 3. Arquitetura recomendada

```
Lead (WhatsApp)
  └─ número do corretor (WhatsApp Business Cloud API, Meta)
       └─ webhook POST /api/whatsapp-webhook (Vercel, Next.js)
            ├─ identifica o tenant (corretor) pelo phone_number_id
            ├─ grava mensagem em Supabase (tabela nova, RLS por corretor)
            ├─ chama Claude (Haiku) com o contexto da conversa + perfil do corretor
            └─ responde via Graph API (mensagem de serviço, janela 24h = custo zero Meta)

tool.html
  └─ nova aba "Leads": conversas, status de qualificação, botão "gerar proposta"
```

Decisões:

- **Meta Cloud API direto, como Tech Provider (Embedded Signup v4).** Sem intermediário
  (Twilio/360dialog) cobrando margem por mensagem. O corretor conecta o próprio número em
  um fluxo de login da Meta dentro do Selo. Importante: usar **Embedded Signup v4** desde o
  início — a v2 será desativada em 15/10/2026.
- **Modo coexistência.** Desde 2025 a Meta permite conectar um número que já usa o app
  WhatsApp Business à Cloud API **sem o corretor perder o app no celular**. Isso é decisivo
  para o nosso público: o corretor continua conversando normalmente pelo app, e o bot
  coexiste no mesmo número. Sem isso, a adoção morre (ninguém abandona o número).
- **IA: Claude Haiku** para o diálogo (custo por conversa na casa de centavos), com
  escalonamento para modelo maior só se a qualificação exigir. Prompt com persona do
  corretor, catálogo de regras (o que não pode prometer) e instrução de handoff.
- **Supabase** para conversas e leads, RLS por corretor — mesma disciplina da `cpr_user_data`.
  Definir retenção/expurgo LGPD igual ao já feito para fotos (pg_cron).
- **Fila:** webhook da Meta exige resposta rápida; processar a IA de forma assíncrona
  (responder 200 imediato, processar em background — em Vercel, via `waitUntil` ou uma fila
  simples em Supabase). Mesmo princípio do webhook Hotmart: nunca segurar o 200.

## 4. Provedores — comparação

| Opção | Custo | Prós | Contras |
|---|---|---|---|
| **Meta Cloud API direto (Tech Provider)** | Só as tarifas da Meta; mensagens de serviço (lead inicia, janela 24h) são **gratuitas** | Sem margem de terceiro; Embedded Signup nativo; coexistência | Precisamos virar Tech Provider verificado; corretor precisa cadastrar meio de pagamento na conta WhatsApp Business dele (fricção); limite inicial de ~10 onboardings por janela de 7 dias |
| 360dialog / Gupshup / Twilio | Meta + margem de 10–30% + mensalidade por número | Onboarding mais mastigado, suporte | Custo recorrente por corretor conectado corrói a margem do plano |
| Z-API / Evolution API (não oficiais) | Barato | Zero burocracia | **Risco de banimento do número do corretor.** Banir o WhatsApp de um corretor é destruir o negócio dele — e a nossa reputação. Descartado. |

**Recomendação: Meta Cloud API direto.** O modelo de tarifas de 2026 joga a nosso favor:
o caso de uso central (lead inicia a conversa, bot responde dentro de 24h) é mensagem de
serviço, **custo zero da Meta**. Só pagamos template quando *nós* iniciamos (follow-up,
lembrete): utilidade ~R$0,04–0,05, marketing ~R$0,31–0,38 por mensagem no Brasil.

## 5. Custos estimados (por corretor ativo/mês)

Premissas: 100 leads/mês, ~12 mensagens de IA por conversa, 20 follow-ups template de
utilidade.

- Meta (serviço): R$ 0
- Meta (20 templates utilidade): ~R$ 1
- Claude Haiku (~1.200 chamadas curtas): ~R$ 3–6
- Infra (Vercel/Supabase, rateado): marginal

**Custo direto: < R$ 10/corretor/mês.** Isso comporta um plano superior ("Selo com
atendimento", nome a definir) a R$ 40–60 acima do plano atual, com margem folgada — ou
como diferencial incluso para o plano anual, empurrando upgrade.

## 6. Riscos e mitigação

1. **LGPD.** Conversas de leads são dados pessoais de terceiros (não do assinante). O bot
   precisa se identificar como assistente virtual na primeira mensagem, a política de
   privacidade precisa cobrir o tratamento, e o expurgo automático (pg_cron, como já feito
   para fotos) precisa existir desde o dia 1. Mensagem proativa (Fase 3) só com opt-in.
2. **Bot falando besteira.** Alucinação sobre preço/condição de imóvel é risco jurídico
   para o corretor. Mitigação: o bot só qualifica e agenda, nunca informa dados de imóvel
   que o corretor não cadastrou; suite de testes adversariais antes do beta.
3. **Fricção do onboarding Meta.** Corretor precisa de conta Meta Business e meio de
   pagamento cadastrado. Mitigação: fluxo guiado passo a passo dentro do Selo + o modo
   coexistência (não perde o app). Validar no piloto quanto disso trava adoção real.
4. **Limite de 10 onboardings/7 dias** como Tech Provider novo. Na prática vira fila de
   espera no beta — até é útil para marketing ("lista de espera"), e o limite sobe com
   histórico de qualidade.
5. **Vercel serverless vs. conversas.** Latência e background processing exigem cuidado;
   se apertar, um worker dedicado (Railway/Fly) só para o motor de conversa, mantendo o
   resto na Vercel.
6. **Suporte.** Bot no ar 24/7 gera expectativa de suporte 24/7. Definir SLA claro no
   plano superior.

## 7. Fases de execução

- **F0 — Piloto interno. ✅ CONCLUÍDO (2026-07-11).** App registrado na Meta, número real
  dedicado conectado direto na Cloud API, bot de qualificação funcionando ponta a ponta,
  conversas gravadas no Supabase e lead entrando no inbox do Selo. Detalhes e armadilhas
  na seção 0. (Nota: a coexistência do plano original foi descartada no piloto — para
  número dedicado, registro direto na Cloud API é mais simples; coexistência volta a
  importar no F1, quando o corretor conecta o próprio número em uso.)
- **F1 — Beta fechado (10 corretores).** Embedded Signup v4 no Selo, aba "Leads" na
  ferramenta, handoff com notificação, horário de silêncio. Cobrança ainda não — em troca,
  feedback semanal. Objetivo: medir leads atendidos, taxa de handoff, reclamações.
- **F2 — Lançamento pago.** Novo plano na Hotmart, gating por `app_metadata` (mesmo
  mecanismo atual de `subscription_status`), fila de espera pública, material de marketing
  (respeitando as regras: sem emoji, sem cara de IA, avatar ≤ 10 s).
- **F3 — Propostas integradas e follow-ups** (Fases 2 e 3 do escopo).

Critério de avanço F0→F1: 3 conversas reais de lead qualificadas corretamente sem
intervenção. Critério F1→F2: ≥7 dos 10 corretores usando semanalmente e dizendo que
pagariam.

## 8. Decisões que precisam do fundador antes da F0

1. Nome e preço do plano superior (ou incluso no anual?).
2. O bot se apresenta com que identidade? ("Assistente do [nome do corretor]" é a
   recomendação — a marca Selo fica invisível para o lead.)
3. Conta Meta Business do Selo: quem é o titular/verificação de empresa (precisa de CNPJ).
4. Piloto F0: número de quem? (Sugestão: um corretor parceiro de confiança, com leads
   reais, melhor que teste sintético.)
