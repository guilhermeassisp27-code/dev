# Plano estratégico — Atendimento de leads por WhatsApp (feature de produto)

Data: 2026-07-10
Status: proposta para decisão do fundador. Nada aqui foi implementado.

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

- **F0 — Piloto interno (1–2 semanas de trabalho).** Registrar app na Meta, virar Tech
  Provider, conectar UM número (do fundador ou de um corretor parceiro), bot de
  qualificação funcionando ponta a ponta, conversas gravadas no Supabase. Sem UI nova —
  leitura via Supabase mesmo. Objetivo: validar coexistência, latência e qualidade do
  diálogo com leads reais.
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
