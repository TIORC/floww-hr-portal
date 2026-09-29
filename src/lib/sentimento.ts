export const LIMITE_MOTIVO = 12000;

export const EMOCOES_SENTIMENTO = [
  { id: "muito_triste", rotulo: "Muito triste", imagem: "/Vary_Sad.png" },
  { id: "triste", rotulo: "Triste", imagem: "/sad.png" },
  { id: "neutro", rotulo: "Neutro", imagem: "/Neutral.png" },
  { id: "feliz", rotulo: "Feliz", imagem: "/Happy.png" },
  { id: "muito_feliz", rotulo: "Muito feliz", imagem: "/Very_Happy.png" },
] as const;

export type EmocaoSentimento = (typeof EMOCOES_SENTIMENTO)[number]["id"];

export function isEmocaoSentimento(valor: string): valor is EmocaoSentimento {
  return EMOCOES_SENTIMENTO.some((emocao) => emocao.id === valor);
}

export function getEmocaoSentimento(id: string) {
  return EMOCOES_SENTIMENTO.find((emocao) => emocao.id === id);
}
