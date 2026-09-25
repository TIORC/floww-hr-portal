type Saudacao = "Bom dia" | "Boa tarde" | "Boa noite";

function horaLocal(date: Date): number {
  return date.getHours();
}

export function getSaudacao(date: Date = new Date()): Saudacao {
  const hora = horaLocal(date);

  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

function capitalizar(valor: string): string {
  return valor.charAt(0).toLocaleUpperCase("pt-BR") + valor.slice(1);
}

export function getNomeESobrenome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeiro = partes[0];
  if (!primeiro) return "";

  const ultimo = partes.length > 1 ? partes[partes.length - 1] : undefined;
  if (!ultimo) return capitalizar(primeiro);

  return `${capitalizar(primeiro)} ${capitalizar(ultimo)}`;
}

export function montarSaudacao(nome: string, date: Date = new Date()): string {
  const nomeESobrenome = getNomeESobrenome(nome);
  return nomeESobrenome ? `${getSaudacao(date)}, ${nomeESobrenome}` : getSaudacao(date);
}
