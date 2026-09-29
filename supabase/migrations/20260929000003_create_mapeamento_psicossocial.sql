-- Estrutura inicial do modulo de mapeamento psicossocial.
-- Reutiliza colaboradores e setores; este projeto ainda nao possui cadastro
-- de empresas ou papeis administrativos no schema.

create table if not exists public.fatores_psicossociais (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem smallint not null unique check (ordem between 1 and 13),
  criado_em timestamptz not null default now()
);

create table if not exists public.avaliacoes_psicossociais (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  setor_id uuid references public.setores (id) on delete restrict,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'ativa', 'encerrada')),
  data_inicio date,
  data_fim date,
  criado_por uuid not null references auth.users (id) on delete cascade default auth.uid(),
  criado_em timestamptz not null default now(),
  constraint avaliacoes_psicossociais_periodo_check
    check (data_fim is null or data_inicio is null or data_fim >= data_inicio)
);

create table if not exists public.perguntas_psicossociais (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.avaliacoes_psicossociais (id) on delete cascade,
  fator_id uuid not null references public.fatores_psicossociais (id) on delete restrict,
  texto text not null,
  tipo_resposta text not null default 'escala'
    check (tipo_resposta in ('escala', 'texto', 'sim_nao', 'multipla_escolha')),
  opcoes jsonb,
  ordem smallint not null default 1 check (ordem > 0),
  obrigatoria boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (avaliacao_id, fator_id, ordem)
);

create table if not exists public.respostas_psicossociais (
  id uuid primary key default gen_random_uuid(),
  pergunta_id uuid not null references public.perguntas_psicossociais (id) on delete cascade,
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  resposta jsonb not null,
  respondido_em timestamptz not null default now(),
  unique (pergunta_id, colaborador_id)
);

create table if not exists public.resultados_psicossociais (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.avaliacoes_psicossociais (id) on delete cascade,
  fator_id uuid not null references public.fatores_psicossociais (id) on delete restrict,
  setor_id uuid references public.setores (id) on delete restrict,
  total_respostas integer not null default 0 check (total_respostas >= 0),
  media numeric(8, 3),
  distribuicao jsonb not null default '{}'::jsonb,
  calculado_em timestamptz not null default now(),
  unique nulls not distinct (avaliacao_id, fator_id, setor_id)
);

create index if not exists avaliacoes_psicossociais_setor_idx
  on public.avaliacoes_psicossociais (setor_id, status);
create index if not exists perguntas_psicossociais_avaliacao_idx
  on public.perguntas_psicossociais (avaliacao_id, fator_id);
create index if not exists respostas_psicossociais_colaborador_idx
  on public.respostas_psicossociais (colaborador_id);
create index if not exists resultados_psicossociais_avaliacao_idx
  on public.resultados_psicossociais (avaliacao_id, setor_id);

insert into public.fatores_psicossociais (ordem, nome) values
  (1, 'Sobrecarga de trabalho'),
  (2, 'Autonomia'),
  (3, 'Pressão por metas'),
  (4, 'Conflitos'),
  (5, 'Percepção de assédio'),
  (6, 'Suporte da liderança'),
  (7, 'Jornada excessiva'),
  (8, 'Responsabilidades mal distribuídas'),
  (9, 'Falta de clareza sobre funções'),
  (10, 'Disponibilidade constante'),
  (11, 'Isolamento no trabalho remoto'),
  (12, 'Violência ou assédio'),
  (13, 'Mudanças organizacionais mal conduzidas')
on conflict (nome) do update set ordem = excluded.ordem;

alter table public.fatores_psicossociais enable row level security;
alter table public.avaliacoes_psicossociais enable row level security;
alter table public.perguntas_psicossociais enable row level security;
alter table public.respostas_psicossociais enable row level security;
alter table public.resultados_psicossociais enable row level security;

create policy "authenticated read psychosocial factors"
  on public.fatores_psicossociais for select to authenticated using (true);

create policy "authenticated read psychosocial assessments"
  on public.avaliacoes_psicossociais for select to authenticated using (true);
create policy "authors create psychosocial assessments"
  on public.avaliacoes_psicossociais for insert to authenticated
  with check (criado_por = auth.uid());
create policy "authors update psychosocial assessments"
  on public.avaliacoes_psicossociais for update to authenticated
  using (criado_por = auth.uid()) with check (criado_por = auth.uid());
create policy "authors delete psychosocial assessments"
  on public.avaliacoes_psicossociais for delete to authenticated
  using (criado_por = auth.uid());

create policy "authenticated read psychosocial questions"
  on public.perguntas_psicossociais for select to authenticated using (true);
create policy "assessment authors manage psychosocial questions"
  on public.perguntas_psicossociais for all to authenticated
  using (exists (
    select 1 from public.avaliacoes_psicossociais a
    where a.id = avaliacao_id and a.criado_por = auth.uid()
  ))
  with check (exists (
    select 1 from public.avaliacoes_psicossociais a
    where a.id = avaliacao_id and a.criado_por = auth.uid()
  ));

create policy "collaborators read own psychosocial answers"
  on public.respostas_psicossociais for select to authenticated
  using (colaborador_id in (
    select c.id from public.colaboradores c where c.user_id = auth.uid()
  ));
create policy "collaborators submit own psychosocial answers"
  on public.respostas_psicossociais for insert to authenticated
  with check (colaborador_id in (
    select c.id from public.colaboradores c where c.user_id = auth.uid()
  ));
create policy "collaborators update own psychosocial answers"
  on public.respostas_psicossociais for update to authenticated
  using (colaborador_id in (
    select c.id from public.colaboradores c where c.user_id = auth.uid()
  ))
  with check (colaborador_id in (
    select c.id from public.colaboradores c where c.user_id = auth.uid()
  ));
create policy "collaborators delete own psychosocial answers"
  on public.respostas_psicossociais for delete to authenticated
  using (colaborador_id in (
    select c.id from public.colaboradores c where c.user_id = auth.uid()
  ));

create policy "assessment authors read psychosocial results"
  on public.resultados_psicossociais for select to authenticated
  using (exists (
    select 1 from public.avaliacoes_psicossociais a
    where a.id = avaliacao_id and a.criado_por = auth.uid()
  ));
create policy "assessment authors manage psychosocial results"
  on public.resultados_psicossociais for all to authenticated
  using (exists (
    select 1 from public.avaliacoes_psicossociais a
    where a.id = avaliacao_id and a.criado_por = auth.uid()
  ))
  with check (exists (
    select 1 from public.avaliacoes_psicossociais a
    where a.id = avaliacao_id and a.criado_por = auth.uid()
  ));

grant select on public.fatores_psicossociais to authenticated;
grant select, insert, update, delete on public.avaliacoes_psicossociais to authenticated;
grant select, insert, update, delete on public.perguntas_psicossociais to authenticated;
grant select, insert, update, delete on public.respostas_psicossociais to authenticated;
grant select, insert, update, delete on public.resultados_psicossociais to authenticated;
