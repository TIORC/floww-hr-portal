import { createFileRoute } from "@tanstack/react-router";
import { PaginaPesquisa } from "@/components/pesquisa-pagina";

export const Route = createFileRoute("/pesquisa-satisfacao")({ component: Page });

function Page() {
  return <PaginaPesquisa titulo="Pesquisa de Satisfação" descricao="Avalie clima, benefícios e experiência do colaborador e defina quem vai participar." exemplo="Ex.: Satisfação com clima e benefícios" />;
}
