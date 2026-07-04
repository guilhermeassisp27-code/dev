-- ============================================================
-- CorretorPRO — armazenamento de perfil e histórico por conta
-- Rode UMA vez no Supabase: Dashboard > SQL Editor > New query > Run
-- ============================================================

-- Tabela que guarda os dados de cada usuário (perfil + histórico de propostas)
create table if not exists public.cpr_user_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  perfil     jsonb not null default '{}'::jsonb,
  historico  jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Liga o Row Level Security: cada usuário só enxerga a própria linha
alter table public.cpr_user_data enable row level security;

-- Permissões em nível de TABELA para o papel "authenticated".
-- IMPRESCINDÍVEL ao criar a tabela por SQL puro: sem este GRANT, o usuário
-- logado leva "permission denied for table" (erro 42501) mesmo com a RLS certa.
grant select, insert, update on public.cpr_user_data to authenticated;

-- SELECT: ler apenas os próprios dados
drop policy if exists "cpr_select_own" on public.cpr_user_data;
create policy "cpr_select_own"
  on public.cpr_user_data for select
  using (auth.uid() = user_id);

-- INSERT: criar apenas a própria linha
drop policy if exists "cpr_insert_own" on public.cpr_user_data;
create policy "cpr_insert_own"
  on public.cpr_user_data for insert
  with check (auth.uid() = user_id);

-- UPDATE: atualizar apenas a própria linha
drop policy if exists "cpr_update_own" on public.cpr_user_data;
create policy "cpr_update_own"
  on public.cpr_user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Migração: Agenda de Visitas / Funil de Leads (2026-06)
-- Nova coluna jsonb seguindo o MESMO padrão de `perfil` e `historico`
-- (uma coluna por "domínio" de dado, sem tabela nova, RLS já cobre
-- a tabela inteira por user_id). Idempotente — seguro rodar de novo.
-- ============================================================
alter table public.cpr_user_data
  add column if not exists leads jsonb not null default '[]'::jsonb;

-- Sem GRANT adicional necessário: a coluna nova já está coberta pelo
-- grant select/insert/update on public.cpr_user_data feito acima.

-- ============================================================
-- Migração: Catálogo de Imóveis + Vendas (2026-06) e Site público (2026-06-28)
-- Mesmas colunas jsonb por domínio. Idempotente.
--   imoveis: catálogo do corretor. Cada item pode ter `publicado: true`,
--            que o expõe na vitrine pública SSR (selosales.com.br/{slug}).
--            O resolveSlug (service role) lê só campos seguros — endereço
--            completo e dados de cliente NUNCA saem para o público.
--   vendas:  histórico de vendas/comissões (privado, nunca exposto).
-- ============================================================
alter table public.cpr_user_data
  add column if not exists imoveis jsonb not null default '[]'::jsonb,
  add column if not exists vendas  jsonb not null default '[]'::jsonb;

