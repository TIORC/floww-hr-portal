import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { isEmocaoSentimento, type EmocaoSentimento } from "@/lib/sentimento";

export const CHECKIN_SENTIMENTO_QUERY_KEY = ["checkin-sentimento", "hoje"] as const;

export interface CheckinDoDia {
  emocao: EmocaoSentimento;
  motivo: string;
  data: string;
}

interface RespostaCheckinBruta {
  emocao?: unknown;
  motivo?: unknown;
  data?: unknown;
}

function normalizarCheckinBruto(valor: unknown): CheckinDoDia | null {
  if (!valor || typeof valor !== "object") return null;

  const bruto = valor as RespostaCheckinBruta;

  if (typeof bruto.emocao !== "string" || !isEmocaoSentimento(bruto.emocao)) return null;

  return {
    emocao: bruto.emocao,
    motivo: typeof bruto.motivo === "string" ? bruto.motivo : "",
    data: typeof bruto.data === "string" ? bruto.data : "",
  };
}

export function useCheckinDoDia() {
  return useQuery<CheckinDoDia | null>({
    queryKey: CHECKIN_SENTIMENTO_QUERY_KEY,
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return null;

      const { data, error } = await supabase.rpc("obter_checkin_sentimento_do_dia");

      if (error) throw error;
      return normalizarCheckinBruto(data);
    },
  });
}

export function useRegistrarCheckinSentimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { emocao: EmocaoSentimento; motivo: string }) => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Sessão expirada.");

      const { data: perfil } = await supabase
        .from("perfil_colaborador")
        .select("id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!perfil) throw new Error("Perfil de colaborador não encontrado.");

      const { error } = await supabase.rpc("registrar_checkin_sentimento", {
        p_colaborador_id: perfil.id as string,
        p_emocao: payload.emocao,
        p_motivo: payload.motivo,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHECKIN_SENTIMENTO_QUERY_KEY });
    },
  });
}
