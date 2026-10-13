import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PessoaOrganograma } from "@/lib/organograma";
import { estaDesligado } from "@/lib/desligamento";

const TAMANHO_PAGINA = 1000;


// Lê todos os colaboradores importados, página a página, sem os desligados.
async function buscarPessoasOrganograma(): Promise<PessoaOrganograma[]> {
  const pessoas: PessoaOrganograma[] = [];

  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await supabase
      .from("colaboradores_importados")
      .select("id, nome, email, cargo, cargo_visivel, departamento, gestor_direto_email, papel, foto_url, situacao, desligamento, ultimo_dia_trabalhado")
      .order("nome", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;

    (data ?? [])
      .filter((linha) => !estaDesligado(linha))
      .forEach((linha) => {
        pessoas.push({
          id: linha.id,
          nome: linha.nome,
          cargo: linha.cargo_visivel || linha.cargo,
          departamento: linha.departamento,
          email: linha.email,
          gestorEmail: linha.gestor_direto_email,
          papel: linha.papel,
          fotoUrl: linha.foto_url,
        });
      });

    if (!data || data.length < TAMANHO_PAGINA) break;
  }

  return pessoas;
}

export function useOrganograma() {
  return useQuery({
    queryKey: ["organograma"],
    queryFn: buscarPessoasOrganograma,
  });
}
