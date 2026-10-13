import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type Formacao = Tables<"colaboradores_formacoes">;

export const TIPOS_FORMACAO = [
  "Ensino superior",
  "Pós-graduação",
  "Mestrado",
  "Doutorado",
  "Técnico",
  "Profissionalizante",
  "Outro",
] as const;

export type TipoFormacao = (typeof TIPOS_FORMACAO)[number];

export type DadosFormacao = {
  tipo: TipoFormacao;
  instituicao: string;
  formacao: string;
  area: string;
  data_inicio: string;
  data_termino: string;
  diploma_url: string;
};

const FORMACOES_QUERY_KEY = ["formacoes"] as const;

export function useFormacoes() {
  return useQuery({
    queryKey: FORMACOES_QUERY_KEY,
    queryFn: async (): Promise<Formacao[]> => {
      const { data, error } = await supabase
        .from("colaboradores_formacoes")
        .select("*")
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSalvarFormacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dados }: { id: string | null; dados: DadosFormacao }) => {
      const { error } = await supabase.rpc("salvar_formacao", {
        p_id: id ?? undefined,
        p_tipo: dados.tipo,
        p_instituicao: dados.instituicao,
        p_formacao: dados.formacao,
        p_area: dados.area,
        p_data_inicio: dados.data_inicio,
        p_data_termino: dados.data_termino,
        p_diploma_url: dados.diploma_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMACOES_QUERY_KEY });
    },
  });
}

export function useRemoverFormacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("remover_formacao", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMACOES_QUERY_KEY });
    },
  });
}
