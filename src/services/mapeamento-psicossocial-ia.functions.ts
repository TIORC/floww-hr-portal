import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RequestSchema = z
  .object({
    avaliacaoId: z.string().uuid(),
    setorId: z.string().uuid().nullable(),
    // SCAFFOLD TEMPORÁRIO: habilita o botão no cenário demonstrativo usando os dados
    // fictícios da tela. Remover junto com a reativação do bloqueio por demoActive.
    demo: z.boolean().optional(),
    demoFatores: z
      .array(
        z.object({
          nome: z.string().min(1).max(200),
          percentual: z.number().min(0).max(100).nullable(),
          relataram: z.number().int().min(0).nullable(),
          nao_relataram: z.number().int().min(0).nullable(),
        }),
      )
      .max(13)
      .optional(),
    demoTotal: z.number().int().min(0).optional(),
  })
  .strict();

const PRIORIDADES = ["alta", "media", "baixa"] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

export type PontoAtencao = {
  fator: string;
  percentual: number | null;
  quantidade: number | null;
  prioridade: Prioridade;
  interpretacao: string;
};

export type Recomendacao = { fator: string; acoes: string[] };

export type PlanoAcao = {
  fator: string;
  situacao: string;
  acao: string;
  objetivo: string;
  responsavel_sugerido: string;
  prazo_sugerido_dias: number;
  indicador: string;
};

export type AiAnalysis = {
  resumo_executivo: string;
  indice_atencao: number | null;
  pontos_atencao: PontoAtencao[];
  analise_resultados: string;
  recomendacoes: Recomendacao[];
  plano_acao: PlanoAcao[];
  consideracoes_finais: string;
};

