-- Marca do usuário (nome, @, marca d'água, foto, fontes padrão), igual em todos os aparelhos
create table if not exists public.user_brand (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  -- só textos e URLs; imagens vão para o Storage
  constraint user_brand_size check (pg_column_size(data) < 16384)
);

alter table public.user_brand enable row level security;

create policy "Users read own brand" on public.user_brand
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users insert own brand" on public.user_brand
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users update own brand" on public.user_brand
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.user_brand from anon;
grant select, insert, update on public.user_brand to authenticated;
