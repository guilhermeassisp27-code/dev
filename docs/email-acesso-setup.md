# Setup do fluxo de acesso (compra → email → senha → ferramenta)

Guia operacional do fluxo de onboarding do CorretorPRO. Mantém o passo a passo
para configurar e diagnosticar o envio de email de acesso.

## Como o fluxo funciona

```
Compra na Hotmart
   │
   ▼
Webhook  POST /api/hotmart-webhook   (valida HOTMART_WEBHOOK_TOKEN)
   │  cria o usuário no Supabase (generateLink — NÃO usa email do Supabase)
   │  marca app_metadata.subscription_status = "active"
   ▼
Email enviado pelo RESEND  (lib/email.ts)  → contém o link "Definir minha senha"
   │
   ▼
/definir-senha  → usuário cria a senha → sessão criada
   │
   ▼
Ferramenta (tool.html)  → checa app_metadata.subscription_status
   │  "active"  → libera
   │  "inactive"→ tela de reativar assinatura
```

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
| `RESEND_API_KEY` | Chave da conta Resend (`re_...`) |
| `RESEND_FROM` | Remetente verificado, ex: `CorretorPRO <acesso@seudominio.com.br>` |
| `RESEND_REPLY_TO` | (opcional) email de suporte para respostas |

> Toda vez que mudar uma variável no Vercel, faça **Redeploy** para valer.

## Passo 1 — Webhook da Hotmart

1. Hotmart → Ferramentas → Webhooks → criar webhook
2. URL: `https://usecorretorpro.vercel.app/api/hotmart-webhook`
3. Eventos: `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`,
   `PURCHASE_CANCELLED`, `PURCHASE_CHARGEBACK`, `SUBSCRIPTION_CANCELLATION`
4. Copie o **Hottok** gerado → cole em `HOTMART_WEBHOOK_TOKEN` no Vercel

## Passo 2 — Domínio + Resend (entregabilidade)

1. Registre um domínio (ex: `usecorretorpro.com.br` no Registro.br, ou um `.com`
   no Cloudflare/Namecheap).
2. Resend → Domains → Add Domain → informe o domínio.
3. O Resend mostra 3 registros DNS (SPF, DKIM e MX de retorno). Adicione-os
   **exatamente** no painel de DNS do domínio.
4. Clique em **Verify**. Quando ficar "Verified", o envio para clientes funciona.
5. Preencha `RESEND_API_KEY` e `RESEND_FROM` (use um email @seudominio) no Vercel.

> Sem domínio verificado, o Resend só entrega para o email dono da conta (teste).

## Passo 3 — Allowlist de redirect no Supabase

Supabase → Authentication → URL Configuration:
- **Site URL:** `https://usecorretorpro.vercel.app`
- **Redirect URLs:** adicione `https://usecorretorpro.vercel.app/definir-senha`
  e `https://usecorretorpro.vercel.app/**`

Se a URL não estiver aqui, o link do email não estabelece a sessão.

## Endpoint admin — convidar / reenviar acesso manualmente

`POST /api/admin/invite` — autentica com o header `x-admin-token` =
`SUPABASE_SERVICE_ROLE_KEY`.

```bash
curl -X POST https://usecorretorpro.vercel.app/api/admin/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <SERVICE_ROLE_KEY>" \
  -d '{"email":"comprador@email.com","name":"Nome","plan":"mensal"}'
```

Resposta inclui:
- `emailSent: true/false` — se o Resend entregou
- `emailError` — motivo, se falhou
- `actionLink` — link de definir senha (envie por WhatsApp se `emailSent=false`)

Consultar status de um usuário:
```bash
curl "https://usecorretorpro.vercel.app/api/admin/invite?email=comprador@email.com&token=<SERVICE_ROLE_KEY>"
```

## Diagnóstico rápido

| Sintoma | Causa provável | Onde olhar |
|---------|----------------|-----------|
| Webhook responde 401 | Token errado | `HOTMART_WEBHOOK_TOKEN` no Vercel vs Hottok |
| Webhook responde 500 "not configured" | Token vazio | preencher `HOTMART_WEBHOOK_TOKEN` |
| Usuário criado mas sem email | Resend não configurado / domínio não verificado | logs do Vercel; `emailError` no endpoint admin |
| Email chega mas link "inválido/expirado" | Redirect URL fora da allowlist | Supabase URL Configuration |
| Comprador não consegue logar após cancelar | Esperado: conta banida/inativa | reassinar reativa |
