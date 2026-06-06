# Setup do fluxo de acesso (compra → email → senha → ferramenta)

Guia operacional do fluxo de onboarding do CorretorPRO. Mantém o passo a passo
para configurar e diagnosticar o envio de email de acesso.

## Como o fluxo funciona

```
Compra na Hotmart
   │
   ▼
Webhook  POST /api/hotmart-webhook   (valida HOTMART_WEBHOOK_TOKEN)
   │  1. CRIA o usuário no Supabase (admin.createUser — sempre, mesmo se o email falhar)
   │  2. marca app_metadata.subscription_status = "active"
   │  3. dispara o email de definir senha (resetPasswordForEmail → SMTP Brevo)
   ▼
Email (template Reset password do Supabase, enviado pelo Brevo)
   │  contém o link "definir senha" → {NEXT_PUBLIC_APP_URL}/definir-senha
   ▼
/definir-senha  → usuário cria a senha → sessão criada
   │
   ▼
Ferramenta (tool.html)  → checa app_metadata.subscription_status
   │  "active"  → libera
   │  "inactive"→ tela de reativar assinatura
```

> Criação da conta e envio do email são SEPARADOS: quem pagou sempre fica com
> conta ativa, mesmo que o email não saia. O email é reenviável pelo endpoint
> admin (abaixo).

Cancelamento/reembolso na Hotmart → webhook marca `inactive` e bane a conta.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Para que serve |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Admin (webhook + endpoint admin) |
| `NEXT_PUBLIC_APP_URL` | `https://usecorretorpro.vercel.app` (sem barra final) |
| `NEXT_PUBLIC_TOOL_URL` | URL da ferramenta (GitHub Pages) |
| `HOTMART_WEBHOOK_TOKEN` | Hottok do webhook da Hotmart |

> Não há variáveis de email no código. O envio é feito pelo Supabase usando o
> SMTP do **Brevo**, configurado no painel (Authentication → SMTP Settings).
>
> Toda vez que mudar uma variável no Vercel, faça **Redeploy** para valer.

## Envio de email (Brevo via Supabase SMTP)

- Supabase → Authentication → **SMTP Settings**: host/credenciais do Brevo,
  com o remetente (sender) verificado no Brevo.
- Supabase → Authentication → **Email Templates**: o template **Reset password**
  é o usado no fluxo de definir senha (o webhook chama `resetPasswordForEmail`).
- Se o email não chega: confira no Brevo (Transactional → Logs) se saiu, e a
  pasta de spam. O endpoint admin com `mode:"link"` gera o link para envio
  manual enquanto o SMTP não estiver 100%.

## Passo 1 — Webhook da Hotmart

1. Hotmart → Ferramentas → Webhooks → criar webhook
2. URL: `https://usecorretorpro.vercel.app/api/hotmart-webhook`
3. Eventos: `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`,
   `PURCHASE_CANCELLED`, `PURCHASE_CHARGEBACK`, `SUBSCRIPTION_CANCELLATION`
4. Copie o **Hottok** gerado → cole em `HOTMART_WEBHOOK_TOKEN` no Vercel

## Passo 2 — Brevo (entregabilidade)

1. Supabase → Authentication → SMTP Settings → preencher com o SMTP do Brevo
   (host `smtp-relay.brevo.com`, porta, login e a chave SMTP do Brevo).
2. No Brevo, verificar o remetente (sender) e, idealmente, autenticar um domínio
   próprio (SPF/DKIM) para melhor entregabilidade ao escalar.
3. Testar o envio (Passo 4 abaixo, compra de teste) e checar os logs do Brevo.

## Passo 3 — Allowlist de redirect no Supabase

Supabase → Authentication → URL Configuration:
- **Site URL:** `https://usecorretorpro.vercel.app`
- **Redirect URLs:** adicione `https://usecorretorpro.vercel.app/definir-senha`
  e `https://usecorretorpro.vercel.app/**`

Se a URL não estiver aqui, o link do email não estabelece a sessão.

## Endpoint admin — convidar / reenviar acesso manualmente

`POST /api/admin/invite` — autentica com o header `x-admin-token` =
`SUPABASE_SERVICE_ROLE_KEY`.

Criar/ativar + enviar o email pelo Brevo:
```bash
curl -X POST https://usecorretorpro.vercel.app/api/admin/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <SERVICE_ROLE_KEY>" \
  -d '{"email":"comprador@email.com","name":"Nome","plan":"mensal"}'
```
Resposta: `emailSent: true/false` e `emailError` (se o Brevo falhar).

Gerar link para envio MANUAL (WhatsApp), sem depender do email:
```bash
curl -X POST https://usecorretorpro.vercel.app/api/admin/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <SERVICE_ROLE_KEY>" \
  -d '{"email":"comprador@email.com","name":"Nome","plan":"mensal","mode":"link"}'
```
Resposta: `actionLink` — envie esse link direto pro comprador.

Consultar status de um usuário:
```bash
curl "https://usecorretorpro.vercel.app/api/admin/invite?email=comprador@email.com&token=<SERVICE_ROLE_KEY>"
```

## Diagnóstico rápido

| Sintoma | Causa provável | Onde olhar |
|---------|----------------|-----------|
| Webhook responde 401 | Token errado | `HOTMART_WEBHOOK_TOKEN` no Vercel vs Hottok |
| Webhook responde 500 "not configured" | Token vazio | preencher `HOTMART_WEBHOOK_TOKEN` |
| Compra não cria usuário no banco | Webhook não configurado/401, ou compra anterior ao token | logs de webhook na Hotmart; status no endpoint admin GET |
| Usuário criado mas sem email | SMTP Brevo não configurado/sender não verificado | Brevo → Transactional → Logs; `emailError` no endpoint admin |
| Email chega mas link "inválido/expirado" | Redirect URL fora da allowlist OU `NEXT_PUBLIC_APP_URL` ausente | Supabase URL Configuration; var no Vercel |
| Comprador não consegue logar após cancelar | Esperado: conta banida/inativa | reassinar reativa |
