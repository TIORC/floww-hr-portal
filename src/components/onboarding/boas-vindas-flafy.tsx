import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { usePerfil } from "@/hooks/use-perfil";
import { useTypewriter } from "@/hooks/use-typewriter";
import { getNomeESobrenome } from "@/lib/greeting";
import { cn } from "@/lib/utils";

const ETAPAS = [
  {
    imagem: "/and2.png",
    rotuloBotao: "Continuar",
    texto: (nome: string) =>
      nome
        ? `Vivaaa! Você entrou! Seja bem-vindo(a), ${nome}! Eu me chamo Flafy, a inteligência artificial do seu sistema de gestão de RH Floww!`
        : "Vivaaa! Você entrou! Seja bem-vindo(a)! Eu me chamo Flafy, a inteligência artificial do seu sistema de gestão de RH Floww!",
  },
  {
    imagem: "/and.png",
    rotuloBotao: "Começar a explorar!",
    texto: () =>
      "No momento ainda estamos em fase de desenvolvimento do sistema... Mas você está convidado a explorar a plataforma mesmo assim, viu? :3 Qualquer coisa, eu estou ali no cantinho direito da página... dormindo 😴",
  },
] as const;

type Passo = 0 | 1;

function primeiroNome(nome: string): string {
  return getNomeESobrenome(nome).split(" ")[0] ?? "";
}

type BalãoFlafyProps = {
  etapa: (typeof ETAPAS)[Passo];
  nome: string;
  exibido: string;
};

function BalãoFlafy({ etapa, nome, exibido }: BalãoFlafyProps) {
  const fraseCompleta = etapa.texto(nome);

  return (
    <div className="brand-message">
      <div className="relative rounded-2xl rounded-bl-sm bg-white px-10 py-7 shadow-lg ring-1 ring-black/5">
        <p className="sr-only">{fraseCompleta}</p>
        <p aria-hidden="true" className="text-xl leading-relaxed text-slate-700 sm:text-[28px]">
          {exibido}
          <span className="brand-caret ml-0.5 text-amber-400">▌</span>
        </p>
        <span
          aria-hidden
          className="absolute -bottom-3 left-[50px] size-[22px] rotate-45 bg-white ring-1 ring-black/5"
        />
      </div>
      <img
        src={etapa.imagem}
        alt=""
        aria-hidden
        className="brand-wave -mt-6 ml-10 h-auto w-105 max-w-[70%] object-contain object-bottom drop-shadow-lg"
      />
    </div>
  );
}

export function BoasVindasFlafy({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const [passo, setPasso] = useState<Passo>(0);
  const { data: perfil, isPending } = usePerfil();

  const etapa = ETAPAS[passo];
  const nome = primeiroNome(perfil?.nome ?? "");
  const { texto: exibido, digitando } = useTypewriter(etapa.texto(nome), !isPending);
  const bloqueado = digitando;

  function avancar() {
    if (bloqueado) return;
    if (passo === 0) {
      setPasso(1);
      return;
    }
    setPasso(0);
    onFechar();
  }

  return (
    <Dialog open={aberto} onOpenChange={passo === 0 ? () => {} : onFechar}>
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-y-auto border-none p-11 pb-0 sm:max-w-[940px] [&>button:last-child]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Boas-vindas da Flafy</DialogTitle>
        <DialogDescription className="sr-only">
          A Flafy dá as boas-vindas e avisa que o sistema ainda está em fase de desenvolvimento.
        </DialogDescription>

        <div key={passo}>
          <BalãoFlafy etapa={etapa} nome={nome} exibido={exibido} />
        </div>

        <footer className="flex items-center justify-between gap-4 pb-11 pt-7 sm:pb-14">
          <ol aria-label="Etapas da apresentação" className="flex items-center gap-1.5">
            {ETAPAS.map((item, indice) => (
              <li
                key={item.rotuloBotao}
                aria-current={indice === passo ? "step" : undefined}
                className={cn(
                  "h-3.5 rounded-full transition-all",
                  indice === passo ? "w-11 bg-amber-400" : "w-3.5 bg-border",
                )}
              />
            ))}
          </ol>
          <Button
            size="lg"
            className="h-[68px] bg-amber-400 px-14 text-xl text-slate-900 shadow hover:bg-amber-500"
            disabled={bloqueado}
            onClick={avancar}
          >
            {etapa.rotuloBotao}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
