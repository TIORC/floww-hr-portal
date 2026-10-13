-- Feedbacks e solicitacoes de feedback entre colaboradores (pagina /feedbacks).
-- Pessoas vem do diretorio colaboradores_importados; o usuario logado e identificado pelo e-mail da sessao,
-- como nas demais funcoes do diretorio. Escritas passam apenas pelas funcoes abaixo.

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  remetente_id uuid not null references public.colaboradores_importados (id) on delete cascade,
  destinatario_id uuid not null references public.colaboradores_importados (id) on delete cascade,
  tipo text not null check (tipo in ('feedback', 'solicitacao')),
  mensagem text not null check (char_length(mensagem) between 1 and 12000),
  -- Notas por competencia (proatividade, transparencia, cliente, responsabilidade), de 1 a 5.
  avaliacoes jsonb not null default '{}'::jsonb,
  -- Somente para solicitacoes.
  status text check (status in ('pending', 'accepted', 'declined')),
  criado_em timestamptz not null default now(),
  check (remetente_id <> destinatario_id),
  check ((tipo = 'solicitacao') = (status is not null))
);

create index if not exists feedbacks_destinatario_idx on public.feedbacks (destinatario_id, criado_em desc);
create index if not exists feedbacks_remetente_idx on public.feedbacks (remetente_id, criado_em desc);

create table if not exists public.feedback_respostas (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedbacks (id) on delete cascade,
  autor_id uuid not null references public.colaboradores_importados (id) on delete cascade,
  mensagem text not null check (char_length(mensagem) between 1 and 12000),
  criado_em timestamptz not null default now()
);

create index if not exists feedback_respostas_feedback_idx on public.feedback_respostas (feedback_id, criado_em);

alter table public.feedbacks enable row level security;
alter table public.feedback_respostas enable row level security;

-- Colaborador logado, identificado pelo e-mail da sessao. Precisa existir antes das politicas abaixo.
create or replace function public.meu_colaborador_importado_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select ci.id
  from public.colaboradores_importados ci
  where lower(btrim(ci.email)) = lower(btrim(auth.jwt() ->> 'email'))
  limit 1;
$$;

-- Cada pessoa le apenas os feedbacks em que e remetente ou destinatario.
drop policy if exists "participants read feedbacks" on public.feedbacks;
create policy "participants read feedbacks"
  on public.feedbacks
  for select
  to authenticated
  using (public.meu_colaborador_importado_id() in (remetente_id, destinatario_id));

drop policy if exists "participants read feedback replies" on public.feedback_respostas;
create policy "participants read feedback replies"
  on public.feedback_respostas
  for select
  to authenticated
  using (exists (
    select 1 from public.feedbacks f
    where f.id = feedback_id
      and public.meu_colaborador_importado_id() in (f.remetente_id, f.destinatario_id)
  ));

grant select on public.feedbacks to authenticated;
grant select on public.feedback_respostas to authenticated;

-- Monta o JSON de um feedback. Nao verifica acesso: quem chama precisa validar antes.
create or replace function public.feedback_json(p_id uuid)
returns json
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select json_build_object(
    'id', f.id,
    'sender', json_build_object(
      'id', rem.id, 'name', rem.nome, 'avatarUrl', coalesce(rem.foto_url, ''), 'department', rem.departamento
    ),
    'receiver', json_build_object(
      'id', dest.id, 'name', dest.nome, 'avatarUrl', coalesce(dest.foto_url, ''), 'department', dest.departamento
    ),
    'createdAt', f.criado_em,
    'message', f.mensagem,
    'skillsRatings', f.avaliacoes,
    'replies', coalesce((
      select json_agg(json_build_object(
        'id', r.id, 'authorId', r.autor_id, 'message', r.mensagem, 'createdAt', r.criado_em
      ) order by r.criado_em)
      from public.feedback_respostas r
      where r.feedback_id = f.id
    ), '[]'::json),
    'status', f.status
  )
  from public.feedbacks f
  join public.colaboradores_importados rem on rem.id = f.remetente_id
  join public.colaboradores_importados dest on dest.id = f.destinatario_id
  where f.id = p_id;
