import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ListPlus,
  Plus,
  SearchX,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/routes/painel";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { usePerfil } from "@/hooks/use-perfil";
import { getIniciais } from "@/lib/iniciais";

export const Route = createFileRoute("/reunioes-1-1")({ component: ReunioesPage });

type Colaborador = {
  id: string;
  user_id: string;
  nome: string;
  cargo: string;
  setor: string;
  setor_sigla: string;
};
type Reuniao = Tables<"reunioes_1a1">;
type Topico = Tables<"reunioes_1a1_topicos">;
type ReuniaoComTopicos = Reuniao & { topicos: Topico[] };
type Frequency = "nenhuma" | "semanal" | "quinzenal" | "mensal";

const CATEGORIAS = ["Desenvolvimento", "Desempenho", "Carreira", "Bem-estar", "Alinhamento"];
const TOPICOS_SUGERIDOS = [
  "Conquistas e pontos positivos",
  "Desafios e obstáculos",
  "Desenvolvimento e carreira",
  "Bem-estar e carga de trabalho",
  "Prioridades e próximos passos",
];

function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function showDate(value: string | null) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";
}

function frequencyLabel(frequency: string) {
  const labels: Record<string, string> = {
    nenhuma: "Sem recorrência",
    semanal: "Semanal",
    quinzenal: "Quinzenal",
    mensal: "Mensal",
  };
  return labels[frequency] ?? frequency;
}

function getNextOccurrence(meeting: Reuniao, today = localDate()): string | null {
  if (meeting.status !== "agendada") return null;
  if (meeting.data_reuniao >= today) return meeting.data_reuniao;
  if (meeting.frequencia === "nenhuma") return null;
  const current = new Date(`${meeting.data_reuniao}T12:00:00`);
  const endDate = meeting.recorrencia_ate ? new Date(`${meeting.recorrencia_ate}T12:00:00`) : null;
  const interval = meeting.frequencia === "semanal" ? 7 : meeting.frequencia === "quinzenal" ? 14 : 0;
  for (let attempts = 0; attempts < 520; attempts += 1) {
    if (meeting.frequencia === "mensal") current.setMonth(current.getMonth() + 1);
    else current.setDate(current.getDate() + interval);
    if (endDate && current > endDate) return null;
    const nextDate = localDate(current);
    if (nextDate >= today) return nextDate;
  }
  return null;
}

