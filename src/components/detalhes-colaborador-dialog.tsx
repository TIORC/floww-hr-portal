import { UserRound } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type DetalhesColaborador = {
  nome: string;
  fotoUrl: string;
  cargoVisivel: string;
  cargo: string;
  dadosPlanilha: Record<string, string>;
};

// Mesmos rótulos das 28 colunas do modelo, agrupados em seções.
const SECOES: { titulo: string; campos: string[] }[] = [
  {
    titulo: "Identificação",
    campos: [
      "ID",
      "Nome",
      "Nome Completo",
      "Matricula",
      "Email",
      "CPF",
      "Etnia",
      "Sexo",
      "Gênero",
      "Data de Nascimento",
    ],
  },
  {
    titulo: "Função e vínculo",
    campos: [
      "Cargo",
      "Cargo Visível ( editável )",
      "Unidade",
      "Departamento",
      "Grupos",
      "Papel",
      "Gestor Direto",
      "Gestor Direto - E-mail",
      "Data de Admissão",
      "Situação",
      "Desligamento",
      "Ultimo dia trabalhado",
    ],
  },
  {
    titulo: "Sistema e acesso",
    campos: [
      "Data de Cadastro",
      "Ultimo Acesso",
      "Origem do Cadastro",
      "Participa gamificação",
      "Biografia",
      "Idioma",
    ],
  },
];

const TEXTO_VAZIO = "Não informado";

export function DetalhesColaboradorDialog({
  colaborador,
  aoFechar,
}: {
  colaborador: DetalhesColaborador | null;
  aoFechar: () => void;
}) {
  return (
    <Dialog open={colaborador !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-5xl">
        {colaborador ? (
          <>
            <DialogHeader>
              <DialogTitle>{colaborador.nome}</DialogTitle>
              <DialogDescription>Dados completos do colaborador, por seção.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-[17rem_1fr]">
              <div className="flex flex-col items-center gap-3">
                <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-3xl border border-dashed border-border bg-muted/40">
                  {colaborador.fotoUrl ? (
                    <img
                      src={colaborador.fotoUrl}
                      alt={`Foto de ${colaborador.nome}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 px-6 text-center text-muted-foreground">
                      <UserRound className="size-16" strokeWidth={1.2} aria-hidden />
                      <p className="text-xs">Nenhuma foto cadastrada</p>
                    </div>
                  )}
                </div>
                <p className="text-center text-base font-semibold text-foreground">
                  {colaborador.nome}
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  {colaborador.cargoVisivel || colaborador.cargo || TEXTO_VAZIO}
                </p>
              </div>
              <div className="grid max-h-[60vh] content-start gap-6 overflow-y-auto pr-1">
                {SECOES.map((secao, indiceSecao) => (
                  <section key={secao.titulo}>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                        {indiceSecao + 1}
                      </span>
                      {secao.titulo}
                    </h3>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {secao.campos.map((campo) => {
                        const valor = colaborador.dadosPlanilha[campo]?.trim() ?? "";
                        return (
                          <div
                            key={campo}
                            className={
                              campo === "Biografia" ? "rounded-xl border border-border p-3 sm:col-span-2" : "rounded-xl border border-border p-3"
                            }
                          >
                            <dt className="text-xs text-muted-foreground">{campo}</dt>
                            <dd
                              className={
                                valor
                                  ? "mt-1 break-words text-sm text-foreground"
                                  : "mt-1 text-sm italic text-muted-foreground"
                              }
                            >
                              {valor || TEXTO_VAZIO}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </section>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