const ResponseSchema = {
  type: "object",
  properties: {
    resumo_executivo: { type: "string" },
    indice_atencao: { type: ["number", "null"] },
    pontos_atencao: {
      type: "array",
      items: {
        type: "object",
        properties: {
          fator: { type: "string" },
          percentual: { type: ["number", "null"] },
          quantidade: { type: ["integer", "null"] },
          prioridade: { type: "string", enum: [...PRIORIDADES] },
          interpretacao: { type: "string" },
        },
        required: ["fator", "percentual", "quantidade", "prioridade", "interpretacao"],
        additionalProperties: false,
      },
    },
    analise_resultados: { type: "string" },
    recomendacoes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          fator: { type: "string" },
          acoes: { type: "array", items: { type: "string" } },
        },
        required: ["fator", "acoes"],
        additionalProperties: false,
      },
    },
    plano_acao: {
      type: "array",
      items: {
        type: "object",
        properties: {
          fator: { type: "string" },
          situacao: { type: "string" },
          acao: { type: "string" },
          objetivo: { type: "string" },
          responsavel_sugerido: { type: "string" },
          prazo_sugerido_dias: { type: "integer" },
          indicador: { type: "string" },
        },
        required: [
          "fator",
          "situacao",
          "acao",
          "objetivo",
          "responsavel_sugerido",
          "prazo_sugerido_dias",
          "indicador",
        ],
        additionalProperties: false,
      },
    },
    consideracoes_finais: { type: "string" },
  },
  required: [
    "resumo_executivo",
    "indice_atencao",
    "pontos_atencao",
    "analise_resultados",
    "recomendacoes",
    "plano_acao",
    "consideracoes_finais",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = [
  "Você é a Floww! IA, assistente de análise organizacional especializada em mapeamento de riscos psicossociais.",
  "Responda sempre em português do Brasil, de forma objetiva e profissional, sem emojis.",
  "",
  "Regras obrigatórias:",
  "1. Utilize somente os dados agregados enviados na mensagem. Eles são a única fonte de verdade.",
  "2. Nunca invente números. Não calcule, estime, complete ou projete percentuais, contagens, datas ou tendências que não estejam no payload. Quando um dado não vier, use null em campos numéricos.",
  "3. Nunca invente respostas de colaboradores nem detalhes que não constem no payload.",
  "4. Nunca identifique, cite ou descreva colaboradores individuais. Não use nomes, cargos específicos de pessoas ou qualquer dado pessoal.",
  "5. Trabalhe exclusivamente com dados agregados.",
  "6. Não realizar diagnóstico médico ou psicológico.",
  "7. Nunca afirme que um colaborador possui ansiedade, depressão, burnout ou qualquer outra condição clínica.",
  "8. Nunca afirme automaticamente que existe descumprimento legal, violação de norma ou infração.",
  "9. Não apresente nenhuma recomendação como obrigação legal. Somente mencione exigência legal se ela estiver explicitamente definida pelos dados enviados ou pela metodologia da plataforma; caso contrário, apresente como recomendação organizacional.",
  "10. Analise os fatores relacionados às condições e à organização do trabalho.",
  "11. Priorize os fatores com maior percentual informado no payload.",
  "12. Considere o número de pessoas afetadas (campo 'relataram') sempre que essa informação estiver disponível.",
  "13. Quando os dados não forem suficientes para determinada conclusão, informe isso claramente no texto, em vez de especular. Não afirme causalidade entre fatores sem que os dados permitam essa conclusão.",
  "",
  "Como preencher cada campo:",
  "- indice_atencao: copie exatamente o valor de 'indice_atencao_psicossocial' do payload, ou null se ele vier nulo.",
  "- pontos_atencao: liste os fatores de maior percentual primeiro. percentual e quantidade devem ser copiados do payload. prioridade deve ser 'alta' para os maiores percentuais, 'media' para os intermediários e 'baixa' para os menores.",
  "- analise_resultados: explique os padrões encontrados e relacione os fatores às dimensões organizacionais presentes nos dados, como pressão por metas, sobrecarga, jornada, disponibilidade constante, autonomia, conflitos, liderança, clareza de funções, distribuição de responsabilidades e mudanças organizacionais. Relacione apenas os fatores que realmente aparecem no payload.",
  "- recomendacoes: agrupe de 3 a 5 ações práticas por fator, ligadas à organização e às condições de trabalho.",
  "- plano_acao: gere de 3 a 5 itens, um para cada principal fator de atenção, com situacao observada, acao recomendada, objetivo, responsavel_sugerido, prazo_sugerido_dias e indicador de acompanhamento. IMPORTANTE: responsavel_sugerido e prazo_sugerido_dias são SUGESTÕES suas e não informações reais da organização. Escolha prazos entre 15 e 90 dias.",
  "- consideracoes_finais: conclusión objetiva baseada exclusivamente nos resultados recebidos.",
].join("\n");

type FactorRecord = { id: string; nome: string; ordem: number };
type ResultRecord = {
  fator_id: string;
  setor_id: string | null;
  distribuicao: Record<string, unknown> | null;
};
type FactorMetric = {
  fator: string;
  percentual: number | null;
  relataram: number | null;
  nao_relataram: number | null;
};

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

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function metricsFor(factors: FactorRecord[], rows: ResultRecord[], setorId: string | null) {
  const matchingRows = setorId === null ? rows : rows.filter((row) => row.setor_id === setorId);
  const useOrganizationTotals =
    setorId === null && matchingRows.some((row) => row.setor_id === null);
  const scopedRows = useOrganizationTotals
    ? matchingRows.filter((row) => row.setor_id === null)
    : matchingRows;
  const factorMetrics: FactorMetric[] = factors.map((factor) => {
    const counts = scopedRows
      .filter((row) => row.fator_id === factor.id)
      .map(distribution)
      .filter((item): item is NonNullable<typeof item> => item !== null);
    const reported = counts.reduce((sum, item) => sum + item.reported, 0);
    const notReported = counts.reduce((sum, item) => sum + item.notReported, 0);
    const total = reported + notReported;
    return {
      fator: factor.nome,
      percentual: total ? round1((reported / total) * 100) : null,
      relataram: total ? reported : null,
      nao_relataram: total ? notReported : null,
    };
  });
  const available = factorMetrics.filter((item) => item.percentual !== null);
  const indice =
    available.length === 13
      ? round1(available.reduce((sum, item) => sum + (item.percentual ?? 0), 0) / 13)
      : null;
  const metadataRows = scopedRows.map((row) => row.distribuicao ?? {});
  const participants = Math.max(
    0,
    ...metadataRows
      .map((item) => readCount(item.total_colaboradores_avaliados))
      .filter((value): value is number => value !== null),
  );
  const eligibleValues = metadataRows
    .map((item) => readCount(item.total_colaboradores_elegiveis))
    .filter((value): value is number => value !== null);
  const eligible = eligibleValues.length ? Math.max(...eligibleValues) : null;
  return {
    // Ordenado do maior para o menor para que o modelo naturallyamente priorize os fatores de maior percentual.
    fatores: [...factorMetrics].sort(
      (a, b) =>
        (b.percentual ?? -1) - (a.percentual ?? -1) || a.fator.localeCompare(b.fator, "pt-BR"),
    ),
    indice_atencao_psicossocial: indice,
    total_participantes: participants || null,
    percentual_participacao:
      eligible && eligible > 0 && participants > 0 ? round1((participants / eligible) * 100) : null,
  };
}

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatPeriodo(inicio: unknown, fim: unknown, criadoEm: unknown): string {
  const start = formatDate(inicio);
  const end = formatDate(fim);
  if (start && end) {
    if (
      start.getUTCMonth() === end.getUTCMonth() &&
      start.getUTCFullYear() === end.getUTCFullYear()
    ) {
      return `${MONTHS[start.getUTCMonth()]}/${start.getUTCFullYear()}`;
    }
    const fmt = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
    return `${fmt.format(start)} a ${fmt.format(end)}`;
  }
  if (start) {
    const fmt = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
    return `a partir de ${fmt.format(start)}`;
  }
  if (end) {
    const fmt = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
    return `até ${fmt.format(end)}`;
  }
  const created = formatDate(criadoEm);
  if (created) return `${MONTHS[created.getUTCMonth()]}/${created.getUTCFullYear()}`;
  return "não informado";
}

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODELS = ["gemini-3.5-flash", "gemini-3.8-flash"];
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const ATTEMPTS_PER_MODEL = 3;
const REQUEST_TIMEOUT_MS = 120000;

type GeminiError = Error & { status?: number; detail?: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestAnalysis(apiKey: string, model: string, body: string): Promise<string> {
  const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
    method: "POST",
    // O formato de Auth Key do AI Studio (prefixo AQ.) exige x-goog-api-key ou ?key=.
    // Enviar como Authorization: Bearer retorna 401.
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw Object.assign(new Error(`Gemini respondeu ${response.status}`), {
      status: response.status,
      detail: detail.slice(0, 400),
    }) satisfies GeminiError;
  }
  const payload = (await response.json()) as {
    candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw Object.assign(new Error("A Floww! IA retornou uma resposta vazia."), {
      status: 200,
    }) satisfies GeminiError;
  }
  return text;
}

async function requestWithFallback(
  apiKey: string,
  models: string[],
  body: string,
): Promise<string> {
  let lastStatus: number | undefined;
  for (const model of models) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt += 1) {
      try {
        return await requestAnalysis(apiKey, model, body);
      } catch (cause) {
        const error = cause as GeminiError;
        lastStatus = error.status;
        const retryable = lastStatus === undefined || RETRYABLE_STATUS.has(lastStatus);
        if (!retryable || attempt === ATTEMPTS_PER_MODEL) break;
        await sleep(700 * attempt * attempt);
      }
    }
  }
  const suffix = lastStatus ? ` (código ${lastStatus})` : "";
  throw new Error(
    `A Floww! IA não conseguiu gerar a análise agora${suffix}. Tente novamente em alguns instantes.`,
  );
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asTextArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asPrioridade(value: unknown): Prioridade {
  return (PRIORIDADES as readonly string[]).includes(value as string)
    ? (value as Prioridade)
    : "media";
}

