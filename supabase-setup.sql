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
