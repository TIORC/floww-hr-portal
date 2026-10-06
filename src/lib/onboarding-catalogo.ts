const CHAVE = "floww:onboarding:catalogo:v1";

export function catalogoJaVisitado(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CHAVE) !== null;
  } catch {
    // aba anônima / storage bloqueado: mostramos o modal sem persistir
    return false;
  }
}

export function marcarCatalogoVisitado(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE, "visto");
  } catch {
    // storage bloqueado: seguimos sem rastreio
  }
}
