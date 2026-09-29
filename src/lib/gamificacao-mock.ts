export type PerfilGamificacao = "Colaborador" | "Gestor";

export type ParticipanteGamificacao = {
  id: string;
  nome: string;
  departamento: string;
  moedas: number;
  perfil: PerfilGamificacao;
};

// Conteúdo de demonstração: atualize estas listas quando a integração estiver disponível.
export const ACOES_GAMIFICACAO = [
  { descricao: "Acesso diário à plataforma", pontos: 100 },
  { descricao: "Alterar Avatar/Foto do perfil (pontuação única)", pontos: 10 },
  { descricao: "Responder Pesquisa de Engajamento", pontos: 200 },
  { descricao: "Responder Pesquisa de Satisfação", pontos: 500 },
  { descricao: "Responder Pesquisa Rápida", pontos: 500 },
  { descricao: "Responder Termômetro de Humor", pontos: 50 },
  { descricao: "Realizar check-in em um Objetivo", pontos: 100 },
  { descricao: "Celebrar", pontos: 10 },
  { descricao: "Enviar Feedback", pontos: 300 },
  { descricao: "Finalizar 1:1", pontos: 200 },
  { descricao: "Plano de Desenvolvimento (PDI) vigente", pontos: 500 },
  { descricao: "Responder uma Super Pesquisa", pontos: 500 },
];

export const PARTICIPANTES_GAMIFICACAO: ParticipanteGamificacao[] = [
  { id: "p-01", nome: "Yasmin Pires", departamento: "RH", moedas: 8420, perfil: "Gestor" },
  { id: "p-02", nome: "Geane Lopes", departamento: "Departamento Contábil", moedas: 8400, perfil: "Colaborador" },
  { id: "p-03", nome: "Olandson Jesus", departamento: "Departamento Qualidade", moedas: 7390, perfil: "Colaborador" },
  { id: "p-04", nome: "Dani Santana", departamento: "Departamento Contábil", moedas: 6160, perfil: "Colaborador" },
  { id: "p-05", nome: "Raydan Santana", departamento: "Departamento Contábil", moedas: 5690, perfil: "Colaborador" },
  { id: "p-06", nome: "Ivani Oliveira", departamento: "Departamento Contábil", moedas: 5620, perfil: "Colaborador" },
  { id: "p-07", nome: "Kaylane Oliveira", departamento: "Departamento Qualidade", moedas: 4830, perfil: "Colaborador" },
  { id: "p-08", nome: "Felipe Gino", departamento: "Departamento Pessoal", moedas: 4650, perfil: "Colaborador" },
  { id: "p-09", nome: "Marina Vasconcelos", departamento: "Departamento Financeiro", moedas: 4320, perfil: "Gestor" },
  { id: "p-10", nome: "Paula Quintanilha", departamento: "Departamento Qualidade", moedas: 3980, perfil: "Gestor" },
  { id: "p-11", nome: "Rafael Uchoa", departamento: "Departamento Contábil", moedas: 3750, perfil: "Gestor" },
  { id: "p-12", nome: "Samira Rezende", departamento: "Recursos Humanos", moedas: 3420, perfil: "Gestor" },
];
