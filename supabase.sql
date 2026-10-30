-- Cuesies: Supabase schema (fresh setup). Upgrading from the old cuesies_ tables? Run supabase-rename.sql instead.
-- Run this in the Supabase SQL editor (Database > SQL Editor > New query).

-- ---------------------------------------------------------------
-- Levels: one row per table per day. `data` holds the level JSON
-- (title, theme, goal, cueStart, balls, obstacles, slowZones, camera).
-- ---------------------------------------------------------------
create table if not exists public.cuesies_levels (
  id           bigserial primary key,
  level_date   date        not null,
  level_order  smallint    not null check (level_order between 1 and 5),
  data         jsonb       not null,
  created_at   timestamptz not null default now(),
  unique (level_date, level_order)
);

alter table public.cuesies_levels enable row level security;

-- Anyone may read levels dated no later than tomorrow (UTC), so players in
-- every time zone can load "today" without future puzzles leaking early.
drop policy if exists "read released levels" on public.cuesies_levels;
create policy "read released levels"
  on public.cuesies_levels
  for select
  to anon, authenticated
  using (level_date <= ((now() at time zone 'utc')::date + 1));

-- (No insert/update/delete policies: add levels from the dashboard or with the service key.)

-- ---------------------------------------------------------------
-- Scores: one row per player per table per day.
-- table_order 1..5 = a single table, 0 = the daily total.
-- ---------------------------------------------------------------
create table if not exists public.cuesies_scores (
  id           bigserial primary key,
  player_id    uuid        not null,
  play_date    date        not null,
  puzzle_no    integer,
  table_order  smallint    not null check (table_order between 0 and 5),
  -- no shot limit in the game; the upper bound here only filters out junk submissions
  shots        smallint    not null check (shots between 1 and 5000),
  created_at   timestamptz not null default now(),
  unique (player_id, play_date, table_order)
);

create index if not exists cuesies_scores_board
  on public.cuesies_scores (play_date, table_order, shots);

alter table public.cuesies_scores enable row level security;

-- Anyone may submit a score.
drop policy if exists "anyone can insert scores" on public.cuesies_scores;
create policy "anyone can insert scores"
  on public.cuesies_scores
  for insert
  to anon, authenticated
  with check (play_date between ((now() at time zone 'utc')::date - 1) and ((now() at time zone 'utc')::date + 1));

