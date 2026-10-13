-- Indicador agregado do humor da empresa para os relatorios do RH.
-- Retorna apenas totais e medias: nunca identifica colaboradores nem expoe o motivo (texto sigiloso).
-- Escala: muito_triste = 1, triste = 2, neutro = 3, feliz = 4, muito_feliz = 5.

create or replace function public.obter_humor_medio_empresa(
  p_inicio date default null,
  p_fim date default null
)
returns json
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with checkins as (
    select emocao
    from public.checkins_sentimento
    where (p_inicio is null or data >= p_inicio)
      and (p_fim is null or data <= p_fim)
  ),
  pontuados as (
    select
      emocao,
      case emocao
        when 'muito_triste' then 1
        when 'triste' then 2
        when 'neutro' then 3
        when 'feliz' then 4
        when 'muito_feliz' then 5
      end as pontuacao
    from checkins
  )
  select json_build_object(
    'total_checkins', (select count(*) from pontuados),
    'media', (select round(avg(pontuacao)::numeric, 2) from pontuados),
    'distribuicao', json_build_object(
      'muito_triste', (select count(*) from pontuados where emocao = 'muito_triste'),
      'triste', (select count(*) from pontuados where emocao = 'triste'),
      'neutro', (select count(*) from pontuados where emocao = 'neutro'),
      'feliz', (select count(*) from pontuados where emocao = 'feliz'),
      'muito_feliz', (select count(*) from pontuados where emocao = 'muito_feliz')
    )
  );
$$;

grant execute on function public.obter_humor_medio_empresa(date, date) to authenticated;
