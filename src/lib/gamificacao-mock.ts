// Tabela de pontuação por ação. O ranking e os saldos vêm do banco (ver hooks/use-floww-coins.ts).
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
