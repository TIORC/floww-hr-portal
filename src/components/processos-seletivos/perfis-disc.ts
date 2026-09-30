export const PERFIS_DISC = [
  { valor: "Comunicador", atalho: "C" },
  { valor: "Executor", atalho: "E" },
  { valor: "Analista", atalho: "A" },
  { valor: "Planejador", atalho: "P" },
] as const;

export type PerfilDisc = (typeof PERFIS_DISC)[number]["valor"];
export type PercentuaisDisc = Record<PerfilDisc, number>;

/**
 * Cores de cada perfil DISC.
 * Executor vermelho, Comunicador amarelo, Analista azul e Planejador verde.
 * Todos os tons sao tokens do tema (styles.css), sem hex solto.
 */
export const TONS_DISC: Record<
  PerfilDisc,
  {
    chip: string;
    bloco: string;
    barra: string;
    thumb: string;
    texto: string;
    ponto: string;
  }
> = {
  Comunicador: {
    chip: "bg-accent-yellow text-slate-900",
    bloco: "border-accent-yellow bg-accent-yellow/10",
    barra: "bg-accent-yellow",
    thumb:
      "border-accent-yellow bg-accent-yellow focus-visible:ring-accent-yellow/40",
    texto: "text-accent-gold",
    ponto: "bg-accent-yellow",
  },
  Executor: {
    chip: "bg-destructive text-destructive-foreground",
    bloco: "border-destructive/40 bg-destructive/5",
    barra: "bg-destructive",
    thumb:
      "border-destructive bg-destructive focus-visible:ring-destructive/40",
    texto: "text-destructive",
    ponto: "bg-destructive",
  },
  Analista: {
    chip: "bg-primary text-primary-foreground",
    bloco: "border-primary/30 bg-primary/5",
    barra: "bg-primary",
    thumb: "border-primary bg-primary focus-visible:ring-primary/40",
    texto: "text-primary",
    ponto: "bg-primary",
  },
  Planejador: {
    chip: "bg-accent-green text-white",
    bloco: "border-accent-green/40 bg-accent-green/5",
    barra: "bg-accent-green",
    thumb:
      "border-accent-green bg-accent-green focus-visible:ring-accent-green/40",
    texto: "text-accent-green",
    ponto: "bg-accent-green",
  },
};