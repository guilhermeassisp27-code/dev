# Selo — Guia para Agentes

## O que é este projeto

Selo. Sua comissão, garantida.

Selo não é um gerador de propostas — é a plataforma que blinda a comissão do corretor de
imóveis autônomo do primeiro contato até a assinatura. SaaS para corretores de imóveis,
com geração de propostas comerciais profissionais em segundos como uma das frentes.
Monetização via Hotmart (assinatura recorrente). Dois planos: Mensal (`hgn79gvq`) e Anual (`mcjyy7ub`).

> Nota: o produto foi renomeado de "CorretorPRO" para "Selo". Nomes técnicos legados
> (domínio `usecorretorpro.vercel.app`, tabela `cpr_user_data`, prefixos `cpr_*`) seguem
> com o nome antigo internamente — não renomear infraestrutura sem planejamento dedicado.

## Arquitetura

```
Hotmart (pagamento)
  └─ webhook POST /api/hotmart-webhook
       ├─ cria conta no Supabase Auth (admin.createUser)
       ├─ salva subscription_status: active em app_metadata
       └─ dispara email via resetPasswordForEmail → Brevo SMTP → usuário define senha

Usuário define senha em /definir-senha
  └─ redireciona para tool.html com tokens no hash

tool.html (GitHub Pages: https://guilhermeassisp27-code.github.io/dev/tool.html)
  ├─ consome Supabase diretamente (anon key, RLS)
  ├─ salva propostas em cpr_user_data (tabela Supabase)
  └─ verifica app_metadata.subscription_status === 'active' para liberar uso

Next.js app (Vercel: https://usecorretorpro.vercel.app)
  ├─ /acesso       — login (email + senha)
  ├─ /definir-senha — define senha via link do email
  └─ /api/hotmart-webhook — webhook Hotmart
```

## Stack

- **Frontend da ferramenta**: HTML/CSS/JS puro em `tool.html` (sem framework)
- **Auth app**: Next.js 14 App Router, TypeScript, no `app/` directory
- **Banco**: Supabase (Postgres + Auth)
- **Email**: Brevo SMTP configurado em Supabase → Authentication → SMTP Settings
- **Pagamento**: Hotmart webhooks
- **Deploy**: Vercel (Next.js) + GitHub Actions → gh-pages (tool.html)

## Arquivos principais

| Arquivo | O que faz |
|---|---|
| `tool.html` | Ferramenta completa do corretor (propostas, perfil, histórico) |
| `app/api/hotmart-webhook/route.ts` | Recebe eventos do Hotmart, cria/bane usuários |
| `app/(auth)/acesso/page.tsx` | Tela de login |
| `app/(auth)/definir-senha/page.tsx` | Define senha após convite |
| `middleware.ts` | Redireciona sessão ativa para tool.html |
| `supabase-setup.sql` | SQL para criar tabela cpr_user_data + RLS + GRANT |
| `marketing/` | Materiais de marketing (imagens, plano de tráfego) |
| `marketing/logo/selo/` | Kit de marca oficial do Selo (logos, cores, tipografia) — ver `brand-tokens.json` como fonte única de cor/tipografia e `LEIA-ME.md` para o mapa de arquivos |
| `landing/` | Landing page (se existir) |