/**
 * Substitui os números informados pelo modelo pelos valores autoritativos calculados
 * a partir dos agregados reais, garantindo a regra "nunca invente números".
 */
function authoritativeFactors(factors: FactorMetric[]): Map<string, FactorMetric> {
  return new Map(factors.map((item) => [item.fator.trim().toLowerCase(), item]));
}

function normalizeAnalysis(
  raw: unknown,
  factors: FactorMetric[],
  indice: number | null,
): AiAnalysis {
  const data = (raw ?? {}) as Record<string, unknown>;
  const reference = authoritativeFactors(factors);

  const pontos_atencao: PontoAtencao[] = (
    Array.isArray(data.pontos_atencao) ? data.pontos_atencao : []
  )
    .map((item) => item as Record<string, unknown>)
    .filter((item) => asText(item.fator).length > 0)
    .map((item) => {
      const factor = asText(item.fator);
      const source = reference.get(factor.trim().toLowerCase());
      return {
        fator: factor,
        percentual: source ? source.percentual : asNumber(item.percentual),
        quantidade: source ? source.relataram : asNumber(item.quantidade),
        prioridade: asPrioridade(item.prioridade),
        interpretacao: asText(item.interpretacao, "Sem interpretação disponível."),
      };
    });

  const recomendacoes: Recomendacao[] = (
    Array.isArray(data.recomendacoes) ? data.recomendacoes : []
  )
    .map((item) => item as Record<string, unknown>)
    .filter((item) => asText(item.fator).length > 0)
    .map((item) => ({ fator: asText(item.fator), acoes: asTextArray(item.acoes) }))
    .filter((item) => item.acoes.length > 0);

  const plano_acao: PlanoAcao[] = (Array.isArray(data.plano_acao) ? data.plano_acao : [])
    .map((item) => item as Record<string, unknown>)
    .filter((item) => asText(item.fator).length > 0)
    .map((item) => {
      const prazo = asNumber(item.prazo_sugerido_dias);
      return {
        fator: asText(item.fator),
        situacao: asText(item.situacao, "Situação não informada."),
        acao: asText(item.acao, "Ação não informada."),
        objetivo: asText(item.objetivo, "Objetivo não informado."),
        responsavel_sugerido: asText(item.responsavel_sugerido, "Não informado"),
        prazo_sugerido_dias: prazo === null ? 0 : Math.min(365, Math.max(1, Math.round(prazo))),
        indicador: asText(item.indicador, "Indicador não informado."),
      };
    });

  return {
    resumo_executivo: asText(
      data.resumo_executivo,
      "A Floww! IA não retornou um resumo executivo para esta avaliação.",
    ),
    indice_atencao: indice,
    pontos_atencao,
    analise_resultados: asText(
      data.analise_resultados,
      "A Floww! IA não retornou uma análise dos resultados.",
    ),
    recomendacoes,
    plano_acao,
    consideracoes_finais: asText(
      data.consideracoes_finais,
      "A Floww! IA não retornou considerações finais.",
    ),
  };
}

