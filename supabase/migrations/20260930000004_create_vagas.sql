create table if not exists public.vagas (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references public.cargos (id) on delete restrict,
  setor_id uuid not null references public.setores (id) on delete restrict,
  titulo text not null check (char_length(titulo) > 0),
  status text not null default 'ativa' check (status in ('ativa', 'encerrada', 'cancelada')),
  criado_por uuid references auth.users (id) on delete set null default auth.uid(),
  criado_em timestamptz not null default now()
);

create index if not exists vagas_cargo_id_idx
  on public.vagas (cargo_id);

create index if not exists vagas_setor_id_idx
  on public.vagas (setor_id);

create index if not exists vagas_status_idx
  on public.vagas (status);

alter table public.vagas enable row level security;

drop policy if exists "authenticated users read vacancies" on public.vagas;
create policy "authenticated users read vacancies"
  on public.vagas for select to authenticated
  using (true);

drop policy if exists "authenticated users publish vacancies" on public.vagas;
create policy "authenticated users publish vacancies"
  on public.vagas for insert to authenticated
  with check (true);

grant select, insert on public.vagas to authenticated;

-- O cadastro de cargos hoje e somente leitura: sem insert nao da para registrar
-- um cargo novo pelo fluxo "Outro" do modal de processo seletivo.
drop policy if exists "authenticated users register cargos" on public.cargos;
create policy "authenticated users register cargos"
  on public.cargos for insert to authenticated
  with check (true);

grant insert on public.cargos to authenticated;

insert into public.setores (nome, sigla)
values
  ('Tecnologia', 'TEC'),
  ('Recursos Humanos', 'RH'),
  ('Comercial', 'COM'),
  ('Marketing', 'MKT'),
  ('Financeiro', 'FIN'),
  ('Operações', 'OPS'),
  ('Administrativo', 'ADM')
on conflict (nome) do nothing;

insert into public.cargos (nome, setor_id)
select 'Analista de Dados', s.id from public.setores s where s.nome = 'Tecnologia'
on conflict (nome) do nothing;

insert into public.cargos (nome, setor_id)
select 'Desenvolvedor Front-end', s.id from public.setores s where s.nome = 'Tecnologia'
on conflict (nome) do nothing;

insert into public.cargos (nome, setor_id)
select 'Product Designer', s.id from public.setores s where s.nome = 'Tecnologia'
on conflict (nome) do nothing;

insert into public.cargos (nome, setor_id)
select 'Analista de RH', s.id from public.setores s where s.nome = 'Recursos Humanos'
on conflict (nome) do nothing;

insert into public.cargos (nome, setor_id)
select 'Coordenador de Marketing', s.id from public.setores s where s.nome = 'Marketing'
on conflict (nome) do nothing;

insert into public.cargos (nome, setor_id)
select 'Assistente Financeiro', s.id from public.setores s where s.nome = 'Financeiro'
on conflict (nome) do nothing;

insert into public.vagas (cargo_id, setor_id, titulo, status)
select c.id, c.setor_id, c.nome, 'ativa'
from public.cargos c
where c.nome in (
  'Analista de Dados',
  'Desenvolvedor Front-end',
  'Product Designer',
  'Analista de RH',
  'Coordenador de Marketing',
  'Assistente Financeiro'
)
  and not exists (
    select 1 from public.vagas v where v.cargo_id = c.id and v.status = 'ativa'
  );