function MeetingDialog({
  open,
  onOpenChange,
  collaborators,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborators: Colaborador[];
  onCreate: (meeting: {
    collaboratorId: string;
    date: string;
    startTime: string;
    endTime: string;
    category: string;
    frequency: Frequency;
    recurrenceEndDate: string;
    topics: string[];
  }) => Promise<void>;
}) {
  const [collaboratorId, setCollaboratorId] = useState("");
  const [date, setDate] = useState(localDate());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("nenhuma");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [topicDraft, setTopicDraft] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCollaboratorId("");
    setDate(localDate());
    setStartTime("09:00");
    setEndTime("09:30");
    setCategory("");
    setFrequency("nenhuma");
    setRecurrenceEndDate("");
    setTopicDraft("");
    setTopics([]);
  }, [open]);

  function addTopic(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    if (topics.some((topic) => topic.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
      toast.info("Esse tópico já foi adicionado.");
      return;
    }
    setTopics((current) => [...current, normalized]);
    setTopicDraft("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (topics.length === 0) {
      toast.error("Adicione pelo menos um tópico à pauta.");
      return;
    }
    if (endTime <= startTime) {
      toast.error("O horário final precisa ser depois do horário de início.");
      return;
    }
    if (date < localDate()) {
      toast.error("Escolha uma data de hoje em diante.");
      return;
    }
    if (frequency !== "nenhuma" && recurrenceEndDate && recurrenceEndDate < date) {
      toast.error("O fim da recorrência deve ser na data da reunião ou depois.");
      return;
    }
    setSaving(true);
    try {
      await onCreate({ collaboratorId, date, startTime, endTime, category, frequency, recurrenceEndDate, topics });
      onOpenChange(false);
    } catch {
      // O handler mostra a mensagem de erro; mantém o modal aberto para correção.
    } finally {
      setSaving(false);
    }
  }

  const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle>Criar reunião 1:1</DialogTitle>
          <DialogDescription>Preencha os dados da conversa e organize a pauta.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <label className="grid gap-1.5 text-sm font-medium">
            Colaborador <span className="text-destructive">*</span>
            <select required value={collaboratorId} onChange={(event) => setCollaboratorId(event.target.value)} className={selectClass}>
              <option value="">Selecione um colaborador</option>
              {collaborators.map((person) => <option value={person.id} key={person.id}>{person.nome} · {person.setor_sigla}</option>)}
            </select>
            {collaborators.length === 0 && <span className="text-xs font-normal text-muted-foreground">Não há outros colaboradores disponíveis no seu setor.</span>}
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-medium">Data *<Input type="date" required min={localDate()} value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <label className="grid gap-1.5 text-sm font-medium">Início *<Input type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
            <label className="grid gap-1.5 text-sm font-medium">Fim *<Input type="time" required value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
          </div>

          <label className="grid gap-1.5 text-sm font-medium">Categoria <span className="text-xs font-normal text-muted-foreground">Opcional</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={selectClass}>
              <option value="">Selecione uma categoria</option>
              {CATEGORIAS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <fieldset className="grid gap-2 rounded-xl border border-border p-4">
            <legend className="px-1 text-sm font-semibold">Pauta da reunião <span className="text-destructive">*</span></legend>
            <label className="sr-only" htmlFor="meeting-suggested-topic">Adicionar tópico sugerido</label>
            <select id="meeting-suggested-topic" value="" onChange={(event) => addTopic(event.target.value)} className={selectClass}>
              <option value="">Adicionar tópico sugerido à pauta</option>
              {TOPICOS_SUGERIDOS.filter((topic) => !topics.includes(topic)).map((topic) => <option key={topic} value={topic}>{topic}</option>)}
            </select>
            <div className="flex gap-2">
              <Input value={topicDraft} onChange={(event) => setTopicDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTopic(topicDraft); } }} placeholder="Adicionar um novo tópico" aria-label="Novo tópico" />
              <Button type="button" variant="outline" size="icon" aria-label="Adicionar tópico" onClick={() => addTopic(topicDraft)}><ListPlus className="size-4" /></Button>
            </div>
            {topics.length === 0 ? (
              <p className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">Adicione ao menos um tópico para criar a reunião.</p>
            ) : (
              <ol className="grid gap-2">
                {topics.map((topic, index) => <li key={`${topic}-${index}`} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"><span className="min-w-0 flex-1">{index + 1}. {topic}</span><button type="button" aria-label={`Remover tópico ${topic}`} onClick={() => setTopics((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></li>)}
              </ol>
            )}
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-semibold"><CalendarClock className="mr-1 inline size-4" />Recorrência</legend>
            <p className="text-xs text-muted-foreground">Defina se esta conversa deve se repetir. A pauta será mantida nas próximas ocorrências.</p>
            <select value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)} className={selectClass}>
              <option value="nenhuma">Sem recorrência</option>
              <option value="semanal">Semanal</option>
              <option value="quinzenal">A cada duas semanas</option>
              <option value="mensal">Mensal</option>
            </select>
            {frequency !== "nenhuma" && <label className="grid gap-1.5 text-sm">Repetir até (opcional)<Input type="date" min={date} value={recurrenceEndDate} onChange={(event) => setRecurrenceEndDate(event.target.value)} /></label>}
          </fieldset>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || collaborators.length === 0 || !collaboratorId}>{saving ? "Criando..." : "Criar reunião"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReunioesPage() {
  const { data: perfil, isPending: profileLoading } = usePerfil();
  const [collaborators, setCollaborators] = useState<Colaborador[]>([]);
  const [meetings, setMeetings] = useState<ReuniaoComTopicos[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [personFilter, setPersonFilter] = useState("");
  const [meetingStatusFilter, setMeetingStatusFilter] = useState("agendada");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState("");

  const loadData = useCallback(async () => {
    if (!perfil?.id) return;
    setLoading(true);
    try {
      const [teamResult, meetingResult] = await Promise.all([
        supabase.rpc("listar_equipe_colaborador"),
        supabase
          .from("reunioes_1a1")
          .select("*")
          .or(`organizador_id.eq.${perfil.id},colaborador_id.eq.${perfil.id}`)
          .order("data_reuniao", { ascending: true }),
      ]);
      if (teamResult.error) throw teamResult.error;
      if (meetingResult.error) throw meetingResult.error;
      const teamData = (teamResult.data ?? []) as Colaborador[];
      setCollaborators(teamData.filter((person) => person.id !== perfil.id));
      const rows = meetingResult.data ?? [];
      if (!rows.length) {
        setMeetings([]);
        return;
      }
      const topicsResult = await supabase.from("reunioes_1a1_topicos").select("*").in("reuniao_id", rows.map((row) => row.id));
      if (topicsResult.error) throw topicsResult.error;
      setMeetings(rows.map((row) => ({ ...row, topicos: (topicsResult.data ?? []).filter((topic) => topic.reuniao_id === row.id) })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar as reuniões. Confira as migrations do Supabase.");
    } finally {
      setLoading(false);
    }
  }, [perfil?.id]);

  useEffect(() => {
    if (!profileLoading && perfil?.id) void loadData();
    if (!profileLoading && !perfil?.id) setLoading(false);
  }, [loadData, perfil?.id, profileLoading]);

  async function createMeeting(input: {
    collaboratorId: string;
    date: string;
    startTime: string;
    endTime: string;
    category: string;
    frequency: Frequency;
    recurrenceEndDate: string;
    topics: string[];
  }) {
    if (!perfil?.id) throw new Error("O perfil do colaborador não foi encontrado.");
    const { data: meeting, error } = await supabase
      .from("reunioes_1a1")
      .insert({
        organizador_id: perfil.id,
        colaborador_id: input.collaboratorId,
        data_reuniao: input.date,
        hora_inicio: input.startTime,
        hora_fim: input.endTime,
        categoria: input.category || null,
        frequencia: input.frequency,
        recorrencia_ate: input.frequency === "nenhuma" ? null : input.recurrenceEndDate || null,
      })
      .select()
      .single();
    if (error) {
      toast.error(`Não foi possível criar a reunião: ${error.message}`);
      throw error;
    }
    const { error: topicsError } = await supabase.from("reunioes_1a1_topicos").insert(
      input.topics.map((title) => ({ reuniao_id: meeting.id, titulo: title })),
    );
    if (topicsError) {
      await supabase.from("reunioes_1a1").delete().eq("id", meeting.id);
      toast.error(`A reunião foi criada, mas a pauta não foi salva: ${topicsError.message}`);
      throw topicsError;
    }
    toast.success("Reunião 1:1 criada.");
    await loadData();
  }

  const filteredMeetings = meetings.filter((meeting) => {
    if (meetingStatusFilter && meeting.status !== meetingStatusFilter) return false;
    if (categoryFilter && meeting.categoria !== categoryFilter) return false;
    if (frequencyFilter && meeting.frequencia !== frequencyFilter) return false;
    const person = collaborators.find((item) => item.id === (meeting.organizador_id === perfil?.id ? meeting.colaborador_id : meeting.organizador_id));
    return !personFilter || person?.nome.toLocaleLowerCase().includes(personFilter.trim().toLocaleLowerCase());
  });

  const groupedRows = useMemo(() => {
    const byPerson = new Map<string, Reuniao[]>();
    filteredMeetings.forEach((meeting) => {
      const personId = meeting.organizador_id === perfil?.id ? meeting.colaborador_id : meeting.organizador_id;
      byPerson.set(personId, [...(byPerson.get(personId) ?? []), meeting]);
    });
    return [...byPerson.entries()].map(([personId, personMeetings]) => {
      const person = collaborators.find((item) => item.id === personId);
      const sorted = [...personMeetings].sort((a, b) => a.data_reuniao.localeCompare(b.data_reuniao));
      const next = sorted
        .map((meeting) => ({ meeting, date: getNextOccurrence(meeting) }))
        .filter((item): item is { meeting: Reuniao; date: string } => Boolean(item.date))
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      const previous = [...sorted].filter((meeting) => meeting.data_reuniao < localDate()).sort((a, b) => b.data_reuniao.localeCompare(a.data_reuniao))[0];
      return { personId, person, next, previous };
    }).filter((row): row is typeof row & { person: Colaborador } => Boolean(row.person));
  }, [collaborators, filteredMeetings, perfil?.id]);

  const upcomingMeetings = filteredMeetings
    .filter((meeting) => getNextOccurrence(meeting))
    .sort((a, b) => (getNextOccurrence(a) ?? "").localeCompare(getNextOccurrence(b) ?? ""));

  const selectClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end"><PerfilFlutuante /></div>
        <Card className="min-h-[calc(100vh-7rem)]">
          <CardHeader className="flex flex-wrap items-start justify-between gap-4 sm:flex-row">
            <div><CardTitle className="text-2xl">Reuniões 1:1</CardTitle><p className="mt-1 text-sm text-muted-foreground">Realize e gerencie conversas individuais com as pessoas da sua empresa.</p></div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline">Integrar agenda <ChevronDown className="ml-2 size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast.info("A integração com o Google Agenda estará disponível em breve.")}>Google Agenda</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("A integração com o Outlook estará disponível em breve.")}>Outlook Calendar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 size-4" />Criar reunião 1:1</Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-1.5 text-sm font-medium">Colaborador
                <div className="relative"><Input value={personFilter} onChange={(event) => setPersonFilter(event.target.value)} placeholder="Buscar colaborador com 1:1 existente" className="pr-9" /><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Status da reunião
                <select value={meetingStatusFilter} onChange={(event) => setMeetingStatusFilter(event.target.value)} className={selectClass}><option value="">Todos</option><option value="agendada">Agendadas</option><option value="concluida">Concluídas</option><option value="cancelada">Canceladas</option></select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Categoria
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={selectClass}><option value="">Todas</option>{CATEGORIAS.map((category) => <option value={category} key={category}>{category}</option>)}</select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Frequência
                <select value={frequencyFilter} onChange={(event) => setFrequencyFilter(event.target.value)} className={selectClass}><option value="">Todas</option><option value="nenhuma">Sem recorrência</option><option value="semanal">Semanal</option><option value="quinzenal">Quinzenal</option><option value="mensal">Mensal</option></select>
              </label>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(17rem,0.85fr)]">
              <section className="min-w-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead><tr className="border-b text-muted-foreground"><th className="px-3 py-3 font-semibold">Nome do colaborador</th><th className="px-3 py-3 font-semibold">Última reunião</th><th className="px-3 py-3 font-semibold">Próxima reunião</th><th className="px-3 py-3 font-semibold">Frequência</th></tr></thead>
                    <tbody>
                      {loading ? <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Carregando reuniões...</td></tr> : groupedRows.map(({ person, next, previous, personId }) => (
                        <tr key={personId} className="border-b last:border-0">
                          <td className="px-3 py-3"><div className="flex items-center gap-3"><Avatar className="size-9"><AvatarFallback>{getIniciais(person.nome)}</AvatarFallback></Avatar><span><span className="block font-medium">{person.nome}</span><span className="text-xs text-muted-foreground">{person.setor_sigla}</span></span></div></td>
                          <td className="px-3 py-3">{showDate(previous?.data_reuniao ?? null)}</td>
                          <td className="px-3 py-3">{showDate(next?.date ?? null)}{next && <span className="block text-xs text-muted-foreground">{next.meeting.hora_inicio.slice(0, 5)}–{next.meeting.hora_fim.slice(0, 5)}</span>}</td>
                          <td className="px-3 py-3">{frequencyLabel(next?.meeting.frequencia ?? previous?.frequencia ?? "nenhuma")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!loading && groupedRows.length === 0 && <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center"><SearchX className="mb-3 size-12 text-primary/35" strokeWidth={1.4} aria-hidden /><p className="font-medium">Nenhuma reunião encontrada</p><p className="mt-1 text-sm text-muted-foreground">Crie uma conversa 1:1 ou ajuste os filtros para ver reuniões agendadas.</p></div>}
              </section>

              <Card className="self-start border-primary/20 shadow-none">
                <CardHeader><CardTitle className="text-lg">Próximas conversas</CardTitle></CardHeader>
                <CardContent>
                  {upcomingMeetings.length === 0 ? (
                    <div className="flex flex-col items-center py-5 text-center"><CalendarCheck2 className="mb-3 size-14 text-primary/35" strokeWidth={1.4} aria-hidden /><p className="font-medium">Sem reuniões agendadas</p><p className="mt-1 text-sm text-muted-foreground">Reserve um momento para conversar e acompanhar o desenvolvimento.</p><Button className="mt-4" variant="outline" onClick={() => setCreateOpen(true)}>Criar reunião</Button></div>
                  ) : (
                    <div className="space-y-3">{upcomingMeetings.slice(0, 4).map((meeting) => { const personId = meeting.organizador_id === perfil?.id ? meeting.colaborador_id : meeting.organizador_id; const person = collaborators.find((item) => item.id === personId); return <div key={meeting.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"><CalendarDays className="mt-0.5 size-4 text-primary" /><div className="min-w-0"><p className="truncate text-sm font-medium">{person?.nome ?? "Colaborador"}</p><p className="text-xs text-muted-foreground">{showDate(getNextOccurrence(meeting))} · {meeting.hora_inicio.slice(0, 5)}</p>{meeting.categoria && <Badge variant="secondary" className="mt-1">{meeting.categoria}</Badge>}</div></div>; })}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </main>

      <MeetingDialog open={createOpen} onOpenChange={setCreateOpen} collaborators={collaborators} onCreate={createMeeting} />
    </div>
  );
}
