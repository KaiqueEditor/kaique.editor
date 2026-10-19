-- P0 security: fecha leitura pública de dados e restringe escrita ao dono.

-- Helper: "o usuário atual é admin?" — SECURITY DEFINER evita recursão
-- infinita quando policies da tabela profiles consultam a própria profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 1. profiles: era legível por qualquer um (inclusive sem login) → e-mails expostos
drop policy if exists "Anyone can read profiles" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());
-- Sem policy de UPDATE antes: a troca de role no painel admin falhava em silêncio
create policy "Admins update profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 2. login_logs: SELECT era "true" para todos
drop policy if exists "Admins can read all login_logs" on public.login_logs;
create policy "Admins read login_logs" on public.login_logs
  for select to authenticated using (public.is_admin());
drop policy if exists "Users can insert their own login_logs" on public.login_logs;
create policy "Users insert own login_logs" on public.login_logs
  for insert to authenticated with check (user_id = auth.uid());

-- 3. export_logs: SELECT e INSERT eram "true" para todos
drop policy if exists "Admins can view all export logs" on public.export_logs;
create policy "Admins read export_logs" on public.export_logs
  for select to authenticated using (public.is_admin());
drop policy if exists "Anyone can insert export logs" on public.export_logs;
create policy "Users insert own export_logs" on public.export_logs
  for insert to authenticated with check (user_id = auth.uid());

-- 4. carousels: troca a subquery do admin pelo helper (mesmo efeito, sem depender
--    de profiles ser legível) e fixa as policies em "authenticated"
drop policy if exists "Admins see all carousels" on public.carousels;
create policy "Admins see all carousels" on public.carousels
  for select to authenticated using (public.is_admin());
drop policy if exists "Users update own carousels" on public.carousels;
create policy "Users update own carousels" on public.carousels
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. storage: qualquer usuário logado podia sobrescrever/apagar imagem de outro.
--    Agora só dentro da própria pasta ({user_id}/...). Leitura pública continua
--    (as imagens são servidas por getPublicUrl).
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow authenticated updates" on storage.objects;
drop policy if exists "Allow authenticated deletes" on storage.objects;
create policy "Users upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'carousel-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'carousel-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'carousel-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'carousel-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- 6. handle_new_user é função de trigger; não deve ser chamável via /rpc
revoke execute on function public.handle_new_user() from public, anon, authenticated;
