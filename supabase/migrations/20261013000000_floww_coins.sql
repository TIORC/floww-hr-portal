-- Floww Coins: saldo dos colaboradores, extrato de movimentações e catálogo da Floww Shop.
--
-- Escrita de saldo e estoque só acontece via funções (security definer). A tabela
-- colaboradores_importados tem policy de update liberada para authenticated, então o saldo
-- fica numa tabela separada sem policy de escrita para o cliente.
--
-- O colaborador logado é ligado ao registro importado pelo e-mail do login (case-insensitive).

-- Catálogo da Floww Shop ----------------------------------------------------------------

create table if not exists public.produtos_shop (
  id text primary key,
  nome text not null,
  descricao text not null default '',
  preco integer not null check (preco > 0),
  categoria text not null check (categoria in ('vantagem', 'produto', 'experiencia')),
  quantidade_estoque integer not null default 0 check (quantidade_estoque >= 0),
  esgotado boolean not null default false,
  imagem_url text,
  criado_em timestamptz not null default now()
);

alter table public.produtos_shop enable row level security;

drop policy if exists "authenticated can read produtos_shop" on public.produtos_shop;
create policy "authenticated can read produtos_shop"
  on public.produtos_shop
  for select
  to authenticated
  using (true);

grant select on public.produtos_shop to authenticated;

insert into public.produtos_shop (id, nome, descricao, preco, categoria, quantidade_estoque, esgotado, imagem_url)
values
  ('shop-01', 'Camiseta Floww!', 'Camiseta oficial da Floww!, do tamanho P ao GG.', 400, 'produto', 25, false, 'https://placehold.co/400x300/111827/FFF?text=Camiseta+Floww!'),
  ('shop-02', 'Vale-compras', 'Vale de R$ 100 para usar onde quiser.', 1200, 'vantagem', 50, false, 'https://placehold.co/400x300/065f46/FFF?text=Vale-compras'),
  ('shop-03', 'Workshop de trilha', 'Vaga em um dos workshops de desenvolvimento da Floww.', 3000, 'experiencia', 15, false, 'https://placehold.co/400x300/1e3a8a/FFF?text=Workshop'),
  ('shop-04', 'Cadeira ergonômica', 'Home office com cadeira ergonômica para o seu cantinho.', 5500, 'produto', 0, true, 'https://placehold.co/400x300/111827/FFF?text=Cadeira'),
  ('shop-05', 'Headset sem fio', 'Headset com cancelamento de ruído para reuniões.', 2500, 'produto', 20, false, 'https://placehold.co/400x300/111827/FFF?text=Headset'),
  ('shop-06', 'Mochila corporativa', 'Mochila resistente para notebook e documentos.', 800, 'produto', 35, false, 'https://placehold.co/400x300/111827/FFF?text=Mochila'),
  ('shop-07', 'Vale-refeição extra', 'Crédito adicional para alimentação.', 600, 'vantagem', 100, false, 'https://placehold.co/400x300/065f46/FFF?text=Vale-refeicao'),
  ('shop-08', 'Curso online', 'Acesso a curso profissionalizante parceiro.', 1800, 'experiencia', 40, false, 'https://placehold.co/400x300/1e3a8a/FFF?text=Curso+online'),
  ('shop-09', 'Garrafa térmica', 'Garrafa inox com personalização Floww!.', 350, 'produto', 60, false, 'https://placehold.co/400x300/111827/FFF?text=Garrafa'),
  ('shop-10', 'Day off remunerado', 'Um dia de folga remunerada para usar quando quiser.', 4500, 'vantagem', 10, false, 'https://placehold.co/400x300/065f46/FFF?text=Day+off'),
  ('shop-11', 'Notebook stand', 'Suporte de notebook ajustável para home office.', 900, 'produto', 18, false, 'https://placehold.co/400x300/111827/FFF?text=Notebook+stand'),
  ('shop-12', 'Vale-cinema', 'Ingresso padrão para sessões 2D.', 500, 'vantagem', 80, false, 'https://placehold.co/400x300/065f46/FFF?text=Vale-cinema'),
  ('shop-13', 'Passeio turístico', 'Passeio guiado para equipes.', 2200, 'experiencia', 12, false, 'https://placehold.co/400x300/1e3a8a/FFF?text=Passeio'),
  ('shop-14', 'Fone de ouvido', 'Fone Bluetooth com microfone integrado.', 1500, 'produto', 22, false, 'https://placehold.co/400x300/111827/FFF?text=Fone+de+ouvido')
on conflict (id) do nothing;

-- Saldo por colaborador ------------------------------------------------------------------

create table if not exists public.floww_coins_saldos (
  colaborador_importado_id uuid primary key
    references public.colaboradores_importados (id) on delete cascade,
  saldo integer not null default 0 check (saldo >= 0),
  atualizado_em timestamptz not null default now()
);

alter table public.floww_coins_saldos enable row level security;

drop policy if exists "authenticated can read floww_coins_saldos" on public.floww_coins_saldos;
create policy "authenticated can read floww_coins_saldos"
  on public.floww_coins_saldos
  for select
  to authenticated
  using (true);

grant select on public.floww_coins_saldos to authenticated;

-- Extrato de movimentações ---------------------------------------------------------------