## Variáveis de ambiente (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://kdudodqmijlzqwnkxpjo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...       # NUNCA committar
NEXT_PUBLIC_APP_URL=https://usecorretorpro.vercel.app
NEXT_PUBLIC_TOOL_URL=https://guilhermeassisp27-code.github.io/dev/tool.html
HOTMART_WEBHOOK_TOKEN=...                      # NUNCA committar
```

`.env.local` está no `.gitignore` — nunca commitar segredos.

## Fluxo de assinatura

**Compra aprovada** (`PURCHASE_APPROVED` ou `PURCHASE_COMPLETE`):
1. Cria usuário com `admin.createUser` (email_confirm: true)
2. Define `app_metadata.subscription_status: 'active'`
3. Envia email via `resetPasswordForEmail` → redirectTo `/definir-senha`
4. Marca `app_metadata.welcome_sent: true` (idempotência)

**Cancelamento/reembolso** (`PURCHASE_REFUNDED`, `PURCHASE_CANCELLED`, `PURCHASE_CANCELED`, `PURCHASE_CHARGEBACK`, `SUBSCRIPTION_CANCELLATION`):
1. Localiza usuário pelo email
2. Define `ban_duration: '87600h'` (10 anos)
3. Define `app_metadata.subscription_status: 'inactive'`
4. **NÃO deleta** o usuário (preserva dados para reassinatura)

## Banco de dados (Supabase)

Tabela principal: `cpr_user_data`
- `user_id` (uuid, FK auth.users)
- `data` (jsonb) — propostas, configurações de perfil, logo

RLS: usuário só lê/escreve o próprio row.
GRANT obrigatório: `grant select, insert, update on public.cpr_user_data to authenticated;`
Sem esse grant, todas as escritas retornam 403/42501.

## Regras para agentes

1. **Branch de desenvolvimento**: `claude/development-session-O10kI`
   - Commitar e pushar neste branch
   - Nunca pushar direto em `main` sem autorização explícita
   - `main` é production — PR necessário

2. **Segredos**: nunca commitar `.env.local`, service role key, webhook token

3. **tool.html**: arquivo crítico e sensível. Qualquer mudança requer teste manual completo do fluxo de salvar proposta → sair → entrar → proposta ainda existe.

4. **Webhook**: não alterar a validação `x-hotmart-hottok` nem o retorno 200 — Hotmart retenta em falha, mas duplicações são tratadas pelo guard `welcome_sent`.

5. **Brevo SMTP**: configurado no dashboard do Supabase, não via código. Não criar integrações com Resend, SendGrid ou similar.

6. **Middleware**: só redireciona, não tem lógica de negócio. Cuidado para não quebrar `/api/*` (já excluído no matcher).

## Comandos úteis

```bash
# Desenvolvimento local
npm run dev

# Build
npm run build

# Verificar tipos
npx tsc --noEmit

# Testar webhook localmente (precisa de HOTMART_WEBHOOK_TOKEN no .env.local)
curl -X POST http://localhost:3000/api/hotmart-webhook \
  -H "x-hotmart-hottok: SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event":"PURCHASE_APPROVED","data":{"buyer":{"email":"teste@teste.com","name":"Teste"},"purchase":{"transaction":"TXN123","offer":{"code":"hgn79gvq"}}}}'
```

## Diagnóstico rápido

- Usuário não recebeu email → verificar Brevo logs (app.brevo.com → Transactional → Logs)
- Usuário não consegue salvar na ferramenta → verificar console: erro 42501 = falta GRANT no Supabase
- Webhook retorna 401 → `HOTMART_WEBHOOK_TOKEN` não configurado no Vercel
- Webhook retorna 500 → ver logs no Vercel → Functions → hotmart-webhook
- Tool.html não abre → verificar GitHub Actions (Actions tab) se o deploy de gh-pages rodou

## Histórico de decisões

- **Por que tool.html em vez de Next.js?** Performance — zero cold start para o usuário.
- **Por que tokens no hash fragment?** Cross-domain (Vercel ↔ GitHub Pages) sem cookies.
- **Por que app_metadata e não user_metadata?** `app_metadata` não é editável pelo usuário via client SDK — mais seguro para controle de acesso.
- **Por que não deletar usuário ao cancelar?** Preservar histórico de propostas; reassinatura reativa sem perda de dados.
- **Por que "CorretorPRO" virou "Selo"?** Reposicionamento de marca: de "gerador de propostas" para "plataforma que blinda a comissão do corretor autônomo do primeiro contato até a assinatura". Slogan oficial: "Selo. Sua comissão, garantida." Identidade visual em `marketing/logo/selo/` (paleta navy `#0F2D4A` + âmbar `#C9882A`, fonte Geist).
