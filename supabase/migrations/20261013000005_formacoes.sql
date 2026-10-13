-- Aba Educação do Meu Perfil: formações do colaborador (cada uma separada).

create table if not exists public.colaboradores_formacoes (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  tipo text not null check (tipo in (
    'Ensino superior', 'Pós-graduação', 'Mestrado', 'Doutorado',
    'Técnico', 'Profissionalizante', 'Outro'
  )),
  instituicao text not null check (char_length(btrim(instituicao)) > 0),
  formacao text not null check (char_length(btrim(formacao)) > 0),
  area text not null default '',
  data_inicio date not null,
  data_termino date not null,
  diploma_url text not null default '',
  criado_em timestamptz not null default now(),
  constraint colaboradores_formacoes_datas check (data_termino >= data_inicio)
);

create index if not exists colaboradores_formacoes_colaborador_idx
  on public.colaboradores_formacoes (colaborador_id, data_inicio desc);

alter table public.colaboradores_formacoes enable row level security;

drop policy if exists "colaborador read own formacoes" on public.colaboradores_formacoes;
create policy "colaborador read own formacoes"
  on public.colaboradores_formacoes
  for select
  to authenticated
  using (colaborador_id in (select id from public.colaboradores where user_id = auth.uid()));

grant select on public.colaboradores_formacoes to authenticated;

-- Cria ou atualiza uma formação do usuário logado (p_id nulo = nova formação).
create or replace function public.salvar_formacao(
  p_id uuid,
  p_tipo text,
  p_instituicao text,
  p_formacao text,
  p_area text,
  p_data_inicio date,
  p_data_termino date,
  p_diploma_url text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_colaborador_id uuid;
  v_id uuid;
begin
  select id into v_colaborador_id
  from public.colaboradores
  where user_id = auth.uid();

  if v_colaborador_id is null then
    raise exception 'Colaborador não encontrado para este usuário.';
  end if;

  if p_id is null then
    insert into public.colaboradores_formacoes
      (colaborador_id, tipo, instituicao, formacao, area, data_inicio, data_termino, diploma_url)
    values
      (v_colaborador_id, p_tipo, btrim(p_instituicao), btrim(p_formacao), btrim(coalesce(p_area, '')),
       p_data_inicio, p_data_termino, btrim(coalesce(p_diploma_url, '')))
    returning id into v_id;
  else
    update public.colaboradores_formacoes
    set tipo = p_tipo,
        instituicao = btrim(p_instituicao),
        formacao = btrim(p_formacao),
        area = btrim(coalesce(p_area, '')),
        data_inicio = p_data_inicio,
        data_termino = p_data_termino,
        diploma_url = btrim(coalesce(p_diploma_url, ''))
    where id = p_id and colaborador_id = v_colaborador_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Formação não encontrada.';
    end if;
  end if;

  return v_id;
end;
$$;

-- Remove uma formação do usuário logado.
create or replace function public.remover_formacao(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.colaboradores_formacoes f
  using public.colaboradores c
  where f.id = p_id
    and f.colaborador_id = c.id
    and c.user_id = auth.uid();

  if not found then
    raise exception 'Formação não encontrada.';
  end if;
end;
$$;

revoke all on function public.salvar_formacao(uuid, text, text, text, text, date, date, text) from public, anon;
revoke all on function public.remover_formacao(uuid) from public, anon;
grant execute on function public.salvar_formacao(uuid, text, text, text, text, date, date, text) to authenticated;
grant execute on function public.remover_formacao(uuid) to authenticated;
