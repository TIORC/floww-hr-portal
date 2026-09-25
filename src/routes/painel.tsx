import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { IndicadoresPainel } from "@/components/indicadores-painel";
import { RankingMoedas } from "@/components/ranking-moedas";
import { usePerfil } from "@/hooks/use-perfil";
import { montarSaudacao } from "@/lib/greeting";

const NAV_ITEMS = [{ to: "/painel", label: "Início", icon: Home }] as const;

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [{ title: "Painel — Floww!" }],
  }),
  component: Painel,
});

function Sidebar() {
  return (
    <aside className="relative flex min-h-screen flex-col overflow-hidden bg-[image:var(--gradient-brand)] px-6 py-7 lg:min-h-0">
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

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && !data.session) {
        navigate({ to: "/", replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

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
        <RankingMoedas />
      </main>
    </div>
  );
}
