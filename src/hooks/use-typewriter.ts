import { useEffect, useState } from "react";

export const VELOCIDADE_PADRAO_MS = 22;

const PAUSA_PONTUACAO_MS = 220;
const PONTUACAO_PAUSADA = new Set([",", ".", "!", "?", ":", ";", "…", "\n"]);

type Estado = { alvo: string; exibido: string };

function querPausar(caractere: string | undefined): boolean {
  return caractere !== undefined && PONTUACAO_PAUSADA.has(caractere);
}

function prefereMovimentoReduzido(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useTypewriter(
  texto: string,
  ativo = true,
  velocidade: number = VELOCIDADE_PADRAO_MS,
) {
  const [estado, setEstado] = useState<Estado>({ alvo: "", exibido: "" });

  // Reseta durante o render (antes do paint) para o texto do passo anterior
  // não piscar na tela quando a frase muda.
  if (estado.alvo !== texto) {
    setEstado({ alvo: texto, exibido: "" });
  }

  const emDia = estado.alvo === texto;
  const exibido = emDia ? estado.exibido : "";
  const concluido = !ativo || exibido.length >= texto.length;

  useEffect(() => {
    if (!ativo || texto.length === 0) return;

    if (prefereMovimentoReduzido()) {
      setEstado({ alvo: texto, exibido: texto });
      return;
    }

    let cancelado = false;
    let timeoutId: number | undefined;
    let posicao = 0;

    const avancar = () => {
      if (cancelado) return;
      posicao += 1;
      setEstado({ alvo: texto, exibido: texto.slice(0, posicao) });
      if (posicao >= texto.length) return;

      const espera = querPausar(texto[posicao - 1]) ? velocidade + PAUSA_PONTUACAO_MS : velocidade;
      timeoutId = window.setTimeout(avancar, espera);
    };

    timeoutId = window.setTimeout(avancar, velocidade);

    return () => {
      cancelado = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [texto, ativo, velocidade]);

  return { texto: exibido, digitando: !concluido };
}
