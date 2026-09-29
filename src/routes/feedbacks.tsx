import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Download,
  MessageSquarePlus,
  Search,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import {
  fetchFeedbackDetail,
  fetchFeedbackMetrics,
  fetchFeedbacks,
  replyToFeedback,
  requestFeedback,
  sendFeedback,
} from "@/services/feedbacks";
import type {
  FeedbackDraft,
  FeedbackItem,
  FeedbackListType,
  FeedbackMetrics,
} from "@/types/feedbacks";
import { getIniciais } from "@/lib/iniciais";
import { toast } from "sonner";

export const Route = createFileRoute("/feedbacks")({ component: FeedbacksPage });

const TAB_ITEMS: { id: FeedbackListType; label: string }[] = [
  { id: "received", label: "Recebidos" },
  { id: "sent", label: "Enviados" },
  { id: "requested_received", label: "Solicitações Recebidas" },
  { id: "requested_sent", label: "Solicitações Enviadas" },
];

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultPeriod() {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 3);
  return { startDate: toDateInput(start), endDate: toDateInput(end) };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function PersonAvatar({ item, size = "size-10" }: { item: FeedbackItem["sender"]; size?: string }) {
  return (
    <Avatar className={`${size} shrink-0`}>
      <AvatarImage src={item.avatarUrl || undefined} alt={item.name} />
      <AvatarFallback>{getIniciais(item.name)}</AvatarFallback>
    </Avatar>
  );
}

