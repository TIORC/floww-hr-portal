import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cargos-salarios")({
  component: CargosSalariosPage,
});

// Os cargos ainda não são salvos no banco: vivem só nesta tela até a tabela ser criada.
type Senioridade = {
  id: string;
  nivel: string;
  faixaMinima: number;
  salarioBase: number;
  faixaMaxima: number;
};

type Cargo = {
  id: string;
  nome: string;
  cbo: string;
  setor: string;
  senioridades: Senioridade[];
};

type FormularioSenioridade = {
  id: string;
  nivel: string;
  faixaMinima: string;
  salarioBase: string;
  faixaMaxima: string;
};

type FormularioCargo = {
  nome: string;
  cbo: string;
  setor: string;
  senioridades: FormularioSenioridade[];
};

const ITENS_POR_PAGINA = 10;
const SETOR_TODOS = "todos";

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function novaSenioridade(): FormularioSenioridade {
  return {
    id: crypto.randomUUID(),
    nivel: "",
    faixaMinima: "",
    salarioBase: "",
    faixaMaxima: "",
  };
}

function formularioInicial(): FormularioCargo {
  return { nome: "", cbo: "", setor: "", senioridades: [] };
}

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter((parte) => parte.length > 2)
    .slice(0, 3)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

// Converte o formulário em dados, ou devolve a mensagem do primeiro problema.
function validarFormulario(formulario: FormularioCargo) {
  if (!formulario.nome.trim()) return "Informe o nome do cargo.";
  if (!formulario.setor) return "Selecione o setor do cargo.";
  const senioridades: Senioridade[] = [];
  for (const item of formulario.senioridades) {
    const minima = Number(item.faixaMinima);
    const base = Number(item.salarioBase);
    const maxima = Number(item.faixaMaxima);
    if (!item.nivel.trim()) return "Informe o nível de cada senioridade.";
    if (!(minima > 0) || !(base > 0) || !(maxima > 0)) {
      return `Informe as três faixas salariais de "${item.nivel.trim()}".`;
    }
    if (!(minima <= base && base <= maxima)) {
      return `Em "${item.nivel.trim()}", o salário base precisa ficar entre a faixa mínima e a máxima.`;
    }
    senioridades.push({
      id: item.id,
      nivel: item.nivel.trim(),
      faixaMinima: minima,
      salarioBase: base,
      faixaMaxima: maxima,
    });
  }
  return senioridades;
}

