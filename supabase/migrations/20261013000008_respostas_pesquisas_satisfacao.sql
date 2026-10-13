-- Respostas das pesquisas (uma resposta por colaborador por pesquisa).
-- Usada para listar, no painel, as pesquisas com prazo vigente que o colaborador ainda nao respondeu.

create table if not exists public.respostas_pesquisas_satisfacao (
  id uuid primary key default gen_random_uuid(),
  pesquisa_id uuid not null references public.pesquisas_satisfacao (id) on delete cascade,
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  respondido_em timestamptz not null default now(),
  unique (pesquisa_id, colaborador_id)
);

create index if not exists respostas_pesquisas_satisfacao_colaborador_idx
  on public.respostas_pesquisas_satisfacao (colaborador_id);

alter table public.respostas_pesquisas_satisfacao enable row level security;

-- Colaborador ve apenas as proprias respostas
drop policy if exists "colaborador read own survey responses" on public.respostas_pesquisas_satisfacao;
create policy "colaborador read own survey responses"
  on public.respostas_pesquisas_satisfacao
  for select
  to authenticated
  using (colaborador_id in (
    select c.id from public.colaboradores c where c.user_id = auth.uid()
  ));

-- Lista as pesquisas com prazo vigente (fuso de Sao Paulo) que o colaborador autenticado ainda nao respondeu
create or replace function public.listar_pesquisas_pendentes_colaborador()
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_colaborador_id uuid;
begin
  select c.id into v_colaborador_id
  from public.colaboradores c
  where c.user_id = auth.uid();

  if v_colaborador_id is null then
    return '[]'::json;
  end if;

  return coalesce((
    select json_agg(to_jsonb(p) order by p.prazo, p.criado_em)
    from (
      select ps.id, ps.titulo, ps.descricao, ps.tipo, ps.prazo, ps.anonima, ps.criado_em
      from public.pesquisas_satisfacao ps
      where ps.prazo >= (now() at time zone 'America/Sao_Paulo')::date
        and not exists (
          select 1
          from public.respostas_pesquisas_satisfacao r
          where r.pesquisa_id = ps.id
            and r.colaborador_id = v_colaborador_id
        )
    ) p
  ), '[]'::json);
end;
$$;

-- Registra que o colaborador autenticado respondeu a pesquisa (idempotente)
create or replace function public.responder_pesquisa_satisfacao(p_pesquisa_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_colaborador_id uuid;
begin
  select c.id into v_colaborador_id
  from public.colaboradores c
  where c.user_id = auth.uid();

  if v_colaborador_id is null then
    raise exception 'Perfil de colaborador nao encontrado.';
  end if;

  insert into public.respostas_pesquisas_satisfacao (pesquisa_id, colaborador_id)
  values (p_pesquisa_id, v_colaborador_id)
  on conflict (pesquisa_id, colaborador_id) do nothing;
end;
$$;

grant select on public.respostas_pesquisas_satisfacao to authenticated;
grant execute on function public.listar_pesquisas_pendentes_colaborador() to authenticated;
grant execute on function public.responder_pesquisa_satisfacao(uuid) to authenticated;
