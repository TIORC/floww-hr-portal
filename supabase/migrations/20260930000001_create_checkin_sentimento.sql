-- Check-in diario de sentimento (uma resposta por colaborador por dia).
-- A data usa o fuso de Sao Paulo para que o dia vire exatamente a meia-noite local.

create table if not exists public.checkins_sentimento (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  emocao text not null
    check (emocao in ('muito_triste', 'triste', 'neutro', 'feliz', 'muito_feliz')),
  motivo text not null default '' check (char_length(motivo) <= 12000),
  data date not null default (now() at time zone 'America/Sao_Paulo')::date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (colaborador_id, data)
);

create index if not exists checkins_sentimento_data_idx on public.checkins_sentimento (data);

alter table public.checkins_sentimento enable row level security;

-- Colaborador ve apenas o proprio check-in
create policy "colaborador read own sentiment checkins"
  on public.checkins_sentimento
  for select
  to authenticated
  using (colaborador_id in (
    select c.id from public.colaboradores c where c.user_id = auth.uid()
  ));

-- Colaborador registra apenas o proprio check-in
create policy "colaborador insert own sentiment checkins"
  on public.checkins_sentimento
  for insert
  to authenticated
  with check (colaborador_id in (
    select c.id from public.colaboradores c where c.user_id = auth.uid()
  ));

-- Permite sobrescrever a resposta do mesmo dia
create policy "colaborador update own sentiment checkins"
  on public.checkins_sentimento
  for update
  to authenticated
  using (colaborador_id in (
    select c.id from public.colaboradores c where c.user_id = auth.uid()
  ))
  with check (colaborador_id in (
    select c.id from public.colaboradores c where c.user_id = auth.uid()
  ));

-- Função para registrar o check-in do dia (upsert: um voto por colaborador por dia)
create or replace function public.registrar_checkin_sentimento(
  p_colaborador_id uuid,
  p_emocao text,
  p_motivo text default ''
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_emocao is null or p_emocao not in ('muito_triste', 'triste', 'neutro', 'feliz', 'muito_feliz') then
    raise exception 'Emocao invalida: %', p_emocao;
  end if;

  insert into public.checkins_sentimento (colaborador_id, emocao, motivo, data)
  values (p_colaborador_id, p_emocao, coalesce(p_motivo, ''), (now() at time zone 'America/Sao_Paulo')::date)
  on conflict (colaborador_id, data) do update
    set emocao = excluded.emocao,
        motivo = excluded.motivo,
        atualizado_em = now();
end;
$$;

-- Função para buscar o check-in de hoje do colaborador autenticado
create or replace function public.obter_checkin_sentimento_do_dia()
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_colaborador_id uuid;
  v_registro json;
begin
  select c.id into v_colaborador_id
  from public.colaboradores c
  where c.user_id = auth.uid();

  if v_colaborador_id is null then
    return null;
  end if;

  select to_jsonb(t) into v_registro
  from (
    select emocao, motivo, data, criado_em, atualizado_em
    from public.checkins_sentimento
    where colaborador_id = v_colaborador_id
      and data = (now() at time zone 'America/Sao_Paulo')::date
    limit 1
  ) t;

  return v_registro;
end;
$$;

grant execute on function public.registrar_checkin_sentimento(uuid, text, text) to authenticated;
grant execute on function public.obter_checkin_sentimento_do_dia() to authenticated;
grant select, insert, update on public.checkins_sentimento to authenticated;
