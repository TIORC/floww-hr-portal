import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { LIMITE_MOTIVO, EMOCOES_SENTIMENTO, isEmocaoSentimento, type EmocaoSentimento } from "@/lib/sentimento";
import {
  CHECKIN_SENTIMENTO_QUERY_KEY,
  useCheckinDoDia,
  useRegistrarCheckinSentimento,
} from "@/hooks/use-checkin-sentimento";
import { usePesquisasPendentes, type PesquisaPendente } from "@/hooks/use-pesquisas-pendentes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TITULO_CHECKIN = "checkin-sentimento-titulo";
const ID_MOTIVO = "checkin-sentimento-motivo";

function ArteEmocao({
  emocao,
  imgClassName,
  emojiClassName,
}: {
  emocao: { imagem: string; emoji: string };
  imgClassName?: string;
  emojiClassName?: string;
}) {
  const [falhou, setFalhou] = useState(false);

  if (falhou) {
    return (
      <span aria-hidden="true" className={cn("leading-none", emojiClassName)}>
        {emocao.emoji}
      </span>
    );
  }

  return (
    <img
      src={emocao.imagem}
      alt=""
      aria-hidden="true"
      className={imgClassName}
      onError={() => setFalhou(true)}
    />
  );
}

function CabecalhoCheckin() {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-3">
      <img
        src="/Very_Happy.png"
        alt=""
        aria-hidden="true"
        className="size-12 shrink-0 object-contain sm:size-14"
      />
      <div>
        <h2
          id={TITULO_CHECKIN}
          className="font-display text-xl font-semibold text-muted-foreground"
        >
          Como você está se sentindo hoje?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua resposta vale por um dia inteiro e pode ser alterada até a meia-noite.
        </p>
      </div>
    </div>
  );
}

function SeletorEmocoes({
  valor,
  onChange,
  desabilitado,
}: {
  valor: EmocaoSentimento | null;
  onChange: (emocao: EmocaoSentimento) => void;
  desabilitado: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={TITULO_CHECKIN}
      className="mx-auto grid w-full max-w-[51.2rem] grid-cols-5 items-end gap-[0.6rem] sm:gap-4"
    >
      {EMOCOES_SENTIMENTO.map((emocao) => {
        const selecionado = valor === emocao.id;
        return (
          <button
            key={emocao.id}
            type="button"
            role="radio"
            aria-checked={selecionado}
            aria-label={emocao.rotulo}
            title={emocao.rotulo}
            disabled={desabilitado}
            onClick={() => onChange(emocao.id)}
            className={cn(
              "group flex aspect-square w-full items-center justify-center rounded-2xl border-2 bg-background p-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
              selecionado
                ? "scale-105 border-brand bg-brand/5 shadow-lg"
                : "border-border hover:-translate-y-1.5 hover:scale-110 hover:border-brand/60 hover:bg-muted/50 hover:shadow-xl active:scale-95",
            )}
          >
            <ArteEmocao
              emocao={emocao}
              imgClassName="h-auto w-full max-w-[4.8rem] object-contain transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3 sm:max-w-[5.6rem]"
              emojiClassName="text-5xl leading-none transition-transform duration-200 group-hover:scale-110 sm:text-6xl"
            />
          </button>
        );
      })}
    </div>
  );
}

const TIPO_PESQUISA_ROTULO: Record<string, string> = {
  satisfacao: "Pesquisa de Satisfação",
  rapida: "Pesquisa Rápida",
  super: "Super Pesquisa",
  desligamento: "Pesquisa de Desligamento",
  engajamento: "Pesquisa de Engajamento",
};

// Estado exibido quando não sobra nenhuma pendência (check-in respondido e nenhuma pesquisa aberta).
function SemPendencias() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 text-center">
      <img src="/sleep.png" alt="" aria-hidden="true" className="h-24 w-auto object-contain" />
      <p className="text-sm italic text-muted-foreground">Finalmente. Posso dormir em paz</p>
    </div>
  );
}

