import type {
  PerformanceAssessment,
  AssessmentType,
  DevolutionStatus,
  EvaluatorPairStatus,
  ActionType,
} from "@/types/avaliacoes";

const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString("pt-BR");

export const MOCK_ASSESSMENTS: PerformanceAssessment[] = [
  {
    id: "av-003",
    title: "Avaliação Periódica Semestral - 1º Semestre 2026",
    selfEvaluationDeadline: "2026-07-10T23:59:59.000Z",
    evaluatorsInfo: { totalAssigned: 3, totalCompleted: 2, isNotApplicable: false },
    isSelfEvaluationDone: true,
    isResultPublished: false,
    devolutionStatus: "PENDENTE",
    type: "PERIODICA",
    availableActions: ["VER_RESPOSTAS"],
  },
  {
    id: "av-004",
    title: "Avaliação 360° - Liderança e Competências",
    selfEvaluationDeadline: "2026-06-30T23:59:59.000Z",
    evaluatorsInfo: { totalAssigned: 5, totalCompleted: 5, isNotApplicable: false },
    isSelfEvaluationDone: true,
    isResultPublished: true,
    devolutionStatus: "PENDENTE",
    type: "360",
    availableActions: ["VER_RESPOSTAS", "VER_RESULTADO", "SOLICITAR_DEVOLUTIVA"],
  },
  {
    id: "av-005",
    title: "Avaliação 180° - Feedback de Pares",
    selfEvaluationDeadline: "2026-05-15T23:59:59.000Z",
    evaluatorsInfo: { totalAssigned: 4, totalCompleted: 4, isNotApplicable: false },
    isSelfEvaluationDone: true,
    isResultPublished: true,
    devolutionStatus: "CONCLUIDA",
    type: "180",
    availableActions: ["VER_RESPOSTAS", "VER_RESULTADO"],
  },
  {
    id: "av-006",
    title: "Avaliação Periódica Anual - 2025",
    selfEvaluationDeadline: "2025-12-20T23:59:59.000Z",
    evaluatorsInfo: { totalAssigned: 3, totalCompleted: 3, isNotApplicable: false },
    isSelfEvaluationDone: true,
    isResultPublished: true,
    devolutionStatus: "AGENDADA",
    type: "PERIODICA",
    availableActions: ["VER_RESPOSTAS", "VER_RESULTADO"],
  },
  {
    id: "av-007",
    title: "Avaliação de Experiência - 90 dias (João Silva)",
    selfEvaluationDeadline: "2026-11-01T23:59:59.000Z",
    evaluatorsInfo: { totalAssigned: 0, totalCompleted: 0, isNotApplicable: true },
    isSelfEvaluationDone: false,
    isResultPublished: false,
    devolutionStatus: "PENDENTE",
    type: "EXPERIENCIA_90",
    availableActions: ["RESPONDER"],
  },
  {
    id: "av-008",
    title: "Avaliação 360° - Competências Técnicas",
    selfEvaluationDeadline: "2026-08-15T23:59:59.000Z",
    evaluatorsInfo: { totalAssigned: 6, totalCompleted: 3, isNotApplicable: false },
    isSelfEvaluationDone: true,
    isResultPublished: false,
    devolutionStatus: "PENDENTE",
    type: "360",
    availableActions: ["VER_RESPOSTAS"],
  },
];

export function getMockAssessments(params: { page: number; pageSize: number; search?: string }) {
  const { page, pageSize, search } = params;
  let filtered = [...MOCK_ASSESSMENTS];

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter((a) => a.title.toLowerCase().includes(searchLower));
  }

  const totalRecords = filtered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = filtered.slice(start, end);

  return { data, totalRecords, page, pageSize };
}

export function getMockSelfEvaluationForm(assessmentId: string) {
  const assessment = MOCK_ASSESSMENTS.find((a) => a.id === assessmentId);
  if (!assessment) return null;

  return {
    assessmentId,
    questions: [
      {
        id: "q1",
        text: "Como você avalia seu desempenho geral neste período?",
        type: "SCALE" as const,
        required: true,
      },
      {
        id: "q2",
        text: "Quais foram suas principais conquistas?",
        type: "TEXT" as const,
        required: true,
      },
      {
        id: "q3",
        text: "Quais áreas você identifica para desenvolvimento?",
        type: "TEXT" as const,
        required: false,
      },
      {
        id: "q4",
        text: "Como você classifica sua comunicação com a equipe?",
        type: "SINGLE_CHOICE" as const,
        options: ["Excelente", "Boa", "Regular", "Precisa melhorar"],
        required: true,
      },
      {
        id: "q5",
        text: "Quais competências você mais desenvolveu?",
        type: "MULTIPLE_CHOICE" as const,
        options: [
          "Liderança",
          "Comunicação",
          "Resolução de Problemas",
          "Trabalho em Equipe",
          "Inovação",
          "Organização",
        ],
        required: false,
      },
    ],
  };
}
