import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Coins } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { PRODUTOS_SHOP, type ProdutoShop } from "@/lib/shop-mock";

const TITULO_SHOP = "floww-shop-titulo";
const LIMITE_VITRINE_PAINEL = 6;

function formatarMoedas(valor: number) {
  return valor.toLocaleString("pt-BR");
}

function CardProduto({
  produto,
  saldo,
  aoSelecionar,
}: {
  produto: ProdutoShop;
  saldo: number;
  aoSelecionar: (produto: ProdutoShop) => void;
}) {
  const esgotado = produto.esgotado || (produto.quantidadeEstoque ?? 0) <= 0;
  const semSaldo = !esgotado && saldo < produto.preco;
  const bloqueado = esgotado || semSaldo;
  const faltam = Math.max(produto.preco - saldo, 0);

  return (
    <article
      className={cn(
        "flex w-full flex-col rounded-xl border border-border bg-background p-4 transition hover:border-brand/30",
        esgotado && "opacity-60",
      )}
    >
      <p className="truncate text-sm font-semibold text-foreground">{produto.nome}</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{produto.descricao}</p>

      <div className="mt-auto flex flex-col gap-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          {esgotado ? (
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Esgotado
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                semSaldo ? "bg-muted text-muted-foreground" : "bg-accent-yellow text-slate-900",
              )}
            >
              <Coins className="size-3 shrink-0" aria-hidden />
              {formatarMoedas(produto.preco)}
            </span>
          )}

          <button
            type="button"
            disabled={bloqueado}
            onClick={() => aoSelecionar(produto)}
            aria-label={`Resgatar ${produto.nome}`}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
              bloqueado
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-[image:var(--gradient-brand)] text-primary-foreground shadow-[var(--shadow-brand)] hover:brightness-110",
            )}
          >
            {esgotado ? "Indisponível" : "Resgatar"}
          </button>
        </div>

        {!esgotado && (
          <p className="text-[0.65rem] font-semibold text-muted-foreground">
            Estoque: {formatarMoedas(produto.quantidadeEstoque ?? 0)} un.
          </p>
        )}

        {semSaldo && (
          <p className="text-[0.65rem] font-semibold text-accent-orange">
            Faltam {formatarMoedas(faltam)} Floww Coins
          </p>
        )}
      </div>
    </article>
  );
}

type LinhaResumoProps = {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  negativo?: boolean;
  className?: string;
};

function LinhaResumo({ rotulo, valor, destaque, negativo, className }: LinhaResumoProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <dt
        className={cn(
          "text-xs",
          destaque ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {rotulo}
      </dt>
      <dd
        className={cn(
          "font-display font-bold",
          destaque ? "text-base" : "text-sm",
          negativo ? "text-destructive" : destaque ? "text-accent-green" : "text-foreground",
        )}
      >
        {valor}
      </dd>
    </div>
  );
}

function ConfirmarResgateDialog({
  produto,
  saldo,
  onConfirmar,
  onCancel,
}: {
  produto: ProdutoShop;
  saldo: number;
  onConfirmar: () => void;
  onCancel: () => void;
}) {
  const saldoFinal = Math.max(saldo - produto.preco, 0);

  return (
    <AlertDialog
      open
      onOpenChange={(aberto) => {
        if (!aberto) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">Confirmar resgate</AlertDialogTitle>
          <AlertDialogDescription>
            Você está a comprar{" "}
            <span className="font-semibold text-accent-gold">{produto.nome}</span>. Está ciente da
            compra?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <dl className="grid gap-2 rounded-xl border border-border bg-accent-soft p-4">
          <LinhaResumo rotulo="Saldo atual" valor={formatarMoedas(saldo)} />
          <LinhaResumo
            rotulo="Valor do item"
            valor={`− ${formatarMoedas(produto.preco)}`}
            negativo
          />
          <LinhaResumo
            rotulo="Saldo final"
            valor={formatarMoedas(saldoFinal)}
            destaque
            className="border-t border-border pt-2"
          />
        </dl>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            className="bg-[image:var(--gradient-brand)] text-primary-foreground hover:brightness-110"
          >
            Confirmar compra
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function FlowwShop({
  saldo,
  aoConfirmarResgate,
}: {
  saldo: number;
  aoConfirmarResgate: (valor: number) => void;
}) {
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoShop | null>(null);

  function confirmarResgate() {
    if (!produtoSelecionado) return;
    aoConfirmarResgate(produtoSelecionado.preco);
    toast.success(`Resgate de "${produtoSelecionado.nome}" confirmado.`);
    setProdutoSelecionado(null);
  }

  return (
    <section aria-labelledby={TITULO_SHOP} className="w-full">
      <h2
        id={TITULO_SHOP}
        className="font-display text-xl font-semibold text-muted-foreground lg:text-right"
      >
        Floww Shop - Vitrine da organização
      </h2>

      <div className="relative mt-4 flex h-full flex-col rounded-2xl bg-accent-soft p-6">
        <span className="pointer-events-none absolute -top-4 left-0 z-10 block h-[139px] w-[238px] overflow-hidden rounded-xl lg:-top-14 lg:-translate-x-1/2">
          <img
            src="/loja.png"
            alt=""
            aria-hidden
            width={1698}
            height={926}
            className="size-full object-cover"
          />
        </span>

        <div className="flex justify-end">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5">
            <Coins className="size-3.5 shrink-0 text-accent-gold" aria-hidden />
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Seu saldo
            </span>
            <span className="font-display text-sm font-bold text-foreground">
              {formatarMoedas(saldo)}
            </span>
          </div>
        </div>

        <ul className="mt-4 grid flex-1 grid-cols-1 content-start gap-3 overflow-hidden sm:grid-cols-2">
          {PRODUTOS_SHOP.slice(0, LIMITE_VITRINE_PAINEL).map((produto) => (
            <li key={produto.id} className="flex">
              <CardProduto produto={produto} saldo={saldo} aoSelecionar={setProdutoSelecionado} />
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-center border-t border-border pt-5">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Ver catálogo
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      {produtoSelecionado && (
        <ConfirmarResgateDialog
          produto={produtoSelecionado}
          saldo={saldo}
          onConfirmar={confirmarResgate}
          onCancel={() => setProdutoSelecionado(null)}
        />
      )}
    </section>
  );
}
