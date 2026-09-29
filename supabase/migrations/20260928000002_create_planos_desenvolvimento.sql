create table if not exists public.planos_desenvolvimento (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  criado_por uuid not null references auth.users (id) on delete cascade default auth.uid(),
  titulo text not null,
  descricao text not null default '',
  status text not null default 'ativo' check (status in ('ativo', 'finalizado')),
  prazo date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.pdi_objetivos (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.planos_desenvolvimento (id) on delete cascade,
  titulo text not null,
  descricao text not null default '',
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido')),
  prazo date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists planos_desenvolvimento_colaborador_id_idx
  on public.planos_desenvolvimento (colaborador_id);
create index if not exists pdi_objetivos_plano_id_idx
  on public.pdi_objetivos (plano_id);

alter table public.planos_desenvolvimento enable row level security;
alter table public.pdi_objetivos enable row level security;

create policy "colaborador reads own development plans"
  on public.planos_desenvolvimento for select to authenticated
  using (exists (
    select 1 from public.colaboradores c
    where c.id = colaborador_id and c.user_id = auth.uid()
  ));

create policy "colaborador creates own development plans"
  on public.planos_desenvolvimento for insert to authenticated
  with check (
    criado_por = auth.uid()
    and exists (
      select 1 from public.colaboradores c
      where c.id = colaborador_id and c.user_id = auth.uid()
    )
  );

create policy "colaborador updates own development plans"
  on public.planos_desenvolvimento for update to authenticated
  using (exists (
    select 1 from public.colaboradores c
    where c.id = colaborador_id and c.user_id = auth.uid()
  ))
  with check (
    criado_por = auth.uid()
    and exists (
      select 1 from public.colaboradores c
      where c.id = colaborador_id and c.user_id = auth.uid()
    )
  );

create policy "colaborador deletes own development plans"
  on public.planos_desenvolvimento for delete to authenticated
  using (exists (
    select 1 from public.colaboradores c
    where c.id = colaborador_id and c.user_id = auth.uid()
  ));

create policy "colaborador reads objectives of own plans"
  on public.pdi_objetivos for select to authenticated
  using (exists (
    select 1
    from public.planos_desenvolvimento p
    join public.colaboradores c on c.id = p.colaborador_id
    where p.id = plano_id and c.user_id = auth.uid()
  ));

create policy "colaborador creates objectives of own plans"
  on public.pdi_objetivos for insert to authenticated
  with check (exists (
    select 1
    from public.planos_desenvolvimento p
    join public.colaboradores c on c.id = p.colaborador_id
    where p.id = plano_id and c.user_id = auth.uid()
  ));

create policy "colaborador updates objectives of own plans"
  on public.pdi_objetivos for update to authenticated
  using (exists (
    select 1
    from public.planos_desenvolvimento p
    join public.colaboradores c on c.id = p.colaborador_id
    where p.id = plano_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from public.planos_desenvolvimento p
    join public.colaboradores c on c.id = p.colaborador_id
    where p.id = plano_id and c.user_id = auth.uid()
  ));

create policy "colaborador deletes objectives of own plans"
  on public.pdi_objetivos for delete to authenticated
  using (exists (
    select 1
    from public.planos_desenvolvimento p
    join public.colaboradores c on c.id = p.colaborador_id
    where p.id = plano_id and c.user_id = auth.uid()
  ));

-- O schema ainda não possui gestor/equipe formal. Para preencher a área de equipe,
-- retornamos apenas perfis mínimos de colegas do mesmo setor do usuário autenticado.
create or replace function public.listar_equipe_colaborador()
returns table (
  id uuid,
  user_id uuid,
  nome text,
  cargo text,
  setor text,
  setor_sigla text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.user_id, c.nome, ca.nome, s.nome, s.sigla
  from public.colaboradores atual
  join public.colaboradores c on c.setor_id = atual.setor_id
  join public.cargos ca on ca.id = c.cargo_id
  join public.setores s on s.id = c.setor_id
  where atual.user_id = auth.uid()
    and auth.uid() is not null
  order by c.nome;
$$;

revoke all on function public.listar_equipe_colaborador() from public;
grant execute on function public.listar_equipe_colaborador() to authenticated;

grant select, insert, update, delete on public.planos_desenvolvimento to authenticated;
grant select, insert, update, delete on public.pdi_objetivos to authenticated;
