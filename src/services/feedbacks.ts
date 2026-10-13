import { supabase } from "@/integrations/supabase/client";
import type {
  FeedbackDraft,
  FeedbackItem,
  FeedbackListType,
  FeedbackMetrics,
} from "@/types/feedbacks";

// Todos os dados vêm do banco. As funções do banco identificam o colaborador logado pelo e-mail da sessão.

export async function fetchFeedbackMetrics(startDate: string, endDate: string) {
  const { data, error } = await supabase.rpc("obter_metricas_feedbacks", {
    p_inicio: startDate,
    p_fim: endDate,
  });
  if (error) throw error;
  return data as unknown as FeedbackMetrics;
}

export async function fetchFeedbacks(
  type: FeedbackListType,
  startDate: string,
  endDate: string,
  search: string,
) {
  const { data, error } = await supabase.rpc("listar_feedbacks", {
    p_tipo: type,
    p_inicio: startDate,
    p_fim: endDate,
    p_busca: search,
  });
  if (error) throw error;
  return (data ?? []) as unknown as FeedbackItem[];
}

export async function fetchFeedbackDetail(id: string) {
  const { data, error } = await supabase.rpc("obter_feedback", { p_id: id });
  if (error) throw error;
  return data as unknown as FeedbackItem;
}

export async function replyToFeedback(id: string, message: string) {
  const { error } = await supabase.rpc("responder_feedback", { p_id: id, p_mensagem: message });
  if (error) throw error;
}

export async function sendFeedback(draft: FeedbackDraft) {
  const { data, error } = await supabase.rpc("enviar_feedback", {
    p_destinatario_id: draft.receiverId,
    p_mensagem: draft.message,
  });
  if (error) throw error;
  return data as string;
}

export async function requestFeedback(draft: FeedbackDraft) {
  const { data, error } = await supabase.rpc("solicitar_feedback", {
    p_destinatario_id: draft.receiverId,
    p_mensagem: draft.message,
  });
  if (error) throw error;
  return data as string;
}
