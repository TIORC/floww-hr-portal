-- Notificações do sistema por usuário logado.
-- A notificação de boas-vindas é única por usuário (chave 'boas-vindas') e é criada no primeiro acesso.

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chave text not null,
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (user_id, chave)
);

create index if not exists notificacoes_user_id_criado_em_idx
  on public.notificacoes (user_id, criado_em desc);

alter table public.notificacoes enable row level security;

drop policy if exists "user read own notificacoes" on public.notificacoes;
create policy "user read own notificacoes"
  on public.notificacoes
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user mark own notificacoes as read" on public.notificacoes;
create policy "user mark own notificacoes as read"
  on public.notificacoes
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select on public.notificacoes to authenticated;
-- Só a coluna "lida" pode ser alterada pelo cliente.
grant update (lida) on public.notificacoes to authenticated;

-- Cria a boas-vindas do usuário logado, se ainda não existir (idempotente).
create or replace function public.garantir_notificacao_boas_vindas()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notificacoes (user_id, chave, titulo, mensagem)
  values (
    auth.uid(),
    'boas-vindas',
    'Bem-vindo(a) ao Floww!',
    'Este é o novo canal de interação com a sua equipe e com os seus gestores. Por aqui você acompanha avisos e novidades da plataforma.'
  )
  on conflict (user_id, chave) do nothing;
$$;

revoke all on function public.garantir_notificacao_boas_vindas() from public, anon;
grant execute on function public.garantir_notificacao_boas_vindas() to authenticated;
