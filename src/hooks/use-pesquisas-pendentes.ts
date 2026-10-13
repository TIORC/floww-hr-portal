import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const PESQUISAS_PENDENTES_QUERY_KEY = ["pesquisas-pendentes", "colaborador"] as const;

export interface PesquisaPendente {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  prazo: string;
  anonima: boolean;
}

function normalizarPesquisasBrutas(valor: unknown): PesquisaPendente[] {
  if (!Array.isArray(valor)) return [];

  return valor.flatMap((item): PesquisaPendente[] => {
    if (!item || typeof item !== "object") return [];

    const bruto = item as Record<string, unknown>;
    if (typeof bruto.id !== "string" || typeof bruto.titulo !== "string") return [];

    return [
      {
        id: bruto.id,
        titulo: bruto.titulo,
        descricao: typeof bruto.descricao === "string" ? bruto.descricao : "",
        tipo: typeof bruto.tipo === "string" ? bruto.tipo : "",
        prazo: typeof bruto.prazo === "string" ? bruto.prazo : "",
        anonima: bruto.anonima === true,
      },
    ];
  });
}

export function usePesquisasPendentes() {
  return useQuery<PesquisaPendente[]>({
    queryKey: PESQUISAS_PENDENTES_QUERY_KEY,
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return [];

      const { data, error } = await supabase.rpc("listar_pesquisas_pendentes_colaborador");

      if (error) throw error;
      return normalizarPesquisasBrutas(data);
    },
  });
}
