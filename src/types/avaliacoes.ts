export type AssessmentType = "EXPERIENCIA_45" | "EXPERIENCIA_90" | "PERIODICA" | "360" | "180";
export type DevolutionStatus = "PENDENTE" | "AGENDADA" | "CONCLUIDA";
export type ActionType = "RESPONDER" | "VER_RESPOSTAS" | "VER_RESULTADO" | "SOLICITAR_DEVOLUTIVA";

export interface EvaluatorPairStatus {
  totalAssigned: number;
  totalCompleted: number;
  isNotApplicable: boolean;
}

export interface PerformanceAssessment {
  id: string;
  title: string;
  selfEvaluationDeadline: string;
  evaluatorsInfo: EvaluatorPairStatus;
  isSelfEvaluationDone: boolean;
  isResultPublished: boolean;
  devolutionStatus: DevolutionStatus;
  type: AssessmentType;
  availableActions: ActionType[];
}

export interface AssessmentsResponse {
  data: PerformanceAssessment[];
  totalRecords: number;
  page: number;
  pageSize: number;
}

export interface SelfEvaluationForm {
  assessmentId: string;
  questions: {
    id: string;
    text: string;
    type: "TEXT" | "SCALE" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
    options?: string[];
    required: boolean;
  }[];
}

export interface SubmitSelfEvaluationPayload {
  assessmentId: string;
  answers: Record<string, string | number | string[]>;
}
