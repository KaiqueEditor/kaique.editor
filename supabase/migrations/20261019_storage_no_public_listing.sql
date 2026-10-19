-- Visitantes conseguiam listar todos os arquivos (e os user_ids nas pastas).
-- As imagens continuam acessíveis pela URL pública (bucket público ignora RLS);
-- o dono ainda precisa de SELECT na própria pasta para o upload com upsert.
drop policy if exists "Allow public read" on storage.objects;
create policy "Users read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'carousel-images' and (storage.foldername(name))[1] = auth.uid()::text);
