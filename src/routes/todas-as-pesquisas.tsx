import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, Plus, Search, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/todas-as-pesquisas")({ component: TodasAsPesquisasPage });

type Pesquisa = Tables<"pesquisas_satisfacao">;
type Filtro = "vigentes" | "historico" | "todas";
type TipoPesquisa = "satisfacao" | "rapida" | "super" | "desligamento" | "engajamento";

const TIPOS_PESQUISA: { id: TipoPesquisa; label: string }[] = [
  { id: "satisfacao", label: "Pesquisa de Satisfação" },
  { id: "rapida", label: "Pesquisa Rápida" },
  { id: "super", label: "Super Pesquisa" },
  { id: "desligamento", label: "Pesquisa de Desligamento" },
  { id: "engajamento", label: "Pesquisa de Engajamento" },
];

// Métricas ilustrativas para visualizar o painel antes de existir coleta de respostas.
const DADOS_DEMONSTRATIVOS: Record<TipoPesquisa, { pesquisa: string; respostas: number; tempoMedio: number }[]> = {
  satisfacao: [
    { pesquisa: "Clima organizacional", respostas: 86, tempoMedio: 4.2 },
    { pesquisa: "Benefícios e bem-estar", respostas: 64, tempoMedio: 3.6 },
    { pesquisa: "Comunicação interna", respostas: 52, tempoMedio: 5.1 },
    { pesquisa: "Experiência no trabalho", respostas: 41, tempoMedio: 6.4 },
  ],
  rapida: [
    { pesquisa: "Pulso da semana", respostas: 112, tempoMedio: 1.1 },
    { pesquisa: "Rotina do time", respostas: 98, tempoMedio: 1.4 },
    { pesquisa: "Comunicação", respostas: 76, tempoMedio: 1.2 },
    { pesquisa: "Bem-estar", respostas: 69, tempoMedio: 1.6 },
  ],
  super: [
    { pesquisa: "Cultura e valores", respostas: 83, tempoMedio: 9.5 },
    { pesquisa: "Jornada do colaborador", respostas: 71, tempoMedio: 11.2 },
    { pesquisa: "Liderança", respostas: 62, tempoMedio: 8.8 },
    { pesquisa: "Desenvolvimento", respostas: 58, tempoMedio: 10.4 },
  ],
  desligamento: [
    { pesquisa: "Entrevista de saída", respostas: 18, tempoMedio: 7.2 },
    { pesquisa: "Motivos de desligamento", respostas: 15, tempoMedio: 5.8 },
    { pesquisa: "Experiência na empresa", respostas: 13, tempoMedio: 6.4 },
    { pesquisa: "Recomendação", respostas: 11, tempoMedio: 2.1 },
  ],
  engajamento: [
    { pesquisa: "Engajamento geral", respostas: 94, tempoMedio: 5.4 },
    { pesquisa: "Reconhecimento e valorização", respostas: 81, tempoMedio: 4.8 },
    { pesquisa: "Relação com a liderança", respostas: 76, tempoMedio: 6.1 },
    { pesquisa: "Colaboração e pertencimento", respostas: 68, tempoMedio: 5.7 },
  ],
};

const DADOS_TURNOVER_MOTIVO = [
  { nome: "Baixo Desempenho", quantidade: 8 },
  { nome: "Nova Oportunidade", quantidade: 7 },
  { nome: "Pedido de Demissão", quantidade: 5 },
  { nome: "Justa Causa", quantidade: 3 },
  { nome: "Outros", quantidade: 2 },
];

const DADOS_TURNOVER_DEPARTAMENTO = [
  { nome: "Tecnologia", quantidade: 7 },
  { nome: "Comercial", quantidade: 6 },
  { nome: "Operações", quantidade: 4 },
  { nome: "Administrativo", quantidade: 3 },
  { nome: "Recursos Humanos", quantidade: 2 },
];

const DADOS_TURNOVER_TIPO = [
  { nome: "Voluntário", quantidade: 15 },
  { nome: "Involuntário", quantidade: 7 },
];

