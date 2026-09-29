alter table public.pesquisas_satisfacao
  add column if not exists tipo text not null default 'satisfacao';

alter table public.pesquisas_satisfacao
  add constraint pesquisas_satisfacao_tipo_check
  check (tipo in ('satisfacao', 'rapida', 'super', 'desligamento'));

create index if not exists pesquisas_satisfacao_tipo_prazo_idx
  on public.pesquisas_satisfacao (tipo, prazo desc);
