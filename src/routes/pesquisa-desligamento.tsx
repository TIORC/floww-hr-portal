import { createFileRoute } from "@tanstack/react-router";
import { PaginaPesquisa } from "@/components/pesquisa-pagina";

export const Route = createFileRoute("/pesquisa-desligamento")({ component: Page });

function Page() {
  return <PaginaPesquisa titulo="Pesquisa de Desligamento" descricao="Conduza a entrevista de saída e entenda os motivos de desligamento." exemplo="Ex.: Entrevista de saída" />;
}
