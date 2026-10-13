import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { estaDesligado } from "@/lib/desligamento";

export type FormacaoColaborador = {
  tipo: string;
  formacao: string;
  instituicao: string;
  area: string;
};

export type ColaboradorLista = {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  unidade: string;
  papel: string;
  habilidades: string[];
  formacoes: FormacaoColaborador[];
  fotoUrl: string | null;
};

const TAMANHO_PAGINA = 1000;

// Habilidades do cadastro são texto livre; separa por vírgula, ponto e vírgula ou quebra de linha.
export function separarHabilidades(texto: string) {
  return texto
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// Lê os colaboradores importados, página a página. Desligados não entram na lista.
async function buscarColaboradores(): Promise<ColaboradorLista[]> {
  const { data: diretorio, error: erroDiretorio } = await supabase.rpc(
    "listar_habilidades_formacoes_diretorio",
  );
  if (erroDiretorio) throw erroDiretorio;

  const porId = new Map(
    (diretorio ?? []).map((item) => [
      item.colaborador_importado_id,
      {
        habilidades: separarHabilidades(item.habilidades ?? ""),
        formacoes: (item.formacoes as unknown as FormacaoColaborador[]) ?? [],
      },
    ]),
  );

  const colaboradores: ColaboradorLista[] = [];

  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await supabase
      .from("colaboradores_importados")
      .select("id, nome, email, cargo, cargo_visivel, departamento, unidade, papel, foto_url, situacao, desligamento, ultimo_dia_trabalhado")
      .order("nome", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;

    (data ?? [])
      .filter((linha) => !estaDesligado(linha))
      .forEach((linha) => {
        const extra = porId.get(linha.id);
        colaboradores.push({
          id: linha.id,
          nome: linha.nome,
          email: linha.email,
          cargo: linha.cargo_visivel || linha.cargo,
          departamento: linha.departamento,
          unidade: linha.unidade,
          papel: linha.papel,
          habilidades: extra?.habilidades ?? [],
          formacoes: extra?.formacoes ?? [],
          fotoUrl: linha.foto_url,
        });
      });

    if (!data || data.length < TAMANHO_PAGINA) break;
  }

  return colaboradores;
}

export function useColaboradores() {
  return useQuery({
    queryKey: ["colaboradores-lista"],
    queryFn: buscarColaboradores,
  });
}
