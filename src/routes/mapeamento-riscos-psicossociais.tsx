import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Brain, ClipboardList, FlaskConical, LoaderCircle, Sparkles, UsersRound } from "lucide-react";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { gerarAnaliseMapeamentoPsicossocial } from "@/services/mapeamento-psicossocial-ia.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mapeamento-riscos-psicossociais")({
  component: MapeamentoRiscosPsicossociaisPage,
});

// O schema foi criado por migration e os tipos locais do projeto ainda não incluem estas tabelas.
const db = supabase as unknown as SupabaseClient<any>;

type Assessment = {
  id: string;
  titulo: string;
  criado_em: string;
  data_inicio: string | null;
  data_fim: string | null;
};
type Sector = { id: string; nome: string };
type Factor = { id: string; nome: string; ordem: number };
type Aggregate = {
  avaliacao_id: string;
  fator_id: string;
  setor_id: string | null;
  distribuicao: Record<string, unknown> | null;
};
type FactorResult = Factor & {
  reported: number;
  notReported: number;
  total: number;
  percent: number;
};
type AiAnalysis = {
  resumo_executivo: string;
  principais_pontos_atencao: string[];
  analise: string;
  recomendacoes: string[];
};

const DEMO_TOTAL = 72;
const DEMO_FACTOR_COUNTS = [35, 26, 38, 23, 13, 30, 34, 27, 25, 32, 18, 9, 29];
const DEMO_FACTOR_NAMES = [
  "Sobrecarga de trabalho",
  "Autonomia",
  "Pressão por metas",
  "Conflitos",
  "Percepção de assédio",
  "Suporte da liderança",
  "Jornada excessiva",
  "Responsabilidades mal distribuídas",
  "Falta de clareza sobre funções",
  "Disponibilidade constante",
  "Isolamento no trabalho remoto",
  "Violência ou assédio",
  "Mudanças organizacionais mal conduzidas",
];
const DEMO_FACTORS: FactorResult[] = DEMO_FACTOR_NAMES.map((nome, index) => {
  const reported = DEMO_FACTOR_COUNTS[index] ?? 0;
  const notReported = DEMO_TOTAL - reported;
  return {
    id: `demo-${index + 1}`,
    nome,
    ordem: index + 1,
    reported,
    notReported,
    total: DEMO_TOTAL,
    percent: reported / DEMO_TOTAL * 100,
  };
}).sort((a, b) => b.percent - a.percent);

const numberAt = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (value && typeof value === "object" && "quantidade" in value) {
    return numberAt((value as { quantidade: unknown }).quantidade);
  }
  return null;
};

