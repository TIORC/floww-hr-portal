import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SmilePlus } from "lucide-react";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHumorEmpresa } from "@/hooks/use-humor-empresa";
import { EMOCOES_SENTIMENTO } from "@/lib/sentimento";

export const Route = createFileRoute("/relatorios-gerais")({
  head: () => ({
    meta: [{ title: "Relatórios Gerais — Floww!" }],
  }),
  component: RelatoriosGeraisPage,
});

const PERIODOS = [
  { id: "todo-periodo", rotulo: "Todo o período", dias: null },
  { id: "7-dias", rotulo: "Últimos 7 dias", dias: 7 },
  { id: "30-dias", rotulo: "Últimos 30 dias", dias: 30 },
  { id: "90-dias", rotulo: "Últimos 90 dias", dias: 90 },
] as const;

type PeriodoId = (typeof PERIODOS)[number]["id"];

// Data no formato AAAA-MM-DD, pelo calendário local do navegador.
function formatarDataIso(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function intervaloDoPeriodo(id: PeriodoId) {
  const periodo = PERIODOS.find((item) => item.id === id);
  if (!periodo || periodo.dias === null) return {};

  const inicio = new Date();
  inicio.setDate(inicio.getDate() - (periodo.dias - 1));
  return { inicio: formatarDataIso(inicio), fim: formatarDataIso(new Date()) };
}

function RelatoriosGeraisPage() {
  const [periodo, setPeriodo] = useState<PeriodoId>("todo-periodo");
  const { data, isPending, isError } = useHumorEmpresa(intervaloDoPeriodo(periodo));

  const media = data?.media ?? null;
  const emocaoDaMedia = media === null ? null : EMOCOES_SENTIMENTO[Math.min(Math.max(Math.round(media), 1), 5) - 1];
  const total = data?.totalCheckins ?? 0;

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <Sidebar />
      <main className="min-w-0 px-5 py-7 sm:px-8 lg:px-10">
        <div className="w-full max-w-none">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Relatórios e Pesquisas</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Relatórios Gerais</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Indicadores consolidados da organização. Os dados são sempre agregados e não identificam colaboradores.
              </p>
            </div>
            <PerfilFlutuante />
          </div>

          <div className="mb-6 flex justify-end">
            <Select value={periodo} onValueChange={(valor) => setPeriodo(valor as PeriodoId)}>
              <SelectTrigger className="w-56" aria-label="Período do relatório">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SmilePlus className="size-5 text-brand" aria-hidden />
                Termômetro do humor
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Média do check-in diário de sentimento de todos os colaboradores no período.
              </p>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : isError ? (
                <p className="rounded-xl border border-accent-orange/40 bg-accent-orange/10 p-4 text-sm font-medium text-foreground">
                  Não foi possível carregar o termômetro do humor.
                </p>
              ) : total === 0 || !emocaoDaMedia ? (
                <p className="text-sm text-muted-foreground">Ainda não há check-ins neste período.</p>
              ) : (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:items-center">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <img
                      src={emocaoDaMedia.imagem}
                      alt=""
                      aria-hidden="true"
                      className="h-32 w-auto object-contain"
                    />
                    <p className="font-display text-xl font-bold text-foreground">{emocaoDaMedia.rotulo}</p>
                    <p className="text-sm text-muted-foreground">
                      Média{" "}
                      <span className="font-semibold text-foreground">
                        {media!.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>{" "}
                      de 5 · {total.toLocaleString("pt-BR")} check-in(s)
                    </p>
                  </div>

                  <ul className="grid gap-3" aria-label="Distribuição das respostas">
                    {EMOCOES_SENTIMENTO.slice()
                      .reverse()
                      .map((emocao) => {
                        const quantidade = data?.distribuicao[emocao.id] ?? 0;
                        const percentual = total > 0 ? (quantidade / total) * 100 : 0;

                        return (
                          <li key={emocao.id} className="grid grid-cols-[7rem_minmax(0,1fr)_4.5rem] items-center gap-3">
                            <span className="text-sm font-medium text-foreground">{emocao.rotulo}</span>
                            <div className="h-3 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-brand" style={{ width: `${percentual}%` }} />
                            </div>
                            <span className="text-right text-sm text-muted-foreground">
                              {quantidade} · {percentual.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
