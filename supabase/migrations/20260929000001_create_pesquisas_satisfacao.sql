create table if not exists public.pesquisas_satisfacao (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null check (char_length(descricao) <= 12000),
  anonima boolean not null default false,
  prazo date not null,
  criado_por uuid not null references auth.users (id) on delete cascade default auth.uid(),
  criado_em timestamptz not null default now()
);

create index if not exists pesquisas_satisfacao_prazo_idx
  on public.pesquisas_satisfacao (prazo desc);

alter table public.pesquisas_satisfacao enable row level security;

drop policy if exists "authenticated users read satisfaction surveys" on public.pesquisas_satisfacao;
create policy "authenticated users read satisfaction surveys"
  on public.pesquisas_satisfacao for select to authenticated
  using (true);

drop policy if exists "authenticated users publish satisfaction surveys" on public.pesquisas_satisfacao;
create policy "authenticated users publish satisfaction surveys"
  on public.pesquisas_satisfacao for insert to authenticated
  with check (criado_por = auth.uid());

drop policy if exists "authors update satisfaction surveys" on public.pesquisas_satisfacao;
create policy "authors update satisfaction surveys"
  on public.pesquisas_satisfacao for update to authenticated
  using (criado_por = auth.uid())
  with check (criado_por = auth.uid());

drop policy if exists "authors delete satisfaction surveys" on public.pesquisas_satisfacao;
create policy "authors delete satisfaction surveys"
  on public.pesquisas_satisfacao for delete to authenticated
  using (criado_por = auth.uid());

grant select, insert, update, delete on public.pesquisas_satisfacao to authenticated;
