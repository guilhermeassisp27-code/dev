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
