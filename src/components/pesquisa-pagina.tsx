import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardParticipantes } from "@/components/pesquisa-builder";
import { CardDetalhesPesquisa } from "@/components/pesquisa-detalhes";
import { CardPerguntas } from "@/components/pesquisa-perguntas";

export function PaginaPesquisa({ titulo, descricao, exemplo }: { titulo: string; descricao: string; exemplo: string }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end"><PerfilFlutuante /></div>
        <Card className="min-h-[34rem] rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="font-display text-3xl">{titulo}</CardTitle><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{descricao}</p></CardHeader>
          <CardContent className="space-y-6"><CardParticipantes nome={titulo} /><CardDetalhesPesquisa nome={titulo} exemplo={exemplo} /><CardPerguntas /></CardContent>
        </Card>
      </main>
    </div>
  );
}