$$;

-- Lista feedbacks do colaborador logado por aba: received, sent, requested_received, requested_sent.
create or replace function public.listar_feedbacks(
  p_tipo text,
  p_inicio date,
  p_fim date,
  p_busca text default ''
)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := public.meu_colaborador_importado_id();
  v_busca text := lower(btrim(coalesce(p_busca, '')));
begin
  if p_tipo not in ('received', 'sent', 'requested_received', 'requested_sent') then
    raise exception 'Tipo de lista invalido: %', p_tipo;
  end if;

  if v_me is null then
    return '[]'::json;
  end if;

  return coalesce((
    select json_agg(public.feedback_json(f.id) order by f.criado_em desc)
    from public.feedbacks f
    join public.colaboradores_importados rem on rem.id = f.remetente_id
    join public.colaboradores_importados dest on dest.id = f.destinatario_id
    where (
        (p_tipo = 'received' and f.destinatario_id = v_me and f.tipo = 'feedback')
        or (p_tipo = 'sent' and f.remetente_id = v_me and f.tipo = 'feedback')
        or (p_tipo = 'requested_received' and f.destinatario_id = v_me and f.tipo = 'solicitacao')
        or (p_tipo = 'requested_sent' and f.remetente_id = v_me and f.tipo = 'solicitacao')
      )
      and (f.criado_em at time zone 'America/Sao_Paulo')::date between p_inicio and p_fim
      and (
        v_busca = ''
        or strpos(
          lower(concat_ws(' ',
            case when p_tipo in ('sent', 'requested_sent') then dest.nome else rem.nome end,
            case when p_tipo in ('sent', 'requested_sent') then dest.departamento else rem.departamento end
          )),
          v_busca
        ) > 0
      )
  ), '[]'::json);
end;
$$;

