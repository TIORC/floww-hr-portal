-- Base da tela /cadastro-desligamento: colaboradores vindos da planilha (28 colunas).
-- Nao exige user_id: o login/senha da galera sera criado posteriormente.
-- ID e Email da planilha sao unique para a regra de duplicado.

create extension if not exists "pgcrypto";

create table if not exists public.colaboradores_importados (
  id uuid primary key default gen_random_uuid(),
  id_planilha text not null unique,
  nome text not null,
  nome_completo text not null,
  matricula text not null default '',
  email text not null unique,
  cpf text not null default '',
  cargo text not null default '',
  cargo_visivel text not null default '',
  unidade text not null default '',
  departamento text not null default '',
  grupos text not null default '',
  papel text not null default '',
  gestor_direto text not null default '',
  etnia text not null default '',
  sexo text not null default '',
  genero text not null default '',
  data_nascimento text not null default '',
  data_admissao text not null default '',
  data_cadastro text not null default '',
  situacao text not null default '',
  ultimo_acesso text not null default '',
  origem_cadastro text not null default '',
  gestor_direto_email text not null default '',
  participa_gamificacao text not null default '',
  desligamento text not null default '',
  ultimo_dia_trabalhado text not null default '',
  biografia text not null default '',
  idioma text not null default '',
  foto_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Backfill para linhas antigas sem id_planilha/email.
update public.colaboradores_importados
set id_planilha = 'sem-id-' || id::text
where id_planilha is null or btrim(id_planilha) = '';

update public.colaboradores_importados
set email = 'sem-email-' || id::text || '@importado.local'
where email is null or btrim(email) = '';

-- Qualidade: nome, id_planilha e email nao vazios.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'colab_importados_nome_nao_vazio') then
    alter table public.colaboradores_importados
      add constraint colab_importados_nome_nao_vazio check (char_length(btrim(nome)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'colab_importados_id_planilha_nao_vazio') then
    alter table public.colaboradores_importados
      add constraint colab_importados_id_planilha_nao_vazio check (char_length(btrim(id_planilha)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'colab_importados_email_nao_vazio') then
    alter table public.colaboradores_importados
      add constraint colab_importados_email_nao_vazio check (char_length(btrim(email)) > 0);
  end if;
end
$$;

-- Unicidade de ID e E-mail da planilha (regra de duplicado da importacao).
create unique index if not exists colaboradores_importados_id_planilha_unique
  on public.colaboradores_importados (id_planilha);
create unique index if not exists colaboradores_importados_email_unique
  on public.colaboradores_importados (email);
create index if not exists colaboradores_importados_nome_order_idx
  on public.colaboradores_importados (nome);
create index if not exists colaboradores_importados_departamento_idx
  on public.colaboradores_importados (departamento);

alter table public.colaboradores_importados enable row level security;

-- Leitura/escrita para usuarios autenticados (tela /cadastro-desligamento).
drop policy if exists "authenticated can read colaboradores_importados" on public.colaboradores_importados;
create policy "authenticated can read colaboradores_importados"
  on public.colaboradores_importados
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can insert colaboradores_importados" on public.colaboradores_importados;
create policy "authenticated can insert colaboradores_importados"
  on public.colaboradores_importados
  for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update colaboradores_importados" on public.colaboradores_importados;
create policy "authenticated can update colaboradores_importados"
  on public.colaboradores_importados
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete colaboradores_importados" on public.colaboradores_importados;
create policy "authenticated can delete colaboradores_importados"
  on public.colaboradores_importados
  for delete
  to authenticated
  using (true);

grant select, insert, update, delete on public.colaboradores_importados to authenticated;

