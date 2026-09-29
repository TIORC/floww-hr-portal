import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, CheckCircle2, Clock3, Plus, Search, ShieldCheck } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/todas-as-pesquisas")({ component: TodasAsPesquisasPage });

type Pesquisa = Tables<"pesquisas_satisfacao">;
type Filtro = "vigentes" | "historico" | "todas";
type TipoPesquisa = "satisfacao" | "rapida" | "super" | "desligamento";

const TIPOS_PESQUISA: { id: TipoPesquisa; label: string }[] = [
  { id: "satisfacao", label: "Pesquisa de Satisfação" },
  { id: "rapida", label: "Pesquisa Rápida" },
  { id: "super", label: "Super Pesquisa" },
  { id: "desligamento", label: "Pesquisa de Desligamento" },
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
};

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
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-muted/30 shadow-none"><CardContent className="flex items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Clock3 className="size-5" /></span><div><p className="text-sm text-muted-foreground">Pesquisas vigentes</p><p className="font-display text-2xl font-semibold">{vigentes}</p></div></CardContent></Card>
              <Card className="bg-muted/30 shadow-none"><CardContent className="flex items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-xl bg-accent-yellow/30 text-foreground"><CheckCircle2 className="size-5" /></span><div><p className="text-sm text-muted-foreground">Pesquisas no histórico</p><p className="font-display text-2xl font-semibold">{pesquisasDoTipo.length - vigentes}</p></div></CardContent></Card>
            </div>

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
