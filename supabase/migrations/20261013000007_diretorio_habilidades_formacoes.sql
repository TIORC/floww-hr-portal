-- Diretório de colaboradores: habilidades e formações de cada pessoa cadastrada no login.
-- A ligação é feita pelo e-mail do login (auth.users) com o e-mail da lista importada.
-- Quem ainda não tem login não aparece aqui e continua sem habilidades/cursos.

create or replace function public.listar_habilidades_formacoes_diretorio()
returns table (
  colaborador_importado_id uuid,
  habilidades text,
  formacoes json
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ci.id as colaborador_importado_id,
    c.habilidades,
    coalesce((
      select json_agg(
        json_build_object(
          'tipo', f.tipo,
          'formacao', f.formacao,
          'instituicao', f.instituicao,
          'area', f.area
        )
        order by f.data_inicio desc
      )
      from public.colaboradores_formacoes f
      where f.colaborador_id = c.id
    ), '[]'::json) as formacoes
  from public.colaboradores_importados ci
  join auth.users u on lower(btrim(u.email)) = lower(btrim(ci.email))
  join public.colaboradores c on c.user_id = u.id;
$$;

revoke all on function public.listar_habilidades_formacoes_diretorio() from public, anon;
grant execute on function public.listar_habilidades_formacoes_diretorio() to authenticated;
