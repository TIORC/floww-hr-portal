import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type ProdutoShop = Tables<"produtos_shop">;
export type TransacaoFlowwCoins = Tables<"floww_coins_transacoes">;

export type SaldoFlowwCoins = {
  id: string;
  nome: string;
  cargo: string;
  saldo: number;
};

export type EntradaRankingFlowwCoins = {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  papel: string;
  saldo: number;
};

export type ItemResgate = {
  produto_id: string;
  quantidade: number;
};

const SALDO_QUERY_KEY = ["floww-coins", "saldo"] as const;
const RANKING_QUERY_KEY = ["floww-coins", "ranking"] as const;
const PRODUTOS_QUERY_KEY = ["floww-coins", "produtos"] as const;
const TRANSACOES_QUERY_KEY = ["floww-coins", "transacoes"] as const;

// Saldo do colaborador logado. Null quando o e-mail do login não está na base de colaboradores.
export function useSaldoFlowwCoins() {
  return useQuery({
    queryKey: SALDO_QUERY_KEY,
    queryFn: async (): Promise<SaldoFlowwCoins | null> => {
      const { data, error } = await supabase.rpc("obter_meu_saldo_floww_coins");
      if (error) throw error;
      return data as unknown as SaldoFlowwCoins | null;
    },
  });
}

export function useRankingFlowwCoins() {
  return useQuery({
    queryKey: RANKING_QUERY_KEY,
    queryFn: async (): Promise<EntradaRankingFlowwCoins[]> => {
      const { data, error } = await supabase.rpc("listar_ranking_floww_coins");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProdutosShop() {
  return useQuery({
    queryKey: PRODUTOS_QUERY_KEY,
    queryFn: async (): Promise<ProdutoShop[]> => {
      const { data, error } = await supabase.from("produtos_shop").select("*").order("id");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTransacoesFlowwCoins() {
  return useQuery({
    queryKey: TRANSACOES_QUERY_KEY,
    queryFn: async (): Promise<TransacaoFlowwCoins[]> => {
      const { data, error } = await supabase.rpc("listar_minhas_transacoes_floww_coins");
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Credita a recompensa diária de entrada (uma vez por dia, no banco).
export function useRegistrarEntradaDiaria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("registrar_entrada_diaria_floww_coins");
      if (error) throw error;
      return data as unknown as { creditado: boolean; valor?: number; saldo?: number };
    },
    onSuccess: (resultado) => {
      if (!resultado.creditado) return;
      queryClient.invalidateQueries({ queryKey: ["floww-coins"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

// Resgata os itens em uma única transação no banco. O preço e o estoque são validados lá.
export function useResgatarProdutos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itens: ItemResgate[]) => {
      const { data, error } = await supabase.rpc("resgatar_produtos_floww_coins", {
        p_itens: itens,
      });
      if (error) throw error;
      return data as unknown as { saldo: number; total: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floww-coins"] });
    },
  });
}
