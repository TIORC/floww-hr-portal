import { createFileRoute } from "@tanstack/react-router";
import { PaginaPesquisa } from "@/components/pesquisa-pagina";

export const Route = createFileRoute("/pesquisa-rapida")({ component: Page });

function Page() {
  return <PaginaPesquisa titulo="Pesquisa Rápida" descricao="Crie um pulso rápido com poucas perguntas e acompanhe a rotina do time." exemplo="Ex.: Pulso rápido da semana" />;
}
