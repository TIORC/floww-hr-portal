import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ContatoPerfil = {
  tipo: "Whatsapp" | "Telefone" | "E-mail";
  valor: string;
};

export type MeuPerfil = {
  nome: string;
  cargo: string;
  email: string;
  cargo_visivel: string;
  idioma: string;
  biografia: string;
  habilidades: string;
  contatos: ContatoPerfil[];
};

export type DadosInformacoes = {
  biografia: string;
  habilidades: string;
};

export type DadosEditaveisPerfil = {
  cargo_visivel: string;
  idioma: string;
  contatos: ContatoPerfil[];
};

const MEU_PERFIL_QUERY_KEY = ["meu-perfil"] as const;

export function useMeuPerfil() {
  return useQuery({
    queryKey: MEU_PERFIL_QUERY_KEY,
    queryFn: async (): Promise<MeuPerfil | null> => {
      const { data, error } = await supabase.rpc("obter_meu_perfil");
      if (error) throw error;
      return data as unknown as MeuPerfil | null;
    },
  });
}

export function useSalvarMinhasInformacoes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: DadosInformacoes) => {
      const { error } = await supabase.rpc("salvar_minhas_informacoes", {
        p_biografia: dados.biografia,
        p_habilidades: dados.habilidades,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEU_PERFIL_QUERY_KEY });
    },
  });
}

export function useSalvarMeuPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: DadosEditaveisPerfil) => {
      const { error } = await supabase.rpc("salvar_meu_perfil", {
        p_cargo_visivel: dados.cargo_visivel,
        p_idioma: dados.idioma,
        p_contatos: dados.contatos,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEU_PERFIL_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["perfil-colaborador"] });
    },
  });
}
