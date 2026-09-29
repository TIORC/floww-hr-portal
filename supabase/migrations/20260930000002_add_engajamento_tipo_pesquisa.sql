alter table public.pesquisas_satisfacao
  drop constraint if exists pesquisas_satisfacao_tipo_check;

alter table public.pesquisas_satisfacao
  add constraint pesquisas_satisfacao_tipo_check
  check (tipo in ('satisfacao', 'rapida', 'super', 'desligamento', 'engajamento'));
