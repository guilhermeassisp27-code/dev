# AUDITORIA DA PLATAFORMA — Selo

**Data:** 2026-07-03 · **Escopo:** código em produção no `main` (tool.html, app Next.js, SQL, integrações, workflows) · **Método:** 5 frentes de auditoria independentes com evidência `arquivo:linha` para cada achado; medições de performance feitas em navegador real (Chromium/Playwright), não estimadas.

---

## SUMÁRIO EXECUTIVO

| Área | Nota | Resumo em uma linha |
|---|---|---|
| Segurança de aplicação | **7,0** | escH disciplinado, sandbox correto, gate em profundidade — mas zero CSP/SRI no domínio da ferramenta e Next vulnerável |
| Performance | **7,0** | Carrega rápido (FCP 396ms), mobile ok, build Next saudável — mas sem minificação e fotos base64 estouram o localStorage |
| Fluxo de compra | **6,5** | Caminho feliz sólido — mas 2 planos B2B invendáveis e ex-assinante sem porta de volta |
| Arquitetura | **6,0** | Separação Next+Pages+Supabase coerente e documentada — mas monolito de 7,7k linhas sem build/testes e lógica duplicada divergente |
| Integrações | **5,5** | Fundamentos maduros — mas service role em URL, fila offline que perde trabalho e scan O(n) no webhook de pagamento |
| Banco de dados | **5,0** | RLS acima da média — mas RPC vazando perfil a anônimos, last-write-wins destruindo dados multi-dispositivo e nenhum backup |
| **GERAL** | **6,0** | Produto funcional com decisões maduras em vários pontos, mas com 12 achados críticos que precisam ser resolvidos antes de escalar |

**Leitura honesta:** o Selo está melhor do que a média de MVPs em segurança de aplicação (o básico foi feito com disciplina), mas os três riscos que mais importam para um SaaS pago estão abertos: **(1) dados de cliente podem ser perdidos sem recuperação** (LWW + sem backup), **(2) dados de perfil vazam para qualquer anônimo** (RPC), e **(3) há receita sendo deixada na mesa** (B2B invendável, churn sem porta de volta).

---

## 🔴 PROBLEMAS CRÍTICOS (12)

### C1. RPC `cpr_resolve_slug` vaza o perfil INTEIRO para qualquer anônimo
- **Evidência:** `supabase-setup.sql:158-171` — função `security definer` retorna `user_id, perfil` (jsonb completo); Postgres concede EXECUTE a PUBLIC por padrão e o script nunca revoga. PostgREST a expõe em `/rest/v1/rpc/cpr_resolve_slug` com a anon key (pública).
- **Impacto:** qualquer pessoa obtém telefone, e-mail, logo, templates de WhatsApp, textos e `user_id` de qualquer corretor com slug (slugs são públicos — são o link do site). Contorna a projeção de "campos seguros" de `lib/corretor.ts:64-78`.
- **Solução:** `revoke execute on function public.cpr_resolve_slug(text) from public, anon, authenticated;` + `alter default privileges revoke execute on functions from public;`. **1 linha de SQL. Rodar HOJE.**

### C2. Last-write-wins do documento inteiro: dois dispositivos se destroem mutuamente
- **Evidência:** `tool.html:2967-2982` — `salvarRemoto()` upserta as 5 colunas jsonb SEMPRE, sem versão/etag; `carregarRemoto()` (`:2927`) só roda no boot. ~35 call sites.
- **Impacto:** celular de manhã + desktop à tarde = o save do desktop apaga o lead criado no celular. A fila offline (`:2988-3005`) agrava (empurra estado velho por cima). Perda silenciosa e irrecuperável.
- **Solução:** coluna `version int` + update condicional com re-fetch/merge em conflito; melhor: salvar cada domínio (coluna) separadamente e só o alterado.

### C3. Nenhum backup — e a arquitetura amplifica qualquer perda
- **Evidência:** zero menção a backup no repo; Supabase só tem backup diário no plano Pro, PITR é add-on.
- **Impacto:** combinado com C2, um save ruim sobrescreve o documento inteiro do usuário e não existe como voltar. O dado do produto É o jsonb — hoje tem exatamente uma cópia viva.
- **Solução:** confirmar plano Pro; dump diário externo (`pg_dump` via GitHub Action + secret). ~1 hora de trabalho.

### C4. Fallback de slug faz full-table scan em rota pública
- **Evidência:** `app/api/captura/route.ts:51-59` e `lib/corretor.ts:87-95` — RPC com 0 linhas (slug não existe) cai em `select user_id, perfil ... limit(2000)` e baixa o perfil de até 2000 usuários (com logos base64) para filtrar em JS.
- **Impacto:** um bot fazendo GET `/{slug-aleatorio}` dispara dezenas de MB por request — DoS de custo auto-infligido.
- **Solução:** RPC 0 linhas = 404; fallback só quando `rpc.error` = função ausente (42883).

