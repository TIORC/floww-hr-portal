-- Recompensa de entrada diária: 50 Floww Coins por colaborador, uma vez por dia.
-- O "dia" segue o fuso de Brasília, então a regra reinicia à 00h.

create table if not exists public.floww_coins_recompensas_diarias (
  colaborador_importado_id uuid not null
    references public.colaboradores_importados (id) on delete cascade,
  data date not null,
  valor integer not null check (valor > 0),
  criado_em timestamptz not null default now(),
  primary key (colaborador_importado_id, data)
);

-- Sem policies: a tabela só é acessada pela função abaixo (security definer).
alter table public.floww_coins_recompensas_diarias enable row level security;

create or replace function public.registrar_entrada_diaria_floww_coins()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_colaborador_id uuid := public.colaborador_importado_do_usuario();
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
  v_valor constant integer := 50;
  v_saldo integer;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if v_colaborador_id is null then
    return json_build_object('creditado', false);
  end if;

  -- Uma recompensa por colaborador e por dia. Se já existir, não credita de novo.
  insert into public.floww_coins_recompensas_diarias (colaborador_importado_id, data, valor)
  values (v_colaborador_id, v_dia, v_valor)
  on conflict (colaborador_importado_id, data) do nothing;

  if not found then
    return json_build_object('creditado', false);
  end if;

  insert into public.floww_coins_saldos (colaborador_importado_id, saldo)
  values (v_colaborador_id, 0)
  on conflict (colaborador_importado_id) do nothing;

  update public.floww_coins_saldos
  set saldo = saldo + v_valor,
      atualizado_em = now()
  where colaborador_importado_id = v_colaborador_id
  returning saldo into v_saldo;

  insert into public.floww_coins_transacoes (colaborador_importado_id, tipo, descricao, valor)
  values (v_colaborador_id, 'entrada', 'Entrada diária na plataforma', v_valor);

  insert into public.notificacoes (user_id, chave, titulo, mensagem)
  values (
    auth.uid(),
    'entrada-diaria-' || v_dia::text,
    'Parabéns!',
    'Por ter entrado hoje, você ganhou ' || v_valor || ' Floww Coins!!'
  )
  on conflict (user_id, chave) do nothing;

  return json_build_object('creditado', true, 'valor', v_valor, 'saldo', v_saldo);
end;
$$;

revoke all on function public.registrar_entrada_diaria_floww_coins() from public, anon;
grant execute on function public.registrar_entrada_diaria_floww_coins() to authenticated;
