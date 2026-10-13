-- Aba Informações do Meu Perfil: biografia (até 6000 caracteres) e habilidades.

alter table public.colaboradores
  add column if not exists biografia text not null default '';

alter table public.colaboradores
  add column if not exists habilidades text not null default '';

alter table public.colaboradores
  drop constraint if exists colaboradores_biografia_tamanho;

alter table public.colaboradores
  add constraint colaboradores_biografia_tamanho check (char_length(biografia) <= 6000);

-- Dados do perfil do usuário logado, agora com biografia e habilidades.
create or replace function public.obter_meu_perfil()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'nome', c.nome,
    'cargo', ca.nome,
    'email', auth.jwt() ->> 'email',
    'cargo_visivel', c.cargo_visivel,
    'idioma', c.idioma,
    'biografia', c.biografia,
    'habilidades', c.habilidades,
    'contatos', coalesce((
      select json_agg(json_build_object('tipo', t.tipo, 'valor', t.valor) order by t.criado_em)
      from public.colaboradores_contatos t
      where t.colaborador_id = c.id
    ), '[]'::json)
  )
  from public.colaboradores c
  join public.cargos ca on ca.id = c.cargo_id
  where c.user_id = auth.uid();
$$;

-- Salva biografia e habilidades do usuário logado.
create or replace function public.salvar_minhas_informacoes(
  p_biografia text,
  p_habilidades text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_biografia text := coalesce(p_biografia, '');
begin
  if char_length(v_biografia) > 6000 then
    raise exception 'A biografia pode ter no máximo 6000 caracteres.';
  end if;

  update public.colaboradores
  set biografia = btrim(v_biografia),
      habilidades = btrim(coalesce(p_habilidades, ''))
  where user_id = auth.uid();

  if not found then
    raise exception 'Colaborador não encontrado para este usuário.';
  end if;
end;
$$;

revoke all on function public.salvar_minhas_informacoes(text, text) from public, anon;
grant execute on function public.salvar_minhas_informacoes(text, text) to authenticated;
