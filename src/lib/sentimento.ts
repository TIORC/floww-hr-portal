export const LIMITE_MOTIVO = 12000;

export const EMOCOES_SENTIMENTO = [
  { id: "muito_triste", rotulo: "Muito triste", imagem: "/Very_Sad.png", emoji: "😭" },
  { id: "triste", rotulo: "Triste", imagem: "/sad.png", emoji: "😢" },
  { id: "neutro", rotulo: "Neutro", imagem: "/Neutral.png", emoji: "😐" },
  { id: "feliz", rotulo: "Feliz", imagem: "/Happy.png", emoji: "🙂" },
  { id: "muito_feliz", rotulo: "Muito feliz", imagem: "/Very_Happy.png", emoji: "😄" },
] as const;

export type EmocaoSentimento = (typeof EMOCOES_SENTIMENTO)[number]["id"];

export function isEmocaoSentimento(valor: string): valor is EmocaoSentimento {
  return EMOCOES_SENTIMENTO.some((emocao) => emocao.id === valor);
}

export function getEmocaoSentimento(id: string) {
  return EMOCOES_SENTIMENTO.find((emocao) => emocao.id === id);
}
