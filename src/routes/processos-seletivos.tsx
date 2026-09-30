import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Check, ChevronRight, FileText, Mail, MapPin, Phone, Plus, Search, Users } from "lucide-react";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { AbrirProcessoDialog, type NovoProcessoSeletivo } from "@/components/processos-seletivos/abrir-processo-dialog";
import { PERFIS_DISC, TONS_DISC, type PerfilDisc, type PercentuaisDisc } from "@/components/processos-seletivos/perfis-disc";
import { Sidebar } from "@/routes/painel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/processos-seletivos")({ component: ProcessosPage });

const ETAPAS = ["Novos", "Triagem", "Entrevista", "Proposta", "Contratado", "Reprovado"] as const;
type Etapa = (typeof ETAPAS)[number];
type Vaga = { id: string; cargo: string; setor: string; gestor: string; candidatos: number; abertura: string; status: "Ativo" | "Fechado"; perfilDisc?: PerfilDisc; percentuaisDisc?: PercentuaisDisc };
type Pessoa = { id: number; nome: string; email: string; telefone: string; data: string; etapa: Etapa; observacoes: string; curriculo: string };
const VAGAS_INICIAIS: Vaga[] = [
  { id: "analista-dados", cargo: "Analista de Dados", setor: "Tecnologia", gestor: "Mariana Costa", candidatos: 18, abertura: "12/08/2025", status: "Ativo" },
  { id: "designer-produto", cargo: "Product Designer", setor: "Produto", gestor: "Rafael Lima", candidatos: 24, abertura: "18/08/2025", status: "Ativo" },
  { id: "analista-rh", cargo: "Analista de RH", setor: "Pessoas", gestor: "Camila Souza", candidatos: 12, abertura: "25/08/2025", status: "Ativo" },
  { id: "dev-frontend", cargo: "Desenvolvedor Front-end", setor: "Tecnologia", gestor: "André Martins", candidatos: 31, abertura: "02/09/2025", status: "Ativo" },
  { id: "coord-marketing", cargo: "Coordenador de Marketing", setor: "Marketing", gestor: "Paula Nunes", candidatos: 16, abertura: "10/06/2025", status: "Fechado" },
  { id: "assistente-financeiro", cargo: "Assistente Financeiro", setor: "Financeiro", gestor: "Bruno Alves", candidatos: 9, abertura: "22/05/2025", status: "Fechado" },
];
const PESSOAS_INICIAIS: Pessoa[] = [
  { id: 1, nome: "Beatriz Oliveira", email: "beatriz.oliveira@email.com", telefone: "(11) 98765-4321", data: "08 set, 2025", etapa: "Novos", observacoes: "", curriculo: "/curriculos/candidato-1.pdf" },
  { id: 2, nome: "Lucas Ferreira", email: "lucas.ferreira@email.com", telefone: "(11) 97654-3210", data: "07 set, 2025", etapa: "Novos", observacoes: "", curriculo: "/curriculos/candidato-2.pdf" },
  { id: 3, nome: "Mariana Santos", email: "mariana.santos@email.com", telefone: "(21) 99876-5432", data: "06 set, 2025", etapa: "Triagem", observacoes: "", curriculo: "/curriculos/candidato-3.pdf" },
  { id: 4, nome: "Pedro Almeida", email: "pedro.almeida@email.com", telefone: "(31) 98765-1234", data: "05 set, 2025", etapa: "Triagem", observacoes: "", curriculo: "/curriculos/candidato-4.pdf" },
  { id: 5, nome: "Ana Clara Ribeiro", email: "ana.ribeiro@email.com", telefone: "(11) 91234-5678", data: "03 set, 2025", etapa: "Entrevista", observacoes: "", curriculo: "/curriculos/candidato-5.pdf" },
  { id: 6, nome: "Gabriel Costa", email: "gabriel.costa@email.com", telefone: "(41) 99876-1234", data: "02 set, 2025", etapa: "Proposta", observacoes: "", curriculo: "/curriculos/candidato-6.pdf" },
  { id: 7, nome: "Sofia Martins", email: "sofia.martins@email.com", telefone: "(51) 98765-9876", data: "01 set, 2025", etapa: "Contratado", observacoes: "", curriculo: "/curriculos/candidato-7.pdf" },
  { id: 8, nome: "Rafael Mendes", email: "rafael.mendes@email.com", telefone: "(31) 97654-8765", data: "29 ago, 2025", etapa: "Reprovado", observacoes: "", curriculo: "/curriculos/candidato-8.pdf" },
];

