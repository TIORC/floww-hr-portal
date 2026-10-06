import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTypewriter } from "@/hooks/use-typewriter";

const TEXTO =
  "E essa é a vitrine da sua loja. Aqui você pode saber o que está sendo vendido dentro da plataforma! Vamos lá, explore! Só não entre em desespero querendo pegar tudo de uma vez kkk";

export function ConheçaLojaDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { texto: exibido, digitando } = useTypewriter(TEXTO, aberto);

  return (
    <Dialog open={aberto} onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-y-auto border-none p-11 pb-0 sm:max-w-[760px] [&>button:last-child]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Conheça a vitrine da loja</DialogTitle>
        <DialogDescription className="sr-only">
          A vitrine da loja mostra o que está sendo vendido dentro da plataforma.
        </DialogDescription>

        <div className="brand-message">
          <div className="relative rounded-2xl rounded-bl-sm bg-white px-10 py-7 shadow-lg ring-1 ring-black/5">
            <p className="sr-only">{TEXTO}</p>
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
            src="/loja.png"
            alt=""
            aria-hidden
            width={1698}
            height={926}
            className="brand-wave -ml-11 mt-6 w-full max-w-[30.8rem] rounded-2xl object-contain"
          />
        </div>

        <footer className="flex justify-end pb-11 pt-7 sm:pb-14">
          <Button
            size="lg"
            className="h-[68px] bg-amber-400 px-14 text-xl text-slate-900 shadow hover:bg-amber-500"
            disabled={digitando}
            onClick={onFechar}
          >
            Vamos lá!
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
