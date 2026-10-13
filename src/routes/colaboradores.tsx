import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Mail, UserRound } from "lucide-react";

import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getIniciais } from "@/lib/iniciais";
import { type ColaboradorLista, useColaboradores } from "@/hooks/use-colaboradores";

export const Route = createFileRoute("/colaboradores")({
  head: () => ({
    meta: [{ title: "Colaboradores — Floww!" }],
  }),
  component: ColaboradoresPage,
});

const TODOS = "todos";

function valoresUnicos(lista: ColaboradorLista[], campo: "unidade" | "departamento" | "papel") {
  return Array.from(new Set(lista.map((item) => item[campo]).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

function CampoFiltro({
  id,
  rotulo,
  valor,
  opcoes,
  onChange,
}: {
  id: string;
  rotulo: string;
  valor: string;
  opcoes: string[];
  onChange: (valor: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {rotulo}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <option value={TODOS}>Todos</option>
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </div>
  );
}

function CardColaborador({ colaborador }: { colaborador: ColaboradorLista }) {
  const [emailAberto, setEmailAberto] = useState(false);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-white shadow-sm">
      <header className="bg-amber-400 px-3 py-1.5 text-center text-xs font-semibold text-slate-900">
        {colaborador.departamento || "Departamento não informado"}
      </header>

      <div className="flex flex-col items-center gap-2 px-4 pt-4">
        <Avatar className="size-20">
          <AvatarImage src={colaborador.fotoUrl || undefined} alt={`Foto de ${colaborador.nome}`} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {colaborador.nome ? getIniciais(colaborador.nome) : <UserRound className="size-8" aria-hidden />}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-center font-display text-base font-semibold text-foreground">{colaborador.nome}</h3>
        <span className="w-full rounded-full border border-border px-3 py-1 text-center text-xs italic text-muted-foreground">
          {colaborador.cargo || "Cargo não informado"}
        </span>
      </div>

      {/* Altura fixa para o bloco de habilidades e cursos: todos os cards ficam com o mesmo tamanho. */}
      {colaborador.habilidades.length > 0 || colaborador.formacoes.length > 0 ? (
        <div className="mt-3 flex h-32 flex-col gap-2 overflow-hidden px-4 text-left">
          {colaborador.habilidades.length > 0 && (
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Habilidades</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {colaborador.habilidades.slice(0, 6).map((habilidade) => (
                  <span key={habilidade} className="rounded-full bg-brand/10 px-2 py-0.5 text-[0.65rem] font-semibold text-brand">
                    {habilidade}
                  </span>
                ))}
                {colaborador.habilidades.length > 6 && (
                  <span className="px-1 text-[0.65rem] font-semibold text-muted-foreground">
                    +{colaborador.habilidades.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}

          {colaborador.formacoes.length > 0 && (
            <div className="min-h-0">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Cursos</p>
              <ul className="mt-1 grid gap-0.5">
                {colaborador.formacoes.slice(0, 3).map((formacao, indice) => (
                  <li key={`${formacao.formacao}-${indice}`} className="truncate text-xs text-foreground">
                    {formacao.formacao}
                    {formacao.instituicao && <span className="text-muted-foreground"> · {formacao.instituicao}</span>}
                  </li>
                ))}
                {colaborador.formacoes.length > 3 && (
                  <li className="text-[0.65rem] font-semibold text-muted-foreground">
                    +{colaborador.formacoes.length - 3} curso(s)
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 flex h-32 flex-col items-center justify-center gap-1 px-4 text-center">
          <img src="/sleep.png" alt="" aria-hidden className="h-20 w-auto object-contain" />
          <p className="text-xs italic text-muted-foreground">Nenhuma informação aqui!</p>
        </div>
      )}

      <footer className="mt-auto flex justify-end gap-2 border-t border-border px-4 py-2.5">
        {colaborador.email && (
          <button
            type="button"
            onClick={() => setEmailAberto(true)}
            aria-label={`Ver e-mail de ${colaborador.nome}`}
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Mail className="size-4" aria-hidden />
          </button>
        )}
      </footer>

      <Dialog open={emailAberto} onOpenChange={setEmailAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{colaborador.nome}</DialogTitle>
            <DialogDescription>E-mail de contato</DialogDescription>
          </DialogHeader>
          <p className="break-all rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
            {colaborador.email}
          </p>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function ColaboradoresPage() {
  const { data: colaboradores = [], isPending, isError } = useColaboradores();
  const [unidade, setUnidade] = useState(TODOS);
  const [departamento, setDepartamento] = useState(TODOS);
  const [papel, setPapel] = useState(TODOS);
  const [pesquisa, setPesquisa] = useState("");

  const unidades = useMemo(() => valoresUnicos(colaboradores, "unidade"), [colaboradores]);
  const departamentos = useMemo(() => valoresUnicos(colaboradores, "departamento"), [colaboradores]);
  const papeis = useMemo(() => valoresUnicos(colaboradores, "papel"), [colaboradores]);

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    return colaboradores.filter((colaborador) => {
      if (unidade !== TODOS && colaborador.unidade !== unidade) return false;
      if (departamento !== TODOS && colaborador.departamento !== departamento) return false;
      if (papel !== TODOS && colaborador.papel !== papel) return false;
      if (!termo) return true;
      return [
        colaborador.nome,
        colaborador.cargo,
        colaborador.departamento,
        ...colaborador.habilidades,
        ...colaborador.formacoes.map((formacao) => `${formacao.formacao} ${formacao.instituicao}`),
      ]
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
  }, [colaboradores, unidade, departamento, papel, pesquisa]);

  function limparFiltros() {
    setUnidade(TODOS);
    setDepartamento(TODOS);
    setPapel(TODOS);
    setPesquisa("");
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="flex min-w-0 flex-col bg-accent-soft p-5 sm:p-8">
        <div className="mb-5 flex justify-end">
          <PerfilFlutuante />
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="font-display text-3xl font-semibold text-foreground">Colaboradores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui você pode encontrar a listagem de todos os colaboradores da sua empresa cadastrados, junto com suas
            informações.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CampoFiltro id="filtro-unidade" rotulo="Unidade" valor={unidade} opcoes={unidades} onChange={setUnidade} />
            <CampoFiltro
              id="filtro-departamento"
              rotulo="Departamento"
              valor={departamento}
              opcoes={departamentos}
              onChange={setDepartamento}
            />
            <CampoFiltro id="filtro-papel" rotulo="Papéis" valor={papel} opcoes={papeis} onChange={setPapel} />
            <div className="grid gap-1.5">
              <label htmlFor="filtro-pesquisa" className="text-sm font-semibold text-foreground">
                Pesquisar
              </label>
              <Input
                id="filtro-pesquisa"
                placeholder="Palavra-chave: nome, cargo ou departamento"
                value={pesquisa}
                onChange={(evento) => setPesquisa(evento.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          {isPending && <p className="py-12 text-center text-sm text-muted-foreground">Carregando colaboradores...</p>}

          {isError && (
            <p className="py-12 text-center text-sm text-destructive">Não foi possível carregar os colaboradores.</p>
          )}

          {!isPending && !isError && filtrados.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">Nenhum colaborador encontrado.</p>
          )}

          {filtrados.length > 0 && (
            <>
              <p className="mb-4 text-xs text-muted-foreground">
                {filtrados.length} {filtrados.length === 1 ? "colaborador" : "colaboradores"}
              </p>
              <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtrados.map((colaborador) => (
                  <li key={colaborador.id} className="h-full">
                    <CardColaborador colaborador={colaborador} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
