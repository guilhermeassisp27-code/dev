-- Setup do atendimento de leads por WhatsApp (F0 — piloto).
-- Rodar no SQL Editor do Supabase. Idempotente (pode rodar de novo).
--
-- Modelo: o webhook (service role) escreve; o corretor só LÊ o que é dele
-- via RLS — mesma disciplina da cpr_user_data.

-- Números conectados: mapeia o phone_number_id da Meta para o corretor dono.
create table if not exists public.cpr_wa_numbers (
  phone_number_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_number text,
  bot_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cpr_wa_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phone_number_id text not null references public.cpr_wa_numbers (phone_number_id) on delete cascade,
  lead_phone text not null,
  lead_name text,
  -- qualifying: bot conversando | handoff: pronto para o corretor humano |
  -- paused: corretor respondeu manualmente, bot fica quieto até paused_until
  status text not null default 'qualifying'
    check (status in ('qualifying', 'handoff', 'paused')),
  paused_until timestamptz,
  -- dados coletados pelo bot: intenção, tipo de imóvel, região, faixa, prazo
  lead_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone_number_id, lead_phone)
);

create table if not exists public.cpr_wa_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.cpr_wa_conversations (id) on delete cascade,
  -- id da mensagem na Meta (wamid...). Unique = idempotência: a Meta
  -- reenvia o webhook em falha e o insert duplicado é ignorado.
  wa_message_id text unique,
  direction text not null check (direction in ('inbound', 'outbound', 'corretor')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists cpr_wa_conversations_user_idx
  on public.cpr_wa_conversations (user_id, updated_at desc);
create index if not exists cpr_wa_messages_conv_idx
  on public.cpr_wa_messages (conversation_id, created_at);

-- RLS: corretor lê só o que é dele. Escrita fica exclusiva do service role
-- (webhook) — nenhuma policy de insert/update/delete para authenticated.
alter table public.cpr_wa_numbers enable row level security;
alter table public.cpr_wa_conversations enable row level security;
alter table public.cpr_wa_messages enable row level security;

drop policy if exists "wa_numbers_select_own" on public.cpr_wa_numbers;
create policy "wa_numbers_select_own" on public.cpr_wa_numbers
  for select using (auth.uid() = user_id);

drop policy if exists "wa_conversations_select_own" on public.cpr_wa_conversations;
create policy "wa_conversations_select_own" on public.cpr_wa_conversations
  for select using (auth.uid() = user_id);

drop policy if exists "wa_messages_select_own" on public.cpr_wa_messages;
create policy "wa_messages_select_own" on public.cpr_wa_messages
  for select using (
    exists (
      select 1 from public.cpr_wa_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

grant select on public.cpr_wa_numbers to authenticated;
grant select on public.cpr_wa_conversations to authenticated;
grant select on public.cpr_wa_messages to authenticated;

-- O webhook usa a service role key (bypassa RLS, mas ainda precisa do GRANT
-- de tabela — mesmo caso do cpr_user_data, ver CLAUDE.md). Sem isso, toda
-- leitura/escrita do webhook retorna "permission denied for table".
grant select, insert, update, delete on public.cpr_wa_numbers to service_role;
grant select, insert, update, delete on public.cpr_wa_conversations to service_role;
grant select, insert, update, delete on public.cpr_wa_messages to service_role;

-- LGPD: conversas de leads são dados pessoais de terceiros. Expurgo
-- automático de conversas paradas há mais de 180 dias (mesmo padrão do
-- expurgo de fotos). Requer a extensão pg_cron já habilitada.
select cron.schedule(
  'cpr-wa-expurgo-lgpd',
  '30 3 * * *',
  $$
    delete from public.cpr_wa_conversations
    where updated_at < now() - interval '180 days'
  $$
);
