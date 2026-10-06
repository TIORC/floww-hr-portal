import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Pencil } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { LIMITE_MOTIVO, EMOCOES_SENTIMENTO, getEmocaoSentimento, isEmocaoSentimento, type EmocaoSentimento } from "@/lib/sentimento";
import {
  CHECKIN_SENTIMENTO_QUERY_KEY,
  useCheckinDoDia,
  useRegistrarCheckinSentimento,
  type CheckinDoDia,
} from "@/hooks/use-checkin-sentimento";
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

function RespostaRegistrada({
  checkin,
  onEditar,
}: {
  checkin: CheckinDoDia;
  onEditar: () => void;
}) {
  const emocao = getEmocaoSentimento(checkin.emocao);

  return (
    <div className="mt-6 flex flex-col items-center gap-5 rounded-2xl border border-border bg-background p-6 sm:flex-row">
      {emocao ? (
        <ArteEmocao
          emocao={emocao}
          imgClassName="h-auto w-56 shrink-0 object-contain sm:w-72"
          emojiClassName="text-8xl leading-none sm:text-9xl"
        />
      ) : null}

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="flex items-center justify-center gap-2 font-display text-lg font-bold text-foreground sm:justify-start">
          <CheckCircle2 className="size-5 shrink-0 text-accent-green" aria-hidden />
          Hoje você está se sentindo {emocao?.rotulo.toLowerCase()}.
        </p>

        {checkin.motivo ? (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{checkin.motivo}</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Você não contou o porquê.</p>
        )}

        <p className="mt-3 text-xs font-semibold text-accent-green">
          Resposta registrada. Ela zera à meia-noite.
        </p>
      </div>

      <Button type="button" variant="outline" className="shrink-0" onClick={onEditar}>
        <Pencil className="size-4" aria-hidden />
        Alterar
      </Button>
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

  const [editando, setEditando] = useState(false);
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

  useEffect(() => {
    if (!checkin || editando) return;
    setEmocao(checkin.emocao);
    setMotivo(checkin.motivo);
  }, [checkin, editando]);

  function iniciarEdicao() {
    if (checkin) {
      setEmocao(checkin.emocao);
      setMotivo(checkin.motivo);
    }
    setEditando(true);
  }

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
          setEditando(false);
          toast.success("Sentimento registrado. Obrigado por compartilhar!");
        },
        onError: () => {
          toast.error("Não foi possível registrar seu sentimento. Tente novamente.");
        },
      },
    );
  }

  const respondido = Boolean(checkin) && !editando;

  return (
    <section aria-labelledby={TITULO_CHECKIN} className="mt-8 w-full">
      <div className="rounded-2xl bg-accent-soft p-6">
        <CabecalhoCheckin />

        {isError ? (
          <p className="mt-6 rounded-2xl border border-accent-orange/40 bg-accent-orange/10 p-4 text-sm font-medium text-foreground">
            Não conseguimos ler o seu check-in de hoje. Você pode enviar o seu agora mesmo.
          </p>
        ) : null}

        {respondido && checkin ? (
          <RespostaRegistrada checkin={checkin} onEditar={iniciarEdicao} />
        ) : (
          <FormularioCheckin
            emocao={emocao}
            motivo={motivo}
            onEmocaoChange={setEmocao}
            onMotivoChange={setMotivo}
            onSubmit={enviar}
            enviando={enviando}
          />
        )}
      </div>
    </section>
  );
}
