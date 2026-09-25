import type { ReactNode } from "react";
import { Award, CodeXml, Flame, LogIn, TrendingUp, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const CARD =
  "flex h-[230px] w-[280px] shrink-0 flex-col rounded-2xl border border-border bg-card p-5";

const ATIVIDADES = [
  { id: "acessos-diarios", titulo: "Acessos diários", icone: LogIn, cor: "text-brand" },
  {
    id: "evolucao-profissional",
    titulo: "Evolução profissional",
    icone: TrendingUp,
    cor: "text-accent-green",
  },
  {
    id: "desenvolvimento",
    titulo: "Desenvolvimento",
    icone: CodeXml,
    cor: "text-accent-orange",
  },
  { id: "reconhecimentos", titulo: "Reconhecimentos", icone: Award, cor: "text-destructive" },
] as const;

const COMPETENCIAS = [
  { id: "foco", rotulo: "Foco", valor: 70, cor: "bg-destructive" },
  { id: "colaboracao", rotulo: "Colaboração", valor: 50, cor: "bg-accent-yellow" },
  { id: "desenvolvimento", rotulo: "Desenvolvimento", valor: 20, cor: "bg-brand" },
  { id: "iniciativa", rotulo: "Iniciativa", valor: 60, cor: "bg-accent-orange" },
] as const;

const MEDIA_CONSTANCIA = Math.round(
  COMPETENCIAS.reduce((soma, competencia) => soma + competencia.valor, 0) / COMPETENCIAS.length,
);

const BARRA = [
  ...COMPETENCIAS,
  {
    id: "resultados",
    rotulo: "Resultados",
    valor: MEDIA_CONSTANCIA,
    cor: "bg-accent-green",
  },
] as const;

const TITULO_ATIVIDADES = "atividades-painel-titulo";

function HeroCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex w-max min-w-full items-stretch gap-4 rounded-2xl bg-accent-soft p-6">
        {children}
      </div>
    </div>
  );
}

function CardTitulo({
  icone: Icone,
  titulo,
  cor,
}: {
  icone: LucideIcon;
  titulo: string;
  cor: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icone className={cn("size-4 shrink-0", cor)} aria-hidden />
      <h3 className="truncate text-sm font-semibold text-muted-foreground">{titulo}</h3>
    </div>
  );
}

function CardAtividade({ titulo, icone, cor }: { titulo: string; icone: LucideIcon; cor: string }) {
  return (
    <article className={CARD}>
      <CardTitulo icone={icone} titulo={titulo} cor={cor} />
      <p className="mt-auto font-display text-4xl font-bold text-foreground">—</p>
    </article>
  );
}

function CardReconhecimentos() {
  return (
    <article className={CARD}>
      <CardTitulo icone={Award} titulo="Reconhecimentos" cor="text-destructive" />
      <div className="mt-auto grid grid-cols-2 gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Recebidos
          </p>
          <p className="font-display text-3xl font-bold text-foreground">—</p>
        </div>
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Enviados
          </p>
          <p className="font-display text-3xl font-bold text-foreground">—</p>
        </div>
      </div>
    </article>
  );
}

function BarraProgresso({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.65rem] font-semibold text-foreground">{rotulo}</span>
        <span className="text-[0.65rem] font-bold text-muted-foreground">{valor}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={rotulo}
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full rounded-full", cor)} style={{ width: `${valor}%` }} />
      </div>
    </div>
  );
}

function CardConstancia() {
  return (
    <article className={CARD}>
      <CardTitulo icone={Flame} titulo="Constância" cor="text-brand" />
      <div className="mt-3 flex flex-col gap-2.5">
        {BARRA.map((competencia) => (
          <BarraProgresso
            key={competencia.id}
            rotulo={competencia.rotulo}
            valor={competencia.valor}
            cor={competencia.cor}
          />
        ))}
      </div>
    </article>
  );
}

export function IndicadoresPainel() {
  return (
    <section aria-labelledby={TITULO_ATIVIDADES} className="mt-8">
      <h2
        id={TITULO_ATIVIDADES}
        className="ml-8 font-display text-xl font-semibold text-muted-foreground"
      >
        Acompanhe suas atividades!
      </h2>

      <div className="mt-4">
        <HeroCard>
          {ATIVIDADES.map((atividade) =>
            atividade.id === "reconhecimentos" ? (
              <CardReconhecimentos key={atividade.id} />
            ) : (
              <CardAtividade
                key={atividade.id}
                titulo={atividade.titulo}
                icone={atividade.icone}
                cor={atividade.cor}
              />
            ),
          )}
          <CardConstancia />
        </HeroCard>
      </div>
    </section>
  );
}