create table if not exists public.floww_coins_transacoes (
  id uuid primary key default gen_random_uuid(),
  colaborador_importado_id uuid not null
    references public.colaboradores_importados (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida')),
  descricao text not null,
  valor integer not null check (valor > 0),
  produto_id text references public.produtos_shop (id) on delete set null,
  criado_em timestamptz not null default now()
);

create index if not exists floww_coins_transacoes_colaborador_idx
  on public.floww_coins_transacoes (colaborador_importado_id, criado_em desc);

alter table public.floww_coins_transacoes enable row level security;

grant select on public.floww_coins_transacoes to authenticated;

-- Funções --------------------------------------------------------------------------------

-- Registro de colaboradores_importados do usuário logado (pelo e-mail do login).
create or replace function public.colaborador_importado_do_usuario()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ci.id
  from public.colaboradores_importados ci
  where lower(btrim(ci.email)) = lower(btrim(auth.jwt() ->> 'email'))
  limit 1;
$$;

-- Ranking: todos os colaboradores importados, com saldo (0 quando ainda não há registro).
create or replace function public.listar_ranking_floww_coins()
returns table (
  id uuid,
  nome text,
  cargo text,
  departamento text,
  papel text,
  saldo integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    ci.id,
    ci.nome,
    ci.cargo,
    ci.departamento,
    ci.papel,
    coalesce(s.saldo, 0) as saldo
  from public.colaboradores_importados ci
  left join public.floww_coins_saldos s on s.colaborador_importado_id = ci.id
  order by coalesce(s.saldo, 0) desc, ci.nome asc;
$$;

-- Saldo do colaborador logado. Retorna null se o e-mail do login não estiver na base importada.
create or replace function public.obter_meu_saldo_floww_coins()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'id', ci.id,
    'nome', ci.nome,
    'cargo', ci.cargo,
    'saldo', coalesce(s.saldo, 0)
  )
  from public.colaboradores_importados ci
  left join public.floww_coins_saldos s on s.colaborador_importado_id = ci.id
  where ci.id = public.colaborador_importado_do_usuario();
$$;

-- Extrato do colaborador logado.
create or replace function public.listar_minhas_transacoes_floww_coins()
returns setof public.floww_coins_transacoes
language sql
stable
security definer
set search_path = public
as $$
  select t.*
  from public.floww_coins_transacoes t
  where t.colaborador_importado_id = public.colaborador_importado_do_usuario()
  order by t.criado_em desc;
$$;

-- Resgate de um ou mais produtos em uma única transação.
-- p_itens: [{ "produto_id": "shop-01", "quantidade": 2 }, ...]
-- Preço e estoque vêm do banco. Qualquer falha desfaz todo o resgate.
create or replace function public.resgatar_produtos_floww_coins(p_itens jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_colaborador_id uuid := public.colaborador_importado_do_usuario();
  v_item jsonb;
  v_produto public.produtos_shop%rowtype;
  v_quantidade integer;
  v_total integer := 0;
  v_saldo integer;
begin
  if v_colaborador_id is null then
    raise exception 'Colaborador não encontrado para este usuário.';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Nenhum item informado.';
  end if;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    v_quantidade := (v_item ->> 'quantidade')::integer;
    if v_quantidade is null or v_quantidade <= 0 then
      raise exception 'Quantidade inválida.';
    end if;

    select * into v_produto
    from public.produtos_shop
    where id = v_item ->> 'produto_id'
    for update;

    if not found then
      raise exception 'Produto não encontrado.';
    end if;

    if v_produto.esgotado or v_produto.quantidade_estoque < v_quantidade then
      raise exception 'Estoque insuficiente para "%".', v_produto.nome;
    end if;

    update public.produtos_shop
    set quantidade_estoque = quantidade_estoque - v_quantidade,
        esgotado = (quantidade_estoque - v_quantidade) <= 0
    where id = v_produto.id;

    insert into public.floww_coins_transacoes
      (colaborador_importado_id, tipo, descricao, valor, produto_id)
    values (
      v_colaborador_id,
      'saida',
      'Compra: ' || v_produto.nome || case when v_quantidade > 1 then ' (x' || v_quantidade || ')' else '' end,
      v_produto.preco * v_quantidade,
      v_produto.id
    );

    v_total := v_total + v_produto.preco * v_quantidade;
  end loop;

  insert into public.floww_coins_saldos (colaborador_importado_id, saldo)
  values (v_colaborador_id, 0)
  on conflict (colaborador_importado_id) do nothing;

  select saldo into v_saldo
  from public.floww_coins_saldos
  where colaborador_importado_id = v_colaborador_id
  for update;

  if v_saldo < v_total then
    raise exception 'Saldo insuficiente para finalizar a compra.';
  end if;

  update public.floww_coins_saldos
  set saldo = saldo - v_total,
      atualizado_em = now()
  where colaborador_importado_id = v_colaborador_id;

  return json_build_object('saldo', v_saldo - v_total, 'total', v_total);
end;
$$;

-- O colaborador só lê as próprias movimentações (a policy usa a função acima, por isso fica depois dela).
drop policy if exists "colaborador read own floww_coins_transacoes" on public.floww_coins_transacoes;
create policy "colaborador read own floww_coins_transacoes"
  on public.floww_coins_transacoes
  for select
  to authenticated
  using (colaborador_importado_id = public.colaborador_importado_do_usuario());

revoke all on function public.colaborador_importado_do_usuario() from public, anon;
revoke all on function public.listar_ranking_floww_coins() from public, anon;
revoke all on function public.obter_meu_saldo_floww_coins() from public, anon;
revoke all on function public.listar_minhas_transacoes_floww_coins() from public, anon;
revoke all on function public.resgatar_produtos_floww_coins(jsonb) from public, anon;

grant execute on function public.colaborador_importado_do_usuario() to authenticated;
grant execute on function public.listar_ranking_floww_coins() to authenticated;
grant execute on function public.obter_meu_saldo_floww_coins() to authenticated;
grant execute on function public.listar_minhas_transacoes_floww_coins() to authenticated;
grant execute on function public.resgatar_produtos_floww_coins(jsonb) to authenticated;
