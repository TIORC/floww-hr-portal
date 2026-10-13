-- Preferências de notificação por e-mail do colaborador.
-- Sem linha salva, o tipo vale como ligado (padrão). O envio de e-mails ainda não existe no sistema:
-- quando existir, deve consultar esta tabela antes de enviar.

create table if not exists public.colaboradores_preferencias_email (
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  tipo text not null check (tipo in (
    'lembrete_celebracao',
    'atualizacoes_okr',
    'nova_celebracao',
    'novo_feedback',
    'novo_objetivo'
  )),
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now(),
  primary key (colaborador_id, tipo)
);

alter table public.colaboradores_preferencias_email enable row level security;

drop policy if exists "colaborador read own preferencias_email" on public.colaboradores_preferencias_email;
create policy "colaborador read own preferencias_email"
  on public.colaboradores_preferencias_email
  for select
  to authenticated
  using (colaborador_id in (select id from public.colaboradores where user_id = auth.uid()));

grant select on public.colaboradores_preferencias_email to authenticated;

-- Lista as preferências do usuário logado (todos os tipos, com padrão ligado).
create or replace function public.obter_preferencias_email()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(
    json_build_object('tipo', t.tipo, 'ativo', coalesce(p.ativo, true))
    order by t.ordem
  ), '[]'::json)
  from (values
    (1, 'lembrete_celebracao'),
    (2, 'atualizacoes_okr'),
    (3, 'nova_celebracao'),
    (4, 'novo_feedback'),
    (5, 'novo_objetivo')
  ) as t(ordem, tipo)
  left join public.colaboradores c on c.user_id = auth.uid()
  left join public.colaboradores_preferencias_email p
    on p.colaborador_id = c.id and p.tipo = t.tipo;
$$;

-- Salva as preferências do usuário logado.
-- p_preferencias: [{ "tipo": "novo_feedback", "ativo": false }, ...]
create or replace function public.salvar_preferencias_email(p_preferencias jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_colaborador_id uuid;
begin
  select id into v_colaborador_id
  from public.colaboradores
  where user_id = auth.uid();

  if v_colaborador_id is null then
    raise exception 'Colaborador não encontrado para este usuário.';
  end if;

  insert into public.colaboradores_preferencias_email (colaborador_id, tipo, ativo, atualizado_em)
  select v_colaborador_id, item ->> 'tipo', (item ->> 'ativo')::boolean, now()
  from jsonb_array_elements(coalesce(p_preferencias, '[]'::jsonb)) as item
  on conflict (colaborador_id, tipo)
  do update set ativo = excluded.ativo, atualizado_em = excluded.atualizado_em;
end;
$$;

revoke all on function public.obter_preferencias_email() from public, anon;
revoke all on function public.salvar_preferencias_email(jsonb) from public, anon;
grant execute on function public.obter_preferencias_email() to authenticated;
grant execute on function public.salvar_preferencias_email(jsonb) to authenticated;
