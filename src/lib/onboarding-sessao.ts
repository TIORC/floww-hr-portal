const CHAVE = "floww:onboarding:v1";

export function marcarSaidaDoLogin(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CHAVE, "pendente");
  } catch {
    // aba anônima / storage bloqueado: seguimos sem rastreio
  }
}

export function consumirOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const pendente = window.sessionStorage.getItem(CHAVE);
    window.sessionStorage.removeItem(CHAVE);
    return pendente !== null;
  } catch {
    return false;
  }
}
