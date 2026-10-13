import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TipoPreferenciaEmail =
  | "lembrete_celebracao"
  | "atualizacoes_okr"
  | "nova_celebracao"
  | "novo_feedback"
  | "novo_objetivo";

export type PreferenciaEmail = {
  tipo: TipoPreferenciaEmail;
  ativo: boolean;
};

const PREFERENCIAS_QUERY_KEY = ["preferencias-email"] as const;

export function usePreferenciasEmail() {
  return useQuery({
    queryKey: PREFERENCIAS_QUERY_KEY,
    queryFn: async (): Promise<PreferenciaEmail[]> => {
      const { data, error } = await supabase.rpc("obter_preferencias_email");
      if (error) throw error;
      return (data as unknown as PreferenciaEmail[] | null) ?? [];
    },
  });
}

export function useSalvarPreferenciasEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferencias: PreferenciaEmail[]) => {
      const { error } = await supabase.rpc("salvar_preferencias_email", {
        p_preferencias: preferencias,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCIAS_QUERY_KEY });
    },
  });
}
