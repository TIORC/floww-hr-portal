-- Estrutura de colaboradores: setor -> cargo -> colaborador (ligado ao auth.users)

create table if not exists public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  sigla text not null,
  criado_em timestamptz not null default now()
);

create table if not exists public.cargos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  setor_id uuid not null references public.setores (id) on delete restrict,
  criado_em timestamptz not null default now()
);

create table if not exists public.colaboradores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nome text not null,
  setor_id uuid not null references public.setores (id) on delete restrict,
  cargo_id uuid not null references public.cargos (id) on delete restrict,
  criado_em timestamptz not null default now()
);

create index if not exists colaboradores_setor_id_idx on public.colaboradores (setor_id);
create index if not exists colaboradores_cargo_id_idx on public.colaboradores (cargo_id);
create index if not exists cargos_setor_id_idx on public.cargos (setor_id);

alter table public.setores enable row level security;
alter table public.cargos enable row level security;
alter table public.colaboradores enable row level security;

-- Setores e cargos sao catalogos: qualquer usuario autenticado pode consultar.
create policy "authenticated can read setores"
  on public.setores
  for select
  to authenticated
  using (true);

create policy "authenticated can read cargos"
  on public.cargos
  for select
  to authenticated
  using (true);

-- Colaborador le apenas o proprio registro.
create policy "collaboradores read own record"
  on public.colaboradores
  for select
  to authenticated
  using (user_id = auth.uid());

-- View que junta colaborador + cargo + setor em uma unica consulta.
create or replace view public.perfil_colaborador
with (security_invoker = true)
as
select
  c.id,
  c.user_id,
  c.nome,
  c.cargo_id,
  ca.nome as cargo,
  c.setor_id,
  s.nome as setor,
  s.sigla as setor_sigla
from public.colaboradores c
join public.cargos ca on ca.id = c.cargo_id
join public.setores s on s.id = c.setor_id;

grant select on public.perfil_colaborador to authenticated;

-- Dados do TI Maracas.
insert into public.setores (nome, sigla)
values ('TI', 'TI')
on conflict (nome) do nothing;

insert into public.cargos (nome, setor_id)
select 'Desenvolvedor do Sistema', id
from public.setores
where nome = 'TI'
on conflict (nome) do nothing;

insert into public.colaboradores (user_id, nome, setor_id, cargo_id)
select
  u.id,
  'TI Maracas',
  s.id,
  ca.id
from auth.users u
cross join public.setores s
cross join public.cargos ca
where u.email = 'timaracas@orcoma.com.br'
  and s.nome = 'TI'
  and ca.nome = 'Desenvolvedor do Sistema'
on conflict (user_id) do nothing;
