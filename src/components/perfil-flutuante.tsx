import { cn } from "@/lib/utils";
import { usePerfil } from "@/hooks/use-perfil";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getIniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

export function PerfilFlutuante({ className }: { className?: string }) {
  const { data: perfil, isPending } = usePerfil();

  if (isPending) {
    return <div aria-hidden className={cn("h-8 w-36", className)} />;
  }

  const nome = perfil?.nome ?? "Colaborador";
  const cargo = perfil?.cargo ?? "Cargo não informado";
  const setor = perfil?.setor_sigla || perfil?.setor || "Setor não informado";

  return (
    <div className={cn("flex max-w-sm items-center gap-2", className)}>
      <Avatar className="size-8 shrink-0 border border-brand/20">
        <AvatarFallback className="bg-[image:var(--gradient-brand)] font-display text-[0.65rem] font-bold text-primary-foreground">
          {getIniciais(nome)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 text-left">
        <p className="truncate font-display text-xs font-bold text-foreground">{nome}</p>
        <p className="truncate text-xs font-semibold text-destructive">{cargo}</p>
        <span className="mt-1 inline-flex items-center rounded-full bg-brand/10 px-1.5 py-px text-[0.55rem] font-bold uppercase tracking-[0.1em] text-brand">
          {setor}
        </span>
      </div>
    </div>
  );
}
