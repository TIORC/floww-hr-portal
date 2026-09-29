import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BriefcaseBusiness, Plus } from "lucide-react";

import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AbrirVagaDialog } from "@/components/vagas/abrir-vaga-dialog";

type SetorVagas = { id: number; nome: string; vagas: number };

const SETORES_DEMONSTRATIVOS: SetorVagas[] = [
  { id: 1, nome: "Tecnologia", vagas: 8 },
  { id: 2, nome: "Recursos Humanos", vagas: 4 },
  { id: 3, nome: "Comercial", vagas: 6 },
  { id: 4, nome: "Marketing", vagas: 3 },
  { id: 5, nome: "Financeiro", vagas: 2 },
];

export const Route = createFileRoute("/vagas")({ component: VagasPage });

function VagasVazias({ fechadas }: { fechadas: boolean }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-6 grid size-36 place-items-center rounded-[2rem] bg-primary/5 text-primary/75 sm:size-44">
        <BriefcaseBusiness className="size-20 sm:size-24" strokeWidth={1.2} aria-hidden />
      </div>
      <h2 className="font-display text-lg font-semibold text-foreground">
        {fechadas ? "Nenhuma vaga fechada" : "Nenhuma vaga aberta"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {fechadas
          ? "As vagas encerradas aparecerão aqui."
          : "As oportunidades disponíveis para candidatura aparecerão aqui."}
      </p>
    </div>
  );
}

function VagasPage() {
  const [abrirVagaAberto, setAbrirVagaAberto] = useState(false);

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
              <h1 className="font-display text-3xl font-semibold text-foreground">Vagas</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Consulte as oportunidades abertas e as vagas já encerradas.
              </p>
              </div>
              <Button type="button" onClick={() => setAbrirVagaAberto(true)}>
                <Plus className="size-4" aria-hidden />
                Abrir vaga
              </Button>
            </header>
            <Tabs defaultValue="abertas" className="w-full">
              <TabsList className="h-auto w-full justify-start gap-2 rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger
                  value="abertas"
                  className="rounded-t-md rounded-b-none border border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Abertas
                </TabsTrigger>
                <TabsTrigger
                  value="fechadas"
                  className="rounded-t-md rounded-b-none border border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Fechadas
                </TabsTrigger>
              </TabsList>
              <TabsContent value="abertas" className="mt-0">
                <VagasVazias fechadas={false} />
              </TabsContent>
              <TabsContent value="fechadas" className="mt-0">
                <VagasVazias fechadas />
              </TabsContent>
            </Tabs>

            <section className="mt-8 border-t border-border pt-8" aria-labelledby="vagas-setor-title">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 id="vagas-setor-title" className="font-display text-xl font-semibold text-foreground">
                    Vagas abertas por setor
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Visão demonstrativa da distribuição de vagas abertas por setor.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="h-80 w-full rounded-xl border border-border bg-card p-4" role="img" aria-label="Gráfico de vagas abertas por setor">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SETORES_DEMONSTRATIVOS} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                      <YAxis dataKey="nome" type="category" width={130} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => [`${value} vagas`, "Abertas"]} />
                      <Bar dataKey="vagas" name="Vagas abertas" fill="var(--accent-yellow)" radius={[0, 6, 6, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </section>
          </CardContent>
        </Card>
        <AbrirVagaDialog open={abrirVagaAberto} onOpenChange={setAbrirVagaAberto} />
      </main>
    </div>
  );
}
