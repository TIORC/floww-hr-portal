-- Tabela de acessos diários (um registro por colaborador por dia)

create table if not exists public.acessos_diarios (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  data date not null default now(),
  criado_em timestamptz not null default now(),
  unique (colaborador_id, data)
);

create index if not exists acessos_diarios_colaborador_id_idx on public.acessos_diarios (colaborador_id);
create index if not exists acessos_diarios_data_idx on public.acessos_diarios (data);

alter table public.acessos_diarios enable row level security;

-- Colaborador vê apenas próprios acessos
create policy "colaborador read own accesses"
  on public.acessos_diarios
  for select
  to authenticated
  using (colaborador_id in (
    select id from public.colaboradores where user_id = auth.uid()
  ));

-- Sistema pode inserir (via service role ou RPC)
create policy "system insert accesses"
  on public.acessos_diarios
  for insert
  to authenticated
  with check (true);

-- Função para registrar acesso diário (upsert: evita duplicatas no mesmo dia)
create or replace function public.registrar_acesso_diario(p_colaborador_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.acessos_diarios (colaborador_id, data)
  values (p_colaborador_id, now()::date)
  on conflict (colaborador_id, data) do nothing;
end;
$$;

-- Função para buscar acessos de hoje + comparação com média da empresa
create or replace function public.get_acessos_diario_comparativo(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_colaborador_id uuid;
  v_hoje date := now()::date;
  v_meus_acessos int;
  v_media_empresa numeric;
  v_percentual numeric;
  v_comparativo text;
begin
  -- Obter colaborador_id a partir do user_id
  select id into v_colaborador_id
  from public.colaboradores
  where user_id = p_user_id;

  if v_colaborador_id is null then
    return json_build_object('erro', 'Colaborador não encontrado');
  end if;

  -- Meus acessos hoje
  select count(*) into v_meus_acessos
  from public.acessos_diarios
  where colaborador_id = v_colaborador_id
    and data = v_hoje;

  -- Média da empresa (média de acessos diários por usuário hoje)
  select avg(cnt) into v_media_empresa
  from (
    select colaborador_id, count(*) as cnt
    from public.acessos_diarios
    where data = v_hoje
    group by colaborador_id
  ) sub;

  if v_media_empresa is null or v_media_empresa = 0 then
    v_percentual := 0;
    v_comparativo := 'Média da empresa indisponível';
  else
    v_percentual := round(((v_meus_acessos - v_media_empresa) / v_media_empresa) * 100);
    if v_percentual > 0 then
      v_comparativo := v_percentual || '% acima da média da empresa';
    elsif v_percentual < 0 then
      v_comparativo := abs(v_percentual) || '% abaixo da média da empresa';
    else
      v_comparativo := 'Na média da empresa';
    end if;
  end if;

  return json_build_object(
    'meus_acessos', v_meus_acessos,
    'media_empresa', round(v_media_empresa::numeric, 1),
    'percentual', v_percentual,
    'comparativo', v_comparativo
  );
end;
$$;

grant execute on function public.get_acessos_diario_comparativo(uuid) to authenticated;
grant execute on function public.registrar_acesso_diario(uuid) to authenticated;