-- Um feedback, somente para quem e remetente ou destinatario.
create or replace function public.obter_feedback(p_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := public.meu_colaborador_importado_id();
begin
  if not exists (
    select 1 from public.feedbacks f
    where f.id = p_id
      and v_me in (f.remetente_id, f.destinatario_id)
  ) then
    raise exception 'Feedback nao encontrado.';
  end if;

  return public.feedback_json(p_id);
end;
$$;

-- Metricas do periodo: totais, radar (media do colaborador x media da companhia) e serie mensal.
create or replace function public.obter_metricas_feedbacks(p_inicio date, p_fim date)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := public.meu_colaborador_importado_id();
begin
  return (
    with periodo as (
      select f.*, (f.criado_em at time zone 'America/Sao_Paulo')::date as dia
      from public.feedbacks f
      where f.tipo = 'feedback'
        and (f.criado_em at time zone 'America/Sao_Paulo')::date between p_inicio and p_fim
    ),
    categorias(categoria, chave) as (
      values
        ('Proatividade e Autonomia', 'proatividade'),
        ('Confiabilidade e Transparência', 'transparencia'),
        ('Encantamento e Foco no Cliente', 'cliente'),
        ('Responsabilidade e Produtividade', 'responsabilidade')
    ),
    radar as (
      select
        c.categoria as "category",
        coalesce((
          select round(avg((p.avaliacoes ->> c.chave)::numeric), 2)
          from periodo p
          where p.destinatario_id = v_me and p.avaliacoes ? c.chave
        ), 0) as "userScore",
        coalesce((
          select round(avg((p.avaliacoes ->> c.chave)::numeric), 2)
          from periodo p
          where p.avaliacoes ? c.chave
        ), 0) as "companyAvg"
      from categorias c
    ),
    meses as (
      select generate_series(
        date_trunc('month', p_inicio::timestamp),
        date_trunc('month', p_fim::timestamp),
        interval '1 month'
      ) as mes
    ),
    mensal as (
      select
        to_char(m.mes, 'MM/YYYY') as "month",
        (select count(*) from periodo p where p.remetente_id = v_me and date_trunc('month', p.dia::timestamp) = m.mes) as "sent",
        (select count(*) from periodo p where p.destinatario_id = v_me and date_trunc('month', p.dia::timestamp) = m.mes) as "received",
        m.mes as ordem
      from meses m
    )
    select json_build_object(
      'totalReceived', (select count(*) from periodo where destinatario_id = v_me),
      'totalSent', (select count(*) from periodo where remetente_id = v_me),
      'radarData', (select coalesce(json_agg(r), '[]'::json) from radar r),
      'monthlyData', (select coalesce(json_agg(json_build_object('month', x."month", 'sent', x."sent", 'received', x."received") order by x.ordem), '[]'::json) from mensal x)
    )
  );
end;
$$;

-- Envia um feedback do colaborador logado para outro colaborador.
create or replace function public.enviar_feedback(p_destinatario_id uuid, p_mensagem text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := public.meu_colaborador_importado_id();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'Seu usuario nao esta vinculado a um colaborador.';
  end if;
  if p_destinatario_id = v_me then
    raise exception 'Voce nao pode enviar feedback para si mesmo.';
  end if;

  insert into public.feedbacks (remetente_id, destinatario_id, tipo, mensagem)
  values (v_me, p_destinatario_id, 'feedback', btrim(p_mensagem))
  returning id into v_id;

  return v_id;
end;
$$;

-- Solicita feedback de outro colaborador (fica pendente).
create or replace function public.solicitar_feedback(p_destinatario_id uuid, p_mensagem text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := public.meu_colaborador_importado_id();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'Seu usuario nao esta vinculado a um colaborador.';
  end if;
  if p_destinatario_id = v_me then
    raise exception 'Voce nao pode solicitar feedback para si mesmo.';
  end if;

  insert into public.feedbacks (remetente_id, destinatario_id, tipo, mensagem, status)
  values (v_me, p_destinatario_id, 'solicitacao', btrim(p_mensagem), 'pending')
  returning id into v_id;

  return v_id;
end;
$$;

-- Responde um feedback ou solicitacao em que o colaborador logado participa.
create or replace function public.responder_feedback(p_id uuid, p_mensagem text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := public.meu_colaborador_importado_id();
begin
  if not exists (
    select 1 from public.feedbacks f
    where f.id = p_id
      and v_me in (f.remetente_id, f.destinatario_id)
  ) then
    raise exception 'Feedback nao encontrado.';
  end if;

  insert into public.feedback_respostas (feedback_id, autor_id, mensagem)
  values (p_id, v_me, btrim(p_mensagem));
end;
$$;

-- Funcao interna: so e chamada pelas funcoes acima, que ja validam o acesso.
revoke all on function public.feedback_json(uuid) from public, anon, authenticated;

revoke execute on function public.meu_colaborador_importado_id() from public, anon;
revoke execute on function public.listar_feedbacks(text, date, date, text) from public, anon;
revoke execute on function public.obter_feedback(uuid) from public, anon;
revoke execute on function public.obter_metricas_feedbacks(date, date) from public, anon;
revoke execute on function public.enviar_feedback(uuid, text) from public, anon;
revoke execute on function public.solicitar_feedback(uuid, text) from public, anon;
revoke execute on function public.responder_feedback(uuid, text) from public, anon;

grant execute on function public.meu_colaborador_importado_id() to authenticated;
grant execute on function public.listar_feedbacks(text, date, date, text) to authenticated;
grant execute on function public.obter_feedback(uuid) to authenticated;
grant execute on function public.obter_metricas_feedbacks(date, date) to authenticated;
grant execute on function public.enviar_feedback(uuid, text) to authenticated;
grant execute on function public.solicitar_feedback(uuid, text) to authenticated;
grant execute on function public.responder_feedback(uuid, text) to authenticated;
