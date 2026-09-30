import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  BriefcaseBusiness,
  BadgeDollarSign,
  MessageCircle,
  X,
  FileSearch,
  Home,
  Megaphone,
  MessageSquareText,
  SearchCheck,
  Settings,
  ShieldAlert,
  Smile,
  Sparkles,
  TrendingUp,
  UserSearch,
  UsersRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { IndicadoresPainel } from "@/components/indicadores-painel";
import { CheckinSentimento } from "@/components/checkin-sentimento";
import { RankingMoedas } from "@/components/ranking-moedas";
import { usePerfil } from "@/hooks/use-perfil";
import { useRegistrarAcesso } from "@/hooks/use-acessos-diarios";
import { montarSaudacao } from "@/lib/greeting";
import { consumirOnboarding } from "@/lib/onboarding-sessao";
import { cn } from "@/lib/utils";
import { BoasVindasFlafy } from "@/components/onboarding/boas-vindas-flafy";

const NAV_ITEMS = [{ to: "/painel", label: "Início", icon: Home }] as const;

const FLOWW_BALLOON_MESSAGES = [
  "Prazer! Eu sou a Floww IA. Meu trabalho é facilitar sua experiência por aqui, desde encontrar uma funcionalidade até entender seus próprios resultados.",
  "Oi! Eu sou a Floww IA. Posso ajudar você a entender melhor sua jornada dentro da plataforma e encontrar as informações que procura.",
  "Tenho respostas sobre os recursos da plataforma e posso ajudar você a interpretar seus feedbacks e resultados.",
  "Quer descobrir o que seus feedbacks estão dizendo sobre sua evolução? Posso analisar os dados disponíveis e apresentar os principais insights.",
  "Posso resumir seus feedbacks para você. Em vez de analisar várias informações separadamente, posso apresentar os pontos mais relevantes de forma objetiva.",
  "Recebeu vários feedbacks? Posso ajudar a organizar as informações e destacar aquilo que merece mais atenção.",
  "Posso ajudar você a transformar feedbacks em ações. A partir das informações disponíveis, posso sugerir pontos que merecem atenção ou desenvolvimento.",
  "Quer saber quais pontos aparecem com mais frequência nos seus feedbacks? Posso analisar as informações disponíveis e mostrar os principais padrões.",
  "Seus resultados mudaram ao longo do tempo? Quando houver histórico disponível, posso ajudar você a entender essa evolução.",
  "Não encontrou alguma coisa? Me diga o que você está procurando e posso indicar onde encontrar na plataforma.",
  "Está procurando uma funcionalidade? Posso orientar você sobre onde ela está e explicar como utilizá-la.",
  "Não sabe onde acessar seus resultados? Posso indicar o caminho dentro da plataforma.",
  "Quer encontrar seus feedbacks? Posso mostrar onde eles ficam e explicar como consultar as informações.",
  "Está tentando encontrar algum recurso? Descreva o que precisa e eu posso orientar sua navegação.",
  "Não precisa explorar todos os menus sozinho. Pergunte onde encontrar uma funcionalidade e eu ajudo você a chegar até ela.",
  "Quer saber onde fica determinada informação? É só me dizer o que procura. Posso indicar o local correspondente na plataforma.",
  "Se estiver perdido entre tantos menus, eu posso ajudar. Diga o que você precisa fazer e indicarei o caminho disponível.",
  "Posso ser seu guia pela plataforma. Pergunte como acessar uma funcionalidade, consultar uma informação ou realizar determinada ação.",
  "Não sabe como fazer alguma coisa por aqui? Me explique o que deseja realizar e eu apresentarei as instruções disponíveis.",
  "Quer aprender a utilizar melhor a plataforma? Posso explicar os principais recursos e orientar você passo a passo.",
  "Posso ajudar você a entender como cada recurso funciona. Pergunte sobre qualquer funcionalidade disponível para o seu perfil.",
  "Tem dúvida sobre alguma ferramenta? Posso explicar para que ela serve e como utilizá-la.",
  "Quer saber o que pode fazer dentro da plataforma? Posso apresentar os recursos disponíveis para o seu perfil.",
  "Posso explicar os recursos da plataforma de maneira simples, sem transformar uma dúvida de dois minutos em um curso de três horas.",
  "Está usando uma funcionalidade pela primeira vez? Posso explicar o que ela faz e orientar os próximos passos.",
  "Quer descobrir recursos que talvez ainda não tenha utilizado? Posso apresentar funcionalidades disponíveis para você.",
  "Posso ajudar você a navegar pela plataforma, entender seus resultados e aproveitar melhor os recursos disponíveis.",
  "Se tiver dúvida sobre como realizar alguma tarefa, pergunte. Posso explicar o procedimento com base nas funcionalidades disponíveis para seu perfil.",
  "Minha função por aqui é facilitar as coisas. Posso explicar recursos, orientar sua navegação e ajudar você a entender seus resultados.",
];

function randomBalloonMessageIndex(currentIndex: number) {
  const next = Math.floor(Math.random() * (FLOWW_BALLOON_MESSAGES.length - 1));
  return next >= currentIndex ? next + 1 : next;
}

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [{ title: "Painel — Floww!" }],
  }),
  component: Painel,
});