function ProcessosPage() {
  const [vagaSelecionada, setVagaSelecionada] = useState<Vaga | null>(null);
  const [busca, setBusca] = useState("");
  const [vagas, setVagas] = useState<Vaga[]>(VAGAS_INICIAIS);
  const [pessoas, setPessoas] = useState(PESSOAS_INICIAIS);
  const [pessoaAtiva, setPessoaAtiva] = useState<Pessoa | null>(null);
  const [aba, setAba] = useState("Ativos");
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const navigate = useNavigate();
  const filtradas = useMemo(() => vagas.filter(v => v.status === aba.slice(0, -1) && v.cargo.toLowerCase().includes(busca.toLowerCase())), [vagas, aba, busca]);
  const moverPessoa = (id: number, etapa: Etapa) => setPessoas(ps => ps.map(p => p.id === id ? { ...p, etapa } : p));
  const atualizarObservacao = (id: number, observacoes: string) => setPessoas(ps => ps.map(p => p.id === id ? { ...p, observacoes } : p));
  const abrirProcesso = (novo: NovoProcessoSeletivo) => {
    setVagas(atuais => [{
      id: `processo-${novo.cargoId}-${Date.now()}`,
      cargo: novo.cargo,
      setor: novo.setor,
      gestor: "—",
      candidatos: 0,
      abertura: novo.dataAbertura.split("-").reverse().join("/"),
      status: "Ativo",
      perfilDisc: novo.perfilDisc,
      percentuaisDisc: novo.percentuaisDisc,
    }, ...atuais]);
    setAba("Ativos");
    toast.success(`Processo seletivo aberto para ${novo.cargo}.`);
  };

  return <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]"><Sidebar /><main className="min-w-0 p-5 sm:p-8"><div className="mb-5 flex justify-end"><PerfilFlutuante /></div>
    <Card className="min-h-[34rem] rounded-2xl shadow-sm"><CardContent className="p-6 sm:p-8">
      {vagaSelecionada ? <>
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div><Button variant="ghost" className="mb-3 -ml-3" onClick={() => { setVagaSelecionada(null); setPessoaAtiva(null); }}><ArrowLeft className="mr-2 size-4" /> Voltar aos processos</Button><h1 className="font-display text-3xl font-semibold">{vagaSelecionada.cargo}</h1><p className="mt-2 text-sm text-muted-foreground">{vagaSelecionada.setor} <span className="mx-2">·</span> <Badge variant={vagaSelecionada.status === "Ativo" ? "default" : "secondary"}>{vagaSelecionada.status}</Badge>{vagaSelecionada.perfilDisc ? <><span className="mx-2">·</span><span className="mt-2 inline-flex flex-wrap items-center gap-1.5">{PERFIS_DISC.map(perfil => { const tom = TONS_DISC[perfil.valor]; const ativo = perfil.valor === vagaSelecionada.perfilDisc; return <span key={perfil.valor} title={`${perfil.valor}: ${vagaSelecionada.percentuaisDisc?.[perfil.valor] ?? 0}%`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tom.chip} ${ativo ? "" : "opacity-40"}`}><span className="grid size-4 place-items-center rounded-full bg-white/25 text-[0.6rem] font-bold">{perfil.atalho}</span>{perfil.valor} {vagaSelecionada.percentuaisDisc?.[perfil.valor] ?? 0}%</span>; })}</span></> : null}</p></div>
          {vagaSelecionada.status === "Ativo" && <Button variant="outline" onClick={() => navigate({ to: "/candidatura/$vagaId", params: { vagaId: vagaSelecionada.id } })}>Ver formulário da vaga <ChevronRight className="ml-1 size-4" /></Button>}
        </div>
        <div className="overflow-x-auto pb-4"><div className="flex min-w-max items-start gap-4">{ETAPAS.map(etapa => {
          const itens = pessoas.filter(p => p.etapa === etapa);
          return <section key={etapa} onDragOver={e => e.preventDefault()} onDrop={e => { const id = Number(e.dataTransfer.getData("text/plain")); if (id) moverPessoa(id, etapa); }} className="w-64 rounded-xl bg-muted/50 p-3">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{etapa}</h2><span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{itens.length}</span></div>
            <div className="min-h-36 space-y-2">{itens.map(p => <button key={p.id} type="button" draggable onDragStart={e => e.dataTransfer.setData("text/plain", String(p.id))} onClick={() => setPessoaAtiva(p)} className="w-full cursor-grab rounded-lg border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md active:cursor-grabbing"><span className="block text-sm font-medium">{p.nome}</span><span className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{p.data}</span></button>)}</div>
          </section>;
        })}</div></div>
      </> : <>
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><BriefcaseBusiness className="size-4" /> Recrutamento</p><h1 className="font-display text-3xl font-semibold">Processos Seletivos</h1><p className="mt-2 text-sm text-muted-foreground">Acompanhe suas vagas e candidatos em cada etapa.</p></div><div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto"><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input aria-label="Buscar cargo" placeholder="Buscar por cargo..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9"/></div><Button type="button" className="shrink-0 rounded-full bg-accent-yellow px-5 text-slate-900 shadow hover:bg-accent-yellow/90 hover:text-slate-900" onClick={() => setDialogoAberto(true)}><Plus className="size-4" aria-hidden />Abrir Processo Seletivo</Button></div></header>
        <Tabs value={aba} onValueChange={setAba}><TabsList className="h-auto w-full justify-start gap-2 rounded-none border-b border-border bg-transparent p-0"><TabsTrigger value="Ativos" className="rounded-t-md rounded-b-none border border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none">Ativos <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">4</span></TabsTrigger><TabsTrigger value="Fechados" className="rounded-t-md rounded-b-none border border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none">Fechados <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">2</span></TabsTrigger></TabsList>
          {["Ativos", "Fechados"].map(tab => <TabsContent value={tab} key={tab} className="mt-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Cargo</TableHead><TableHead>Setor</TableHead><TableHead>Gestor</TableHead><TableHead>Nº de candidatos</TableHead><TableHead>Data de abertura</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{filtradas.map(v => <TableRow key={v.id} onClick={() => setVagaSelecionada(v)} className="cursor-pointer"><TableCell className="font-medium">{v.cargo}</TableCell><TableCell>{v.setor}</TableCell><TableCell>{v.gestor}</TableCell><TableCell><span className="flex items-center gap-2"><Users className="size-4 text-muted-foreground"/>{v.candidatos}</span></TableCell><TableCell>{v.abertura}</TableCell><TableCell><Badge variant={v.status === "Ativo" ? "default" : "secondary"}>{v.status}</Badge></TableCell></TableRow>)}</TableBody></Table>{filtradas.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Nenhum processo encontrado para “{busca}”.</p>}</div></TabsContent>)}
        </Tabs>
      </>}
    </CardContent></Card>
    <Sheet open={!!pessoaAtiva} onOpenChange={open => !open && setPessoaAtiva(null)}><SheetContent className="w-full overflow-y-auto sm:max-w-md"><SheetHeader className="text-left"><SheetTitle>{pessoaAtiva?.nome}</SheetTitle><SheetDescription>Detalhes da candidatura</SheetDescription></SheetHeader>{pessoaAtiva && <div className="mt-7 space-y-6"><div className="space-y-4 text-sm"><p className="flex items-center gap-3"><Mail className="size-4 text-muted-foreground"/>{pessoaAtiva.email}</p><p className="flex items-center gap-3"><Phone className="size-4 text-muted-foreground"/>{pessoaAtiva.telefone}</p><a href={pessoaAtiva.curriculo} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-primary underline"><FileText className="size-4"/>Abrir currículo em PDF</a><p className="flex items-center gap-3"><MapPin className="size-4 text-muted-foreground"/>Candidatura em {pessoaAtiva.data}</p></div><div><label htmlFor="etapa" className="mb-2 block text-sm font-medium">Etapa atual</label><select id="etapa" value={pessoaAtiva.etapa} onChange={e => { const etapa = e.target.value as Etapa; moverPessoa(pessoaAtiva.id, etapa); setPessoaAtiva({ ...pessoaAtiva, etapa }); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{ETAPAS.map(e => <option key={e}>{e}</option>)}</select></div><div><label htmlFor="observacoes" className="mb-2 block text-sm font-medium">Observações</label><Textarea id="observacoes" rows={5} placeholder="Adicione observações sobre este candidato..." value={pessoaAtiva.observacoes} onChange={e => { atualizarObservacao(pessoaAtiva.id, e.target.value); setPessoaAtiva({ ...pessoaAtiva, observacoes: e.target.value }); }}/></div></div>}</SheetContent></Sheet>
    <AbrirProcessoDialog open={dialogoAberto} onOpenChange={setDialogoAberto} onCriar={abrirProcesso} />
  </main></div>;
}
