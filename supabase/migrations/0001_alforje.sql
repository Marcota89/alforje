-- Alforje: contas, progresso, placar do Diário, fantasmas e estatísticas.
-- Regra geral: cada jogador lê e grava só o que é dele; placar e fantasmas são públicos para leitura
-- e só a função alforje-submit (chave de serviço) grava neles, depois de refazer as lutas.

create table public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  updated_at timestamptz not null default now()
);

create table public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  t bigint not null,
  v text,
  prof text,
  run text,
  updated_at timestamptz not null default now(),
  constraint saves_size check (octet_length(coalesce(prof, '')) + octet_length(coalesce(run, '')) < 400000)
);

create table public.board (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  score integer not null check (score >= 0),
  cls text not null,
  wins integer not null,
  fights integer not null,
  proof jsonb not null,
  verified_at timestamptz not null default now(),
  primary key (user_id, day)
);
create index board_day_score on public.board (day, score desc);

create table public.ghosts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null check (char_length(code) < 8000),
  cls text not null,
  wins integer not null,
  ascension integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.runs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rec jsonb not null check (octet_length(rec::text) < 4000),
  created_at timestamptz not null default now()
);
create index runs_user on public.runs (user_id);

alter table public.players enable row level security;
alter table public.saves enable row level security;
alter table public.board enable row level security;
alter table public.ghosts enable row level security;
alter table public.runs enable row level security;

-- nomes aparecem no placar e no duelo
create policy players_read on public.players for select to anon, authenticated using (true);
create policy players_insert_own on public.players for insert to authenticated with check (id = (select auth.uid()));
create policy players_update_own on public.players for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- progresso salvo: só o dono
create policy saves_own_select on public.saves for select to authenticated using (user_id = (select auth.uid()));
create policy saves_own_insert on public.saves for insert to authenticated with check (user_id = (select auth.uid()));
create policy saves_own_update on public.saves for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- placar e fantasmas: leitura pública, sem política de escrita (só a chave de serviço grava)
create policy board_read on public.board for select to anon, authenticated using (true);
create policy ghosts_read on public.ghosts for select to anon, authenticated using (true);

-- estatísticas de balanço: cada um só insere as próprias; ninguém lê pelo app
create policy runs_insert_own on public.runs for insert to authenticated with check (user_id = (select auth.uid()));

-- a prova é grande e só interessa ao servidor: o app lê o placar sem ela
revoke select on public.board from anon, authenticated;
grant select (user_id, day, score, cls, wins, fights, verified_at) on public.board to anon, authenticated;
-- tabelas que o app nunca grava direto
revoke insert, update, delete on public.board, public.ghosts from anon, authenticated;
revoke select, update, delete on public.runs from anon, authenticated;
