import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Coins, Search } from "lucide-react";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIniciais } from "@/lib/iniciais";
import { ACOES_GAMIFICACAO, PARTICIPANTES_GAMIFICACAO } from "@/lib/gamificacao-mock";

export const Route = createFileRoute("/gamificacao")({ component: GamificacaoPage });

function GamificacaoPage() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const totalMoedas = PARTICIPANTES_GAMIFICACAO.reduce((total, pessoa) => total + pessoa.moedas, 0);
  const participantes = useMemo(() => PARTICIPANTES_GAMIFICACAO
    .filter((pessoa) => filtro === "todos" || pessoa.perfil.toLowerCase() === filtro)
    .filter((pessoa) => `${pessoa.nome} ${pessoa.departamento}`.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => b.moedas - a.moedas), [busca, filtro]);

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end"><PerfilFlutuante /></div>
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <header>
            <h1 className="font-display text-3xl font-semibold text-foreground">Ranking de Gamificação</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Veja quanto vale cada ação para ganhar Floww Coins, acompanhe o ranking completo e acesse seu extrato individual para conferir o histórico dos pontos que você acumulou.
            </p>
          </header>

          <section className="mt-8" aria-labelledby="acoes-title">
            <h2 id="acoes-title" className="font-display text-lg font-semibold text-foreground">Ação e valor em pontos</h2>
            <ul className="mt-3 grid gap-x-10 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
              {ACOES_GAMIFICACAO.map((acao) => (
                <li key={acao.descricao} className="flex justify-between gap-3 border-b border-border/60 py-1">
                  <span>{acao.descricao}</span><span className="shrink-0">{acao.pontos} Floww Coins</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10" aria-labelledby="ranking-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="ranking-title" className="font-display text-xl font-semibold text-foreground">Ranking completo</h2>
                <p className="mt-1 text-sm text-muted-foreground">Confira a pontuação do time abaixo. Para ver seu extrato individual, busque seu nome na lista.</p>
              </div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Coins className="size-4 text-accent-gold" aria-hidden /> Total de Floww Coins <strong className="text-foreground">{totalMoedas.toLocaleString("pt-BR")}</strong></p>
            </div>

            <label className="relative mt-5 block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Busque pelo nome" aria-label="Busque pelo nome" className="h-11 border-primary/30 pl-10" />
            </label>

            <Tabs value={filtro} onValueChange={setFiltro} className="mt-3">
              <TabsList className="h-auto justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
                {[{ value: "todos", label: "Todos" }, { value: "colaborador", label: "Colaboradores" }, { value: "gestor", label: "Gestores" }].map((item) => (
                  <TabsTrigger key={item.value} value={item.value} className="rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">{item.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {participantes.length ? <ol className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {participantes.map((pessoa, indice) => (
                <li key={pessoa.id} className="flex min-h-44 flex-col items-center justify-between bg-muted/40 px-4 py-5 text-center">
                  <div className="flex flex-col items-center">
                    <span className="grid size-12 place-items-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">{getIniciais(pessoa.nome)}</span>
                    <span className="mt-2 text-xs text-muted-foreground">#{indice + 1}</span>
                    <h3 className="mt-1 font-display text-sm font-semibold text-foreground">{pessoa.nome}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{pessoa.departamento}</p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-accent-yellow px-2.5 py-1 text-xs font-semibold text-slate-900"><Coins className="size-3" aria-hidden />{pessoa.moedas.toLocaleString("pt-BR")} Floww Coins</span>
                </li>
              ))}
            </ol> : <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma pessoa encontrada.</p>}
          </section>
        </section>
      </main>
    </div>
  );
}
