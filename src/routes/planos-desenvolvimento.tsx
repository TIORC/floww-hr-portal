import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Eye, ListChecks, Plus, Sparkles, Target, X } from "lucide-react";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getIniciais } from "@/lib/iniciais";
import { usePerfil } from "@/hooks/use-perfil";
import { toast } from "sonner";

export const Route = createFileRoute("/planos-desenvolvimento")({
  component: PlanosDesenvolvimentoPage,
});

type Plan = Tables<"planos_desenvolvimento">;
type Objective = Tables<"pdi_objetivos">;
type TeamMember = {
  id: string;
  user_id: string;
  nome: string;
  cargo: string;
  setor: string;
  setor_sigla: string;
};
type PlanTab = "ativo" | "finalizado" | "expirado";

const today = () => new Date().toISOString().slice(0, 10);

function getPlanTab(plan: Plan): PlanTab {
  if (plan.status === "finalizado") return "finalizado";
  if (plan.prazo && plan.prazo < today()) return "expirado";
  return "ativo";
}

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function TeamAvatar({ name }: { name: string }) {
  return (
    <Avatar className="size-11 shrink-0">
      <AvatarFallback>{getIniciais(name)}</AvatarFallback>
    </Avatar>
  );
}

function PlanDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { title: string; description: string; dueDate: string; objective: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [objective, setObjective] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setDueDate("");
      setObjective("");
    }
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onCreate({ title, description, dueDate, objective });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar um plano de desenvolvimento</DialogTitle>
          <DialogDescription>Defina seu foco de desenvolvimento e, se quiser, inclua o primeiro objetivo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome do plano" required maxLength={120} />
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição do plano" rows={3} />
          <label className="grid gap-1 text-sm">Prazo do plano<Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
          <Input value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Primeiro objetivo (opcional)" maxLength={160} />
          <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar plano"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PlanosDesenvolvimentoPage() {
  const { data: perfil, isPending: profileLoading, error: profileError } = usePerfil();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PlanTab>("ativo");
  const [createOpen, setCreateOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [objectivesOpen, setObjectivesOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!perfil?.id) return;
    setLoading(true);
    try {
      const [plansResult, teamResult] = await Promise.all([
        supabase
          .from("planos_desenvolvimento")
          .select("*")
          .eq("colaborador_id", perfil.id)
          .order("criado_em", { ascending: false }),
        supabase.rpc("listar_equipe_colaborador"),
      ]);
      if (plansResult.error) toast.error(`Não foi possível carregar seus planos: ${plansResult.error.message}`);
      if (teamResult.error) toast.error(`Não foi possível carregar sua equipe: ${teamResult.error.message}`);
      const nextPlans = plansResult.data ?? [];
      setPlans(nextPlans);
      setTeam((teamResult.data ?? []) as TeamMember[]);

      if (nextPlans.length === 0) {
        setObjectives([]);
      } else {
        const objectivesResult = await supabase
          .from("pdi_objetivos")
          .select("*")
          .in("plano_id", nextPlans.map((plan) => plan.id))
          .order("criado_em", { ascending: true });
        if (objectivesResult.error) toast.error(`Não foi possível carregar os objetivos: ${objectivesResult.error.message}`);
        setObjectives(objectivesResult.data ?? []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar os dados do desenvolvimento.");
    } finally {
      setLoading(false);
    }
  }, [perfil?.id]);

  useEffect(() => {
    if (profileError) toast.error("Não foi possível carregar seu perfil do Supabase.");
    if (profileLoading) return;
    if (!perfil?.id) {
      setLoading(false);
      return;
    }
    void loadData();
  }, [loadData, perfil?.id, profileError, profileLoading]);

  const visiblePlans = useMemo(
    () => plans.filter((plan) => getPlanTab(plan) === activeTab),
    [activeTab, plans],
  );

  const objectiveCount = objectives.length;
  const teamMembers = team.filter((member) => member.id !== perfil?.id);

  async function createPlan(input: { title: string; description: string; dueDate: string; objective: string }) {
    if (!perfil?.id) {
      toast.error("Seu perfil de colaborador não foi encontrado.");
      throw new Error("Perfil indisponível.");
    }
    const { data: plan, error } = await supabase
      .from("planos_desenvolvimento")
      .insert({
        colaborador_id: perfil.id,
        titulo: input.title.trim(),
        descricao: input.description.trim(),
        prazo: input.dueDate || null,
      })
      .select()
      .single();
    if (error) {
      toast.error(`Não foi possível criar o plano: ${error.message}`);
      throw error;
    }
    if (input.objective.trim()) {
      const { error: objectiveError } = await supabase.from("pdi_objetivos").insert({
        plano_id: plan.id,
        titulo: input.objective.trim(),
      });
      if (objectiveError) toast.error(`O plano foi criado, mas o objetivo não: ${objectiveError.message}`);
    }
    toast.success("Plano criado.");
    setActiveTab("ativo");
    await loadData();
  }

  async function finishPlan(planId: string) {
    const { error } = await supabase
      .from("planos_desenvolvimento")
      .update({ status: "finalizado", atualizado_em: new Date().toISOString() })
      .eq("id", planId);
    if (error) {
      toast.error(`Não foi possível finalizar o plano: ${error.message}`);
      return;
    }
    toast.success("Plano finalizado.");
    await loadData();
  }

  async function changeObjectiveStatus(objective: Objective) {
    const nextStatus = objective.status === "concluido" ? "pendente" : "concluido";
    const { error } = await supabase
      .from("pdi_objetivos")
      .update({ status: nextStatus, atualizado_em: new Date().toISOString() })
      .eq("id", objective.id);
    if (error) {
      toast.error(`Não foi possível atualizar o objetivo: ${error.message}`);
      return;
    }
    setObjectives((current) => current.map((item) => item.id === objective.id ? { ...item, status: nextStatus } : item));
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end"><PerfilFlutuante /></div>
        <Card className="mb-4"><CardHeader><CardTitle>Meu Desenvolvimento</CardTitle></CardHeader></Card>

        <Card>
          <CardContent className="p-5 sm:p-6">
            {bannerVisible && (
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-violet-100 px-4 py-3 text-sm text-violet-950">
                <Sparkles className="size-4 shrink-0" aria-hidden />
                <p className="flex-1">Novidade! Organize seus objetivos e acompanhe seu desenvolvimento.</p>
                <button type="button" className="font-medium underline" onClick={() => setCreateOpen(true)}>Criar meu PDI</button>
                <button type="button" aria-label="Fechar aviso" onClick={() => setBannerVisible(false)}><X className="size-4" /></button>
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1" role="tablist" aria-label="Status dos planos">
                {([
                  ["ativo", "Ativos"],
                  ["finalizado", "Finalizados"],
                  ["expirado", "Expirados"],
                ] as [PlanTab, string][]).map(([id, label]) => (
                  <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} className={`rounded-md px-3 py-2 text-sm ${activeTab === id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 size-4" />Criar um plano</Button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(18rem,0.95fr)]">
              <section className="min-h-[25rem] rounded-2xl bg-muted/60 p-5 sm:p-7">
                <h2 className="sr-only">Planos de desenvolvimento {activeTab}</h2>
                {profileLoading || loading ? (
                  <p className="p-5 text-sm text-muted-foreground">Carregando planos e equipe...</p>
                ) : !perfil ? (
                  <p className="p-5 text-sm text-muted-foreground">Seu perfil de colaborador não está cadastrado no Supabase.</p>
                ) : visiblePlans.length === 0 ? (
                  <div className="flex h-full min-h-[21rem] flex-col items-center justify-center text-center">
                    <div className="mb-4 grid size-40 place-items-center rounded-full bg-background text-primary/70">
                      <ListChecks className="size-20" strokeWidth={1.2} aria-hidden />
                    </div>
                    <p className="font-semibold">Nenhum plano {activeTab === "ativo" ? "ativo" : activeTab === "finalizado" ? "finalizado" : "expirado"} no momento</p>
                    {activeTab === "ativo" && <p className="mt-1 text-sm text-muted-foreground">Crie um plano para transformar seus objetivos em próximos passos.</p>}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {visiblePlans.map((plan) => {
                      const planObjectives = objectives.filter((objective) => objective.plano_id === plan.id);
                      const done = planObjectives.filter((objective) => objective.status === "concluido").length;
                      return (
                        <Card key={plan.id}>
                          <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{plan.titulo}</h3><Badge variant={activeTab === "expirado" ? "destructive" : "secondary"}>{activeTab === "expirado" ? "Expirado" : activeTab === "finalizado" ? "Finalizado" : "Ativo"}</Badge></div>
                              {plan.descricao && <p className="mt-1 text-sm text-muted-foreground">{plan.descricao}</p>}
                              <p className="mt-2 text-xs text-muted-foreground">Prazo: {formatDate(plan.prazo)} · {done}/{planObjectives.length} objetivos concluídos</p>
                            </div>
                            {plan.status === "ativo" && <Button variant="outline" size="sm" onClick={() => void finishPlan(plan.id)}>Finalizar</Button>}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>

              <aside className="space-y-5">
                <section>
                  <h2 className="font-display text-lg font-semibold">Minha equipe</h2>
                  {perfil && (
                    <>
                      <p className="mb-1 text-xs text-muted-foreground">Você</p>
                      <div className="mb-3 flex items-center gap-3 rounded-xl border border-border p-2">
                        <TeamAvatar name={perfil.nome} />
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{perfil.nome}</p><p className="truncate text-xs text-muted-foreground">{perfil.setor_sigla}</p></div>
                        <Button type="button" size="icon" variant="outline" aria-label="Ver meu perfil" onClick={() => setSelectedMember({ id: perfil.id, user_id: perfil.user_id, nome: perfil.nome, cargo: perfil.cargo, setor: perfil.setor, setor_sigla: perfil.setor_sigla })}><Eye className="size-4" /></Button>
                      </div>
                    </>
                  )}
                  <p className="mb-1 text-xs text-muted-foreground">Equipe · mesmo setor</p>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
                        <TeamAvatar name={member.nome} />
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{member.nome}</p><p className="truncate text-xs text-muted-foreground">{member.setor_sigla}</p></div>
                        <Button type="button" size="icon" variant="outline" aria-label={`Ver perfil de ${member.nome}`} onClick={() => setSelectedMember(member)}><Eye className="size-4" /></Button>
                      </div>
                    ))}
                    {!loading && teamMembers.length === 0 && <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">Nenhum outro colaborador do seu setor foi retornado pelo Supabase.</p>}
                  </div>
                </section>

                <section>
                  <h2 className="font-display text-lg font-semibold">Mapa de objetivos</h2>
                  <p className="mb-3 text-xs text-muted-foreground">Acompanhe os objetivos dos seus planos e os que já foram concluídos.</p>
                  <Button className="w-full" variant="outline" onClick={() => setObjectivesOpen(true)}><Target className="mr-2 size-4" />Ver todos os objetivos ({objectiveCount})</Button>
                </section>
              </aside>
            </div>
          </CardContent>
        </Card>
      </main>

      <PlanDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={createPlan} />

      <Dialog open={Boolean(selectedMember)} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Perfil do colaborador</DialogTitle><DialogDescription>Informações carregadas do cadastro de colaboradores no Supabase.</DialogDescription></DialogHeader>
          {selectedMember && <div className="flex items-center gap-4"><TeamAvatar name={selectedMember.nome} /><div><p className="font-semibold">{selectedMember.nome}</p><p className="text-sm text-muted-foreground">{selectedMember.cargo}</p><p className="text-sm text-muted-foreground">{selectedMember.setor} ({selectedMember.setor_sigla})</p></div></div>}
        </DialogContent>
      </Dialog>

      <Dialog open={objectivesOpen} onOpenChange={setObjectivesOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Mapa de objetivos</DialogTitle><DialogDescription>Objetivos registrados nos seus planos de desenvolvimento.</DialogDescription></DialogHeader>
          {objectives.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Você ainda não tem objetivos cadastrados.</p> : <div className="space-y-2">{objectives.map((objective) => <div key={objective.id} className="flex items-start gap-3 rounded-lg border p-3"><button type="button" aria-label={objective.status === "concluido" ? "Reabrir objetivo" : "Concluir objetivo"} onClick={() => void changeObjectiveStatus(objective)} className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border ${objective.status === "concluido" ? "border-green-600 bg-green-600 text-white" : "border-muted-foreground"}`}>{objective.status === "concluido" ? "✓" : ""}</button><div className="min-w-0 flex-1"><p className={`text-sm font-medium ${objective.status === "concluido" ? "line-through text-muted-foreground" : ""}`}>{objective.titulo}</p>{objective.descricao && <p className="text-xs text-muted-foreground">{objective.descricao}</p>}<p className="mt-1 text-xs text-muted-foreground">Prazo: {formatDate(objective.prazo)}</p></div><Badge variant="outline">{objective.status === "concluido" ? "Concluído" : objective.status === "em_andamento" ? "Em andamento" : "Pendente"}</Badge></div>)}</div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
