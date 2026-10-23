-- Cuesies: rename the old poolsies_ tables to cuesies_ (keeps all existing rows).
-- Run once in the Supabase SQL editor if you created the tables under their old names.

alter table if exists public.poolsies_levels rename to cuesies_levels;
alter table if exists public.poolsies_scores rename to cuesies_scores;
alter index if exists public.poolsies_scores_board rename to cuesies_scores_board;

-- Row-level security moves with the tables; re-create the policies so their definitions match the new names.
alter table public.cuesies_levels enable row level security;
drop policy if exists "read released levels" on public.cuesies_levels;
create policy "read released levels"
  on public.cuesies_levels for select to anon, authenticated
  using (level_date <= ((now() at time zone 'utc')::date + 1));

alter table public.cuesies_scores enable row level security;
drop policy if exists "anyone can insert scores" on public.cuesies_scores;
create policy "anyone can insert scores"
  on public.cuesies_scores for insert to anon, authenticated
  with check (play_date between ((now() at time zone 'utc')::date - 1) and ((now() at time zone 'utc')::date + 1));
drop policy if exists "anyone can read scores" on public.cuesies_scores;
create policy "anyone can read scores"
  on public.cuesies_scores for select to anon, authenticated
  using (true);

-- the old 15-shot cap on single tables is gone from the game; drop it here too if it exists
do $$ declare c text; begin
  for c in select conname from pg_constraint where conrelid = 'public.cuesies_scores'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%<= 15%'
  loop execute format('alter table public.cuesies_scores drop constraint %I', c); end loop;
end $$;
