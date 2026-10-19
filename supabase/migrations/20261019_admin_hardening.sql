-- Admin: proteções no banco, auditoria, métricas agregadas e assets da plataforma.

-- ── 1. Auditoria de ações administrativas ───────────────────────────────────
create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  target uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
drop policy if exists "Admins read audit" on public.admin_audit;
create policy "Admins read audit" on public.admin_audit
  for select to authenticated using (public.is_admin());
-- Sem policy de escrita: só o trigger (security definer) grava.

-- ── 2. Regras de alteração de perfis ─────────────────────────────────────────
create or replace function public.protect_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- e-mail vem do Auth; não muda por aqui
  new.email := old.email;

  if new.role is distinct from old.role then
    if new.role not in ('admin', 'user') then  -- mesma regra do check profiles_role_check
      raise exception 'Papel inválido: %', new.role using errcode = '22023';
    end if;
    if auth.uid() is not null and old.id = auth.uid() then
      raise exception 'Você não pode alterar o próprio papel' using errcode = '42501';
    end if;
    if old.role = 'admin' and new.role <> 'admin'
       and (select count(*) from public.profiles where role = 'admin') <= 1 then
      raise exception 'A plataforma precisa de pelo menos um admin' using errcode = '42501';
    end if;
    insert into public.admin_audit (actor, action, target, detail)
    values (auth.uid(), 'role_change', old.id,
            jsonb_build_object('email', old.email, 'from', old.role, 'to', new.role));
  end if;
  return new;
end;
$$;
revoke execute on function public.protect_profile_update() from public, anon, authenticated;

drop trigger if exists protect_profile_update on public.profiles;
create trigger protect_profile_update
  before update on public.profiles
  for each row execute function public.protect_profile_update();

-- ── 3. Métricas agregadas (só admin) ─────────────────────────────────────────
-- Antes o painel baixava login_logs inteiro e o PostgREST cortava em 1.000 linhas.
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;

  with
  logins as (select user_id, created_at, device, browser from public.login_logs),
  per_user as (
    select p.id, p.email, p.role, p.created_at,
      (select count(*) from public.carousels c where c.user_id = p.id) as carousels,
      (select max(c.updated_at) from public.carousels c where c.user_id = p.id) as last_edit,
      (select count(*) from public.export_logs e where e.user_id = p.id) as exports,
      (select coalesce(sum(e.slide_count), 0) from public.export_logs e where e.user_id = p.id) as slides,
      (select max(l.created_at) from logins l where l.user_id = p.id) as last_login,
      (select count(distinct l.created_at::date) from logins l where l.user_id = p.id) as active_days
    from public.profiles p
  )
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'users', (select count(*) from public.profiles),
      'carousels', (select count(*) from public.carousels),
      'exports', (select count(*) from public.export_logs),
      'slides', (select coalesce(sum(slide_count), 0) from public.export_logs),
      'dau', (select count(distinct user_id) from logins where created_at >= date_trunc('day', now())),
      'wau', (select count(distinct user_id) from logins where created_at >= now() - interval '7 days'),
      'mau', (select count(distinct user_id) from logins where created_at >= now() - interval '30 days'),
      'new_users_30d', (select count(*) from public.profiles where created_at >= now() - interval '30 days')
    ),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('date', d::date, 'users', coalesce(u.n, 0)) order by d)
      from generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') d
      left join (
        select created_at::date as day, count(distinct user_id) as n
        from logins where created_at >= now() - interval '30 days' group by 1
      ) u on u.day = d::date
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('name', k, 'users', n) order by n desc)
      from (select coalesce(device, 'desktop') k, count(distinct user_id) n from logins
            where created_at >= now() - interval '30 days' group by 1) x
    ), '[]'::jsonb),
    'browsers', coalesce((
      select jsonb_agg(jsonb_build_object('name', k, 'users', n) order by n desc)
      from (select coalesce(browser, 'outro') k, count(distinct user_id) n from logins
            where created_at >= now() - interval '30 days' group by 1) x
    ), '[]'::jsonb),
    'users', coalesce((
      select jsonb_agg(to_jsonb(per_user) order by coalesce(last_login, last_edit, created_at) desc nulls last)
      from per_user
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;
revoke execute on function public.admin_dashboard() from public, anon;
grant execute on function public.admin_dashboard() to authenticated;

-- ── 4. Assets da plataforma (paletas, fontes, presets compartilhados) ───────
create table if not exists public.platform_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  type text not null check (type in ('font', 'palette', 'preset')),
  data jsonb not null default '{}'::jsonb,
  preview_url text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.platform_assets enable row level security;
drop policy if exists "Users read assets" on public.platform_assets;
create policy "Users read assets" on public.platform_assets
  for select to authenticated using (true);
drop policy if exists "Admins insert assets" on public.platform_assets;
create policy "Admins insert assets" on public.platform_assets
  for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins delete assets" on public.platform_assets;
create policy "Admins delete assets" on public.platform_assets
  for delete to authenticated using (public.is_admin());

-- ── 5. Índices para as consultas do painel ──────────────────────────────────
create index if not exists login_logs_user_created_idx on public.login_logs (user_id, created_at desc);
create index if not exists export_logs_user_idx on public.export_logs (user_id);
create index if not exists carousels_user_updated_idx on public.carousels (user_id, updated_at desc);
