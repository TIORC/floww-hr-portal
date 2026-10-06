-- Permite que usuarios autenticados gerenciem o catalogo de setores.
drop policy if exists "authenticated can insert setores" on public.setores;
create policy "authenticated can insert setores"
  on public.setores
  for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update setores" on public.setores;
create policy "authenticated can update setores"
  on public.setores
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete setores" on public.setores;
create policy "authenticated can delete setores"
  on public.setores
  for delete
  to authenticated
  using (true);
