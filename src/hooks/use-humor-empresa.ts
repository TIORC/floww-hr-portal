import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { EmocaoSentimento } from "@/lib/sentimento";

export interface HumorEmpresa {
  totalCheckins: number;
  // Média na escala 1 (muito triste) a 5 (muito feliz); null quando não há check-ins no período.
  media: number | null;
  distribuicao: Record<EmocaoSentimento, number>;
}

interface HumorEmpresaBruto {
  total_checkins?: unknown;
  media?: unknown;
  distribuicao?: Record<string, unknown>;
}

function normalizarHumorEmpresa(valor: unknown): HumorEmpresa {
  const bruto = (valor ?? {}) as HumorEmpresaBruto;
  const distribuicaoBruta = bruto.distribuicao ?? {};
  const contagem = (id: EmocaoSentimento) =>
    typeof distribuicaoBruta[id] === "number" ? (distribuicaoBruta[id] as number) : 0;

  return {
    totalCheckins: typeof bruto.total_checkins === "number" ? bruto.total_checkins : 0,
    media: typeof bruto.media === "number" ? bruto.media : null,
    distribuicao: {
      muito_triste: contagem("muito_triste"),
      triste: contagem("triste"),
      neutro: contagem("neutro"),
      feliz: contagem("feliz"),
      muito_feliz: contagem("muito_feliz"),
    },
  };
}

export function useHumorEmpresa(periodo: { inicio?: string; fim?: string } = {}) {
  return useQuery<HumorEmpresa>({
    queryKey: ["humor-empresa", periodo.inicio ?? null, periodo.fim ?? null],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("obter_humor_medio_empresa", {
        p_inicio: periodo.inicio,
        p_fim: periodo.fim,
      });

      if (error) throw error;
      return normalizarHumorEmpresa(data);
    },
  });
}
