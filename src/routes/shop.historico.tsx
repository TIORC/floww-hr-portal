import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Coins, History, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TRANSACOES_SHOP, getTotalEntradas, getTotalSaidas, type TransacaoShop } from "@/lib/transacoes-mock";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/shop/historico")({
  head: () => ({
    meta: [{ title: "Histórico — Floww Shop" }],
  }),
  component: HistoricoPage,
});

const CORES_GRAFICO = {
  entrada: "oklch(0.62 0.17 255)",
  saida: "oklch(0.84 0.16 88)",
};

function formatarDataCompleta(dataISO: string): string {
  const data = new Date(dataISO);
  return format(data, "dd 'de' MMMM 'de' yyyy', às' HH'h'mm", { locale: ptBR });
}

function formatarMoedas(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

function ResumoCard({ icone: Icone, label, valor, cor, iconeCor }: {
  icone: React.ComponentType<{ className?: string }>;
  label: string;
  valor: number;
  cor: string;
  iconeCor: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{formatarMoedas(valor)}</p>
        </div>
        <div className={cn("rounded-xl p-3", cor)}>
          <Icone className={cn("size-5", iconeCor)} aria-hidden />
        </div>
      </div>
    </div>
  );
}

function GraficoPizza({ totalEntradas, totalSaidas }: { totalEntradas: number; totalSaidas: number }) {
  const dados = useMemo(() => [
    { name: "Recebido", value: totalEntradas, fill: CORES_GRAFICO.entrada },
    { name: "Gasto", value: totalSaidas, fill: CORES_GRAFICO.saida },
  ].filter((d) => d.value > 0), [totalEntradas, totalSaidas]);

  const total = totalEntradas + totalSaidas;

  if (dados.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-muted/40">
        <p className="text-sm text-muted-foreground">Nenhuma transação para exibir</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-foreground">Recebido vs Gasto</h3>
      <div className="mt-4 flex h-80 items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <ChartContainer
            config={{
              entrada: { label: "Recebido", color: CORES_GRAFICO.entrada },
              saida: { label: "Gasto", color: CORES_GRAFICO.saida },
            }}
          >
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={dados}
                cx="50%"
                cy="50%"
                innerRadius="32%"
                outerRadius="72%"
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {dados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => [formatarMoedas(value as number), ""]} />} />
              <ChartLegend />
            </PieChart>
          </ChartContainer>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute flex max-w-[45%] flex-col items-center gap-1 text-center">
          <span className="font-display text-2xl font-bold text-foreground">{formatarMoedas(total)}</span>
          <span className="text-[11px] leading-tight text-muted-foreground">Total movimentado</span>
        </div>
      </div>
      <ChartLegend className="mt-4" payload={dados} />
    </div>
  );
}

function LinhaTransacao({ transacao }: { transacao: TransacaoShop }) {
  const isSaida = transacao.tipo === "saida";
  const Icone = isSaida ? Package : ArrowUpRight;
  const iconeCor = isSaida ? "text-destructive" : "text-accent-green";
  const valorCor = isSaida ? "text-destructive" : "text-accent-green";
  const sinal = isSaida ? "−" : "+";

  return (
    <article className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 transition hover:border-brand/30">
      <div className={cn("shrink-0 rounded-lg p-2", isSaida ? "bg-destructive/10" : "bg-accent-green/10")}>
        <Icone className={cn("size-4", iconeCor)} aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{transacao.descricao}</p>
        <p className="mt-1 text-xs text-muted-foreground">{formatarDataCompleta(transacao.data)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("font-display text-sm font-bold", valorCor)}>
          {sinal} {formatarMoedas(transacao.valor)} Floww Coins
        </p>
      </div>
    </article>
  );
}

function HistoricoPage() {
  const totalEntradas = getTotalEntradas();
  const totalSaidas = getTotalSaidas();
  const saldoAtual = totalEntradas - totalSaidas;

  const transacoesOrdenadas = useMemo(
    () => [...TRANSACOES_SHOP].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    []
  );

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end">
          <PerfilFlutuante />
        </div>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <header>
            <div>
              <h1 className="font-display text-3xl font-semibold text-foreground">Histórico de Transações</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Acompanhe todas as suas entradas e saídas de Floww Coins, incluindo compras na loja e recompensas.
              </p>
            </div>
            </header>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <ResumoCard
              icone={ArrowUpRight}
              label="Total Recebido"
              valor={totalEntradas}
              cor="bg-accent-green/10"
              iconeCor="text-accent-green"
            />
            <ResumoCard
              icone={ArrowDownRight}
              label="Total Gasto"
              valor={totalSaidas}
              cor="bg-destructive/10"
              iconeCor="text-destructive"
            />
            <ResumoCard
              icone={Coins}
              label="Saldo Disponível"
              valor={saldoAtual}
              cor="bg-brand/10"
              iconeCor="text-brand"
            />
          </div>

          <GraficoPizza totalEntradas={totalEntradas} totalSaidas={totalSaidas} />

          <section className="mt-8" aria-labelledby="historico-title">
            <h2 id="historico-title" className="font-display text-xl font-semibold text-foreground">
              Extrato completo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lista de todas as movimentações ordenadas da mais recente para a mais antiga.
            </p>
            <div className="mt-4 space-y-3" role="list" aria-label="Histórico de transações">
              {transacoesOrdenadas.map((transacao) => (
                <LinhaTransacao key={transacao.id} transacao={transacao} />
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}