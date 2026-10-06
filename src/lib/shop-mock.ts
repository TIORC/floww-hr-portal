export type CategoriaShop = "vantagem" | "produto" | "experiencia";

export type ProdutoShop = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: CategoriaShop;
  esgotado?: boolean;
  quantidadeEstoque?: number;
  imagem?: string;
};

export const PRODUTOS_SHOP: ProdutoShop[] = [
  {
    id: "shop-01",
    nome: "Camiseta Floww!",
    descricao: "Camiseta oficial da Floww!, do tamanho P ao GG.",
    preco: 400,
    categoria: "produto",
    quantidadeEstoque: 25,
    imagem: "https://placehold.co/400x300/111827/FFF?text=Camiseta+Floww!",
  },
  {
    id: "shop-02",
    nome: "Vale-compras",
    descricao: "Vale de R$ 100 para usar onde quiser.",
    preco: 1200,
    categoria: "vantagem",
    quantidadeEstoque: 50,
    imagem: "https://placehold.co/400x300/065f46/FFF?text=Vale-compras",
  },
  {
    id: "shop-03",
    nome: "Workshop de trilha",
    descricao: "Vaga em um dos workshops de desenvolvimento da Floww.",
    preco: 3000,
    categoria: "experiencia",
    quantidadeEstoque: 15,
    imagem: "https://placehold.co/400x300/1e3a8a/FFF?text=Workshop",
  },
  {
    id: "shop-04",
    nome: "Cadeira ergonômica",
    descricao: "Home office com cadeira ergonômica para o seu cantinho.",
    preco: 5500,
    categoria: "produto",
    esgotado: true,
    quantidadeEstoque: 0,
    imagem: "https://placehold.co/400x300/111827/FFF?text=Cadeira",
  },
  {
    id: "shop-05",
    nome: "Headset sem fio",
    descricao: "Headset com cancelamento de ruído para reuniões.",
    preco: 2500,
    categoria: "produto",
    quantidadeEstoque: 20,
    imagem: "https://placehold.co/400x300/111827/FFF?text=Headset",
  },
  {
    id: "shop-06",
    nome: "Mochila corporativa",
    descricao: "Mochila resistente para notebook e documentos.",
    preco: 800,
    categoria: "produto",
    quantidadeEstoque: 35,
    imagem: "https://placehold.co/400x300/111827/FFF?text=Mochila",
  },
  {
    id: "shop-07",
    nome: "Vale-refeição extra",
    descricao: "Crédito adicional para alimentação.",
    preco: 600,
    categoria: "vantagem",
    quantidadeEstoque: 100,
    imagem: "https://placehold.co/400x300/065f46/FFF?text=Vale-refeicao",
  },
  {
    id: "shop-08",
    nome: "Curso online",
    descricao: "Acesso a curso profissionalizante parceiro.",
    preco: 1800,
    categoria: "experiencia",
    quantidadeEstoque: 40,
    imagem: "https://placehold.co/400x300/1e3a8a/FFF?text=Curso+online",
  },
  {
    id: "shop-09",
    nome: "Garrafa térmica",
    descricao: "Garrafa inox com personalização Floww!.",
    preco: 350,
    categoria: "produto",
    quantidadeEstoque: 60,
    imagem: "https://placehold.co/400x300/111827/FFF?text=Garrafa",
  },
  {
    id: "shop-10",
    nome: "Day off remunerado",
    descricao: "Um dia de folga remunerada para usar quando quiser.",
    preco: 4500,
    categoria: "vantagem",
    quantidadeEstoque: 10,
    imagem: "https://placehold.co/400x300/065f46/FFF?text=Day+off",
  },
  {
    id: "shop-11",
    nome: "Notebook stand",
    descricao: "Suporte de notebook ajustável para home office.",
    preco: 900,
    categoria: "produto",
    quantidadeEstoque: 18,
    imagem: "https://placehold.co/400x300/111827/FFF?text=Notebook+stand",
  },
  {
    id: "shop-12",
    nome: "Vale-cinema",
    descricao: "Ingresso padrão para sessões 2D.",
    preco: 500,
    categoria: "vantagem",
    quantidadeEstoque: 80,
    imagem: "https://placehold.co/400x300/065f46/FFF?text=Vale-cinema",
  },
  {
    id: "shop-13",
    nome: "Passeio turístico",
    descricao: "Passeio guiado para equipes.",
    preco: 2200,
    categoria: "experiencia",
    quantidadeEstoque: 12,
    imagem: "https://placehold.co/400x300/1e3a8a/FFF?text=Passeio",
  },
  {
    id: "shop-14",
    nome: "Fone de ouvido",
    descricao: "Fone Bluetooth com microfone integrado.",
    preco: 1500,
    categoria: "produto",
    quantidadeEstoque: 22,
    imagem: "https://placehold.co/400x300/111827/FFF?text=Fone+de+ouvido",
  },
];
