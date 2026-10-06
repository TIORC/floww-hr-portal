import { createFileRoute } from "@tanstack/react-router";
import { PaginaPesquisa } from "@/components/pesquisa-pagina";

export const Route = createFileRoute("/pesquisa-engajamento")({ component: Page });

function Page() {
  return <PaginaPesquisa titulo="Pesquisa de Engajamento" descricao="Meça engajamento, reconhecimento e conexão com a cultura e defina o público." exemplo="Ex.: Engajamento e reconhecimento" />;
}
