import type {
  PerformanceAssessment,
  DevolutionStatus,
  EvaluatorPairStatus,
  ActionType,
} from "@/types/avaliacoes";

export function isExpired(deadline: string): boolean {
  return new Date() > new Date(deadline);
}

export function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getEvaluatorsDisplay(evaluatorsInfo: EvaluatorPairStatus): string {
  if (evaluatorsInfo.isNotApplicable) return "N/A";
  return `${evaluatorsInfo.totalCompleted}/${evaluatorsInfo.totalAssigned} concluídos`;
}

export function getEvaluatorsTooltip(evaluatorsInfo: EvaluatorPairStatus): string {
  if (evaluatorsInfo.isNotApplicable)
    return "Esta avaliação não exige avaliadores externos (apenas autoavaliação)";
  return `${evaluatorsInfo.totalCompleted} de ${evaluatorsInfo.totalAssigned} avaliadores já responderam`;
}

export function getResultStatusLabel(assessment: PerformanceAssessment): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (!assessment.isResultPublished) {
    return { label: "Não disponível", variant: "secondary" };
  }

  const statusLabels: Record<DevolutionStatus, string> = {
    PENDENTE: "Devolutiva pendente",
    AGENDADA: "Devolutiva agendada",
    CONCLUIDA: "Devolutiva concluída",
  };

  return {
    label: statusLabels[assessment.devolutionStatus] || assessment.devolutionStatus,
    variant: "default",
  };
}

export function getAvailableActions(assessment: PerformanceAssessment): ActionType[] {
  return assessment.availableActions;
}

export function getActionLabel(action: ActionType): string {
  const labels: Record<ActionType, string> = {
    RESPONDER: "Preencher Autoavaliação",
    VER_RESPOSTAS: "Visualizar Minhas Respostas",
    VER_RESULTADO: "Visualizar Relatório Final",
    SOLICITAR_DEVOLUTIVA: "Agendar/Ver Devolutiva",
  };
  return labels[action];
}

export function getTypeLabel(type: PerformanceAssessment["type"]): string {
  const labels: Record<PerformanceAssessment["type"], string> = {
    EXPERIENCIA_45: "Experiência 45 dias",
    EXPERIENCIA_90: "Experiência 90 dias",
    PERIODICA: "Periódica",
    "360": "360°",
    "180": "180°",
  };
  return labels[type];
}

export function getDeadlineStatus(assessment: PerformanceAssessment): {
  text: string;
  isExpired: boolean;
} {
  const expired = isExpired(assessment.selfEvaluationDeadline) && !assessment.isSelfEvaluationDone;
  if (expired) return { text: "Expirado", isExpired: true };
  if (assessment.isSelfEvaluationDone) return { text: "Concluído", isExpired: false };
  return { text: formatDeadline(assessment.selfEvaluationDeadline), isExpired: false };
}