function PesquisasPendentes({ pesquisas }: { pesquisas: PesquisaPendente[] }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-foreground">Pesquisas pendentes</h3>
      <ul className="mt-3 grid gap-3">
        {pesquisas.map((pesquisa) => {
          const prazo = new Date(`${pesquisa.prazo}T00:00:00`).toLocaleDateString("pt-BR");

          return (
            <li
              key={pesquisa.id}
              className="rounded-2xl border border-border bg-background p-4"
            >
              <p className="font-semibold text-foreground">{pesquisa.titulo}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {TIPO_PESQUISA_ROTULO[pesquisa.tipo] ?? "Pesquisa"} · Responder até {prazo}
                {pesquisa.anonima ? " · Anônima" : ""}
              </p>
              {pesquisa.descricao ? (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{pesquisa.descricao}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FormularioCheckin({
  emocao,
  motivo,
  onEmocaoChange,
  onMotivoChange,
  onSubmit,
  enviando,
}: {
  emocao: EmocaoSentimento | null;
  motivo: string;
  onEmocaoChange: (emocao: EmocaoSentimento) => void;
  onMotivoChange: (motivo: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  enviando: boolean;
}) {
  const restantes = LIMITE_MOTIVO - motivo.length;
  const temEmocaoSelecionada = emocao !== null;

  return (
    <form className="mt-10 flex flex-col gap-5" onSubmit={onSubmit}>
      <SeletorEmocoes valor={emocao} onChange={onEmocaoChange} desabilitado={enviando} />

      {temEmocaoSelecionada ? (
        <div>
          <Label htmlFor={ID_MOTIVO} className="text-sm font-semibold text-foreground">
            Por que você está se sentindo assim?
            <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id={ID_MOTIVO}
            value={motivo}
            onChange={(event) => onMotivoChange(event.target.value.slice(0, LIMITE_MOTIVO))}
            maxLength={LIMITE_MOTIVO}
            disabled={enviando}
            rows={4}
            autoFocus
            placeholder="Escreva o que estiver na sua mente. Esse texto é sigiloso."
            className="mt-2 resize-y rounded-xl border-border bg-background"
          />
          <p
            className={cn(
              "mt-1.5 text-right text-xs font-semibold",
              restantes <= 500 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {motivo.length.toLocaleString("pt-BR")} / {LIMITE_MOTIVO.toLocaleString("pt-BR")}{" "}
            caracteres
          </p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={enviando || !temEmocaoSelecionada}
          className="min-w-52 bg-accent-yellow text-slate-900 shadow hover:bg-accent-yellow/90 hover:text-slate-900"
        >
          {enviando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {enviando ? "Enviando..." : "Enviar como estou hoje"}
        </Button>
      </div>
    </form>
  );
}

export function CheckinSentimento() {
  const queryClient = useQueryClient();
  const { data: checkin, isError } = useCheckinDoDia();
  const { mutate: registrar, isPending: enviando } = useRegistrarCheckinSentimento();
  const { data: pesquisas, isSuccess: pesquisasCarregadas } = usePesquisasPendentes();

  const [emocao, setEmocao] = useState<EmocaoSentimento | null>(null);
  const [motivo, setMotivo] = useState("");

  // Refaz a consulta assim que o dia vira, para o card liberar o novo voto.
  useEffect(() => {
    const agora = new Date();
    const viradaDoDia = new Date(agora);
    viradaDoDia.setHours(24, 0, 5, 0);

    const intervalo = window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: CHECKIN_SENTIMENTO_QUERY_KEY });
    }, viradaDoDia.getTime() - agora.getTime());

    return () => window.clearTimeout(intervalo);
  }, [queryClient]);

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emocao || !isEmocaoSentimento(emocao)) {
      toast.error("Escolha como você está se sentindo para enviar.");
      return;
    }

    registrar(
      { emocao, motivo: motivo.trim() },
      {
        onSuccess: () => {
          toast.success("Sentimento registrado. Obrigado por compartilhar!");
        },
        onError: () => {
          toast.error("Não foi possível registrar seu sentimento. Tente novamente.");
        },
      },
    );
  }

  const respondido = Boolean(checkin);
  const temPesquisas = (pesquisas?.length ?? 0) > 0;
  // Só mostra o sleep com a lista de pesquisas carregada, para não aparecer por engano durante o carregamento.
  const semPendencias = respondido && pesquisasCarregadas && !temPesquisas;

  return (
    <section aria-label="Check-in de sentimento e pesquisas pendentes" className="mt-8 w-full">
      <div className="rounded-2xl bg-accent-soft p-6">
        {respondido ? null : (
          <>
            <CabecalhoCheckin />

            {isError ? (
              <p className="mt-6 rounded-2xl border border-accent-orange/40 bg-accent-orange/10 p-4 text-sm font-medium text-foreground">
                Não conseguimos ler o seu check-in de hoje. Você pode enviar o seu agora mesmo.
              </p>
            ) : null}

            <FormularioCheckin
              emocao={emocao}
              motivo={motivo}
              onEmocaoChange={setEmocao}
              onMotivoChange={setMotivo}
              onSubmit={enviar}
              enviando={enviando}
            />
          </>
        )}

        {temPesquisas ? (
          <div className={respondido ? undefined : "mt-10 border-t border-border pt-8"}>
            <PesquisasPendentes pesquisas={pesquisas ?? []} />
          </div>
        ) : null}

        {semPendencias ? <SemPendencias /> : null}
      </div>
    </section>
  );
}