async function runAnalysis(
  apiKey: string,
  models: string[],
  aggregatePayload: Record<string, unknown>,
  factors: FactorMetric[],
  indice: number | null,
): Promise<AiAnalysis> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify(aggregatePayload) }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseJsonSchema: ResponseSchema,
    },
  });

  const outputText = await requestWithFallback(apiKey, models, body);
  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("Não foi possível interpretar a resposta da Floww! IA. Tente novamente.");
  }
  return normalizeAnalysis(parsed, factors, indice);
}

export const gerarAnaliseMapeamentoPsicossocial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(RequestSchema)
  .handler(async ({ data, context }) => {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey)
      throw new Error(
        "A integração da Floww! IA não está configurada no servidor (GEMINI_API_KEY ausente).",
      );

    const models = [process.env['FLOWW_IA_MODEL'], ...DEFAULT_MODELS].filter(
      (model): model is string => Boolean(model && model.trim()),
    );
    const selectedModels = [...new Set(models)];

    // SCAFFOLD TEMPORÁRIO: cenário demonstrativo. Usa os agregados fictícios enviados pela
    // tela em vez de ler o banco, para que a análise corresponda ao gráfico exibido.
    // Remover junto com o bloqueio por demoActive no botão.
    if (data.demo) {
      const demoFactors: FactorMetric[] = (data.demoFatores ?? []).map((item) => ({
        fator: item.nome,
        percentual: item.percentual,
        relataram: item.relataram,
        nao_relataram: item.nao_relataram,
      }));
      if (!demoFactors.length) throw new Error("Não há dados fictícios suficientes para gerar uma análise.");
      const withPercent = demoFactors.filter((item) => item.percentual !== null);
      const demoIndex = withPercent.length
        ? round1(withPercent.reduce((sum, item) => sum + (item.percentual ?? 0), 0) / withPercent.length)
        : null;
      return runAnalysis(
        apiKey,
        selectedModels,
        {
          avaliacao: "Cenário demonstrativo (dados fictícios, sem avaliação real)",
          periodo: "não informado",
          setor: null,
          total_participantes: data.demoTotal ?? null,
          percentual_participacao: null,
          indice_atencao_psicossocial: demoIndex,
          fatores: demoFactors.map((item) => ({
            nome: item.fator,
            percentual: item.percentual,
            relataram: item.relataram,
            nao_relataram: item.nao_relataram,
          })),
          comparacao_avaliacao_anterior: null,
        },
        demoFactors,
        demoIndex,
      );
    }

    // Read only the authenticated user's aggregates through their RLS-scoped Supabase client.
    const scopedDb = context.supabase as unknown as {
      from: (table: string) => any;
    };
    const [
      { data: assessment, error: assessmentError },
      { data: factorsData, error: factorError },
      { data: resultsData, error: resultsError },
    ] = await Promise.all([
      scopedDb
        .from("avaliacoes_psicossociais")
        .select("id,titulo,data_inicio,data_fim,criado_em")
        .eq("id", data.avaliacaoId)
        .maybeSingle(),
      scopedDb.from("fatores_psicossociais").select("id,nome,ordem").order("ordem"),
      scopedDb
        .from("resultados_psicossociais")
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
      const { data: sectorData, error: sectorError } = await scopedDb
        .from("setores")
        .select("nome")
        .eq("id", data.setorId)
        .maybeSingle();
      if (sectorError || !sectorData)
        throw new Error("Não foi possível validar o setor selecionado.");
      setor = sectorData.nome as string;
    }

    const { data: previousAssessments, error: previousAssessmentError } = await scopedDb
      .from("avaliacoes_psicossociais")
      .select("id,criado_em")
      .lt("criado_em", assessment.criado_em)
      .order("criado_em", { ascending: false })
      .limit(1);
    if (previousAssessmentError)
      throw new Error("Não foi possível consultar a avaliação anterior.");
    let comparison: { fatores: FactorMetric[]; indice_atencao_psicossocial: number | null } | null =
      null;
    const previous = previousAssessments?.[0] as { id: string; criado_em: string } | undefined;
    if (previous) {
      const { data: previousRows, error: previousResultsError } = await scopedDb
        .from("resultados_psicossociais")
        .select("avaliacao_id,fator_id,setor_id,distribuicao")
        .eq("avaliacao_id", previous.id);
      if (previousResultsError)
        throw new Error("Não foi possível consultar os resultados da avaliação anterior.");
      if (previousRows?.length) {
        const oldMetrics = metricsFor(factors, previousRows as ResultRecord[], data.setorId);
        if (oldMetrics.fatores.some((item) => item.percentual !== null)) {
          comparison = {
            fatores: oldMetrics.fatores,
            indice_atencao_psicossocial: oldMetrics.indice_atencao_psicossocial,
          };
        }
      }
    }

    // Allow-listed aggregate payload: no employee data, no individual answers, no participant identifiers.
    const aggregatePayload = {
      avaliacao: (assessment.titulo as string) ?? "Avaliação Psicossocial",
      periodo: formatPeriodo(assessment.data_inicio, assessment.data_fim, assessment.criado_em),
      setor,
      total_participantes: current.total_participantes,
      percentual_participacao: current.percentual_participacao,
      indice_atencao_psicossocial: current.indice_atencao_psicossocial,
      fatores: current.fatores.map((item) => ({
        nome: item.fator,
        percentual: item.percentual,
        relataram: item.relataram,
        nao_relataram: item.nao_relataram,
      })),
      comparacao_avaliacao_anterior: comparison,
    };

    return runAnalysis(apiKey, selectedModels, aggregatePayload, current.fatores, current.indice_atencao_psicossocial);
  });
