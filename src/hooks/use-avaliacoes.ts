import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyParticipations,
  fetchSelfEvaluation,
  submitSelfEvaluation,
} from "@/services/avaliacoes";
import type {
  PerformanceAssessment,
  AssessmentsResponse,
  SelfEvaluationForm,
  SubmitSelfEvaluationPayload,
} from "@/types/avaliacoes";

export const PARTICIPATIONS_QUERY_KEY = ["avaliacoes", "my-participations"] as const;
export const SELF_EVALUATION_QUERY_KEY = (assessmentId: string) =>
  ["avaliacoes", "self-evaluation", assessmentId] as const;

export function useMyParticipations(params: { page: number; pageSize: number; search: string }) {
  return useQuery<AssessmentsResponse>({
    queryKey: [...PARTICIPATIONS_QUERY_KEY, params],
    queryFn: () =>
      fetchMyParticipations({ page: params.page, limit: params.pageSize, search: params.search }),
    placeholderData: (previousData) => previousData,
  });
}

export function useSelfEvaluation(assessmentId: string, enabled: boolean = true) {
  return useQuery<SelfEvaluationForm | null>({
    queryKey: SELF_EVALUATION_QUERY_KEY(assessmentId),
    queryFn: () => fetchSelfEvaluation(assessmentId),
    enabled: enabled && !!assessmentId,
  });
}

export function useSubmitSelfEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitSelfEvaluationPayload) => submitSelfEvaluation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTICIPATIONS_QUERY_KEY });
    },
  });
}
