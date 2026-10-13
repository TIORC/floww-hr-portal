import { Bell } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePerfil } from "@/hooks/use-perfil";
import { useMeuPerfil } from "@/hooks/use-meu-perfil";
import {
  type Notificacao,
  useMarcarNotificacoesLidas,
  useNotificacoes,
} from "@/hooks/use-notificacoes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getIniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

function formatarDataNotificacao(dataISO: string) {
  return new Date(dataISO).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ListaNotificacoes({ notificacoes }: { notificacoes: Notificacao[] }) {
  if (notificacoes.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma notificação.</p>;
  }

  return (
    <ul className="grid max-h-96 gap-2 overflow-y-auto">
      {notificacoes.map((notificacao) => (
        <li
          key={notificacao.id}
          className={cn(
            "rounded-lg border border-border p-3",
            !notificacao.lida && "bg-brand/5",
          )}
        >
          <p className="font-display text-sm font-bold text-foreground">{notificacao.titulo}</p>
          <p className="mt-1 text-xs text-muted-foreground">{notificacao.mensagem}</p>
          <p className="mt-2 text-[0.65rem] font-semibold text-muted-foreground">
            {formatarDataNotificacao(notificacao.criado_em)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function BotaoNotificacoes() {
  const { data: notificacoes = [] } = useNotificacoes();
  const { mutate: marcarComoLidas } = useMarcarNotificacoesLidas();
  const naoLidas = notificacoes.filter((notificacao) => !notificacao.lida).length;

  return (
    <Popover
      onOpenChange={(aberto) => {
        if (aberto && naoLidas > 0) marcarComoLidas();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={naoLidas > 0 ? `Notificações (${naoLidas} não lidas)` : "Notificações"}
          className="relative shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <Bell className="size-5" aria-hidden />
          {naoLidas > 0 && (
            <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-destructive" aria-hidden />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <p className="mb-2 font-display text-sm font-bold text-foreground">Notificações</p>
        <ListaNotificacoes notificacoes={notificacoes} />
      </PopoverContent>
    </Popover>
  );
}

// Itens do menu com página própria. Os demais ainda não têm tela.
const ROTAS_MENU: Partial<Record<string, "/meu-perfil" | "/comunicados" | "/organograma" | "/colaboradores">> = {
  "Meu Perfil": "/meu-perfil",
  Organograma: "/organograma",
  Colaboradores: "/colaboradores",
  Comunicados: "/comunicados",
};

const ITENS_MENU_PRINCIPAL = [
  "Meu Perfil",
  "Organograma",
  "Colaboradores",
  "Comunicados",
  "Ouvidoria",
  "Novidades do produto",
  "Política de Privacidade",
];

function MenuPerfil({ nome, cargo, setor }: { nome: string; cargo: string; setor: string }) {
  const navigate = useNavigate();

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu do perfil"
          className="flex min-w-0 items-center gap-2 rounded-xl p-1 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <Avatar className="size-8 shrink-0 border border-brand/20">
            <AvatarFallback className="bg-[image:var(--gradient-brand)] font-display text-[0.65rem] font-bold text-primary-foreground">
              {getIniciais(nome)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate font-display text-xs font-bold text-foreground">{nome}</p>
            <p className="truncate text-xs font-semibold text-destructive">{cargo}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-brand/10 px-1.5 py-px text-[0.55rem] font-bold uppercase tracking-[0.1em] text-brand">
              {setor}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {ITENS_MENU_PRINCIPAL.map((item) => (
          <DropdownMenuItem
            key={item}
            onSelect={() => {
              const destino = ROTAS_MENU[item];
              if (destino) navigate({ to: destino });
            }}
          >
            {item}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Minha Área
        </DropdownMenuLabel>
        <DropdownMenuItem>Minha carreira</DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={sair} className="text-destructive focus:text-destructive">
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PerfilFlutuante({ className }: { className?: string }) {
  const { data: perfil, isPending } = usePerfil();
  const { data: meuPerfil } = useMeuPerfil();

  if (isPending) {
    return <div aria-hidden className={cn("h-8 w-36", className)} />;
  }

  const nome = perfil?.nome ?? "Colaborador";
  const cargo = meuPerfil?.cargo_visivel || perfil?.cargo || "Cargo não informado";
  const setor = perfil?.setor_sigla || perfil?.setor || "Setor não informado";

  return (
    <div className={cn("flex max-w-sm items-center gap-2", className)}>
      <BotaoNotificacoes />
      <MenuPerfil nome={nome} cargo={cargo} setor={setor} />
    </div>
  );
}
