import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AcessosDiariosData {
  meus_acessos: number;
  media_empresa: number;
  percentual: number;
  comparativo: string;
  erro?: string;
}

export function useAcessosDiarios() {
  return useQuery<AcessosDiariosData | null>({
    queryKey: ["acessos-diarios"],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return null;

      const { data, error } = await supabase.rpc("get_acessos_diario_comparativo", {
        p_user_id: authData.user.id,
      });

      if (error) throw error;
      return data as unknown as AcessosDiariosData;
    },
  });
}

export function useRegistrarAcesso() {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acessos-diarios"] });
    },
  });
}
