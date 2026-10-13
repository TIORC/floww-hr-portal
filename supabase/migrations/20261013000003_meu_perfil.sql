-- Meu Perfil: campos editáveis pelo próprio colaborador (cargo visível, idioma e contatos).
-- Nome, cargo e e-mail continuam vindos do cadastro e não podem ser alterados pelo usuário.

alter table public.colaboradores
  add column if not exists cargo_visivel text not null default '';

alter table public.colaboradores
  add column if not exists idioma text not null default 'Português - Brasil';

create table if not exists public.colaboradores_contatos (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  tipo text not null check (tipo in ('Whatsapp', 'Telefone', 'E-mail')),
  valor text not null check (char_length(btrim(valor)) > 0),
  criado_em timestamptz not null default now()
);

create index if not exists colaboradores_contatos_colaborador_idx
  on public.colaboradores_contatos (colaborador_id);

alter table public.colaboradores_contatos enable row level security;

drop policy if exists "colaborador read own contatos" on public.colaboradores_contatos;
create policy "colaborador read own contatos"
  on public.colaboradores_contatos
  for select
  to authenticated
  using (colaborador_id in (select id from public.colaboradores where user_id = auth.uid()));

grant select on public.colaboradores_contatos to authenticated;

-- Dados do perfil do usuário logado.
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

-- Salva cargo visível, idioma e contatos do usuário logado (substitui a lista de contatos).
-- p_contatos: [{ "tipo": "Whatsapp", "valor": "(99) 99999-9999" }, ...]
create or replace function public.salvar_meu_perfil(
  p_cargo_visivel text,
  p_idioma text,
  p_contatos jsonb
)
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

  update public.colaboradores
  set cargo_visivel = btrim(coalesce(p_cargo_visivel, '')),
      idioma = coalesce(nullif(btrim(p_idioma), ''), idioma)
  where id = v_colaborador_id;

  delete from public.colaboradores_contatos
  where colaborador_id = v_colaborador_id;

  insert into public.colaboradores_contatos (colaborador_id, tipo, valor)
  select v_colaborador_id, item ->> 'tipo', btrim(item ->> 'valor')
  from jsonb_array_elements(coalesce(p_contatos, '[]'::jsonb)) as item
  where btrim(coalesce(item ->> 'valor', '')) <> '';
end;
$$;

revoke all on function public.obter_meu_perfil() from public, anon;
revoke all on function public.salvar_meu_perfil(text, text, jsonb) from public, anon;
grant execute on function public.obter_meu_perfil() to authenticated;
grant execute on function public.salvar_meu_perfil(text, text, jsonb) to authenticated;
