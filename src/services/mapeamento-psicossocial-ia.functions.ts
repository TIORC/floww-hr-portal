import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RequestSchema = z.object({
  avaliacaoId: z.string().uuid(),
  setorId: z.string().uuid().nullable(),
}).strict();

const ResponseSchema = {
  type: "object",
  properties: {
    resumo_executivo: { type: "string" },
    principais_pontos_atencao: { type: "array", items: { type: "string" } },
    analise: { type: "string" },
    recomendacoes: { type: "array", items: { type: "string" } },
  },
  required: ["resumo_executivo", "principais_pontos_atencao", "analise", "recomendacoes"],
  additionalProperties: false,
} as const;

type FactorRecord = { id: string; nome: string; ordem: number };
type ResultRecord = {
  fator_id: string;
  setor_id: string | null;
  distribuicao: Record<string, unknown> | null;
};
type FactorMetric = { fator: string; percentual_relatado: number | null };

function readCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (value && typeof value === "object" && "quantidade" in value) {
    return readCount((value as { quantidade: unknown }).quantidade);
  }
  return null;
}

function distribution(row: ResultRecord) {
  const source = row.distribuicao ?? {};
  const reported = readCount(source.relatoram ?? source.relatados ?? source.reported);
  const notReported = readCount(source.nao_relatam ?? source.nao_relatados ?? source.notReported);
  return reported === null || notReported === null ? null : { reported, notReported };
}

function metricsFor(factors: FactorRecord[], rows: ResultRecord[], setorId: string | null) {
  const matchingRows = setorId === null ? rows : rows.filter((row) => row.setor_id === setorId);
  const useOrganizationTotals = setorId === null && matchingRows.some((row) => row.setor_id === null);
  const scopedRows = useOrganizationTotals ? matchingRows.filter((row) => row.setor_id === null) : matchingRows;
  const factorMetrics: FactorMetric[] = factors.map((factor) => {
    const counts = scopedRows.filter((row) => row.fator_id === factor.id).map(distribution)
      .filter((item): item is NonNullable<typeof item> => item !== null);
    const reported = counts.reduce((sum, item) => sum + item.reported, 0);
    const notReported = counts.reduce((sum, item) => sum + item.notReported, 0);
    const total = reported + notReported;
    return { fator: factor.nome, percentual_relatado: total ? Math.round(reported / total * 1000) / 10 : null };
  });
  const available = factorMetrics.filter((item) => item.percentual_relatado !== null);
  const indice = available.length === 13
    ? Math.round(available.reduce((sum, item) => sum + (item.percentual_relatado ?? 0), 0) / 13 * 10) / 10
    : null;
  const metadataRows = scopedRows.map((row) => row.distribuicao ?? {});
  const participants = Math.max(0, ...metadataRows
    .map((item) => readCount(item.total_colaboradores_avaliados))
    .filter((value): value is number => value !== null));
  const eligibleValues = metadataRows
    .map((item) => readCount(item.total_colaboradores_elegiveis))
    .filter((value): value is number => value !== null);
  const eligible = eligibleValues.length ? Math.max(...eligibleValues) : null;
  return {
    fatores: factorMetrics,
    indice_geral_percentual: indice,
    quantidade_participantes: participants || null,
    percentual_participacao: eligible && eligible > 0 && participants > 0
      ? Math.round(participants / eligible * 1000) / 10
      : null,
  };
}

