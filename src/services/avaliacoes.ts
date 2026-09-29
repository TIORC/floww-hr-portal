import type {
  PerformanceAssessment,
  AssessmentsResponse,
  SelfEvaluationForm,
  SubmitSelfEvaluationPayload,
} from "@/types/avaliacoes";
import { getMockAssessments, getMockSelfEvaluationForm } from "@/lib/avaliacoes-mock";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchMyParticipations(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<AssessmentsResponse> {
  await delay(500);
  return getMockAssessments({
    page: params.page,
    pageSize: params.limit,
    search: params.search ?? "",
  });
}

export async function fetchSelfEvaluation(
  assessmentId: string,
): Promise<SelfEvaluationForm | null> {
  await delay(300);
  return getMockSelfEvaluationForm(assessmentId);
}

export async function submitSelfEvaluation(payload: SubmitSelfEvaluationPayload): Promise<void> {
  await delay(800);
  console.log("Submitting self-evaluation:", payload);
  return;
}