function CargosSalariosPage() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [setoresBanco, setSetoresBanco] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [setorFiltro, setSetorFiltro] = useState(SETOR_TODOS);
  const [pagina, setPagina] = useState(1);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [cargoEmEdicao, setCargoEmEdicao] = useState<Cargo | null>(null);
  const [formulario, setFormulario] = useState<FormularioCargo>(formularioInicial);

  useEffect(() => {
    supabase
      .from("setores")
      .select("nome")
      .order("nome", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast.error("Não foi possível carregar os setores.");
          return;
        }
        setSetoresBanco((data ?? []).map((setor) => setor.nome));
      });
  }, []);

  const setores = useMemo(() => {
    const nomes = new Set([...setoresBanco, ...cargos.map((cargo) => cargo.setor)]);
    return Array.from(nomes).filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [setoresBanco, cargos]);

  // Um cargo por linha; as senioridades aparecem abaixo dele, como ramificações.
  const cargosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return cargos.filter((cargo) => {
      if (setorFiltro !== SETOR_TODOS && cargo.setor !== setorFiltro) return false;
      if (!termo) return true;
      return (
        cargo.nome.toLowerCase().includes(termo) ||
        cargo.cbo.toLowerCase().includes(termo) ||
        cargo.setor.toLowerCase().includes(termo) ||
        cargo.senioridades.some((item) => item.nivel.toLowerCase().includes(termo))
      );
    });
  }, [cargos, busca, setorFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(cargosFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const cargosPagina = cargosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA,
  );
  const primeiroItem =
    cargosFiltrados.length === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
  const ultimoItem = Math.min(paginaAtual * ITENS_POR_PAGINA, cargosFiltrados.length);

  function calcularPosicao(senioridade: Senioridade) {
    const amplitude = Math.max(1, senioridade.faixaMaxima - senioridade.faixaMinima);
    const posicao = ((senioridade.salarioBase - senioridade.faixaMinima) / amplitude) * 100;
    return Math.min(100, Math.max(0, posicao));
  }

  function abrirCriacao() {
    setCargoEmEdicao(null);
    setFormulario(formularioInicial());
    setDialogoAberto(true);
  }

  function abrirEdicao(cargo: Cargo) {
    setCargoEmEdicao(cargo);
    setFormulario({
      nome: cargo.nome,
      cbo: cargo.cbo,
      setor: cargo.setor,
      senioridades: cargo.senioridades.map((item) => ({
        id: item.id,
        nivel: item.nivel,
        faixaMinima: String(item.faixaMinima),
        salarioBase: String(item.salarioBase),
        faixaMaxima: String(item.faixaMaxima),
      })),
    });
    setDialogoAberto(true);
  }

  function atualizarSenioridade(id: string, campo: keyof FormularioSenioridade, valor: string) {
    setFormulario((atual) => ({
      ...atual,
      senioridades: atual.senioridades.map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item,
      ),
    }));
  }

  function removerSenioridade(id: string) {
    setFormulario((atual) => ({
      ...atual,
      senioridades: atual.senioridades.filter((item) => item.id !== id),
    }));
  }

  function salvarCargo() {
    const resultado = validarFormulario(formulario);
    if (typeof resultado === "string") {
      toast.error(resultado);
      return;
    }
    const cargo: Cargo = {
      id: cargoEmEdicao?.id ?? crypto.randomUUID(),
      nome: formulario.nome.trim(),
      cbo: formulario.cbo.trim(),
      setor: formulario.setor,
      senioridades: resultado,
    };
    setCargos((atuais) =>
      cargoEmEdicao
        ? atuais.map((item) => (item.id === cargo.id ? cargo : item))
        : [...atuais, cargo],
    );
    toast.success(cargoEmEdicao ? "Cargo atualizado." : "Cargo cadastrado.");
    setDialogoAberto(false);
  }

  function excluirCargo() {
    if (!cargoEmEdicao) return;
    const confirmado = window.confirm(`Excluir o cargo "${cargoEmEdicao.nome}"?`);
    if (!confirmado) return;
    setCargos((atuais) => atuais.filter((item) => item.id !== cargoEmEdicao.id));
    toast.success("Cargo excluído.");
    setDialogoAberto(false);
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
                <h1 className="font-display text-3xl font-semibold text-foreground">
                  Cargos e Salários
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Defina a estrutura salarial, níveis de remuneração e cargos agrupados por setor.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast.info("Importação de faixas ainda não está disponível.")}
                >
                  <Upload className="size-4" aria-hidden />
                  Importar Faixas (Planilha)
                </Button>
                <Button type="button" onClick={abrirCriacao}>
                  <Plus className="size-4" aria-hidden />
                  Cadastrar cargo
                </Button>
              </div>
            </header>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1 sm:max-w-md">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={busca}
                  onChange={(event) => {
                    setBusca(event.target.value);
                    setPagina(1);
                  }}
                  placeholder="Buscar por cargo, CBO, setor ou nível"
                  aria-label="Buscar cargo"
                  className="pl-9"
                />
              </div>
              <Select
                value={setorFiltro}
                onValueChange={(valor) => {
                  setSetorFiltro(valor);
                  setPagina(1);
                }}
              >
                <SelectTrigger className="w-56" aria-label="Filtrar por setor">
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SETOR_TODOS}>Todos os setores</SelectItem>
                  {setores.map((setor) => (
                    <SelectItem key={setor} value={setor}>
                      {setor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="ml-auto text-xs text-muted-foreground">
                Exibindo {cargosFiltrados.length} {cargosFiltrados.length === 1 ? "cargo" : "cargos"}
              </p>
            </div>

            {cargosFiltrados.length === 0 ? (
              <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Nenhum cargo cadastrado
                </h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Clique em "Cadastrar cargo" para criar o primeiro cargo e as senioridades com
                  a faixa salarial.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Níveis</TableHead>
                      <TableHead>Faixa salarial (mín - máx)</TableHead>
                      <TableHead>Salário base médio</TableHead>
                      <TableHead>Colaboradores</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">Ações</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargosPagina.map((cargo) => {
                      const senioridades = cargo.senioridades;
                      const media =
                        senioridades.length > 0
                          ? senioridades.reduce((soma, item) => soma + item.salarioBase, 0) /
                            senioridades.length
                          : 0;
                      const minimo =
                        senioridades.length > 0
                          ? Math.min(...senioridades.map((item) => item.faixaMinima))
                          : 0;
                      const maximo =
                        senioridades.length > 0
                          ? Math.max(...senioridades.map((item) => item.faixaMaxima))
                          : 0;
                      return (
                        <Fragment key={cargo.id}>
                          <TableRow>
                            <TableCell>
                              <span className="flex items-center gap-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                                  {iniciais(cargo.nome) || "?"}
                                </span>
                                <span className="min-w-0">
                                  <span className="block font-medium text-foreground">
                                    {cargo.nome}
                                  </span>
                                  {cargo.cbo ? (
                                    <span className="block text-xs text-muted-foreground">
                                      CBO: {cargo.cbo}
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                                {cargo.setor}
                              </span>
                            </TableCell>
                            <TableCell>
                              {senioridades.length > 0
                                ? senioridades.map((item) => item.nivel).join(" · ")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {senioridades.length > 0 ? `${moeda(minimo)} - ${moeda(maximo)}` : "—"}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {senioridades.length > 0 ? moeda(media) : "—"}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">—</span>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Editar ${cargo.nome}`}
                                onClick={() => abrirEdicao(cargo)}
                              >
                                <Pencil className="size-4" aria-hidden />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {senioridades.map((item) => (
                            <TableRow key={item.id} className="bg-muted/30 hover:bg-muted/50">
                              <TableCell className="pl-12">
                                <span className="flex items-center gap-2 text-sm text-foreground">
                                  <span className="text-muted-foreground" aria-hidden>
                                    └
                                  </span>
                                  {item.nivel}
                                </span>
                              </TableCell>
                              <TableCell />
                              <TableCell />
                              <TableCell>
                                <div className="grid gap-1.5">
                                  <span className="text-sm">
                                    {moeda(item.faixaMinima)} - {moeda(item.faixaMaxima)}
                                  </span>
                                  <span className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <span
                                      className="block h-full rounded-full bg-emerald-500"
                                      style={{ width: `${calcularPosicao(item)}%` }}
                                    />
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm font-semibold">
                                {moeda(item.salarioBase)}
                              </TableCell>
                              <TableCell />
                              <TableCell />
                            </TableRow>
                          ))}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {cargosFiltrados.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Mostrando {primeiroItem} a {ultimoItem} de {cargosFiltrados.length} cargo(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={paginaAtual <= 1}
                    onClick={() => setPagina(paginaAtual - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {paginaAtual} / {totalPaginas}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={paginaAtual >= totalPaginas}
                    onClick={() => setPagina(paginaAtual + 1)}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{cargoEmEdicao ? "Editar cargo" : "Cadastrar cargo"}</DialogTitle>
              <DialogDescription>
                Defina o cargo e, em seguida, cadastre cada senioridade com a sua faixa salarial.
                Campos com <span className="text-destructive">*</span> são obrigatórios.
              </DialogDescription>
            </DialogHeader>

            <div className="grid max-h-[60vh] gap-6 overflow-y-auto pr-1">
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="cargo-nome">
                    Nome do cargo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cargo-nome"
                    value={formulario.nome}
                    onChange={(event) =>
                      setFormulario((atual) => ({ ...atual, nome: event.target.value }))
                    }
                    placeholder="Ex.: Desenvolvedor de Software"
                    maxLength={120}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="cargo-cbo">CBO (não obrigatório)</Label>
                  <Input
                    id="cargo-cbo"
                    value={formulario.cbo}
                    onChange={(event) =>
                      setFormulario((atual) => ({ ...atual, cbo: event.target.value }))
                    }
                    placeholder="Ex.: 2124-05"
                    maxLength={20}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>
                    Setor <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formulario.setor || undefined}
                    onValueChange={(valor) =>
                      setFormulario((atual) => ({ ...atual, setor: valor }))
                    }
                  >
                    <SelectTrigger aria-label="Setor do cargo">
                      <SelectValue placeholder="Selecione um setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {setoresBanco.length === 0 && !formulario.setor ? (
                        <SelectItem value="__vazio__" disabled>
                          Nenhum setor cadastrado
                        </SelectItem>
                      ) : null}
                      {Array.from(new Set([...setoresBanco, formulario.setor]))
                        .filter(Boolean)
                        .map((setor) => (
                          <SelectItem key={setor} value={setor}>
                            {setor}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <section className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Senioridades</h3>
                    <p className="text-xs text-muted-foreground">
                      Ex.: Júnior, Pleno, Sênior. Cada senioridade vira uma linha na tabela.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormulario((atual) => ({
                        ...atual,
                        senioridades: [...atual.senioridades, novaSenioridade()],
                      }))
                    }
                  >
                    <Plus className="size-4" aria-hidden />
                    Adicionar senioridade
                  </Button>
                </div>

                {formulario.senioridades.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    Nenhuma senioridade adicionada. Você pode salvar o cargo sem elas e incluir depois.
                  </p>
                ) : (
                  formulario.senioridades.map((item, indice) => (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_auto] sm:items-end"
                    >
                      <div className="grid gap-1.5">
                        <Label htmlFor={`nivel-${item.id}`}>Senioridade</Label>
                        <Input
                          id={`nivel-${item.id}`}
                          value={item.nivel}
                          onChange={(event) =>
                            atualizarSenioridade(item.id, "nivel", event.target.value)
                          }
                          placeholder="Ex.: Pleno (Nível III)"
                          maxLength={60}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`minima-${item.id}`}>Faixa mínima (R$)</Label>
                        <Input
                          id={`minima-${item.id}`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.faixaMinima}
                          onChange={(event) =>
                            atualizarSenioridade(item.id, "faixaMinima", event.target.value)
                          }
                          placeholder="0,00"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`base-${item.id}`}>Salário base (R$)</Label>
                        <Input
                          id={`base-${item.id}`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.salarioBase}
                          onChange={(event) =>
                            atualizarSenioridade(item.id, "salarioBase", event.target.value)
                          }
                          placeholder="0,00"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`maxima-${item.id}`}>Faixa máxima (R$)</Label>
                        <Input
                          id={`maxima-${item.id}`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.faixaMaxima}
                          onChange={(event) =>
                            atualizarSenioridade(item.id, "faixaMaxima", event.target.value)
                          }
                          placeholder="0,00"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover senioridade ${indice + 1}`}
                        onClick={() => removerSenioridade(item.id)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  ))
                )}
              </section>
            </div>

            <DialogFooter className="sm:justify-between">
              {cargoEmEdicao ? (
                <Button type="button" variant="ghost" className="text-destructive" onClick={excluirCargo}>
                  Excluir cargo
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogoAberto(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={salvarCargo}>
                  {cargoEmEdicao ? "Salvar alterações" : "Cadastrar cargo"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
