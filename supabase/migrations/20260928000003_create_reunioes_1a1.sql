create or replace function public.colaborador_compartilha_setor(p_colaborador_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.colaboradores atual
    join public.colaboradores colega on colega.setor_id = atual.setor_id
    where atual.user_id = auth.uid()
      and colega.id = p_colaborador_id
      and auth.uid() is not null
  );
$$;

revoke all on function public.colaborador_compartilha_setor(uuid) from public;
grant execute on function public.colaborador_compartilha_setor(uuid) to authenticated;

create table if not exists public.reunioes_1a1 (
  id uuid primary key default gen_random_uuid(),
  organizador_id uuid not null references public.colaboradores (id) on delete cascade,
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  data_reuniao date not null,
  hora_inicio time not null,
  hora_fim time not null,
  categoria text,
  frequencia text not null default 'nenhuma'
    check (frequencia in ('nenhuma', 'semanal', 'quinzenal', 'mensal')),
  recorrencia_ate date,
  status text not null default 'agendada'
    check (status in ('agendada', 'concluida', 'cancelada')),
  criado_em timestamptz not null default now(),
  constraint reunioes_1a1_horario_valido check (hora_fim > hora_inicio),
  constraint reunioes_1a1_sem_reuniao_consigo check (organizador_id <> colaborador_id)
);

create table if not exists public.reunioes_1a1_topicos (
  id uuid primary key default gen_random_uuid(),
  reuniao_id uuid not null references public.reunioes_1a1 (id) on delete cascade,
  titulo text not null,
  criado_em timestamptz not null default now()
);

create index if not exists reunioes_1a1_organizador_data_idx
  on public.reunioes_1a1 (organizador_id, data_reuniao);
create index if not exists reunioes_1a1_colaborador_data_idx
  on public.reunioes_1a1 (colaborador_id, data_reuniao);
create index if not exists reunioes_1a1_topicos_reuniao_id_idx
  on public.reunioes_1a1_topicos (reuniao_id);

alter table public.reunioes_1a1 enable row level security;
alter table public.reunioes_1a1_topicos enable row level security;

create policy "participants read one to one meetings"
  on public.reunioes_1a1 for select to authenticated
  using (
    organizador_id in (select c.id from public.colaboradores c where c.user_id = auth.uid())
    or colaborador_id in (select c.id from public.colaboradores c where c.user_id = auth.uid())
  );

create policy "colaborador creates same sector meetings"
  on public.reunioes_1a1 for insert to authenticated
  with check (
    organizador_id in (select c.id from public.colaboradores c where c.user_id = auth.uid())
    and public.colaborador_compartilha_setor(colaborador_id)
  );

create policy "organizer updates own meetings"
  on public.reunioes_1a1 for update to authenticated
  using (organizador_id in (select c.id from public.colaboradores c where c.user_id = auth.uid()))
  with check (
    organizador_id in (select c.id from public.colaboradores c where c.user_id = auth.uid())
    and public.colaborador_compartilha_setor(colaborador_id)
  );

create policy "organizer deletes own meetings"
  on public.reunioes_1a1 for delete to authenticated
  using (organizador_id in (select c.id from public.colaboradores c where c.user_id = auth.uid()));

create policy "participants read meeting topics"
  on public.reunioes_1a1_topicos for select to authenticated
  using (exists (
    select 1 from public.reunioes_1a1 r
    where r.id = reuniao_id
      and (
        r.organizador_id in (select c.id from public.colaboradores c where c.user_id = auth.uid())
        or r.colaborador_id in (select c.id from public.colaboradores c where c.user_id = auth.uid())
      )
  ));

create policy "organizer manages meeting topics"
  on public.reunioes_1a1_topicos for all to authenticated
  using (exists (
    select 1 from public.reunioes_1a1 r
    where r.id = reuniao_id
      and r.organizador_id in (select c.id from public.colaboradores c where c.user_id = auth.uid())
  ))
  with check (exists (
    select 1 from public.reunioes_1a1 r
    where r.id = reuniao_id
      and r.organizador_id in (select c.id from public.colaboradores c where c.user_id = auth.uid())
  ));

grant select, insert, update, delete on public.reunioes_1a1 to authenticated;
grant select, insert, update, delete on public.reunioes_1a1_topicos to authenticated;