### C5. `/api/admin/invite` autentica com a SERVICE ROLE KEY como query param de navegador
- **Evidência:** `app/api/admin/invite/route.ts:12-19` (`?token=` comparado à `SUPABASE_SERVICE_ROLE_KEY`); comentário na `:49` admite o uso "cola a URL no navegador".
- **Impacto:** a chave mais poderosa do projeto (bypass total de RLS + admin de Auth) fica em histórico de navegador e logs de acesso do Vercel. Vazou = comprometimento total.
- **Solução:** `ADMIN_API_TOKEN` dedicado, aceito só via header. Nunca reutilizar a service role como senha de URL.

### C6. `findUser` escaneia a base INTEIRA de usuários a cada webhook
- **Evidência:** `hotmart-webhook/route.ts:247-258` (pagina até 500×200 usuários), copiado em `conta-membros/route.ts:115-126` e `admin/invite/route.ts:31-43`.
- **Impacto:** com a base crescendo, o webhook de PAGAMENTO estoura o timeout do Vercel e passa a falhar sistematicamente (cancelamento não processado = acesso grátis; compra não processada = cliente sem acesso).
- **Solução:** lookup direto por email (RPC SQL em `auth.users` via service role, ou tabela espelho indexada).

### C7. Fila offline perde trabalho do cliente em silêncio
- **Evidência:** `sincronizarPendentes` engole QUALQUER erro para sempre (`tool.html:2996` `catch(_)`), inclusive 401 de token expirado; `sair()` (`:2917-2921`) limpa o localStorage SEM checar `_syncPendente`.
- **Impacto:** trabalho offline nunca sobe (usuário não é avisado) e é destruído no logout.
- **Solução:** em erro de auth na sincronização, avisar e mandar relogar; bloquear/avisar `sair()` com pendência.

### C8. supabase-js congelado para sempre no cache do PWA
- **Evidência:** `sw.js:64-77` (cache-first puro para jsDelivr) + `sw.js:16` e `tool.html:21` (tag `@2` flutuante, sem versão exata, sem SRI).
- **Impacto:** a primeira build 2.x cacheada é servida indefinidamente — correções de segurança do supabase-js nunca chegam a PWAs instalados. E sem SRI, um CDN comprometido executa JS com a sessão do usuário.
- **Solução:** pinar versão exata + `integrity=` (SRI) + bump do nome do cache a cada upgrade (ou stale-while-revalidate); considerar auto-hospedar o arquivo.

### C9. Next.js 14.2.3 com vulnerabilidade crítica conhecida
- **Evidência:** `package.json:38`; `npm audit`: Cache Poisoning (GHSA-gp8f-8m3g-qvj9), **Authorization Bypass in Middleware** (GHSA-f82v-jwr5-mffw), SSRF via middleware redirect.
- **Impacto:** o gate de acesso do app É o middleware — exposto exatamente às classes de bug publicadas.
- **Solução:** `next@14.2.35+` e re-testar o fluxo de auth. Upgrade dentro da mesma minor — risco baixo.

### C10. Planos Imobiliária e Loteadora são INVENDÁVEIS
- **Evidência:** ofertas `c9r311s7`/`226wqzhj` existem só no backend (`hotmart-webhook/route.ts:34-37`); grep na landing confirma apenas 2 links de checkout (mensal/anual).
- **Impacto:** dois planos de ticket maior com receita = R$ 0 por impossibilidade física de compra.
- **Solução:** card "Para equipes" na seção `#planos` (ou página `/equipes`) com os 2 checkouts.

### C11. Ex-assinante que quer voltar a pagar bate num erro genérico
- **Evidência:** o ban do Supabase impede login; "User is banned" cai no genérico "Não foi possível entrar. Tente novamente." (`acesso/page.tsx:68-75`). A tela de reativação (`tool.html:2521-2534`) exige sessão válida — que o ban impede.
- **Impacto:** o único ponto de recuperação de receita de churn está quebrado. Reassinatura perdida em silêncio.
- **Solução:** tratar a mensagem de ban no `/acesso` com CTA "Reativar assinatura" → checkout; ou parar de banir e confiar no gate `subscription_status` (que já existe, `tool.html:2495-2498`).

### C12. Monolito tool.html de 7.677 linhas servido cru, sem build
- **Evidência:** CSS ~793 + JS ~5.249 + HTML ~1.620 linhas num arquivo; deploy só faz `cp` (`deploy-vercel.yml:34-35`). 424KB brutos / 100KB gzip. Zero minificação, zero sourcemaps, zero testes unitários.
- **Impacto:** manutenção cada vez mais cara, payload maior que o necessário, debug em produção impossível, e a matemática financeira duplicada já divergiu (ver M1).
- **Solução:** não precisa virar SPA — extrair CSS/JS para arquivos + passo de minificação no workflow de deploy; unit tests para a matemática.

