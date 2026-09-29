alter table public.colaboradores
  add column if not exists foto_url text;

drop function if exists public.listar_equipe_colaborador();

create function public.listar_equipe_colaborador()
returns table (
  id uuid,
  user_id uuid,
  nome text,
  cargo text,
  setor text,
  setor_sigla text,
  foto_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.user_id,
    c.nome,
    ca.nome,
    s.nome,
    s.sigla,
    coalesce(
      nullif(c.foto_url, ''),
      nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(u.raw_user_meta_data ->> 'picture', '')
    )
  from public.colaboradores atual
  join public.colaboradores c on c.setor_id = atual.setor_id
  join public.cargos ca on ca.id = c.cargo_id
  join public.setores s on s.id = c.setor_id
  join auth.users u on u.id = c.user_id
  where atual.user_id = auth.uid()
    and auth.uid() is not null
  order by c.nome;
$$;

revoke all on function public.listar_equipe_colaborador() from public;
grant execute on function public.listar_equipe_colaborador() to authenticated;