function FeedbackFormDialog({
  mode,
  open,
  onOpenChange,
  onSubmit,
}: {
  mode: "send" | "request";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: FeedbackDraft) => Promise<void>;
}) {
  const [receiverId, setReceiverId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReceiverId("");
      setReceiverName("");
      setDepartment("");
      setMessage("");
    }
  }, [open, mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ receiverId, receiverName, department, message });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  const isRequest = mode === "request";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isRequest ? "Solicitar Feedback" : "Enviar Feedback"}</DialogTitle>
          <DialogDescription>
            {isRequest
              ? "Escolha a pessoa de quem deseja receber feedback."
              : "Envie um feedback construtivo para um colaborador."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input
            value={receiverName}
            onChange={(event) => setReceiverName(event.target.value)}
            placeholder="Nome do colaborador"
            aria-label="Nome do colaborador"
            required
          />
          <Input
            value={receiverId}
            onChange={(event) => setReceiverId(event.target.value)}
            placeholder="ID do colaborador (opcional)"
            aria-label="ID do colaborador"
          />
          <Input
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            placeholder="Departamento"
            aria-label="Departamento"
          />
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={isRequest ? "O que gostaria que a pessoa comentasse?" : "Escreva seu feedback..."}
            aria-label="Mensagem"
            required
            minLength={3}
            rows={4}
          />
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enviando..." : isRequest ? "Solicitar" : "Enviar feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FeedbacksPage() {
  const defaultPeriod = useMemo(getDefaultPeriod, []);
  const [dateRange, setDateRange] = useState(defaultPeriod);
  const [appliedRange, setAppliedRange] = useState(defaultPeriod);
  const [activeTab, setActiveTab] = useState<FeedbackListType>("received");
  const [filterQuery, setFilterQuery] = useState("");
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [counts, setCounts] = useState<Record<FeedbackListType, number>>({
    received: 0,
    sent: 0,
    requested_received: 0,
    requested_sent: 0,
  });
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const nextMetrics = await fetchFeedbackMetrics(appliedRange.startDate, appliedRange.endDate);
      const lists = await Promise.all(
        TAB_ITEMS.map(({ id }) => fetchFeedbacks(id, appliedRange.startDate, appliedRange.endDate, "")),
      );
      setMetrics(nextMetrics);
      setCounts({
        received: lists[0]?.length ?? 0,
        sent: lists[1]?.length ?? 0,
        requested_received: lists[2]?.length ?? 0,
        requested_sent: lists[3]?.length ?? 0,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar as métricas.");
    } finally {
      setLoadingMetrics(false);
    }
  }, [appliedRange]);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const list = await fetchFeedbacks(
        activeTab,
        appliedRange.startDate,
        appliedRange.endDate,
        filterQuery,
      );
      setItems(list);
      setSelectedFeedbackId((current) =>
        current && list.some((item) => item.id === current) ? current : list[0]?.id ?? null,
      );
    } catch (error) {
      setItems([]);
      setSelectedFeedbackId(null);
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar os feedbacks.");
    } finally {
      setLoadingItems(false);
    }
  }, [activeTab, appliedRange, filterQuery]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!selectedFeedbackId) {
      setSelectedFeedback(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    fetchFeedbackDetail(selectedFeedbackId)
      .then((item) => {
        if (!cancelled) setSelectedFeedback(item);
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Não foi possível abrir o feedback.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedFeedbackId]);

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dateRange.startDate > dateRange.endDate) {
      toast.error("A data inicial deve ser anterior à data final.");
      return;
    }
    setAppliedRange(dateRange);
  }

  function clearFilters() {
    const defaults = getDefaultPeriod();
    setDateRange(defaults);
    setAppliedRange(defaults);
    setFilterQuery("");
  }

  function exportReceived() {
    const received = itemsForExport;
    const rows = [
      ["Remetente", "Departamento", "Data", "Feedback"],
      ...received.map((item) => [item.sender.name, item.sender.department, formatDate(item.createdAt), item.message]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `feedbacks-recebidos-${appliedRange.startDate}-${appliedRange.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const [itemsForExport, setItemsForExport] = useState<FeedbackItem[]>([]);
  useEffect(() => {
    fetchFeedbacks("received", appliedRange.startDate, appliedRange.endDate, "")
      .then(setItemsForExport)
      .catch(() => setItemsForExport([]));
  }, [appliedRange, counts.received]);

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFeedback || replyText.trim().length < 1) return;
    try {
      await replyToFeedback(selectedFeedback.id, replyText.trim());
      setReplyText("");
      const updated = await fetchFeedbackDetail(selectedFeedback.id);
      setSelectedFeedback(updated);
      toast.success("Resposta enviada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a resposta.");
    }
  }

  async function handleCompose(mode: "send" | "request", draft: FeedbackDraft) {
    try {
      if (mode === "send") await sendFeedback(draft);
      else await requestFeedback(draft);
      toast.success(mode === "send" ? "Feedback enviado." : "Solicitação enviada.");
      await Promise.all([loadMetrics(), loadItems()]);
      if (mode === "send") setActiveTab("sent");
      else setActiveTab("requested_sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
      throw error;
    }
  }

  const selectedPerson = selectedFeedback
    ? activeTab.includes("sent")
      ? selectedFeedback.receiver
      : selectedFeedback.sender
    : null;

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end">
          <PerfilFlutuante />
        </div>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Feedbacks</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Dê, solicite e receba feedbacks de forma construtiva.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-accent-yellow bg-accent-yellow text-slate-900 shadow hover:bg-accent-yellow/90 hover:text-slate-900"
                onClick={() => setRequestDialogOpen(true)}
              >
                <MessageSquarePlus className="mr-2 size-4" /> Solicitar Feedback
              </Button>
              <Button
                className="bg-accent-yellow text-slate-900 shadow hover:bg-accent-yellow/90"
                onClick={() => setSendDialogOpen(true)}
              >
                <Send className="mr-2 size-4" /> Enviar Feedback
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="flex flex-wrap items-end gap-3" onSubmit={handleApplyFilters}>
              <label className="grid gap-1 text-sm">
                Data início
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(event) => setDateRange((range) => ({ ...range, startDate: event.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm">
                Data final
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(event) => setDateRange((range) => ({ ...range, endDate: event.target.value }))}
                  required
                />
              </label>
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="ghost" onClick={clearFilters}>Limpar</Button>
                <Button type="submit" className="bg-accent-yellow text-slate-900 shadow hover:bg-accent-yellow/90">
                  <SlidersHorizontal className="mr-2 size-4" />Filtrar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="mt-6 space-y-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Dados do período</h2>
            <p className="text-sm text-muted-foreground">Dados relacionados aos feedbacks enviados e recebidos no período filtrado.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div><p className="text-sm text-muted-foreground">Feedbacks recebidos</p><p className="text-2xl font-bold">{loadingMetrics ? "…" : metrics?.totalReceived ?? 0}</p></div>
                <Button variant="ghost" size="icon" aria-label="Baixar relatório de feedbacks recebidos" onClick={exportReceived}><Download className="size-5" /></Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div><p className="text-sm text-muted-foreground">Feedbacks enviados</p><p className="text-2xl font-bold">{loadingMetrics ? "…" : metrics?.totalSent ?? 0}</p></div>
                <Send className="mr-2 size-5 text-primary" aria-hidden />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Resumo por item</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={metrics?.radarData ?? []} outerRadius="72%">
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis domain={[0, 5]} tickCount={6} />
                      <Tooltip />
                      <Legend />
                      <Radar name="Feedbacks recebidos" dataKey="userScore" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                      <Radar name="Média da Companhia" dataKey="companyAvg" stroke="#0284c7" fill="#0284c7" fillOpacity={0.18} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Resumo mensal de feedbacks enviados e recebidos</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics?.monthlyData ?? []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar name="Feedbacks enviados" dataKey="sent" fill="#0284c7" radius={[3, 3, 0, 0]} />
                      <Bar name="Feedbacks recebidos" dataKey="received" fill="#10b981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">Feedbacks do período</h2>
            <p className="text-sm text-muted-foreground">Listagem dos feedbacks e solicitações no período filtrado.</p>
          </div>
          <div className="flex flex-wrap gap-2 border-b pb-3" role="tablist" aria-label="Tipos de feedback">
            {TAB_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`rounded-md px-3 py-2 text-sm ${activeTab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {label} ({counts[id]})
              </button>
            ))}
          </div>

          <div className="mt-4 grid min-h-[28rem] gap-4 lg:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.5fr)]">
            <Card className="min-w-0">
              <CardContent className="p-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input value={filterQuery} onChange={(event) => setFilterQuery(event.target.value)} placeholder="Filtrar por pessoa ou departamento" className="pl-9" aria-label="Filtrar feedbacks" />
                </div>
                <div className="max-h-[28rem] space-y-1 overflow-y-auto">
                  {loadingItems ? <p className="p-4 text-sm text-muted-foreground">Carregando feedbacks…</p> : items.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhum registro encontrado no período.</p> : items.map((item) => {
                    const listPerson = activeTab.includes("sent") ? item.receiver : item.sender;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setSelectedFeedbackId(item.id)}
                        className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-muted ${selectedFeedbackId === item.id ? "bg-primary/10" : ""}`}
                      >
                        <PersonAvatar item={listPerson} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{listPerson.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{listPerson.department}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="flex min-w-0 flex-col">
              {loadingDetail ? <CardContent className="p-6 text-sm text-muted-foreground">Carregando detalhes…</CardContent> : selectedFeedback && selectedPerson ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <PersonAvatar item={selectedFeedback.sender} />
                      <div className="min-w-0">
                        <CardTitle className="text-base">{selectedFeedback.sender.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {selectedFeedback.sender.department} · {formatDate(selectedFeedback.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">Para: {selectedFeedback.receiver.name}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
                    <article className="rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">{selectedFeedback.message}</article>
                    {(selectedFeedback.replies ?? []).map((reply) => (
                      <article key={reply.id} className={`max-w-[85%] rounded-xl p-3 text-sm ${reply.authorId === selectedFeedback.sender.id ? "bg-muted" : "ml-auto bg-primary/10"}`}>
                        <p>{reply.message}</p>
                        <time className="mt-2 block text-xs text-muted-foreground">{formatDate(reply.createdAt)}</time>
                      </article>
                    ))}
                    {selectedFeedback.status && <p className="text-xs text-muted-foreground">Status da solicitação: {selectedFeedback.status === "pending" ? "Pendente" : selectedFeedback.status}</p>}
                  </CardContent>
                  <form onSubmit={handleReply} className="flex items-end gap-2 border-t p-3">
                    <Textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Responder feedback" aria-label="Responder feedback" rows={2} />
                    <Button type="submit" disabled={!replyText.trim()} aria-label="Enviar resposta"><Send className="size-4" /></Button>
                  </form>
                </>
              ) : <CardContent className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">Selecione um item para ver os detalhes.</CardContent>}
            </Card>
          </div>
        </section>
      </main>

      <FeedbackFormDialog mode="request" open={requestDialogOpen} onOpenChange={setRequestDialogOpen} onSubmit={(draft) => handleCompose("request", draft)} />
      <FeedbackFormDialog mode="send" open={sendDialogOpen} onOpenChange={setSendDialogOpen} onSubmit={(draft) => handleCompose("send", draft)} />
    </div>
  );
}