---

## 🟡 PROBLEMAS MÉDIOS (seleção dos 25 encontrados — completos nos anexos)

| # | Achado | Evidência | Solução curta |
|---|---|---|---|
| M1 | Cálculo SAC duplicado e JÁ DIVERGENTE entre client e server | `tool.html:3469` vs `lib/taxas.ts:96` (comentário "idêntica" é falso) | fonte única + unit test |
| M2 | Pagante sem email se SMTP falhar nos 2 eventos — sem retry/alerta | `hotmart-webhook:331-338` | cron varrendo `welcome_sent:false` + alerta |
| M3 | Cancelamento: erro do ban ignorado → cancelado fica com acesso PARA SEMPRE | `hotmart-webhook:400-406` | checar erro, retornar 500 p/ retry |
| M4 | Erro de RLS indistinguível de "sem internet"; `catch(()=>{})` em escrita | `tool.html:3974-3979`, `:3305,:4246,:4550,:4259` | inspecionar `error.code`, nunca catch vazio |
| M5 | Banner "até 30 de junho" hardcoded no HTML (flash + crawlers) e promessa de R$ 97 nunca cumprida (escassez falsa — risco CDC) | `landing.html:1328-1335`, `:1329` vs `:1342` | remover bloco; nunca mais deadline fake |
| M6 | Demo (momento mais quente do funil) invisível ao Meta Pixel | `fbq` = 0 no tool.html; iframe em `landing:1084` | eventos na demo via postMessage |
| M7 | Injeção de atributo via logo/foto (data-URI sem escape em `src`) | `tool.html:3598,:6885,:7458` etc. | `createElement`+`.src` |
| M8 | Zero CSP no domínio da ferramenta (GitHub Pages não põe headers) | `tool.html` head | `<meta http-equiv="CSP">` |
| M9 | Link do email de ativação expira em 1h sem aviso no template | `emails/*.html` (zero menção) | TTL 24h + frase no template |
| M10 | Sem senha criável depois: cada dispositivo novo = "esqueci minha senha" | `definir-senha:139-154`; grep vazio no tool | "criar senha" no perfil |
| M11 | Open redirect no `/callback` | `callback/route.ts:16-19` | allowlist igual ao `/acesso` |
| M12 | Fotos: 10 fotos ≈ **2,4MB medidos** de base64 por proposta → localStorage (~5MB) estoura com 2 propostas pesadas; quota estourada corrompe estado | medição real + `tool.html:2936-2964` | Supabase Storage p/ fotos |
| M13 | Hottok aceito via query string + comparação não timing-safe | `hotmart-webhook:197-211` | header-only + `timingSafeEqual` |
| M14 | Convites de equipe: sem rate limit, assentos não-atômicos, email best-effort silencioso | `conta-membros:144-176` | claim atômico + emailSent no JSON |
| M15 | SW cacheia resposta de ERRO por cima do shell bom | `sw.js:51-55` | só cachear `resp.ok` |
| M16 | QA diário escreve em produção, testa domínio errado e depende de senha de demo | `qa-ferramenta.yml:44-46` | conta flag + domínio real |
| M17 | Workflow de revisão dá `git:*`+escrita a agente que lê conteúdo de PR (prompt injection) | `revisao-produto.yml:16-40` | só leitura + `gh pr comment` |
| M18 | Agente "dados" promete relatório do Supabase sem NENHUMA credencial (vai inventar números) | `agentes-automaticos.yml:41-56` | chave read-only ou reescrever prompt |
| M19 | Sem timeout em nenhum fetch externo (Brevo/BC/Meta penduram função) | zero `AbortController` no projeto | `AbortSignal.timeout(8000)` |
| M20 | ~15 dependências instaladas e nunca importadas (resíduo "sales-copilot") | `package.json` | limpar |
| M21 | Propostas assinadas com CPF acessíveis para sempre + leads descartados nunca expurgados (LGPD) | `lib/proposta.ts:26-44`; sql sem delete | política de retenção |
| M22 | `contexto()` pega conta arbitrária se usuário for membro de 2 contas | `conta-membros:61-66` | `account_id` no request |
| M23 | Enums sem CHECK no banco | `supabase-setup.sql:112,:268,:280` | 3 linhas de SQL |
| M24 | Fonte "Geist" declarada mas NUNCA carregada (sem @font-face) — todo mundo vê fonte de sistema | `tool.html:45` (só no stack) | decidir: embutir a fonte ou assumir a system stack |
| M25 | URLs legadas fossilizadas nos workflows (usecorretorpro.vercel.app, github.io) | `gravar-demo.yml:44`, `*.mjs:17-18` | atualizar |

