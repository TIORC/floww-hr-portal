import { Coins, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import { getIniciais } from "@/lib/iniciais";
import { usePerfil } from "@/hooks/use-perfil";
import { useMeuPerfil } from "@/hooks/use-meu-perfil";
import {
  type EntradaRankingFlowwCoins,
  useRankingFlowwCoins,
  useSaldoFlowwCoins,
} from "@/hooks/use-floww-coins";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TITULO_RANKING = "ranking-moedas-titulo";

function formatarMoedas(valor: number) {
  return valor.toLocaleString("pt-BR");
}

// Gestor é identificado pelo campo "Papel" da planilha de colaboradores.
function ehGestor(entrada: EntradaRankingFlowwCoins) {
  return /gestor/i.test(entrada.papel);
}

const LIMITE_TOP = 10;

function CabecalhoMinhasMoedas({ saldo, posicao }: { saldo: number; posicao: number | null }) {
  const { data: perfil, isPending } = usePerfil();
  const { data: meuPerfil } = useMeuPerfil();

  const nome = perfil?.nome ?? "Colaborador";
  const cargo = meuPerfil?.cargo_visivel || perfil?.cargo || "Cargo não informado";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
      <div className="flex min-w-0 items-center gap-3">
        {posicao !== null && (
          <span
            className="shrink-0 font-display text-sm font-bold text-muted-foreground"
            aria-label={`Sua posição: ${posicao}º`}
          >
            {posicao}º
          </span>
        )}
        <Avatar className="size-10 shrink-0 border border-brand/20">
          <AvatarFallback className="bg-[image:var(--gradient-brand)] font-display text-xs font-bold text-primary-foreground">
            {isPending ? "" : getIniciais(nome)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-foreground">
            {isPending ? "" : nome}
          </p>
          <p className="truncate text-xs font-semibold text-destructive">{cargo}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2">
        <Coins className="size-4 shrink-0 text-accent-gold" aria-hidden />
        <span className="font-display text-base font-bold text-foreground">
          {formatarMoedas(saldo)}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">Floww Coins</span>
      </div>
    </div>
  );
}

function LinhaRanking({ posicao, entrada }: { posicao: number; entrada: EntradaRankingFlowwCoins }) {
  const ehTop3 = posicao <= 3;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold",
          ehTop3 ? "bg-accent-gold/20 text-accent-gold" : "bg-muted text-muted-foreground",
        )}
      >
        {ehTop3 ? <Trophy className="size-3.5" aria-hidden /> : posicao}
      </span>

      <Avatar className="size-8 shrink-0 border border-brand/20">
        <AvatarFallback className="bg-brand/10 font-display text-[0.6rem] font-bold text-brand">
          {getIniciais(entrada.nome)}
        </AvatarFallback>
      </Avatar>

      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
        {entrada.nome}
      </p>

      <span className="flex shrink-0 items-center gap-1.5">
        <Coins className="size-3.5 text-accent-gold" aria-hidden />
        <span className="font-display text-sm font-bold text-foreground">
          {formatarMoedas(entrada.saldo)}
        </span>
      </span>
    </li>
  );
}

function ListaRanking({
  dados,
  carregando,
  erro,
}: {
  dados: EntradaRankingFlowwCoins[];
  carregando: boolean;
  erro: boolean;
}) {
  if (carregando) {
    return <p className="mt-4 py-8 text-center text-sm text-muted-foreground">Carregando ranking...</p>;
  }

  if (erro) {
    return (
      <p className="mt-4 py-8 text-center text-sm text-destructive">
        Não foi possível carregar o ranking.
      </p>
    );
  }

  if (dados.length === 0) {
    return (
      <p className="mt-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum colaborador cadastrado.
      </p>
    );
  }

  return (
    <ol className="mt-4 grid gap-2">
      {dados.map((entrada, indice) => (
        <LinhaRanking key={entrada.id} posicao={indice + 1} entrada={entrada} />
      ))}
    </ol>
  );
}

export function RankingMoedas() {
  const { data: saldoData } = useSaldoFlowwCoins();
  const { data: ranking = [], isPending, isError } = useRankingFlowwCoins();

  const colaboradores = ranking.filter((entrada) => !ehGestor(entrada));
  const gestores = ranking.filter(ehGestor);

  // Posição do usuário logado dentro do seu grupo (colaboradores ou gestores).
  // Só é exibida quando ele está fora do top 10.
  const eu = ranking.find((entrada) => entrada.id === saldoData?.id);
  const grupoDoUsuario = eu ? (ehGestor(eu) ? gestores : colaboradores) : [];
  const indiceDoUsuario = eu ? grupoDoUsuario.findIndex((entrada) => entrada.id === eu.id) : -1;
  const posicaoForaDoTop = indiceDoUsuario >= LIMITE_TOP ? indiceDoUsuario + 1 : null;

  return (
    <section aria-labelledby={TITULO_RANKING} className="w-full max-w-[800px]">
      <h2
        id={TITULO_RANKING}
        className="ml-8 font-display text-xl font-semibold text-muted-foreground"
      >
        Ranking de Gameficação! - Acompanhe seus Floww Coins!!
      </h2>

      <div className="mt-4 rounded-2xl bg-accent-soft p-6">
        <CabecalhoMinhasMoedas saldo={saldoData?.saldo ?? 0} posicao={posicaoForaDoTop} />

        <Tabs defaultValue="colaboradores" className="mt-5">
          <TabsList className="grid w-full grid-cols-2 bg-background sm:w-96">
            <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
            <TabsTrigger value="gestores">Gestores</TabsTrigger>
          </TabsList>

          <TabsContent value="colaboradores">
            <ListaRanking dados={colaboradores.slice(0, LIMITE_TOP)} carregando={isPending} erro={isError} />
          </TabsContent>
          <TabsContent value="gestores">
            <ListaRanking dados={gestores.slice(0, LIMITE_TOP)} carregando={isPending} erro={isError} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