-- Anyone may read scores (needed for rank, player count and "you beat X%").
drop policy if exists "anyone can read scores" on public.cuesies_scores;
create policy "anyone can read scores"
  on public.cuesies_scores
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------
-- Example: one day's five tables (swap the date). Same JSON as the
-- built-in demo levels in index.html. Positions use table units:
-- x from -1 to 1 across, z from -2 (far end) to 2 (near end).
-- Obstacle/slow-zone rotation is in degrees.
-- ---------------------------------------------------------------
insert into public.cuesies_levels (level_date, level_order, data) values
('2026-10-23', 1, '{"title":"Rack Em Up","theme":"basement","goal":{"type":"count","count":2},"cueStart":[0,1.25],"balls":[{"number":1,"pos":[0,-0.9]},{"number":9,"pos":[-0.056,-0.997]},{"number":2,"pos":[0.056,-0.997]},{"number":10,"pos":[-0.112,-1.094]},{"number":8,"pos":[0,-1.094]},{"number":3,"pos":[0.112,-1.094]},{"number":5,"pos":[0.78,-1.72]}],"obstacles":[],"slowZones":[],"camera":{"tilt":58,"rotation":0,"zoom":1}}'),
('2026-10-23', 2, '{"title":"Bottomless Coffee","theme":"diner","goal":{"type":"stripes","balls":[10,13]},"cueStart":[0,1.4],"balls":[{"number":10,"pos":[-0.55,-1]},{"number":13,"pos":[0.5,-1.45]},{"number":3,"pos":[-0.15,-1.6]},{"number":6,"pos":[0.7,0.95]}],"obstacles":[{"kind":"coffeeHole","shape":"circle","pos":[0,0],"radius":0.6},{"kind":"coffeeMug","shape":"circle","pos":[-0.5,1],"radius":0.1},{"kind":"coffeeMug","shape":"circle","pos":[0.68,-0.8],"radius":0.1},{"kind":"milkshake","shape":"circle","pos":[0.42,0.95],"radius":0.075},{"kind":"milkshake","shape":"circle","pos":[-0.7,-0.45],"radius":0.075}],"slowZones":[],"camera":{"tilt":62,"rotation":8,"zoom":1}}'),
('2026-10-23', 3, '{"title":"Under the Hood","theme":"garage","goal":{"type":"colors","balls":[3,2]},"cueStart":[0,1.3],"balls":[{"number":3,"pos":[-0.15,-1]},{"number":2,"pos":[0.35,-1.45]},{"number":5,"pos":[-0.62,-1.5]},{"number":14,"pos":[0.6,0.4]}],"obstacles":[{"kind":"toolbox","shape":"box","pos":[0,-0.3],"size":[0.72,0.26],"rotation":0},{"kind":"cone","shape":"circle","pos":[0.64,-1.05],"radius":0.1},{"kind":"sodaCan","shape":"circle","pos":[-0.55,-0.72],"radius":0.06}],"slowZones":[{"kind":"spill","shape":"circle","pos":[0.28,0.9],"radius":0.28}],"camera":{"tilt":56,"rotation":-10,"zoom":1}}'),
('2026-10-23', 4, '{"title":"Sandcastle Siege","theme":"boardwalk","goal":{"type":"specific","balls":[8]},"cueStart":[-0.2,1.4],"balls":[{"number":8,"pos":[0.25,-1.35]},{"number":1,"pos":[-0.6,-1.2]},{"number":12,"pos":[0.62,-0.2]},{"number":4,"pos":[-0.3,-1.78]}],"obstacles":[{"kind":"sandcastle","shape":"circle","pos":[0.15,-0.6],"radius":0.17},{"kind":"sandcastle","shape":"circle","pos":[0.62,-1.58],"radius":0.11},{"kind":"beachBall","shape":"circle","pos":[-0.45,-0.5],"radius":0.12}],"slowZones":[{"kind":"towel","shape":"box","pos":[-0.45,0.35],"size":[0.6,0.9],"rotation":12},{"kind":"towel","shape":"box","pos":[0.5,-0.95],"size":[0.5,0.36],"rotation":-20}],"camera":{"tilt":52,"rotation":12,"zoom":1}}'),
('2026-10-23', 5, '{"title":"Fireside Finale","theme":"cabin","goal":{"type":"order","balls":[1,2]},"cueStart":[0,1.5],"balls":[{"number":1,"pos":[-0.55,-1.45]},{"number":2,"pos":[0.62,-1.62]},{"number":7,"pos":[-0.15,-1.25]},{"number":15,"pos":[0.75,0.2]}],"obstacles":[{"kind":"book","shape":"box","pos":[-0.56,0.12],"size":[0.2,0.27],"rotation":8},{"kind":"book","shape":"box","pos":[-0.31,0.04],"size":[0.2,0.27],"rotation":-6},{"kind":"book","shape":"box","pos":[-0.06,0.15],"size":[0.2,0.27],"rotation":11},{"kind":"cocoaMug","shape":"circle","pos":[-0.55,-0.85],"radius":0.12},{"kind":"snowGlobe","shape":"circle","pos":[0.45,-0.55],"radius":0.15},{"kind":"book","shape":"box","pos":[0.55,-1.15],"size":[0.2,0.27],"rotation":-25},{"kind":"cocoaMug","shape":"circle","pos":[0,-1.75],"radius":0.1}],"slowZones":[{"kind":"rug","shape":"circle","pos":[0.35,0.72],"radius":0.3}],"camera":{"tilt":62,"rotation":-8,"zoom":1.04}}')
on conflict (level_date, level_order) do update set data = excluded.data;
