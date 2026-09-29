import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClipboardCheck, Users, Gavel } from "lucide-react";
import { Sidebar } from "@/routes/painel";
import { PerfilFlutuante } from "@/components/perfil-flutuante";

export const Route = createFileRoute("/avaliacoes")({
  component: AvaliacoesLayout,
});

function AvaliacoesLayout() {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="bg-background p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-end">
          <PerfilFlutuante />
        </div>

        <Tabs defaultValue="autoavaliacoes" className="w-full">
          <section className="rounded-2xl border border-border bg-card px-6 pt-6 shadow-sm sm:px-8 sm:pt-8">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Avaliações de desempenho
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Aqui estão as avaliações de desempenho criadas na sua empresa onde você pode realizar a sua autoavaliação ou ver os resultados.
            </p>
            <TabsList className="mt-10 grid h-auto w-full grid-cols-3 justify-start bg-transparent p-0 sm:flex sm:gap-6">
              <TabsTrigger value="autoavaliacoes" className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Autoavaliações
              </TabsTrigger>
              <TabsTrigger value="gerenciar" className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <Users className="mr-2 h-4 w-4" />
                Gerenciar avaliações
              </TabsTrigger>
              <TabsTrigger value="comites" className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <Gavel className="mr-2 h-4 w-4" />
                Comitês de calibragem
              </TabsTrigger>
            </TabsList>
          </section>

          <TabsContent value="autoavaliacoes" className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <section className="mb-5">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Minhas avaliações como participante
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Aqui você encontra todas as avaliações das quais participou.
              </p>
            </section>
            <Outlet />
          </TabsContent>
          <TabsContent value="gerenciar" className="mt-5">
            <GerenciarPlaceholder />
          </TabsContent>
          <TabsContent value="comites" className="mt-5">
            <ComitesPlaceholder />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function GerenciarPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
        Gerenciar Avaliações
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Área para gestores e RH administrarem ciclos de avaliação, configurarem formulários e
        acompanharem progresso.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Em desenvolvimento</p>
    </div>
  );
}

function ComitesPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <Gavel className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
        Comitês de Calibragem
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Área para reuniões de calibração de notas, discussão de casos e decisões finais de comitês.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Em desenvolvimento</p>
    </div>
  );
}