export function Sidebar() {
  return (
    <aside className="relative z-30 flex min-h-screen flex-col bg-[image:var(--gradient-brand)] px-6 py-7 lg:sticky lg:top-0 lg:h-screen lg:min-h-0">
      <span className="relative font-display text-2xl font-bold tracking-tight text-white">
        Floww
        <span className="brand-bang">!</span>
      </span>

      <nav aria-label="Menu principal" className="relative mt-10">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/45">
          Principal
        </p>
        <ul className="mt-3 grid gap-1.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                activeProps={{
                  className: "bg-white/15 text-white hover:bg-white/15",
                }}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          ))}
          <li className="group relative">
            <button
              type="button"
              aria-haspopup="true"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <TrendingUp className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">Desempenho &amp; Evolução</span>
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </button>
            <ul className="absolute left-full top-0 z-20 ml-2 hidden w-56 rounded-xl border border-white/10 bg-slate-900/95 p-1.5 shadow-xl group-hover:grid group-focus-within:grid">
              {[
                { label: "Avaliações", icon: ClipboardCheck, to: "/avaliacoes" },
                { label: "Feedback's", icon: MessageSquareText, to: "/feedbacks" },
                {
                  label: "Planos de Desenvolvimento",
                  icon: CalendarClock,
                  to: "/planos-desenvolvimento",
                },
                { label: "Reuniões 1:1", icon: UsersRound, to: "/reunioes-1-1" },
              ].map(({ label, icon: Icon, to }) => (
                <li key={label}>
                  {to ? (
                    <Link
                      to={to}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <Icon className="size-4 shrink-0 text-white/65" aria-hidden />
                      {label}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80">
                      <Icon className="size-4 shrink-0 text-white/65" aria-hidden />
                      {label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
          <li className="group relative">
            <button
              type="button"
              aria-haspopup="true"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Sparkles className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">Clima e Engajamento</span>
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </button>
            <ul className="absolute left-full top-0 z-20 ml-2 hidden w-56 rounded-xl border border-white/10 bg-slate-900/95 p-1.5 shadow-xl group-hover:grid group-focus-within:grid">
              {[
                { label: "Comunicados", icon: Megaphone, to: "/comunicados" },
                { label: "Gamificação", icon: Sparkles, to: "/gamificacao" },
              ].map(({ label, icon: Icon, to }) => (
                <li key={label}>
                  {to ? (
                    <Link
                      to={to}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <Icon className="size-4 shrink-0 text-white/65" aria-hidden />
                      {label}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80">
                      <Icon className="size-4 shrink-0 text-white/65" aria-hidden />
                      {label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        </ul>
        <p className="mt-7 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/45">
          RH
        </p>
        <ul className="mt-3 grid gap-1.5">
          <li className="group relative">
            <button
              type="button"
              aria-haspopup="true"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <FileSearch className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">Relatórios e Pesquisas</span>
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </button>
            <ul className="absolute left-full top-0 z-20 ml-2 hidden w-64 rounded-xl border border-white/10 bg-slate-900/95 p-1.5 shadow-xl group-hover:grid group-focus-within:grid">
              {[
                { label: "Todas as Pesquisas", icon: Smile, to: "/todas-as-pesquisas" },
                {
                  label: "Mapeamento de Riscos Psicossociais",
                  icon: ShieldAlert,
                  to: "/mapeamento-riscos-psicossociais",
                },
              ].map(({ label, icon: Icon, to }) => (
                <li key={label}>
                  {to ? (
                    <Link
                      to={to}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <Icon className="size-4 shrink-0 text-white/65" aria-hidden />
                      {label}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80">
                      <Icon className="size-4 shrink-0 text-white/65" aria-hidden />
                      {label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
          <li className="group relative">
            <button
              type="button"
              aria-haspopup="true"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <BriefcaseBusiness className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">Recrutamento &amp; Seleção</span>
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </button>
            <ul className="absolute left-full top-0 z-20 ml-2 hidden w-56 rounded-xl border border-white/10 bg-slate-900/95 p-1.5 shadow-xl group-hover:grid group-focus-within:grid">
              {[
                { label: "Vagas", icon: BriefcaseBusiness, to: "/vagas" },
                { label: "Processos Seletivos", icon: UserSearch, to: "/processos-seletivos" },
                { label: "DISC", icon: SearchCheck },
              ].map(({ label, icon: Icon, to }) => (
                <li key={label}>
                  {to ? (
                    <Link
                      to={to}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <Icon className="size-4 shrink-0 text-white/65" aria-hidden />
                      {label}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80">
                      <Icon className="size-4 shrink-0 text-white/65" aria-hidden />
                      {label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
          <li className="group relative">
            <button
              type="button"
              aria-haspopup="true"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Settings className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">Configurações</span>
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </button>
            <ul className="absolute left-full top-0 z-20 ml-2 hidden w-72 rounded-xl border border-white/10 bg-slate-900/95 p-1.5 shadow-xl group-hover:grid group-focus-within:grid">
              {[
                { label: "Cargos & Salários", icon: BadgeDollarSign },
                { label: "Cadastros e Desligamentos", icon: UsersRound },
              ].map(({ label, icon: Icon }) => (
                <li key={label}>
                  <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80">
                    <Icon className="size-4 shrink-0 text-white/65" aria-hidden />
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>

      <svg
        viewBox="0 0 300 120"
        preserveAspectRatio="none"
        aria-hidden
        className="brand-wave pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full"
      >
        <path
          fill="var(--accent-yellow)"
          fillOpacity="0.25"
          d="M0,64 C60,96 120,32 180,48 C240,64 270,88 300,72 L300,120 L0,120 Z"
        />
        <path
          fill="var(--accent-yellow)"
          fillOpacity="0.5"
          d="M0,84 C50,60 110,104 170,88 C230,72 268,100 300,90 L300,120 L0,120 Z"
        />
      </svg>
    </aside>
  );
}

function Saudacao() {
  const { data: perfil, isPending } = usePerfil();

  if (isPending) {
    return <div aria-hidden className="mt-6 h-8 w-64" />;
  }

  return (
    <p className="mt-6 font-display text-2xl font-semibold text-foreground">
      {montarSaudacao(perfil?.nome ?? "")}
    </p>
  );
}

function Painel() {
  const navigate = useNavigate();
  const [chatAberto, setChatAberto] = useState(false);
  const [balloonMessageIndex, setBalloonMessageIndex] = useState(0);
  const [boasVindasAberto, setBoasVindasAberto] = useState(false);
  const { mutate: registrarAcesso } = useRegistrarAcesso();

  useEffect(() => {
    if (consumirOnboarding()) setBoasVindasAberto(true);
  }, []);

  useEffect(() => {
    if (chatAberto) return;
    setBalloonMessageIndex((current) => randomBalloonMessageIndex(current));
    const intervalId = window.setInterval(() => {
      setBalloonMessageIndex((current) => randomBalloonMessageIndex(current));
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [chatAberto]);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && !data.session) {
        navigate({ to: "/", replace: true });
      }
      if (!cancelled && data.session) {
        registrarAcesso();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, registrarAcesso]);

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="bg-background p-6 sm:p-8">
        <div className="flex items-start justify-end">
          <PerfilFlutuante />
        </div>
        <div className="mt-6 flex h-[300px] w-full items-center justify-center rounded-2xl border border-dashed border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground">Foto dos aniversariantes</p>
        </div>
        <Saudacao />
        <IndicadoresPainel />
        <CheckinSentimento />
        <RankingMoedas />
        <BoasVindasFlafy aberto={boasVindasAberto} onFechar={() => setBoasVindasAberto(false)} />
      </main>
      <div
        className={cn(
          "fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3",
          boasVindasAberto && "hidden",
        )}
      >
        {chatAberto ? (
          <section
            aria-label="Chat com a assistente"
            className="mb-2 flex h-[25rem] w-[min(21rem,calc(100vw-2.5rem))] translate-y-[84px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
          >
            <header className="flex items-center justify-between bg-[image:var(--gradient-brand)] px-4 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <img src="/and.png" alt="" className="size-9 object-contain" />
                <div>
                  <p className="text-sm font-semibold">Assistente Floww</p>
                  <OnlineStatus />
                </div>
              </div>
              <button
                type="button"
                aria-label="Fechar chat"
                onClick={() => setChatAberto(false)}
                className="rounded-md p-1.5 transition hover:bg-white/15"
              >
                <X className="size-4" aria-hidden />
              </button>
            </header>
            <div className="flex-1 bg-slate-50 p-4">
              <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm ring-1 ring-black/5">
                Olá! Como posso ajudar você hoje?
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-200 p-3">
              <input
                type="text"
                disabled
                placeholder="Chat em breve"
                aria-label="Mensagem para a assistente"
                className="h-10 min-w-0 flex-1 rounded-full bg-slate-100 px-4 text-sm text-slate-600 outline-none placeholder:text-slate-400"
              />
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-300 text-white"
                aria-hidden
              >
                <MessageCircle className="size-4" />
              </span>
            </div>
          </section>
        ) : (
          <div className="relative z-10 -translate-x-14 translate-y-[5rem] max-w-60 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg ring-1 ring-black/5">
            {FLOWW_BALLOON_MESSAGES[balloonMessageIndex]}
            <span aria-hidden className="absolute -bottom-1.5 right-7 size-3 rotate-45 bg-white" />
          </div>
        )}
        <button
          type="button"
          aria-label={chatAberto ? "Fechar chat" : "Abrir chat com a assistente"}
          aria-expanded={chatAberto}
          onClick={() => setChatAberto((aberto) => !aberto)}
          className="rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <img
            src="/and.png"
            alt=""
            className="size-42 translate-y-10 object-contain drop-shadow-lg"
          />
        </button>
      </div>
    </div>
  );
}

function OnlineStatus() {
  return (
    <span
      role="status"
      aria-label="Assistente Floww online"
      className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
    >
      <span className="relative flex size-2" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      Online
    </span>
  );
}