## 🟢 PONTOS FORTES (mantenha assim)

- **XSS sob controle:** varredura completa dos 99 `innerHTML` — dados de texto do usuário passam por `escH` com disciplina rara em MVP.
- **HTML não-confiável isolado certo:** proposta pública em iframe `sandbox` sem `allow-scripts` (`docframe.tsx:31`).
- **Gate de assinatura em profundidade:** client + `app_metadata` (não editável) + RLS + revalidação server-side + ban. Burlar o client não persiste nada.
- **CORS restrito a origem fixa** e **JWT validado no servidor** na rota de equipe; grants por coluna no banco (acima da média).
- **Zero SQL injection** (100% SDK parametrizado, UUID por regex, inputs truncados).
- **Performance de carga:** FCP 396ms / load 476ms (mediana local); mobile sem overflow, sidebar off-canvas correta; compressão de 10 fotos em ~1s sem travar a UI; bundles Next saudáveis (87-153kB First Load).
- **Prova social honesta** na landing (rotulada como validação, sem depoimento inventado) e countdown que se esconde ao expirar.
- **Webhook com decisões maduras:** fail-closed sem token, 500-para-retry no createUser, reativação de banido na recompra, claim atômico no email de carrinho abandonado.

## MEDIÇÕES DE PERFORMANCE (reais, não estimadas)

| Métrica | Valor | Veredito |
|---|---|---|
| tool.html | 424.128 bytes / 100.389 gzip (23%) | 🟡 aceitável; minificação cortaria ~30-40% do bruto |
| landing.html | 104.121 / 23.870 gzip | 🟢 |
| FCP / DCL / Load (mediana 3 rodadas, local) | 396ms / 468ms / 476ms | 🟢 |
| supabase-js CDN | tag SEM defer/async (`tool.html:21`) → render-blocking | 🟡 adicionar `defer` |
| Geração de proposta | 1.843ms total, dos quais **1.700ms são setTimeout artificial** (`tool.html:3528`) → ~143ms reais | 🟢 (teatro de UX intencional; ok) |
| Compressão de 10 fotos (1MB cada) | 1.044ms, UI responsiva durante | 🟢 |
| Payload de 10 fotos comprimidas | **2,4MB base64** (240KB/foto em imagem ruidosa; fotos reais ~80-160KB) | 🔴 ver M12/C2 |
| Mobile 390×844 | overflow 0px; sidebar off-canvas; 17 alvos de toque <40px | 🟡 alvos pequenos |
| Next build | 87-153kB First Load; middleware 82,3kB | 🟢 |
| Timers ativos | sync 60s + polling de views 4s (limpo corretamente ao fechar modal) | 🟢 |

---

## PLANO DE AÇÃO PRIORIZADO

### Onda 1 — Quick wins de segurança/receita (1 dia, fazer JÁ)
1. **C1** Revogar EXECUTE da RPC (1 linha de SQL no Supabase) — fecha o vazamento de dados
2. **C3** Dump diário de backup via GitHub Action — compra o direito de errar
3. **C9** `next@14.2.35` + re-teste de auth
4. **C4** Fallback de slug → 404 (10 linhas)
5. **C10** Card "Para equipes" na landing — destrava receita B2B parada
6. **C11** Mensagem de banido com CTA "Reativar" — recupera churn
7. **C8/M15** Pinar supabase-js + SRI + SW só cacheia `resp.ok`
8. **C5** Token admin dedicado via header
9. **M5** Remover banner de deadline vencido do HTML

### Onda 2 — Integridade de dados (3-5 dias)
10. **C2** Versionamento anti-LWW no `salvarRemoto` (ou save por domínio)
11. **C7** Fila offline: tratar 401, bloquear logout com pendência
12. **M12** Fotos → Supabase Storage (URL no jsonb)
13. **C6** Lookup de usuário por email direto (RPC)
14. **M2/M3** Alerta de `welcome_sent:false` + retornar 500 no erro de ban

### Onda 3 — Higiene e conversão (contínuo)
15. **C12** Minificação no deploy + unit tests da matemática (pega M1)
16. **M6** Pixel na demo; **M9** TTL 24h no link; **M10** criar senha no perfil
17. **M7/M8/M11/M13/M14/M19-M25** conforme tabela

---

## ANEXOS
Relatórios completos por área (com todos os achados 🟡/🟢 detalhados) foram produzidos pelas 5 frentes de auditoria e estão consolidados neste documento. Evidências citadas referem-se ao commit `c03219f` do `main`.

*Relatório gerado pela Fase 1 da auditoria. Nenhum código foi alterado. A Fase 2 (redesign) aguarda aprovação expressa.*
