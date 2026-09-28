# Daily Access Comparison Feature - Implementation Plan

## Overview
Add daily access tracking to the "Painel" dashboard that shows:
1. User's daily access count for today
2. Comparison with company average (e.g., "20% above company average")

## Requirements
- Track unique days logged in (one per day max per user)
- Company average = average daily accesses across all colaboradores
- Automatic tracking on login
- Display in existing "Acessos diários" card in IndicadoresPainel

---

## Database Changes

### 1. Create `acessos_diarios` table
```sql
create table if not exists public.acessos_diarios (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  data date not null default now(),
  criado_em timestamptz not null default now(),
  unique (colaborador_id, data)
);

create index if not exists acessos_diarios_colaborador_id_idx on public.acessos_diarios (colaborador_id);
create index if not exists acessos_diarios_data_idx on public.acessos_diarios (data);

alter table public.acessos_diarios enable row level security;

-- Colaborador sees only own accesses
create policy "colaborador read own accesses"
  on public.acessos_diarios
  for select
  to authenticated
  using (colaborador_id in (
    select id from public.colaboradores where user_id = auth.uid()
  ));

-- System can insert (via service role or RPC)
create policy "system insert accesses"
  on public.acessos_diarios
  for insert
  to authenticated
  with check (true);
```

### 2. Create RPC function for recording access (upsert)
```sql
create or replace function public.registrar_acesso_diario(p_colaborador_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.acessos_diarios (colaborador_id, data)
  values (p_colaborador_id, now()::date)
  on conflict (colaborador_id, data) do nothing;
end;
$$;
```

### 3. Create RPC function for getting today's access count + company average
```sql
create or replace function public.get_acessos_diario_comparativo(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_colaborador_id uuid;
  v_hoje date := now()::date;
  v_meus_acessos int;
  v_media_empresa numeric;
  v_percentual numeric;
  v_comparativo text;
begin
  -- Get colaborador_id from user_id
  select id into v_colaborador_id
  from public.colaboradores
  where user_id = p_user_id;

  if v_colaborador_id is null then
    return json_build_object('erro', 'Colaborador não encontrado');
  end if;

  -- My accesses today
  select count(*) into v_meus_acessos
  from public.acessos_diarios
  where colaborador_id = v_colaborador_id
    and data = v_hoje;

  -- Company average (avg daily accesses per user today)
  select avg(cnt) into v_media_empresa
  from (
    select colaborador_id, count(*) as cnt
    from public.acessos_diarios
    where data = v_hoje
    group by colaborador_id
  ) sub;

  if v_media_empresa is null or v_media_empresa = 0 then
    v_percentual := 0;
    v_comparativo := 'Média da empresa indisponível';
  else
    v_percentual := round(((v_meus_acessos - v_media_empresa) / v_media_empresa) * 100);
    if v_percentual > 0 then
      v_comparativo := v_percentual || '% acima da média da empresa';
    elsif v_percentual < 0 then
      v_comparativo := abs(v_percentual) || '% abaixo da média da empresa';
    else
      v_comparativo := 'Na média da empresa';
    end if;
  end if;

  return json_build_object(
    'meus_acessos', v_meus_acessos,
    'media_empresa', round(v_media_empresa::numeric, 1),
    'percentual', v_percentual,
    'comparativo', v_comparativo
  );
end;
$$;

grant execute on function public.get_acessos_diario_comparativo(uuid) to authenticated;
grant execute on function public.registrar_acesso_diario(uuid) to authenticated;
```

---

## Frontend Changes

### 1. Create hook `useAcessosDiarios.ts`
```typescript
// src/hooks/use-acessos-diarios.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAcessosDiarios() {
  return useQuery({
    queryKey: ["acessos-diarios"],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return null;

      const { data, error } = await supabase.rpc("get_acessos_diario_comparativo", {
        p_user_id: authData.user.id,
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useRegistrarAcesso() {
  return useMutation({
    mutationFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { data: perfil } = await supabase
        .from("perfil_colaborador")
        .select("id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!perfil) return;

      const { error } = await supabase.rpc("registrar_acesso_diario", {
        p_colaborador_id: perfil.id,
      });

      if (error) throw error;
    },
  });
}
```

### 2. Update `IndicadoresPainel.tsx` - CardAtividade component
- Replace placeholder "—" with actual access count
- Add comparison text below the number
- Style: green for above average, red for below, gray for equal

### 3. Trigger access recording on login
- Call `registrarAcesso` mutation in `Painel.tsx` useEffect (after session check)
- Or in auth middleware

---

## Implementation Order

1. **Database migration** - Create table + RPC functions
2. **TypeScript types** - Regenerate Supabase types
3. **Hook** - Create `useAcessosDiarios.ts`
4. **UI** - Update `CardAtividade` in `IndicadoresPainel.tsx`
5. **Tracking** - Add `useRegistrarAcesso` call in `Painel.tsx`
6. **Testing** - Verify display and comparison logic

---

## Edge Cases

- No accesses recorded yet → show "0 acessos" + "Média indisponível"
- Company average = 0 → show "Média da empresa indisponível"
- User not in colaboradores table → handle gracefully
- Multiple logins same day → upsert prevents duplicates

---

## Validation

- [ ] Migration runs without errors
- [ ] Types regenerated (`npx supabase gen types`)
- [ ] Hook returns correct data structure
- [ ] Card shows: number + comparison text
- [ ] Comparison text changes color based on percentual
- [ ] Access recorded on first login of day
- [ ] No duplicate records for same day