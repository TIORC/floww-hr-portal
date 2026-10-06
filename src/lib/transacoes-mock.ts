export type TipoTransacao = "entrada" | "saida";

export type TransacaoShop = {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  data: string;
  produtoId?: string;
  produtoNome?: string;
};

export const TRANSACOES_SHOP: TransacaoShop[] = [
  {
    id: "txn-01",
    tipo: "entrada",
    descricao: "Bônus de boas-vindas",
    valor: 1000,
    data: "2025-01-15T09:30:00Z",
  },
  {
    id: "txn-02",
    tipo: "entrada",
    descricao: "Acesso diário à plataforma (7 dias)",
    valor: 700,
    data: "2025-01-20T08:15:00Z",
  },
  {
    id: "txn-03",
    tipo: "saida",
    descricao: "Compra: Camiseta Floww!",
    valor: 400,
    data: "2025-01-22T14:45:00Z",
    produtoId: "shop-01",
    produtoNome: "Camiseta Floww!",
  },
  {
    id: "txn-04",
    tipo: "entrada",
    descricao: "Responder Pesquisa de Engajamento",
    valor: 200,
    data: "2025-02-05T11:20:00Z",
  },
  {
    id: "txn-05",
    tipo: "saida",
    descricao: "Compra: Garrafa térmica",
    valor: 350,
    data: "2025-02-10T16:30:00Z",
    produtoId: "shop-09",
    produtoNome: "Garrafa térmica",
  },
  {
    id: "txn-06",
    tipo: "entrada",
    descricao: "Responder Termômetro de Humor (10x)",
    valor: 500,
    data: "2025-02-18T09:00:00Z",
  },
  {
    id: "txn-07",
    tipo: "saida",
    descricao: "Compra: Vale-cinema",
    valor: 500,
    data: "2025-02-25T18:10:00Z",
    produtoId: "shop-12",
    produtoNome: "Vale-cinema",
  },
  {
    id: "txn-08",
    tipo: "entrada",
    descricao: "Enviar Feedback",
    valor: 300,
    data: "2025-03-03T10:45:00Z",
  },
  {
    id: "txn-09",
    tipo: "entrada",
    descricao: "Finalizar 1:1",
    valor: 200,
    data: "2025-03-10T15:20:00Z",
  },
  {
    id: "txn-10",
    tipo: "saida",
    descricao: "Compra: Fone de ouvido",
    valor: 1500,
    data: "2025-03-15T12:00:00Z",
    produtoId: "shop-14",
    produtoNome: "Fone de ouvido",
  },
  {
    id: "txn-11",
    tipo: "entrada",
    descricao: "Plano de Desenvolvimento (PDI) vigente",
    valor: 500,
    data: "2025-03-20T14:30:00Z",
  },
  {
    id: "txn-12",
    tipo: "saida",
    descricao: "Compra: Mochila corporativa",
    valor: 800,
    data: "2025-03-28T11:15:00Z",
    produtoId: "shop-06",
    produtoNome: "Mochila corporativa",
  },
  {
    id: "txn-13",
    tipo: "entrada",
    descricao: "Responder Pesquisa de Satisfação",
    valor: 500,
    data: "2025-04-02T09:40:00Z",
  },
  {
    id: "txn-14",
    tipo: "saida",
    descricao: "Compra: Notebook stand",
    valor: 900,
    data: "2025-04-10T13:55:00Z",
    produtoId: "shop-11",
    produtoNome: "Notebook stand",
  },
  {
    id: "txn-15",
    tipo: "entrada",
    descricao: "Acesso diário à plataforma (30 dias)",
    valor: 3000,
    data: "2025-04-15T08:00:00Z",
  },
  {
    id: "txn-16",
    tipo: "saida",
    descricao: "Compra: Vale-refeição extra",
    valor: 600,
    data: "2025-04-22T17:25:00Z",
    produtoId: "shop-07",
    produtoNome: "Vale-refeição extra",
  },
  {
    id: "txn-17",
    tipo: "entrada",
    descricao: "Celebrar (5x)",
    valor: 50,
    data: "2025-05-01T10:10:00Z",
  },
  {
    id: "txn-18",
    tipo: "saida",
    descricao: "Compra: Headset sem fio",
    valor: 2500,
    data: "2025-05-08T15:40:00Z",
    produtoId: "shop-05",
    produtoNome: "Headset sem fio",
  },
];

export function getTotalEntradas(): number {
  return TRANSACOES_SHOP.filter((t) => t.tipo === "entrada").reduce((sum, t) => sum + t.valor, 0);
}

export function getTotalSaidas(): number {
  return TRANSACOES_SHOP.filter((t) => t.tipo === "saida").reduce((sum, t) => sum + t.valor, 0);
}

export function getSaldoAtual(): number {
  return getTotalEntradas() - getTotalSaidas();
}