export const gerarAnaliseMapeamentoPsicossocial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(RequestSchema)
  .handler(async ({ data, context }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("A integração da Floww! IA não está configurada no servidor (OPENAI_API_KEY ausente).");

    // Read only the authenticated user's aggregates through their RLS-scoped Supabase client.
    const scopedDb = context.supabase as unknown as {
      from: (table: string) => any;
    };
    const [{ data: assessment, error: assessmentError }, { data: factorsData, error: factorError }, { data: resultsData, error: resultsError }] = await Promise.all([
      scopedDb.from("avaliacoes_psicossociais").select("id,criado_em").eq("id", data.avaliacaoId).maybeSingle(),
      scopedDb.from("fatores_psicossociais").select("id,nome,ordem").order("ordem"),
      scopedDb.from("resultados_psicossociais")
        .select("avaliacao_id,fator_id,setor_id,distribuicao")
        .eq("avaliacao_id", data.avaliacaoId),
    ]);
    if (assessmentError || factorError || resultsError || !assessment) {
      throw new Error("Não foi possível acessar os resultados agregados desta avaliação.");
    }
    const factors = (factorsData ?? []) as FactorRecord[];
    const currentRows = (resultsData ?? []) as ResultRecord[];
    const current = metricsFor(factors, currentRows, data.setorId);
    if (!currentRows.length || !factors.length) {
      throw new Error("Não há dados agregados suficientes para gerar uma análise.");
    }

    let setor: string | null = null;
    if (data.setorId) {
      const { data: sectorData, error: sectorError } = await scopedDb.from("setores")
        .select("nome").eq("id", data.setorId).maybeSingle();
      if (sectorError || !sectorData) throw new Error("Não foi possível validar o setor selecionado.");
      setor = sectorData.nome as string;
    }

    const { data: previousAssessments, error: previousAssessmentError } = await scopedDb.from("avaliacoes_psicossociais")
      .select("id,criado_em")
      .lt("criado_em", assessment.criado_em)
      .order("criado_em", { ascending: false })
      .limit(1);
    if (previousAssessmentError) throw new Error("Não foi possível consultar a avaliação anterior.");
    let comparison: { fatores: FactorMetric[]; indice_geral_percentual: number | null } | null = null;
    const previous = previousAssessments?.[0] as { id: string; criado_em: string } | undefined;
    if (previous) {
      const { data: previousRows, error: previousResultsError } = await scopedDb.from("resultados_psicossociais")
        .select("avaliacao_id,fator_id,setor_id,distribuicao")
        .eq("avaliacao_id", previous.id);
      if (previousResultsError) throw new Error("Não foi possível consultar os resultados da avaliação anterior.");
      if (previousRows?.length) {
        const oldMetrics = metricsFor(factors, previousRows as ResultRecord[], data.setorId);
        if (oldMetrics.fatores.some((item) => item.percentual_relatado !== null)) {
          comparison = { fatores: oldMetrics.fatores, indice_geral_percentual: oldMetrics.indice_geral_percentual };
        }
      }
    }

    // Explicit, allow-listed aggregate payload: no assessment id/title, employee data, or individual answers.
    const aggregatePayload = {
      quantidade_participantes: current.quantidade_participantes,
      percentual_participacao: current.percentual_participacao,
      fatores: current.fatores,
      indice_geral_percentual: current.indice_geral_percentual,
      setor,
      unidade: null,
      comparacao_avaliacao_anterior: comparison,
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.FLOWW_IA_MODEL || "gpt-4.1-mini",
        store: false,
        max_output_tokens: 1400,
        input: [
          {
            role: "system",
            content: "Você é a Floww! IA, assistente de análise organizacional. Use somente os dados agregados fornecidos. Gere resumo executivo, principais pontos de atenção, análise e recomendações específicas e vinculadas aos fatores e percentuais disponíveis. Se houver dados incompletos, informe claramente as limitações e não invente valores, causas ou tendências. Não faça diagnósticos psicológicos ou médicos nem afirme ansiedade, depressão, transtornos ou condições clínicas. Limite-se à percepção sobre fatores organizacionais e condições de trabalho. Recomendações devem ser pontos de investigação ou ações possíveis, sem conclusões sobre indivíduos.",
          },
          { role: "user", content: JSON.stringify(aggregatePayload) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "analise_psicossocial",
            strict: true,
            schema: ResponseSchema,
          },
        },
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw new Error("A Floww! IA não conseguiu gerar a análise agora. Tente novamente.");
    const responseData = await response.json() as {
      output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
    };
    const outputText = responseData.output?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("A Floww! IA retornou uma resposta vazia. Tente novamente.");
    try {
      return JSON.parse(outputText) as {
        resumo_executivo: string;
        principais_pontos_atencao: string[];
        analise: string;
        recomendacoes: string[];
      };
    } catch {
      throw new Error("Não foi possível interpretar a resposta da Floww! IA. Tente novamente.");
    }
  });
