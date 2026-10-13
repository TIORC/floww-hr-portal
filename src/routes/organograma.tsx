import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, UserRound } from "lucide-react";

import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getIniciais } from "@/lib/iniciais";
import { montarArvoreOrganograma, type NoOrganograma } from "@/lib/organograma";
import { useOrganograma } from "@/hooks/use-organograma";

export const Route = createFileRoute("/organograma")({
  head: () => ({
    meta: [{ title: "Organograma — Floww!" }],
  }),
  component: OrganogramaPage,
});

const ZOOM_MINIMO = 0.5;
const ZOOM_MAXIMO = 1.5;
const PASSO_ZOOM = 0.1;

// A planilha já traz "Departamento ..." em alguns casos; evita repetir o prefixo.
function textoDepartamento(departamento: string) {
  if (!departamento) return "Departamento não informado";
  return /^departamento/i.test(departamento) ? departamento : `Departamento ${departamento}`;
}

function CardPessoa({ no }: { no: NoOrganograma }) {
  return (
    <div className="w-72 rounded-sm border border-border border-t-[3px] border-t-brand bg-white px-4 py-3 text-left shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar className="size-11 shrink-0">
          <AvatarImage src={no.fotoUrl || undefined} alt={`Foto de ${no.nome}`} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {no.nome ? getIniciais(no.nome) : <UserRound className="size-5" aria-hidden />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-foreground">{no.nome}</p>
          <p className="break-words text-xs text-muted-foreground">{textoDepartamento(no.departamento)}</p>
          <p className="break-words text-xs font-semibold text-accent-green">{no.cargo || "Cargo não informado"}</p>
        </div>
      </div>
    </div>
  );
}

// Um nível da árvore. Quem tem equipe ganha um botão + para abrir/fechar; a equipe começa recolhida.
function NoArvore({ no }: { no: NoOrganograma }) {
  const [aberto, setAberto] = useState(false);
  const temEquipe = no.subordinados.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <CardPessoa no={no} />

        {temEquipe && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute -right-3 top-1/2 size-7 -translate-y-1/2 rounded-full bg-white"
            aria-label={aberto ? `Recolher equipe de ${no.nome}` : `Expandir equipe de ${no.nome}`}
            aria-expanded={aberto}
            onClick={() => setAberto((atual) => !atual)}
          >
            {aberto ? <Minus className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
          </Button>
        )}
      </div>

      {aberto && temEquipe && (
        <>
          <div className="h-6 w-px bg-slate-400" aria-hidden />
          {/* Sem gap: o espaço entre irmãos é padding interno do item, para a linha horizontal seguir contínua. */}
          <ul className="flex">
            {no.subordinados.map((subordinado, indice) => {
              const primeiro = indice === 0;
              const ultimo = indice === no.subordinados.length - 1;
              const unico = primeiro && ultimo;

              return (
                <li key={subordinado.id} className="relative flex flex-col items-center px-3 pt-6">
                  {!unico && (
                    <span
                      aria-hidden
                      className={
                        primeiro
                          ? "absolute left-1/2 right-0 top-0 h-px bg-slate-400"
                          : ultimo
                            ? "absolute left-0 right-1/2 top-0 h-px bg-slate-400"
                            : "absolute left-0 right-0 top-0 h-px bg-slate-400"
                      }
                    />
                  )}
                  <span aria-hidden className="absolute left-1/2 top-0 h-6 w-px bg-slate-400" />
                  <NoArvore no={subordinado} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function OrganogramaPage() {
  const { data: pessoas = [], isPending, isError } = useOrganograma();
  const raizes = useMemo(() => montarArvoreOrganograma(pessoas), [pessoas]);
  const [zoom, setZoom] = useState(1);

  function alterarZoom(delta: number) {
    setZoom((atual) => Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, Math.round((atual + delta) * 10) / 10)));
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="flex min-w-0 flex-col bg-accent-soft p-5 sm:p-8">
        <div className="mb-5 flex justify-end">
          <PerfilFlutuante />
        </div>

        <section className="flex flex-1 flex-col rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-semibold text-foreground">Organograma</h1>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => alterarZoom(PASSO_ZOOM)}
                disabled={zoom >= ZOOM_MAXIMO}
              >
                Zoom +
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => alterarZoom(-PASSO_ZOOM)}
                disabled={zoom <= ZOOM_MINIMO}
              >
                Zoom -
              </Button>
            </div>
          </div>

          {isPending && <p className="py-12 text-center text-sm text-muted-foreground">Carregando organograma...</p>}

          {isError && (
            <p className="py-12 text-center text-sm text-destructive">Não foi possível carregar o organograma.</p>
          )}

          {!isPending && !isError && raizes.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">Nenhum colaborador cadastrado.</p>
          )}

          {raizes.length > 0 && (
            <div className="mt-6 flex-1 overflow-auto pb-4">
              <div className="flex min-w-max justify-center gap-10" style={{ zoom }}>
                {raizes.map((raiz) => (
                  <NoArvore key={raiz.id} no={raiz} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
