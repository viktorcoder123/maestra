-- ============================================================
--  maestra — schema for Supabase (Postgres)
--  Paste this into Supabase SQL editor and run.
-- ============================================================

-- Clean slate (safe on an empty project; comment out if you have data)
drop table if exists reviews cascade;
drop table if exists card_state cascade;
drop table if exists cards cascade;
drop table if exists simulator_runs cascade;
drop table if exists essays cascade;
drop table if exists activity_log cascade;
drop table if exists sections cascade;
drop table if exists temas cascade;
drop table if exists kv cascade;

-- ---------- Temario ----------
create table temas (
  id          int primary key,
  number      int not null unique,
  title       text not null,
  full_title  text not null
);

create table sections (
  id          bigserial primary key,
  tema_id     int not null references temas(id) on delete cascade,
  parent_id   bigint references sections(id) on delete cascade,
  number      text not null,
  title       text not null,
  level       int not null,
  order_idx   int not null,
  content     text not null default ''
);
create index on sections (tema_id);
create index on sections (parent_id);

-- ---------- SRS cards ----------
create table cards (
  id          bigserial primary key,
  type        text not null,
  front       text not null,
  back        text not null,
  hint        text,
  tema_id     int references temas(id) on delete set null,
  section_id  bigint references sections(id) on delete set null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index on cards (tema_id);
create index on cards (type);

create table card_state (
  card_id            bigint primary key references cards(id) on delete cascade,
  ease               real not null default 2.5,
  interval_days      real not null default 0,
  reps               int not null default 0,
  lapses             int not null default 0,
  due_at             timestamptz not null default now(),
  last_reviewed_at   timestamptz
);
create index on card_state (due_at);

create table reviews (
  id             bigserial primary key,
  card_id        bigint not null references cards(id) on delete cascade,
  reviewed_at    timestamptz not null default now(),
  quality        int not null check (quality between 0 and 3),
  interval_days  real not null,
  ease           real not null
);
create index on reviews (card_id);
create index on reviews (reviewed_at);

-- ---------- Simulador ----------
create table simulator_runs (
  id                bigserial primary key,
  tema_id           int not null references temas(id),
  started_at        timestamptz not null default now(),
  submitted_at      timestamptz,
  outline           text not null default '',
  body              text not null default '',
  elapsed_seconds   int not null default 0,
  coverage_report   jsonb
);

-- ---------- Ensayos (async Claude feedback loop) ----------
create table essays (
  id            bigserial primary key,
  tema_id       int not null references temas(id),
  prompt        text not null,
  body          text not null,
  submitted_at  timestamptz not null default now(),
  status        text not null default 'pending_review'
                check (status in ('pending_review', 'reviewed')),
  feedback      text,
  feedback_at   timestamptz
);
create index on essays (status);

-- ---------- Actividad / rachas ----------
create table activity_log (
  id    bigserial primary key,
  kind  text not null,
  ts    timestamptz not null default now(),
  meta  jsonb
);
create index on activity_log (ts);

-- ---------- KV ----------
create table kv (
  key    text primary key,
  value  text not null
);

-- ---------- Memoria (section persistence) ----------
create table memory_artifacts (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('palacio','canta','frase','mapa')),
  tema_id     int references temas(id),
  list_key    text,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  unique (kind, tema_id, list_key)
);

-- ---------- RLS ----------
-- Single-user app. Publishable key is used client-side; we lock reads/writes
-- to require that key via the "anon" role, and allow service role for ingestion.
alter table temas            enable row level security;
alter table sections         enable row level security;
alter table cards            enable row level security;
alter table card_state       enable row level security;
alter table reviews          enable row level security;
alter table simulator_runs   enable row level security;
alter table essays           enable row level security;
alter table activity_log     enable row level security;
alter table kv               enable row level security;
alter table memory_artifacts enable row level security;

-- Permissive single-user policies (you're the only user; no auth layer).
-- If you later share the app, replace with proper per-user policies.
do $$ declare t text;
begin
  for t in select unnest(array[
    'temas','sections','cards','card_state','reviews',
    'simulator_runs','essays','activity_log','kv','memory_artifacts'
  ]) loop
    execute format('drop policy if exists anon_all on %I;', t);
    execute format('create policy anon_all on %I for all to anon using (true) with check (true);', t);
    execute format('drop policy if exists auth_all on %I;', t);
    execute format('create policy auth_all on %I for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ---------- Views helpful for the Panel de Debilidades ----------
create or replace view section_mastery as
with latest as (
  select c.section_id,
         count(r.id)                                               as reviews,
         avg(case when r.quality >= 2 then 1 else 0 end)::float    as accuracy,
         max(r.reviewed_at)                                        as last_reviewed
  from cards c
  left join reviews r on r.card_id = c.id
  group by c.section_id
)
select s.id            as section_id,
       s.tema_id,
       s.title,
       s.number,
       s.level,
       coalesce(l.reviews, 0)      as reviews,
       coalesce(l.accuracy, 0)     as accuracy,
       l.last_reviewed
from sections s
left join latest l on l.section_id = s.id;