function getDistribution(row: Aggregate) {
  const data = row.distribuicao ?? {};
  const reported = numberAt(data.relatoram ?? data.relatados ?? data.reported);
  const notReported = numberAt(data.nao_relatam ?? data.nao_relatados ?? data.notReported);
  if (reported === null || notReported === null) return null;
  return { reported, notReported, total: reported + notReported };
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function MapeamentoRiscosPsicossociaisPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [aggregates, setAggregates] = useState<Aggregate[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [selectedSector, setSelectedSector] = useState("todos");
  const [period, setPeriod] = useState("todo-periodo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiAnalysisKey, setAiAnalysisKey] = useState("");
  const [demoActive, setDemoActive] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      const [assessmentResult, sectorResult, factorResult, aggregateResult] = await Promise.all([
        db.from("avaliacoes_psicossociais")
          .select("id,titulo,criado_em,data_inicio,data_fim")
          .order("criado_em", { ascending: false }),
        db.from("setores").select("id,nome").order("nome"),
        db.from("fatores_psicossociais").select("id,nome,ordem").order("ordem"),
        db.from("resultados_psicossociais")
          .select("avaliacao_id,fator_id,setor_id,distribuicao"),
      ]);
      if (!active) return;
      const firstError = assessmentResult.error ?? sectorResult.error ?? factorResult.error ?? aggregateResult.error;
      if (firstError) {
        setError("Não foi possível carregar os dados agregados. Verifique sua autorização e se as migrations do módulo foram aplicadas.");
      } else {
        const nextAssessments = (assessmentResult.data ?? []) as Assessment[];
        setAssessments(nextAssessments);
        setSectors((sectorResult.data ?? []) as Sector[]);
        setFactors((factorResult.data ?? []) as Factor[]);
        setAggregates((aggregateResult.data ?? []) as Aggregate[]);
        setSelectedAssessment((current) => current || nextAssessments[0]?.id || "");
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  const periodAssessments = useMemo(() => {
    const now = new Date();
    const cutoff = period === "30-dias" ? new Date(now.getTime() - 30 * 86400000)
      : period === "90-dias" ? new Date(now.getTime() - 90 * 86400000)
      : period === "este-ano" ? new Date(now.getFullYear(), 0, 1)
      : null;
    return assessments.filter((item) => !cutoff || new Date(item.data_inicio ?? item.criado_em) >= cutoff);
  }, [assessments, period]);

  const activeAssessmentId = periodAssessments.some((item) => item.id === selectedAssessment)
    ? selectedAssessment
    : periodAssessments[0]?.id ?? "";
  const selectedAssessmentData = periodAssessments.find((item) => item.id === activeAssessmentId);

  const chartFactors = useMemo<FactorResult[]>(() => {
    if (!activeAssessmentId) return [];
    const assessmentRows = aggregates.filter((row) => row.avaliacao_id === activeAssessmentId);
    const sectorRows = selectedSector === "todos"
      ? assessmentRows
      : assessmentRows.filter((row) => row.setor_id === selectedSector);
    const useGlobalRows = selectedSector === "todos" && sectorRows.some((row) => row.setor_id === null);
    const scopedRows = useGlobalRows ? sectorRows.filter((row) => row.setor_id === null) : sectorRows;
    return factors.flatMap((factor) => {
      const matchingRows = scopedRows.filter((row) => row.fator_id === factor.id);
      const counts = matchingRows.map(getDistribution).filter((item): item is NonNullable<typeof item> => item !== null);
      const reported = counts.reduce((sum, item) => sum + item.reported, 0);
      const notReported = counts.reduce((sum, item) => sum + item.notReported, 0);
      const total = reported + notReported;
      if (!total) return [];
      return [{ ...factor, reported, notReported, total, percent: reported / total * 100 }];
    }).sort((a, b) => b.percent - a.percent || a.ordem - b.ordem);
  }, [activeAssessmentId, aggregates, factors, selectedSector]);

  const scopedAggregateRows = aggregates.filter((row) => row.avaliacao_id === activeAssessmentId
    && (selectedSector === "todos" ? row.setor_id === null : row.setor_id === selectedSector));
  const evaluated = Math.max(0, ...scopedAggregateRows
    .map((row) => numberAt(row.distribuicao?.total_colaboradores_avaliados))
    .filter((value): value is number => value !== null));
  const index = chartFactors.length === 13
    ? chartFactors.reduce((sum, item) => sum + item.percent, 0) / 13
    : null;
  const factorsOfAttention = chartFactors.filter((item) => item.reported > 0).length;
  const totalEligible = useMemo(() => {
    const values = scopedAggregateRows
      .map((row) => numberAt(row.distribuicao?.total_colaboradores_elegiveis))
      .filter((n): n is number => n !== null);
    return values.length ? Math.max(...values) : null;
  }, [scopedAggregateRows]);
  const participation = totalEligible && totalEligible > 0 ? evaluated / totalEligible * 100 : null;
  const displayedFactors = demoActive ? DEMO_FACTORS : chartFactors;
  const displayedEvaluated = demoActive ? DEMO_TOTAL : evaluated;
  const displayedParticipation = demoActive ? 72 : participation;
  const displayedIndex = demoActive
    ? DEMO_FACTORS.reduce((sum, factor) => sum + factor.percent, 0) / DEMO_FACTORS.length
    : index;
  const displayedAttentionFactors = displayedFactors.filter((item) => item.reported > 0).length;
  const currentAnalysisKey = `${demoActive ? "demo" : activeAssessmentId}:${selectedSector}`;

  const handleGenerateAnalysis = async () => {
    if (demoActive || !activeAssessmentId || chartFactors.length === 0 || aiLoading) return;
    setAiLoading(true);
    setAiError("");
    setAiAnalysis(null);
    setAiAnalysisKey("");
    try {
      const result = await gerarAnaliseMapeamentoPsicossocial({
        data: {
          avaliacaoId: activeAssessmentId,
          setorId: selectedSector === "todos" ? null : selectedSector,
        },
      });
      setAiAnalysis(result);
      setAiAnalysisKey(currentAnalysisKey);
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : "Não foi possível gerar a análise. Tente novamente.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <Sidebar />
      <main className="min-w-0 px-5 py-7 sm:px-8 lg:px-10">
        <div className="w-full max-w-none">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Relatórios e Pesquisas</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Mapeamento Psicossocial</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Acompanhe os fatores psicossociais relatados nas avaliações da organização.
              </p>
            </div>
            <PerfilFlutuante />
          </div>

          <section aria-label="Filtros" className="mb-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
            <Filter label="Avaliação">
              <Select value={activeAssessmentId} onValueChange={setSelectedAssessment}>
                <SelectTrigger aria-label="Filtrar por avaliação"><SelectValue placeholder="Selecione uma avaliação" /></SelectTrigger>
                <SelectContent>
                  {periodAssessments.map((assessment) => <SelectItem key={assessment.id} value={assessment.id}>{assessment.titulo}</SelectItem>)}
                </SelectContent>
              </Select>
            </Filter>
            <Filter label="Período">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger aria-label="Filtrar por período"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo-periodo">Todo o período</SelectItem>
                  <SelectItem value="30-dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="90-dias">Últimos 90 dias</SelectItem>
                  <SelectItem value="este-ano">Este ano</SelectItem>
                </SelectContent>
              </Select>
            </Filter>
            <Filter label="Setor">
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger aria-label="Filtrar por setor"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os setores</SelectItem>
                  {sectors.map((sector) => <SelectItem key={sector.id} value={sector.id}>{sector.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Filter>
          </section>

          {error && !demoActive && <div role="alert" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            {demoActive
              ? <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">Cenário demonstrativo · valores fictícios para visualização; não representam colaboradores ou uma avaliação real.</p>
              : <span />}
            <Button type="button" variant="outline" onClick={() => setDemoActive((active) => !active)}>
              <FlaskConical className="mr-2 size-4" aria-hidden />
              {demoActive ? "Voltar aos dados reais" : "Ver cenário demonstrativo"}
            </Button>
          </div>

          <section aria-label="Resumo" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Colaboradores avaliados" value={loading && !demoActive ? "…" : displayedEvaluated ? displayedEvaluated.toLocaleString("pt-BR") : "—"} detail={demoActive ? "Cenário demonstrativo" : "Informado nos resultados agregados"} icon={UsersRound} />
            <SummaryCard title="Percentual de participação" value={loading && !demoActive ? "…" : displayedParticipation === null ? "—" : formatPercent(displayedParticipation)} detail={demoActive ? "72 de 100 participantes" : totalEligible === null ? "Base elegível não informada" : `${totalEligible} colaboradores elegíveis`} icon={ClipboardList} />
            <SummaryCard title="Fatores analisados" value={loading && !demoActive ? "…" : `${displayedFactors.length} de 13`} detail="Com dados agregados disponíveis" icon={BarChart3} />
            <SummaryCard title="Fatores de atenção" value={loading && !demoActive ? "…" : displayedAttentionFactors.toLocaleString("pt-BR")} detail="Com pelo menos um relato" icon={AlertTriangle} />
          </section>

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Índice de Atenção Psicossocial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading && !demoActive ? "…" : displayedIndex === null ? "Dados insuficientes" : formatPercent(displayedIndex)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {demoActive
                  ? "Média dos percentuais deste cenário fictício (sem valor clínico ou real)."
                  : index === null
                  ? `O índice será calculado quando os 13 fatores tiverem dados agregados${selectedAssessmentData ? ` para “${selectedAssessmentData.titulo}”` : ""}.`
                  : "Média aritmética dos percentuais de relatos dos 13 fatores."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relatos por fator</CardTitle>
              <p className="text-sm text-muted-foreground">Percentual de respostas agregadas que relataram cada fator, ordenado do maior para o menor.</p>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <Legend color="bg-primary" label="Relataram" />
                <Legend color="bg-accent-yellow" label="Não relataram" />
              </div>
              {loading && !demoActive ? <p className="py-8 text-center text-sm text-muted-foreground">Carregando dados agregados…</p>
                : displayedFactors.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  {selectedAssessmentData ? "Ainda não há resultados agregados para esta avaliação e os filtros selecionados." : "Não há avaliações disponíveis para o período selecionado."}
                </p>
                : <div className="space-y-5">
                  {displayedFactors.map((factor) => (
                    <div key={factor.id}>
                      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{factor.nome}</span>
                        <span className="shrink-0 text-muted-foreground">{formatPercent(factor.percent)} relataram</span>
                      </div>
                      <div
                        className="flex h-7 w-full overflow-hidden rounded-md bg-muted"
                        role="img"
                        aria-label={`${factor.nome}: ${factor.reported} relataram (${formatPercent(factor.percent)}), ${factor.notReported} não relataram (${formatPercent(100 - factor.percent)}), total de ${factor.total} respostas`}
                        title={`${factor.nome}\nRelataram: ${factor.reported} (${formatPercent(factor.percent)})\nNão relataram: ${factor.notReported} (${formatPercent(100 - factor.percent)})\nTotal de respostas: ${factor.total}`}
                      >
                        <div className="flex h-full items-center bg-primary px-2 text-[11px] font-semibold text-primary-foreground transition-all" style={{ width: `${factor.percent}%` }}>
                          {factor.percent >= 12 ? formatPercent(factor.percent) : ""}
                        </div>
                        <div className="flex h-full flex-1 items-center justify-end bg-accent-yellow px-2 text-[11px] font-medium text-foreground">
                          {100 - factor.percent >= 12 ? formatPercent(100 - factor.percent) : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>}
            </CardContent>
          </Card>

          <Card className="mt-6" aria-labelledby="floww-ai-analysis-title">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Brain className="size-5" aria-hidden />
                </span>
                <div>
                  <CardTitle id="floww-ai-analysis-title" className="text-base">Análise da Floww! IA</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Análise baseada somente nos resultados agregados desta seleção.</p>
                </div>
              </div>
              <Button type="button" onClick={handleGenerateAnalysis} disabled={demoActive || loading || aiLoading || !activeAssessmentId || chartFactors.length === 0}>
                {aiLoading ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden /> : <Sparkles className="mr-2 size-4" aria-hidden />}
                {aiLoading ? "Analisando…" : aiAnalysisKey === currentAnalysisKey ? "Gerar nova análise" : "Gerar análise"}
              </Button>
            </CardHeader>
            <CardContent>
              {aiError && <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{aiError}</div>}
              {aiLoading && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" aria-hidden />A Floww! IA está analisando os dados agregados…</div>}
              {!aiLoading && aiAnalysis && aiAnalysisKey === currentAnalysisKey && <div className="grid gap-5 md:grid-cols-2">
                <AnalysisBlock title="Resumo executivo"><p>{aiAnalysis.resumo_executivo}</p></AnalysisBlock>
                <AnalysisBlock title="Principais pontos de atenção"><AnalysisList items={aiAnalysis.principais_pontos_atencao} /></AnalysisBlock>
                <AnalysisBlock title="Análise"><p>{aiAnalysis.analise}</p></AnalysisBlock>
                <AnalysisBlock title="Recomendações"><AnalysisList items={aiAnalysis.recomendacoes} /></AnalysisBlock>
              </div>}
              {!aiLoading && !aiError && (!aiAnalysis || aiAnalysisKey !== currentAnalysisKey) && <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                {demoActive
                  ? "A geração da IA fica desativada no cenário demonstrativo. Volte aos dados reais para solicitar uma análise."
                  : chartFactors.length === 0
                  ? "Ainda não há dados agregados suficientes para solicitar uma análise."
                  : "Selecione Gerar análise para receber uma leitura dos fatores desta avaliação. A análise não é executada automaticamente."}
              </p>}
              <p className="mt-4 text-xs text-muted-foreground">A análise trata de fatores organizacionais e condições de trabalho; não realiza diagnósticos clínicos.</p>
            </CardContent>
          </Card>
          <p className="mt-4 text-xs text-muted-foreground">
            O painel apresenta somente dados agregados. Respostas individuais não são exibidas.
          </p>
        </div>
      </main>
    </div>
  );
}

function AnalysisBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border p-4">
    <h3 className="mb-2 font-semibold">{title}</h3>
    <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
  </section>;
}

function AnalysisList({ items }: { items: string[] }) {
  return items.length
    ? <ul className="list-disc space-y-1.5 pl-5">{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
    : <p>Não há pontos suficientes para destacar.</p>;
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">{label}{children}</label>;
}

function SummaryCard({ title, value, detail, icon: Icon }: { title: string; value: string; detail: string; icon: typeof UsersRound }) {
  return <Card>
    <CardContent className="flex items-start justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" aria-hidden /></span>
    </CardContent>
  </Card>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-2"><span className={`size-2.5 rounded-sm ${color}`} />{label}</span>;
}
