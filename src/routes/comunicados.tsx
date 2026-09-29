import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Sparkles } from "lucide-react";
import { Sidebar } from "@/routes/painel";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/comunicados")({ component: ComunicadosPage });

function EmptyAnnouncements({ highlighted }: { highlighted: boolean }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative mb-6 grid size-36 place-items-center rounded-[2rem] bg-primary/5 text-primary/75 sm:size-44">
        <Megaphone className="size-20 sm:size-24" strokeWidth={1.2} aria-hidden />
        <span className="absolute -right-1 top-2 grid size-9 place-items-center rounded-full bg-accent text-accent-foreground shadow-sm">
          <Sparkles className="size-4" aria-hidden />
        </span>
      </div>
      <h2 className="font-display text-lg font-semibold text-foreground">
        {highlighted ? "Nenhum comunicado em destaque" : "Ainda não há comunicados"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {highlighted
          ? "Quando houver uma informação importante em destaque, ela aparecerá aqui."
          : "Este espaço reúne novidades e informações compartilhadas pela sua empresa."}
      </p>
    </div>
  );
}

function ComunicadosPage() {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end">
          <PerfilFlutuante />
        </div>
        <Card className="min-h-[34rem] rounded-2xl shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <header className="mb-8">
              <h1 className="font-display text-3xl font-semibold text-foreground">Comunicados</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Melhore a comunicação na sua empresa com novidades e informações compartilhadas em um só lugar.
              </p>
            </header>
            <Tabs defaultValue="destaque" className="w-full">
              <TabsList className="h-auto w-full justify-start gap-2 rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger
                  value="destaque"
                  className="rounded-t-md rounded-b-none border border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Em Destaque
                </TabsTrigger>
                <TabsTrigger
                  value="geral"
                  className="rounded-t-md rounded-b-none border border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Geral
                </TabsTrigger>
              </TabsList>
              <TabsContent value="destaque" className="mt-0">
                <EmptyAnnouncements highlighted />
              </TabsContent>
              <TabsContent value="geral" className="mt-0">
                <EmptyAnnouncements highlighted={false} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
