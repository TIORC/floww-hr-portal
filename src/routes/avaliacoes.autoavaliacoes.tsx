import { createFileRoute } from "@tanstack/react-router";
import { AutoavaliacoesContent } from "@/components/avaliacoes/autoavaliacoes-content";

export const Route = createFileRoute("/avaliacoes/autoavaliacoes")({
  component: AutoavaliacoesPage,
});

function AutoavaliacoesPage() {
  return <AutoavaliacoesContent />;
}
