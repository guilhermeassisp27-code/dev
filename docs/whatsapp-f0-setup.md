# WhatsApp F0 — Guia de configuração do piloto

O código do bot está pronto (webhook + motor de conversa + tabelas). O que falta
é a parte manual na Meta e as variáveis de ambiente. Siga na ordem.

## 1. Rodar o SQL no Supabase

SQL Editor → colar e executar `supabase-whatsapp-setup.sql`. Cria as tabelas
`cpr_wa_numbers`, `cpr_wa_conversations`, `cpr_wa_messages`, RLS e o expurgo
LGPD (180 dias) via pg_cron.

## 2. Criar o app na Meta

1. Acesse developers.facebook.com → My Apps → Create App → tipo **Business**.
2. Vincule ao seu Meta Business (o que você já verificou com a conta pessoal).
3. Adicione o produto **WhatsApp** ao app.
4. Em App Settings → Basic, copie o **App Secret** (vai virar env var).

## 3. Conectar o seu número (modo coexistência)

1. No produto WhatsApp do app → API Setup → Add phone number.
2. Escolha conectar um número que já usa o app WhatsApp Business — o fluxo de
   coexistência pede um QR code lido pelo seu celular. Você continua usando o
   app normalmente.
3. Anote o **Phone number ID** exibido (não é o número de telefone).
4. Gere um **access token permanente**: Business Settings → System Users →
   criar system user → gerar token com permissões `whatsapp_business_messaging`
   e `whatsapp_business_management`. (O token temporário do painel expira em
   24h — serve só para o primeiro teste.)

## 4. Configurar o webhook no app da Meta

1. WhatsApp → Configuration → Webhook:
   - Callback URL: `https://selosales.com.br/api/whatsapp-webhook`
   - Verify token: invente uma string aleatória longa (vai virar env var).
2. Assine os campos (Webhook fields): **messages** e **smb_message_echoes**.
   O segundo é o que avisa o bot quando VOCÊ responde pelo celular — sem ele o
   bot não pausa e atropela suas conversas.

Importante: cadastre as env vars no Vercel (passo 5) e faça o deploy ANTES de
clicar em "Verify and save" — a Meta chama o GET do webhook na hora.

## 5. Variáveis de ambiente (Vercel)

```
WHATSAPP_VERIFY_TOKEN=...   # a string que você inventou no passo 4
WHATSAPP_APP_SECRET=...     # App Settings → Basic
WHATSAPP_ACCESS_TOKEN=...   # token do system user
ANTHROPIC_API_KEY=...       # console.anthropic.com → API Keys
LEADBOT_MODEL=              # opcional; padrão claude-haiku-4-5
```

Nenhuma delas vai no código nem no `.env.local` commitado — mesmas regras dos
segredos do Hotmart.

## 6. Cadastrar o número no Supabase

O bot só responde números mapeados para um corretor. Rode no SQL Editor
(substitua pelos seus valores):

```sql
insert into public.cpr_wa_numbers (phone_number_id, user_id, display_number)
values (
  'PHONE_NUMBER_ID_DO_PASSO_3',
  (select id from auth.users where email = 'guilherme.assisp27@gmail.com'),
  '+55...'
);
```

Para desligar o bot sem desconectar nada: `update cpr_wa_numbers set bot_enabled = false;`

## 7. Testar

1. De OUTRO número (peça a alguém), mande "Oi, vi um apartamento anunciado"
   para o seu número.
2. O bot deve responder em segundos se apresentando como assistente virtual e
   começando a qualificação (comprar/alugar, região, faixa, prazo).
3. Responda você mesmo pelo app em outra conversa de teste — o bot deve ficar
   em silêncio nessa conversa por 24h (status `paused` na tabela).
4. Conferir os dados: Supabase → Table Editor → `cpr_wa_conversations` (o
   `lead_data` acumula o que o bot coletou; `status` vira `handoff` quando o
   lead está qualificado).

## Comportamento do bot (resumo)

- Se apresenta como "assistente do [seu nome]" e declara ser atendimento
  virtual na primeira mensagem (LGPD). Não cita o Selo.
- Só qualifica e agenda: nunca fala preço, condição de imóvel, desconto ou
  comissão. Se perguntarem, redireciona para o corretor.
- Uma pergunta por vez, sem emoji.
- Quando coleta intenção + região + faixa (ou o lead pede humano), marca a
  conversa como `handoff` e para de responder.
- Mensagem manual sua em qualquer conversa pausa o bot nela por 24 horas.
- Toda mensagem (recebida e enviada) fica gravada com data/hora — o registro
  de primeiro contato que protege a comissão.

## Fora do escopo do F0 (fica para F1)

- Aba "Leads" na ferramenta (por ora, leitura via Supabase Table Editor).
- Notificação push/email no handoff.
- Embedded Signup para outros corretores conectarem o próprio número.
- Horário de silêncio configurável.
