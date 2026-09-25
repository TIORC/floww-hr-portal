export type EntradaRanking = {
  id: string;
  nome: string;
  moedas: number;
};

export const MINHAS_MOEDAS = 1240;

export const RANKING_COLABORADORES: EntradaRanking[] = [
  { id: "col-01", nome: "Ana Souza", moedas: 1180 },
  { id: "col-02", nome: "Bruno Lima", moedas: 1095 },
  { id: "col-03", nome: "Camila Rocha", moedas: 980 },
  { id: "col-04", nome: "Diego Alencar", moedas: 905 },
  { id: "col-05", nome: "Elisa Tavares", moedas: 860 },
  { id: "col-06", nome: "Felipe Andrade", moedas: 790 },
  { id: "col-07", nome: "Gabriela Menezes", moedas: 745 },
  { id: "col-08", nome: "Henrique Barros", moedas: 690 },
  { id: "col-09", nome: "Isabela Fontes", moedas: 655 },
  { id: "col-10", nome: "Juliana Prado", moedas: 620 },
];

export const RANKING_GESTORES: EntradaRanking[] = [
  { id: "ges-01", nome: "Marina Vasconcelos", moedas: 1420 },
  { id: "ges-02", nome: "Otávio Bittencourt", moedas: 1310 },
  { id: "ges-03", nome: "Paula Quintanilha", moedas: 1255 },
  { id: "ges-04", nome: "Rafael Uchoa", moedas: 1180 },
  { id: "ges-05", nome: "Samira Rezende", moedas: 1120 },
  { id: "ges-06", nome: "Thiago Montenegro", moedas: 1050 },
  { id: "ges-07", nome: "Vanessa Ferraz", moedas: 970 },
  { id: "ges-08", nome: "Wesley Damásio", moedas: 905 },
  { id: "ges-09", nome: "Yasmim Correia", moedas: 860 },
  { id: "ges-10", nome: "Zilda Barbosa", moedas: 810 },
];