-- ============================================================
-- Migração: Carrinho abandonado Hotmart (2026-06-20)
-- Leads que iniciaram o checkout e não compraram (evento
-- PURCHASE_OUT_OF_SHOPPING_CART). Só o webhook (service role) grava;
-- visualização é manual pelo Table Editor do Supabase. RLS sem
-- nenhuma policy = bloqueado para anon/authenticated, só service role
-- (que ignora RLS) lê/escreve.
-- ============================================================
create table if not exists public.cpr_abandoned_carts (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text,
  phone       text,
  plan        text,
  whatsapp_link text,
  email_sent  boolean not null default false,
  recovered   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.cpr_abandoned_carts enable row level security;

-- IMPORTANTE: neste projeto as tabelas criadas por SQL NÃO recebem grant
-- automático (mesmo motivo do grant a `authenticated` acima). O service_role
-- tem BYPASSRLS (ignora policies) mas ainda precisa do GRANT de tabela —
-- sem isto, o webhook leva "permission denied for table" (42501).
grant select, insert, update on public.cpr_abandoned_carts to service_role;

-- ============================================================
-- Migração: Captação pública de leads (2026-06-20)
-- Formulário público (sem login) que o corretor compartilha com o
-- cliente. O lead cai aqui via API com service role; o corretor
-- revisa na ferramenta e importa para a própria Agenda de Visitas.
-- Sem policy de INSERT: ninguém insere autenticado/anon — só o
-- service role (que ignora RLS) pela rota /api/captura. O corretor
-- lê/atualiza apenas os próprios leads (owner_id = auth.uid()).
-- ============================================================
create table if not exists public.cpr_public_leads (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  nome        text not null,
  telefone    text,
  imovel      text,
  mensagem    text,
  origem      text not null default 'captura',
  status      text not null default 'pendente',  -- pendente | importado | descartado
  created_at  timestamptz not null default now()
);

alter table public.cpr_public_leads enable row level security;

grant select, update on public.cpr_public_leads to authenticated;
-- A rota pública /api/captura insere via service role — precisa do grant.
grant select, insert, update on public.cpr_public_leads to service_role;
-- E o resolveSlug lê cpr_user_data pela chave secreta — grant de SELECT.
grant select on public.cpr_user_data to service_role;

-- SELECT: corretor lê apenas os leads que chegaram para ele
drop policy if exists "cpl_select_own" on public.cpr_public_leads;
create policy "cpl_select_own"
  on public.cpr_public_leads for select
  using (auth.uid() = owner_id);

-- UPDATE: corretor marca como importado/descartado apenas os próprios
drop policy if exists "cpl_update_own" on public.cpr_public_leads;
create policy "cpl_update_own"
  on public.cpr_public_leads for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists cpr_public_leads_owner_idx
  on public.cpr_public_leads (owner_id, status);

-- Índice para resolver slug -> user_id na rota pública /api/captura.
-- ÚNICO: impede dois corretores com o mesmo slug (garantirSlug no tool.html
-- já tenta evitar a colisão antes de salvar, mas a constraint no banco é a
-- garantia de verdade). Nulos não colidem entre si — quem ainda não definiu
-- slug não é afetado.
drop index if exists cpr_user_data_slug_idx;
create unique index if not exists cpr_user_data_slug_idx
  on public.cpr_user_data ((perfil->>'slug'))
  where perfil->>'slug' is not null;

-- ============================================================
-- Migração: resolução de slug via função SQL (2026-06-20)
-- O filtro direto via postgrest-js (.filter('perfil->>slug','eq',valor))
-- se mostrou pouco confiável neste projeto — chegou a retornar "não
-- encontrado" para um slug real em produção, fazendo toda requisição cair
-- no fallback de varrer a tabela em código (sem usar o índice acima). Esta
-- função roda a comparação direto em SQL, garantindo o uso do índice.
-- ============================================================
create or replace function public.cpr_resolve_slug(p_slug text)
returns table(user_id uuid, perfil jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select user_id, perfil
  from public.cpr_user_data
  where perfil->>'slug' = p_slug
  limit 1;
$$;

-- SEGURANÇA (2026-07-03): Postgres concede EXECUTE a PUBLIC por padrão em
-- funções novas — isso inclui os papéis "anon" e "authenticated" do
-- PostgREST/Supabase. Sem o revoke abaixo, QUALQUER pessoa com a anon key
-- (pública, embutida no tool.html) podia chamar
-- rpc('cpr_resolve_slug', {p_slug}) e receber o perfil INTEIRO de qualquer
-- corretor (telefone, e-mail, logo, templates) — slugs são públicos por
-- definição (é o link do site do corretor). Achado C1 da auditoria.
revoke execute on function public.cpr_resolve_slug(text) from public, anon, authenticated;
grant execute on function public.cpr_resolve_slug(text) to service_role;

-- ============================================================
-- Migração: Gestão de Imóveis / catálogo (2026-06-24)
-- Primeiro módulo do pivô para CRM imobiliário completo (próximos:
-- Funil de Vendas, Gestão de Vendas, Dashboard). Nova coluna jsonb
-- seguindo o MESMO padrão de `leads`/`historico` — sem tabela nova,
-- RLS já cobre a tabela inteira por user_id. Idempotente.
-- ============================================================
alter table public.cpr_user_data
  add column if not exists imoveis jsonb not null default '[]'::jsonb;

-- Sem GRANT adicional necessário: a coluna nova já está coberta pelo
-- grant select/insert/update on public.cpr_user_data feito acima.

-- ============================================================
-- Migração: Vendas / registro de comissão (2026-06-24)
-- Terceiro módulo do pivô para CRM imobiliário completo. Nova coluna
-- jsonb seguindo o MESMO padrão de `leads`/`imoveis`/`historico` — sem
-- tabela nova, RLS já cobre a tabela inteira por user_id. Idempotente.
-- Cada venda referencia leadId/imovelId (rastreabilidade) mas guarda os
-- dados principais (cliente, imóvel, valor, comissão) direto no objeto.
-- ============================================================
alter table public.cpr_user_data
  add column if not exists vendas jsonb not null default '[]'::jsonb;

-- Sem GRANT adicional necessário: a coluna nova já está coberta pelo
-- grant select/insert/update on public.cpr_user_data feito acima.

-- ============================================================
-- Migração: Proposta por link + "visualizada" (2026-06-29)
-- O corretor gera um link público da proposta (selosales.com.br/p/<id>),
-- envia ao cliente e sabe QUANDO ele abriu (sinal de lead quente).
-- O HTML renderizado da proposta é guardado autossuficiente (CSS inline).
-- O corretor lê/gera as próprias (RLS por owner); a página pública lê por
-- id via service role; a contagem de abertura é incrementada via service
-- role (rota /api/proposta-view), só por navegadores reais (filtra o bot
-- de preview do WhatsApp, que não roda JS).
-- ============================================================
create table if not exists public.cpr_public_proposals (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  titulo        text,
  cliente       text,
  cor           text,
  html          text not null,
  views         int not null default 0,
  first_view_at timestamptz,
  last_view_at  timestamptz,
  created_at    timestamptz not null default now()
);
alter table public.cpr_public_proposals enable row level security;

grant select, insert, update, delete on public.cpr_public_proposals to authenticated;
grant select, insert, update on public.cpr_public_proposals to service_role;

drop policy if exists "cpp_owner_all" on public.cpr_public_proposals;
create policy "cpp_owner_all"
  on public.cpr_public_proposals for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create index if not exists cpr_public_proposals_owner_idx
  on public.cpr_public_proposals (owner_id, created_at desc);

-- Assinatura eletrônica simples (aceite do cliente no link). Válida como
-- manifestação de vontade (Lei 14.063/2020 + MP 2.200-2), com trilha de
-- evidências: nome, CPF, rabisco (dataURL), data/hora e IP. Idempotente.
alter table public.cpr_public_proposals
  add column if not exists signed_at        timestamptz,
  add column if not exists signer_name      text,
  add column if not exists signer_cpf       text,
  add column if not exists signer_signature text,
  add column if not exists signer_ip        text;

-- ============================================================
-- Migração: Contas multiusuário (2026-07-03) — Prioridade 4 (base técnica)
-- Uma conta (imobiliária/loteadora/corretor) agrupa N usuários com papéis.
-- Quem comprou na Hotmart vira dono/admin da conta; membros são convidados
-- pela rota /api/conta-membros (service role, valida assento e papel).
-- Os dados de trabalho de cada usuário seguem individuais em cpr_user_data.
-- marca_forcada: identidade que o admin pode impor às propostas dos membros
--   ({nome, info, cor, logo, obrigatoria: bool}).
--
-- ROLLBACK (reversível):
--   drop policy if exists "cpa_select_member" on public.cpr_accounts;
--   drop policy if exists "cpa_update_owner"  on public.cpr_accounts;
--   drop policy if exists "cpm_select_member" on public.cpr_account_members;
--   drop function if exists public.cpr_my_account_ids();
--   drop table if exists public.cpr_account_members;
--   drop table if exists public.cpr_accounts;
-- ============================================================
create table if not exists public.cpr_accounts (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  nome          text not null default '',
  plano         text not null default 'corretor',   -- corretor | imobiliaria | loteadora
  max_users     int  not null default 1,
  marca_forcada jsonb,
  created_at    timestamptz not null default now()
);
create unique index if not exists cpr_accounts_owner_idx
  on public.cpr_accounts (owner_id);

create table if not exists public.cpr_account_members (
  account_id uuid not null references public.cpr_accounts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  email      text not null default '',
  papel      text not null default 'corretor',      -- admin | corretor | consultor
  created_at timestamptz not null default now(),
  primary key (account_id, user_id)
);
create index if not exists cpr_account_members_user_idx
  on public.cpr_account_members (user_id);

alter table public.cpr_accounts        enable row level security;
alter table public.cpr_account_members enable row level security;

-- Grants de tabela (mesmo motivo dos grants acima: SQL puro não os cria).
-- authenticated: leitura; update SÓ nas colunas que o dono pode editar pelo
-- client (nome e marca da equipe) — plano/max_users só mudam via service role.
grant select on public.cpr_accounts to authenticated;
grant update (nome, marca_forcada) on public.cpr_accounts to authenticated;
grant select on public.cpr_account_members to authenticated;
grant select, insert, update, delete on public.cpr_accounts        to service_role;
grant select, insert, update, delete on public.cpr_account_members to service_role;

-- Policies de cpr_account_members não podem consultar a própria tabela
-- (recursão infinita) — função security definer resolve.
create or replace function public.cpr_my_account_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select account_id from public.cpr_account_members where user_id = auth.uid()
$$;
-- Higiene (2026-07-03): revoga de anon/public o EXECUTE que o Postgres
-- concede por padrão. Risco baixo (auth.uid() é nulo para anon, a função
-- retorna vazio), mas alinhado ao mesmo tratamento de cpr_resolve_slug.
revoke execute on function public.cpr_my_account_ids() from public, anon;
grant execute on function public.cpr_my_account_ids() to authenticated;

-- SELECT conta: dono ou membro
drop policy if exists "cpa_select_member" on public.cpr_accounts;
create policy "cpa_select_member"
  on public.cpr_accounts for select
  to authenticated
  using (owner_id = auth.uid() or id in (select public.cpr_my_account_ids()));

-- UPDATE conta: só o dono (colunas limitadas pelo grant acima)
drop policy if exists "cpa_update_owner" on public.cpr_accounts;
create policy "cpa_update_owner"
  on public.cpr_accounts for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- SELECT membros: qualquer membro da mesma conta vê a equipe
drop policy if exists "cpm_select_member" on public.cpr_account_members;
create policy "cpm_select_member"
  on public.cpr_account_members for select
  to authenticated
  using (account_id in (select public.cpr_my_account_ids()));

-- Sem policies de INSERT/UPDATE/DELETE para authenticated: convites e
-- remoções passam pela rota /api/conta-membros (service role), que valida
-- papel de admin e o limite de assentos do plano.

-- ============================================================
-- Migração: revisão otimista do documento do usuário (2026-07-03)
-- Achado C2 da auditoria: salvarRemoto() reescrevia as 5 colunas jsonb
-- inteiras num upsert cego (last-write-wins) — dois dispositivos abertos
-- se sobrescreviam mutuamente e o dado perdido era irrecuperável.
-- A coluna rev permite o update condicional (.eq('rev', n)): se outro
-- dispositivo salvou no meio, o update afeta 0 linhas e o client mescla
-- os dois estados antes de tentar de novo, em vez de atropelar.
-- Rows existentes nascem com rev 0 — compatível com o client novo; o
-- client antigo (upsert sem rev) continua funcionando até todo mundo
-- recarregar a página.
-- ============================================================
alter table public.cpr_user_data
  add column if not exists rev bigint not null default 0;

-- ============================================================
-- Migração: lookup de usuário por email via SQL (2026-07-03)
-- Achado C6 da auditoria: o webhook da Hotmart (e as rotas de convite)
-- localizavam usuário por email paginando listUsers() — um scan O(n) da
-- base INTEIRA de contas a cada evento de pagamento. Com a base crescendo
-- isso estoura o timeout da function na Vercel e eventos de compra/
-- cancelamento passam a falhar. Esta função consulta auth.users indexado.
-- SECURITY DEFINER + revoke: só o service role pode chamar (mesmo
-- tratamento de cpr_resolve_slug — nunca expor a anon/authenticated).
-- ============================================================
create or replace function public.cpr_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;
revoke execute on function public.cpr_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.cpr_user_id_by_email(text) to service_role;

-- ============================================================
-- Migração: CHECK constraints em colunas de enum (2026-07-03)
-- Essas colunas eram só texto livre com o conjunto de valores documentado
-- em comentário — nada impedia um update do próprio corretor gravar um
-- valor fora da lista (silenciosamente quebrando filtros no client).
-- Idempotente: DO block ignora "já existe" se a constraint já foi criada.
-- ============================================================
do $$ begin
  alter table public.cpr_public_leads
    add constraint cpr_public_leads_status_check
    check (status in ('pendente', 'importado', 'descartado'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.cpr_accounts
    add constraint cpr_accounts_plano_check
    check (plano in ('corretor', 'imobiliaria', 'loteadora'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.cpr_account_members
    add constraint cpr_account_members_papel_check
    check (papel in ('admin', 'corretor', 'consultor'));
exception when duplicate_object then null;
end $$;