const HISTORICO_DESLIGAMENTOS = [
  { mes: "Abr", desligamentos: 3, ativos: 435 },
  { mes: "Mai", desligamentos: 4, ativos: 438 },
  { mes: "Jun", desligamentos: 2, ativos: 440 },
  { mes: "Jul", desligamentos: 5, ativos: 443 },
  { mes: "Ago", desligamentos: 3, ativos: 445 },
  { mes: "Set", desligamentos: 5, ativos: 439 },
];

const CORES_GRAFICO_PIZZA = ["var(--primary)", "var(--accent-yellow)", "var(--accent-green)", "var(--accent-orange)", "var(--muted-foreground)"];

function dataHoje() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
}

function formatarData(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function PesquisaDialog({ open, onOpenChange, onPublished, tipo }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished: () => Promise<void>;
  tipo: TipoPesquisa;
}) {
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoPesquisa>(tipo);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anonima, setAnonima] = useState(false);
  const [prazo, setPrazo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTipoSelecionado(tipo);
      setTitulo("");
      setDescricao("");
      setAnonima(false);
      setPrazo("");
    }
  }, [open, tipo]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("pesquisas_satisfacao").insert({ titulo: titulo.trim(), descricao: descricao.trim(), anonima, prazo, tipo: tipoSelecionado });
      if (error) throw error;
      await onPublished();
      toast.success("Pesquisa publicada com sucesso.");
      onOpenChange(false);
    } catch (error) {
      console.error("Falha ao publicar pesquisa de satisfação", error);
      toast.error("Não foi possível publicar a pesquisa. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publicar nova pesquisa</DialogTitle>
          <DialogDescription>Defina o tema, as instruções e o prazo em que a pesquisa ficará disponível.</DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-medium">
            Tipo de pesquisa
            <select
              value={tipoSelecionado}
              onChange={(event) => setTipoSelecionado(event.target.value as TipoPesquisa)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {TIPOS_PESQUISA.map((opcao) => <option key={opcao.id} value={opcao.id}>{opcao.label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Nome da pesquisa
            <Input value={titulo} onChange={(event) => setTitulo(event.target.value)} maxLength={160} placeholder="Ex.: Pesquisa de satisfação do trimestre" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Sobre o que é esta pesquisa?
            <Textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} maxLength={12000} rows={9} placeholder="Explique o objetivo da pesquisa e inclua as orientações para participação." required />
            <span className="text-right text-xs font-normal text-muted-foreground">{descricao.length.toLocaleString("pt-BR")} / 12.000 caracteres</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
            <input type="checkbox" checked={anonima} onChange={(event) => setAnonima(event.target.checked)} className="mt-0.5 size-4 accent-primary" />
            <span>
              <span className="block text-sm font-medium">Pesquisa anônima</span>
              <span className="mt-1 block text-xs text-muted-foreground">As respostas não serão associadas à identidade dos participantes.</span>
            </span>
          </label>
          <label className="grid max-w-xs gap-2 text-sm font-medium">
            Prazo para responder
            <Input type="date" value={prazo} onChange={(event) => setPrazo(event.target.value)} min={dataHoje()} required />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving || descricao.trim().length === 0}>{saving ? "Publicando..." : "Publicar pesquisa"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TodasAsPesquisasPage() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([]);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoPesquisa>("satisfacao");
  const [filtro, setFiltro] = useState<Filtro>("vigentes");
  const [busca, setBusca] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [periodoDesligamentos, setPeriodoDesligamentos] = useState<DateRange | undefined>({
    from: new Date(2026, 3, 1),
    to: new Date(2026, 8, 30),
  });
  const [dataEmPreVisualizacao, setDataEmPreVisualizacao] = useState<Date | undefined>();
  const [calendarioPeriodoAberto, setCalendarioPeriodoAberto] = useState(false);

  const dadosDoPeriodo = useMemo(() => {
    if (!periodoDesligamentos?.from || !periodoDesligamentos.to) return HISTORICO_DESLIGAMENTOS;
    const inicio = new Date(periodoDesligamentos.from.getFullYear(), periodoDesligamentos.from.getMonth(), 1);
    const fim = new Date(periodoDesligamentos.to.getFullYear(), periodoDesligamentos.to.getMonth() + 1, 0);
    return HISTORICO_DESLIGAMENTOS.filter((_, index) => {
      const dataMes = new Date(2026, 3 + index, 15);
      return dataMes >= inicio && dataMes <= fim;
    });
  }, [periodoDesligamentos]);
  const totalDesligamentosDoPeriodo = dadosDoPeriodo.reduce((total, mes) => total + mes.desligamentos, 0);
  const mediaAtivosDoPeriodo = dadosDoPeriodo.length
    ? Math.round(dadosDoPeriodo.reduce((total, mes) => total + mes.ativos, 0) / dadosDoPeriodo.length)
    : 0;
  const taxaTurnoverDoPeriodo = mediaAtivosDoPeriodo
    ? (totalDesligamentosDoPeriodo / mediaAtivosDoPeriodo) * 100
    : 0;
  const taxaTurnoverPeriodoChart = [
    { nome: "Turnover", valor: taxaTurnoverDoPeriodo },
    { nome: "Demais colaboradores", valor: 100 - taxaTurnoverDoPeriodo },
  ];
  const taxaTurnoverMensalChart = dadosDoPeriodo.map((mes) => ({
    mes: mes.mes,
    taxa: Number(((mes.desligamentos / mes.ativos) * 100).toFixed(2)),
  }));

  const carregarPesquisas = useCallback(async () => {
    const { data, error } = await supabase.from("pesquisas_satisfacao").select("*").order("criado_em", { ascending: false });
    if (error) {
      console.error("Falha ao carregar pesquisas de satisfação", error);
      toast.error("Não foi possível carregar o histórico de pesquisas.");
      setPesquisas([]);
    } else {
      setPesquisas(data ?? []);
    }
    setCarregando(false);
  }, []);

  useEffect(() => { void carregarPesquisas(); }, [carregarPesquisas]);

  const filtradas = useMemo(() => pesquisas
    .filter((pesquisa) => pesquisa.tipo === tipoSelecionado)
    .filter((pesquisa) => filtro === "todas" || (filtro === "vigentes" ? pesquisa.prazo >= dataHoje() : pesquisa.prazo < dataHoje()))
    .filter((pesquisa) => `${pesquisa.titulo} ${pesquisa.descricao}`.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))), [pesquisas, tipoSelecionado, filtro, busca]);
  const pesquisasDoTipo = pesquisas.filter((pesquisa) => pesquisa.tipo === tipoSelecionado);
  const vigentes = pesquisasDoTipo.filter((pesquisa) => pesquisa.prazo >= dataHoje()).length;

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end"><PerfilFlutuante /></div>
        <Card className="min-h-[34rem] rounded-2xl shadow-sm">
          <CardHeader className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="font-display text-3xl">Todas as Pesquisas</CardTitle>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Publique pesquisas, acompanhe os prazos e consulte o histórico por tipo.</p>
            </div>
            <Button onClick={() => setDialogAberto(true)} className="shrink-0 bg-accent-yellow text-slate-900 hover:bg-accent-yellow/90"><Plus className="mr-2 size-4" />Publicar Nova Pesquisa</Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <nav aria-label="Tipo de pesquisa" className="flex flex-wrap gap-2 border-b border-border pb-4">
              {TIPOS_PESQUISA.map((tipo) => (
                <Button
                  key={tipo.id}
                  type="button"
                  variant="ghost"
                  aria-pressed={tipoSelecionado === tipo.id}
                  onClick={() => setTipoSelecionado(tipo.id)}
                  className={tipoSelecionado === tipo.id ? "rounded-none border-b-2 border-primary bg-transparent font-semibold text-primary hover:bg-transparent" : "rounded-none border-b-2 border-transparent text-muted-foreground"}
                >
                  {tipo.label}
                </Button>
              ))}
            </nav>
            {tipoSelecionado === "desligamento" ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Periodicidade do consolidado</h2>
                  <p className="text-xs text-muted-foreground">Clique na data inicial, mova o cursor até a data final e clique novamente para confirmar.</p>
                </div>
                <Popover open={calendarioPeriodoAberto} onOpenChange={setCalendarioPeriodoAberto}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="justify-start text-left font-normal">
                      <CalendarDays className="size-4" aria-hidden />
                      {periodoDesligamentos?.from ? (
                        periodoDesligamentos.to
                        ? `${periodoDesligamentos.from.toLocaleDateString("pt-BR")} – ${periodoDesligamentos.to.toLocaleDateString("pt-BR")}`
                          : `A partir de ${periodoDesligamentos.from.toLocaleDateString("pt-BR")}`
                      ) : "Selecionar período"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-0">
                    <Calendar
                      mode="range"
                      selected={periodoDesligamentos}
                      onSelect={(range) => {
                        setPeriodoDesligamentos(range);
                        setDataEmPreVisualizacao(undefined);
                        if (range?.from && range.to) setCalendarioPeriodoAberto(false);
                      }}
                      onDayMouseEnter={(date) => {
                        if (periodoDesligamentos?.from && !periodoDesligamentos.to) {
                          setDataEmPreVisualizacao(date);
                        }
                      }}
                      modifiers={{
                        range_preview: (date) => {
                          const inicio = periodoDesligamentos?.from;
                          const fim = dataEmPreVisualizacao;
                          if (!inicio || periodoDesligamentos.to || !fim) return false;
                          const menor = Math.min(inicio.getTime(), fim.getTime());
                          const maior = Math.max(inicio.getTime(), fim.getTime());
                          return date.getTime() > menor && date.getTime() <= maior;
                        },
                      }}
                      modifiersClassNames={{ range_preview: "bg-accent/70 text-accent-foreground" }}
                      locale={ptBR}
                      numberOfMonths={1}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            ) : null}
            {tipoSelecionado !== "desligamento" ? <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-muted/30 shadow-none"><CardContent className="flex items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Clock3 className="size-5" /></span><div><p className="text-sm text-muted-foreground">Pesquisas vigentes</p><p className="font-display text-2xl font-semibold">{vigentes}</p></div></CardContent></Card>
              <Card className="bg-muted/30 shadow-none"><CardContent className="flex items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-xl bg-accent-yellow/30 text-foreground"><CheckCircle2 className="size-5" /></span><div><p className="text-sm text-muted-foreground">Pesquisas no histórico</p><p className="font-display text-2xl font-semibold">{pesquisasDoTipo.length - vigentes}</p></div></CardContent></Card>
            </div> : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="bg-muted/30 shadow-none">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></span>
                    <div><p className="text-sm text-muted-foreground">Consolidado do período</p><p className="font-display text-lg font-semibold">{periodoDesligamentos?.from && periodoDesligamentos.to ? `${periodoDesligamentos.from.toLocaleDateString("pt-BR")} – ${periodoDesligamentos.to.toLocaleDateString("pt-BR")}` : "Escolha a data final"}</p></div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 shadow-none">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="grid size-10 place-items-center rounded-xl bg-accent-yellow/30 text-foreground"><TrendingUp className="size-5" /></span>
                    <div><p className="text-sm text-muted-foreground">Taxa de turnover geral</p><p className="font-display text-2xl font-semibold">{taxaTurnoverDoPeriodo.toFixed(1)}%</p></div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 shadow-none">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><UsersRound className="size-5" /></span>
                    <div><p className="text-sm text-muted-foreground">Média de Colaboradores Ativos</p><p className="font-display text-2xl font-semibold">{mediaAtivosDoPeriodo}</p></div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 shadow-none">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="grid size-10 place-items-center rounded-xl bg-accent-orange/20 text-foreground"><BriefcaseBusiness className="size-5" /></span>
                    <div><p className="text-sm text-muted-foreground">Total de desligamentos</p><p className="font-display text-2xl font-semibold">{totalDesligamentosDoPeriodo}</p></div>
                  </CardContent>
                </Card>
              </div>
            )}

            {tipoSelecionado === "desligamento" ? (
              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Análise de desligamentos</CardTitle>
                  <p className="text-sm text-muted-foreground">Indicadores demonstrativos de turnover e histórico de desligamentos.</p>
                </CardHeader>
                <CardContent className="grid gap-8 lg:grid-cols-2">
                  <section aria-label="Taxa de turnover do período">
                    <h3 className="mb-1 text-sm font-semibold">Taxa de turnover do período</h3>
                    <p className="mb-3 text-xs text-muted-foreground">Desligamentos ÷ média de colaboradores ativos</p>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={taxaTurnoverPeriodoChart} dataKey="valor" nameKey="nome" cx="50%" cy="46%" innerRadius={58} outerRadius={86} label={({ name, value }) => name === "Turnover" ? `${Number(value).toFixed(1)}%` : undefined}>
                            <Cell fill="var(--primary)" />
                            <Cell fill="var(--muted)" />
                          </Pie>
                          <Tooltip formatter={(value, name) => [name === "Turnover" ? `${Number(value).toFixed(1)}%` : `${Number(value).toFixed(1)}%`, name]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                  <section aria-label="Taxa de turnover por mês">
                    <h3 className="mb-1 text-sm font-semibold">Taxa de turnover por mês</h3>
                    <p className="mb-3 text-xs text-muted-foreground">Desligamentos do mês ÷ média de colaboradores ativos no mês</p>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={taxaTurnoverMensalChart} margin={{ top: 12, right: 12, bottom: 4, left: -16 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                          <YAxis unit="%" axisLine={false} tickLine={false} />
                          <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "Taxa de turnover"]} />
                          <Line type="monotone" dataKey="taxa" name="Taxa de turnover" stroke="var(--accent-yellow)" strokeWidth={3} dot={{ r: 4, fill: "var(--accent-yellow)" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                  <section aria-label="Turnover por motivo">
                    <h3 className="mb-3 text-sm font-semibold">Turnover por Motivo</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={DADOS_TURNOVER_MOTIVO} dataKey="quantidade" nameKey="nome" cx="50%" cy="50%" outerRadius={82} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                            {DADOS_TURNOVER_MOTIVO.map((item, index) => <Cell key={item.nome} fill={CORES_GRAFICO_PIZZA[index % CORES_GRAFICO_PIZZA.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} desligamentos`, "Total"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                  <section aria-label="Turnover por tipo">
                    <h3 className="mb-3 text-sm font-semibold">Turnover por Tipo</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={DADOS_TURNOVER_TIPO} dataKey="quantidade" nameKey="nome" cx="50%" cy="50%" outerRadius={82} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                            {DADOS_TURNOVER_TIPO.map((item, index) => <Cell key={item.nome} fill={CORES_GRAFICO_PIZZA[index]} />)}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} desligamentos`, "Total"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                  <section aria-label="Histórico de desligamentos">
                    <h3 className="mb-3 text-sm font-semibold">Histórico de Desligamentos</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={HISTORICO_DESLIGAMENTOS} margin={{ top: 12, right: 12, bottom: 4, left: -16 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(value) => [`${value} desligamentos`, "Total"]} />
                          <Line type="monotone" dataKey="desligamentos" name="Desligamentos" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                  <section aria-label="Top 5 motivos de desligamento">
                    <h3 className="mb-3 text-sm font-semibold">Top 5 motivos de desligamento</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={DADOS_TURNOVER_MOTIVO} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis type="category" dataKey="nome" width={142} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value) => [`${value} desligamentos`, "Total"]} />
                          <Bar dataKey="quantidade" name="Desligamentos" fill="var(--primary)" radius={[0, 5, 5, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                  <section aria-label="Turnover por departamento">
                    <h3 className="mb-3 text-sm font-semibold">Turnover por Departamento</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={DADOS_TURNOVER_DEPARTAMENTO} dataKey="quantidade" nameKey="nome" cx="50%" cy="50%" outerRadius={82} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                            {DADOS_TURNOVER_DEPARTAMENTO.map((item, index) => <Cell key={item.nome} fill={CORES_GRAFICO_PIZZA[index % CORES_GRAFICO_PIZZA.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} desligamentos`, "Total"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </CardContent>
              </Card>
            ) : (
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Respostas e tempo de resposta</CardTitle>
                <p className="text-sm text-muted-foreground">Exemplo visual com dados demonstrativos por pesquisa.</p>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-2">
                <section aria-label="Quantidade de respostas por pesquisa">
                  <h3 className="mb-3 text-sm font-semibold">Respostas recebidas</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={DADOS_DEMONSTRATIVOS[tipoSelecionado]} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="pesquisa" width={128} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value} respostas`, "Total"]} />
                        <Bar dataKey="respostas" name="Respostas" fill="var(--primary)" radius={[0, 5, 5, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <section aria-label="Tempo médio de resposta por pesquisa">
                  <h3 className="mb-3 text-sm font-semibold">Tempo médio para responder</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={DADOS_DEMONSTRATIVOS[tipoSelecionado]} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" unit=" min" />
                        <YAxis type="category" dataKey="pesquisa" width={128} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value} min`, "Tempo médio"]} />
                        <Bar dataKey="tempoMedio" name="Tempo médio" fill="var(--accent-yellow)" radius={[0, 5, 5, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </CardContent>
            </Card>
            )}

            <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs value={filtro} onValueChange={(value) => setFiltro(value as Filtro)}>
                <TabsList className="h-auto justify-start gap-1 rounded-none bg-transparent p-0">
                  {[{ id: "vigentes", label: "Em andamento" }, { id: "historico", label: "Histórico" }, { id: "todas", label: "Todas" }].map((tab) => <TabsTrigger key={tab.id} value={tab.id} className="rounded-none border-b-2 border-transparent px-3 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">{tab.label}</TabsTrigger>)}
                </TabsList>
              </Tabs>
              <label className="relative block w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar pesquisa" aria-label="Buscar pesquisa" className="pl-9" /></label>
            </div>

            {carregando ? <p className="py-12 text-center text-sm text-muted-foreground">Carregando pesquisas...</p> : filtradas.length ? (
              <ul className="grid gap-4">
                {filtradas.map((pesquisa) => {
                  const estaVigente = pesquisa.prazo >= dataHoje();
                  return <li key={pesquisa.id}><Card className="shadow-none"><CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-semibold">{pesquisa.titulo}</h2><Badge variant="outline">{TIPOS_PESQUISA.find((tipo) => tipo.id === pesquisa.tipo)?.label}</Badge><Badge variant={estaVigente ? "default" : "secondary"}>{estaVigente ? "Em andamento" : "Encerrada"}</Badge></div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{pesquisa.descricao}</p>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Prazo: {formatarData(pesquisa.prazo)}</span>
                          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" />{pesquisa.anonima ? "Respostas anônimas" : "Respostas identificadas"}</span>
                          <span>Publicada em {formatarData(pesquisa.criado_em.slice(0, 10))}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent></Card></li>;
                })}
              </ul>
            ) : <div className="py-14 text-center"><CalendarDays className="mx-auto size-9 text-muted-foreground/50" /><p className="mt-3 font-medium">{busca ? "Nenhuma pesquisa encontrada" : filtro === "historico" ? "Ainda não há pesquisas no histórico" : "Nenhuma pesquisa vigente"}</p><p className="mt-1 text-sm text-muted-foreground">As pesquisas publicadas aparecerão aqui.</p></div>}
          </CardContent>
        </Card>
      </main>
      <PesquisaDialog open={dialogAberto} onOpenChange={setDialogAberto} onPublished={carregarPesquisas} tipo={tipoSelecionado} />
    </div>
  );
}
