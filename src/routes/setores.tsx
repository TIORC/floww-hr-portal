import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/setores")({ component: SetoresPage });

type Setor = Tables<"setores">;
type FormularioSetor = { nome: string; sigla: string };
const FORMULARIO_INICIAL: FormularioSetor = { nome: "", sigla: "" };
function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [setorEmEdicao, setSetorEmEdicao] = useState<Setor | null>(null);
  const [formulario, setFormulario] = useState<FormularioSetor>(FORMULARIO_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const carregarSetores = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from("setores")
      .select("id, nome, sigla, criado_em")
      .order("nome", { ascending: true });
    if (error) {
      toast.error("Não foi possível carregar os setores.");
      setSetores([]);
    } else {
      setSetores(data ?? []);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregarSetores();
  }, [carregarSetores]);

  const setoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return setores;
    return setores.filter(
      (setor) =>
        setor.nome.toLowerCase().includes(termo) ||
        setor.sigla.toLowerCase().includes(termo),
    );
  }, [busca, setores]);

  function abrirCriacao() {
    setSetorEmEdicao(null);
    setFormulario(FORMULARIO_INICIAL);
    setDialogoAberto(true);
  }

  function abrirEdicao(setor: Setor) {
    setSetorEmEdicao(setor);
    setFormulario({ nome: setor.nome, sigla: setor.sigla });
    setDialogoAberto(true);
  }

  async function salvarSetor(evento: FormEvent) {
    evento.preventDefault();
    const nome = formulario.nome.trim();
    const sigla = formulario.sigla.trim().toUpperCase();
    if (!nome || !sigla) {
      toast.error("Informe o nome e a sigla do setor.");
      return;
    }
    setSalvando(true);
    const { error } = setorEmEdicao
      ? await supabase.from("setores").update({ nome, sigla }).eq("id", setorEmEdicao.id)
      : await supabase.from("setores").insert({ nome, sigla });
    if (error) {
      toast.error(
        error.code === "23505"
          ? "Já existe um setor com esse nome."
          : "Não foi possível salvar o setor.",
      );
    } else {
      toast.success(setorEmEdicao ? "Setor atualizado." : "Setor criado.");
      setDialogoAberto(false);
      carregarSetores();
    }
    setSalvando(false);
  }

  async function excluirSetor(setor: Setor) {
    const confirmado = window.confirm(`Excluir o setor "${setor.nome}"?`);
    if (!confirmado) return;
    setExcluindoId(setor.id);
    const { error } = await supabase.from("setores").delete().eq("id", setor.id);
    if (error) {
      toast.error(
        error.code === "23503"
          ? "Setor com vínculos não pode ser excluído."
          : "Não foi possível excluir o setor.",
      );
    } else {
      toast.success("Setor excluído.");
      setSetores((atuais) => atuais.filter((item) => item.id !== setor.id));
    }
    setExcluindoId(null);
  }
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end">
          <PerfilFlutuante />
        </div>
        <Card className="min-h-[34rem] rounded-2xl shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-semibold">Setores</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Cadastre e organize os setores da empresa.
                </p>
              </div>
              <Button type="button" onClick={abrirCriacao}>
                <Plus className="size-4" aria-hidden /> Novo setor
              </Button>
            </header>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou sigla..." className="pl-9" aria-label="Buscar setores" />
              </div>
              <p className="text-sm text-muted-foreground" role="status">
                {carregando ? "Carregando..." : `${setoresFiltrados.length} setores`}
              </p>
            </div>
            {carregando ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Carregando setores...</p>
            ) : setoresFiltrados.length === 0 ? (
              <div className="flex min-h-[20rem] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-6 grid size-28 place-items-center rounded-[2rem] bg-primary/5 text-primary/75">
                  <Building2 className="size-14" strokeWidth={1.2} aria-hidden />
                </div>
                <h2 className="font-display text-lg font-semibold">Nenhum setor encontrado</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">Cadastre o primeiro setor para organizar cargos e colaboradores.</p>
                <Button type="button" className="mt-6" onClick={abrirCriacao}>
                  <Plus className="size-4" aria-hidden /> Cadastrar setor
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Sigla</TableHead>
                      <TableHead className="w-32 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {setoresFiltrados.map((setor) => (
                      <TableRow key={setor.id}>
                        <TableCell className="font-medium">{setor.nome}</TableCell>
                        <TableCell>{setor.sigla}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" size="icon" onClick={() => abrirEdicao(setor)} aria-label={`Editar ${setor.nome}`}>
                              <Pencil className="size-4" aria-hidden />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" disabled={excluindoId === setor.id} onClick={() => excluirSetor(setor)} aria-label={`Excluir ${setor.nome}`}>
                              <Trash2 className="size-4 text-destructive" aria-hidden />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{setorEmEdicao ? "Editar setor" : "Novo setor"}</DialogTitle>
              <DialogDescription>Cadastre um setor com nome e sigla.</DialogDescription>
            </DialogHeader>
            <form onSubmit={salvarSetor} className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="setor-nome" className="text-sm font-medium">Nome</label>
                <Input id="setor-nome" value={formulario.nome} onChange={(e) => setFormulario((a) => ({ ...a, nome: e.target.value }))} placeholder="Ex.: Tecnologia" maxLength={80} required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="setor-sigla" className="text-sm font-medium">Sigla</label>
                <Input id="setor-sigla" value={formulario.sigla} onChange={(e) => setFormulario((a) => ({ ...a, sigla: e.target.value.toUpperCase() }))} placeholder="Ex.: TI" maxLength={20} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogoAberto(false)} disabled={salvando}>Cancelar</Button>
                <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : setorEmEdicao ? "Salvar" : "Criar setor"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}


