import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ConheçaLojaDialog } from "@/components/onboarding/conheca-loja-dialog";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { catalogoJaVisitado, marcarCatalogoVisitado } from "@/lib/onboarding-catalogo";
import { Sidebar } from "@/routes/painel";
import { PRODUTOS_SHOP, type ProdutoShop } from "@/lib/shop-mock";
import { MINHAS_MOEDAS } from "@/lib/ranking-mock";
import { Coins, ShoppingCart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [{ title: "Catálogo — Floww!" }],
  }),
  component: CatalogoPage,
});

type ItemCarrinho = {
  produto: ProdutoShop;
  quantidade: number;
};

function CardProdutoCatalogo({
  produto,
  saldo,
  aoComprar,
  aoAdicionarCarrinho,
}: {
  produto: ProdutoShop;
  saldo: number;
  aoComprar: (produto: ProdutoShop) => void;
  aoAdicionarCarrinho: (produto: ProdutoShop) => void;
}) {
  const esgotado = produto.esgotado || (produto.quantidadeEstoque ?? 0) <= 0;
  const semSaldo = !esgotado && saldo < produto.preco;
  const bloqueado = esgotado || semSaldo;
  const faltam = Math.max(produto.preco - saldo, 0);

  return (
    <article className="product-card h-full rounded-xl border border-border bg-background transition hover:border-brand/30">
      <div className="product-card-header flex w-full items-center justify-center bg-muted/40">
        {produto.imagem ? (
          <img src={produto.imagem} alt={produto.nome} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">Sem imagem</span>
        )}
      </div>

      <div className="product-card-body flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-foreground">{produto.nome}</p>
        <p className="product-description line-clamp-2 text-xs text-muted-foreground">
          {produto.descricao}
        </p>

        <div className="product-card-footer mt-auto flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between gap-2">
            {esgotado ? (
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Esgotado
              </span>
            ) : (
              <span className="text-lg font-display font-bold text-foreground">
                {produto.preco.toLocaleString("pt-BR")} Floww Coins
              </span>
            )}

            <span className="text-xs font-medium text-muted-foreground">
              Estoque: {produto.quantidadeEstoque ?? 0}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={bloqueado}
                onClick={() => aoComprar(produto)}
                className="flex-1"
              >
                Comprar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={esgotado}
                onClick={() => aoAdicionarCarrinho(produto)}
                className="flex-1"
              >
                <ShoppingCart className="mr-1.5 size-3.5" aria-hidden />
                Carrinho
              </Button>
            </div>

            {semSaldo && (
              <p className="text-[0.65rem] font-semibold text-accent-orange">
                Faltam {faltam.toLocaleString("pt-BR")} Floww Coins
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function CatalogoPage() {
  const [conhecaLojaAberto, setConheçaLojaAberto] = useState(false);
  const [saldo, setSaldo] = useState(MINHAS_MOEDAS);
  const [produtos, setProdutos] = useState<ProdutoShop[]>(PRODUTOS_SHOP);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  useEffect(() => {
    if (!catalogoJaVisitado()) setConheçaLojaAberto(true);
  }, []);

  function fecharConheçaLoja() {
    marcarCatalogoVisitado();
    setConheçaLojaAberto(false);
  }

  function comprar(produto: ProdutoShop) {
    if (produto.esgotado || (produto.quantidadeEstoque ?? 0) <= 0 || saldo < produto.preco) {
      return;
    }

    setSaldo((atual) => atual - produto.preco);
    setProdutos((lista) =>
      lista.map((item) =>
        item.id === produto.id
          ? { ...item, quantidadeEstoque: (item.quantidadeEstoque ?? 0) - 1 }
          : item,
      ),
    );

    toast.success(`Compra de "${produto.nome}" realizada com sucesso!`);
  }

  function adicionarAoCarrinho(produto: ProdutoShop) {
    if (produto.esgotado || (produto.quantidadeEstoque ?? 0) <= 0) return;

    setCarrinho((lista) => {
      const existente = lista.find((item) => item.produto.id === produto.id);
      if (existente) {
        return lista.map((item) =>
          item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item,
        );
      }
      return [...lista, { produto, quantidade: 1 }];
    });
  }

  function removerDoCarrinho(produtoId: string) {
    setCarrinho((lista) =>
      lista
        .map((item) =>
          item.produto.id === produtoId ? { ...item, quantidade: item.quantidade - 1 } : item,
        )
        .filter((item) => item.quantidade > 0),
    );
  }

  function calcularTotalCarrinho() {
    return carrinho.reduce((total, item) => total + item.produto.preco * item.quantidade, 0);
  }

  function finalizarCompra() {
    const total = calcularTotalCarrinho();
    if (total > saldo) {
      toast.error("Saldo insuficiente para finalizar a compra.");
      return;
    }

    const produtosSemEstoque: string[] = [];
    const carrinhoAtualizado: ItemCarrinho[] = [];

    carrinho.forEach((item) => {
      const produtoAtual = produtos.find((p) => p.id === item.produto.id);
      if (!produtoAtual || (produtoAtual.quantidadeEstoque ?? 0) < item.quantidade) {
        produtosSemEstoque.push(item.produto.nome);
      } else {
        carrinhoAtualizado.push(item);
      }
    });

    if (produtosSemEstoque.length > 0) {
      toast.error(
        `Estoque insuficiente para: ${produtosSemEstoque.join(", ")}. Remova-os do carrinho.`,
      );
      return;
    }

    carrinhoAtualizado.forEach((item) => {
      setProdutos((lista) =>
        lista.map((p) =>
          p.id === item.produto.id
            ? {
                ...p,
                quantidadeEstoque: (p.quantidadeEstoque ?? 0) - item.quantidade,
              }
            : p,
        ),
      );
    });

    const quantidadeItens = carrinhoAtualizado.reduce((s, i) => s + i.quantidade, 0);
    setSaldo((atual) => atual - total);
    setCarrinho([]);
    setCarrinhoAberto(false);
    toast.success(
      `Compra finalizada! ${quantidadeItens} ${quantidadeItens === 1 ? "item" : "itens"} resgatado${quantidadeItens === 1 ? "" : "s"}.`,
    );
  }

  const quantidadeTotalCarrinho = carrinho.reduce((s, i) => s + i.quantidade, 0);

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end">
          <PerfilFlutuante />
        </div>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold text-foreground">Catálogo</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Confira o que está disponível na loja e troque suas Floww Coins antes que acabe!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="inline-flex items-center gap-2 px-3 py-1.5">
                <Coins className="size-4 text-accent-gold" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Seu saldo
                </span>
                <span className="font-display text-sm font-bold text-foreground">
                  {saldo.toLocaleString("pt-BR")}
                </span>
              </Badge>

              <Sheet open={carrinhoAberto} onOpenChange={setCarrinhoAberto}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <ShoppingCart className="size-4" aria-hidden />
                    {quantidadeTotalCarrinho > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-brand text-[0.65rem] font-bold text-primary-foreground">
                        {quantidadeTotalCarrinho}
                      </span>
                    )}
                    <span className="sr-only">Abrir carrinho</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-sm">
                  <SheetHeader>
                    <SheetTitle>Carrinho de compras</SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 flex flex-1 flex-col gap-4 overflow-y-auto">
                    {carrinho.length === 0 && (
                      <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
                    )}

                    {carrinho.map((item) => (
                      <div
                        key={item.produto.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.produto.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.produto.preco.toLocaleString("pt-BR")} Floww Coins · Qtd: {item.quantidade}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {(item.produto.preco * item.quantidade).toLocaleString("pt-BR")}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removerDoCarrinho(item.produto.id)}
                          >
                            <Trash2 className="size-4 text-destructive" aria-hidden />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {carrinho.length > 0 && (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">Total</span>
                        <span className="font-display text-lg font-bold text-foreground">
                          {calcularTotalCarrinho().toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <Button
                        type="button"
                        className="w-full"
                        onClick={finalizarCompra}
                        disabled={calcularTotalCarrinho() > saldo}
                      >
                        Finalizar compra
                      </Button>
                      {calcularTotalCarrinho() > saldo && (
                        <p className="text-xs font-semibold text-destructive">
                          Saldo insuficiente para finalizar esta compra.
                        </p>
                      )}
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </header>

          <ul className="catalog-grid mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {produtos.map((produto) => (
              <li key={produto.id} className="flex min-w-0">
                <CardProdutoCatalogo
                  produto={produto}
                  saldo={saldo}
                  aoComprar={comprar}
                  aoAdicionarCarrinho={adicionarAoCarrinho}
                />
              </li>
            ))}
          </ul>
        </section>
      </main>
      <ConheçaLojaDialog aberto={conhecaLojaAberto} onFechar={fecharConheçaLoja} />
    </div>
  );
}
