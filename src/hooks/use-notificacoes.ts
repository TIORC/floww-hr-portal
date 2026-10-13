import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type Notificacao = Tables<"notificacoes">;

const NOTIFICACOES_QUERY_KEY = ["notificacoes"] as const;

// Garante a boas-vindas do usuário (idempotente) e lista as notificações mais recentes.
export function useNotificacoes() {
  return useQuery({
    queryKey: NOTIFICACOES_QUERY_KEY,
    queryFn: async (): Promise<Notificacao[]> => {
      const { error: erroBoasVindas } = await supabase.rpc("garantir_notificacao_boas_vindas");
      if (erroBoasVindas) throw erroBoasVindas;

      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMarcarNotificacoesLidas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("lida", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICACOES_QUERY_KEY });
    },
  });
}
