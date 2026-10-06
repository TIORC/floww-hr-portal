-- Migration consolidada para a pagina /setores (src/routes/setores.tsx).
-- Garante a tabela public.setores com as colunas usadas pela UI:
-- id, nome, sigla, criado_em + RLS + CRUD para usuarios autenticados.
-- Idempotente: pode rodar com `supabase db push` mesmo se as migrations
-- 20260925000000 e 20261005000000 ja foram aplicadas.

create extension if not exists "pgcrypto";

create table if not exists public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  sigla text not null,
  criado_em timestamptz not null default now()
);

-- Garante colunas caso a tabela ja exista de uma versao antiga.
alter table public.setores add column if not exists nome text;
alter table public.setores add column if not exists sigla text;
alter table public.setores add column if not exists criado_em timestamptz not null default now();

-- Constraints de qualidade (nome/sigla nao vazios, limites iguais aos inputs da UI).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'setores_nome_nao_vazio') then
    alter table public.setores
      add constraint setores_nome_nao_vazio check (char_length(btrim(nome)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'setores_sigla_nao_vazia') then
    alter table public.setores
      add constraint setores_sigla_nao_vazia check (char_length(btrim(sigla)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'setores_nome_max') then
    alter table public.setores
      add constraint setores_nome_max check (char_length(nome) <= 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'setores_sigla_max') then
    alter table public.setores
      add constraint setores_sigla_max check (char_length(sigla) <= 20);
  end if;
end
$$;

-- Nome unico (a UI trata o erro 23505 como "Ja existe um setor com esse nome").
create unique index if not exists setores_nome_unique on public.setores (nome);
create index if not exists setores_nome_order_idx on public.setores (nome);
create index if not exists setores_sigla_idx on public.setores (sigla);

alter table public.setores enable row level security;

-- Leitura: qualquer usuario autenticado pode listar (usado no /setores e nos selects de setor).
drop policy if exists "authenticated can read setores" on public.setores;
create policy "authenticated can read setores"
  on public.setores
  for select
  to authenticated
  using (true);

-- Escrita: qualquer usuario autenticado pode criar/editar/excluir pelo /setores.
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

-- Grants necessarios para o PostgREST (sem eles o select/insert/update/delete falha com 42501).
grant select, insert, update, delete on public.setores to authenticated;
