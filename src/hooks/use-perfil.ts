import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type PerfilColaborador = Tables<"perfil_colaborador">;

export const PERFIL_QUERY_KEY = ["perfil-colaborador"] as const;

export function usePerfil() {
  return useQuery({
    queryKey: PERFIL_QUERY_KEY,
    queryFn: async (): Promise<PerfilColaborador | null> => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const user = authData.user;
      if (!user) return null;

      const { data, error } = await supabase
        .from("perfil_colaborador")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
