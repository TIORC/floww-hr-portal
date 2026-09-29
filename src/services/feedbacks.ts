import type {
  FeedbackDraft,
  FeedbackItem,
  FeedbackListType,
  FeedbackMetrics,
  FeedbackPerson,
  FeedbackReply,
} from "@/types/feedbacks";

const CURRENT_USER: FeedbackPerson = {
  id: "user-current",
  name: "Você",
  avatarUrl: "",
  department: "Meu departamento",
};

const person = (id: string, name: string, department: string): FeedbackPerson => ({
  id,
  name,
  department,
  avatarUrl: "",
});

const dateAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const feedbackStore: FeedbackItem[] = [
  {
    id: "fb-001",
    sender: person("u-1", "Weldner Silva", "Departamento TI"),
    receiver: CURRENT_USER,
    createdAt: dateAgo(8),
    message:
      "Obrigado pela parceria neste período. Sua proatividade e atenção aos detalhes fizeram diferença para o time e para nossos clientes.",
    skillsRatings: { proatividade: 4.5, cliente: 5, responsabilidade: 4, transparencia: 4.5 },
    replies: [],
  },
  {
    id: "fb-002",
    sender: person("u-2", "Gabriel Costa", "Produto"),
    receiver: CURRENT_USER,
    createdAt: dateAgo(35),
    message:
      "Foi ótimo trabalhar com você na entrega. Você manteve a comunicação transparente e ajudou a equipe a encontrar soluções práticas.",
    skillsRatings: { proatividade: 4, cliente: 4.5, responsabilidade: 5, transparencia: 5 },
    replies: [
      {
        id: "reply-001",
        authorId: CURRENT_USER.id,
        message: "Obrigado pelo retorno, Gabriel! Foi uma ótima parceria.",
        createdAt: dateAgo(34),
      },
    ],
  },
  {
    id: "fb-003",
    sender: person("u-3", "Ana Souza", "Pessoas e Cultura"),
    receiver: CURRENT_USER,
    createdAt: dateAgo(64),
    message:
      "Sua colaboração e responsabilidade foram muito importantes para concluirmos as prioridades do trimestre.",
    skillsRatings: { proatividade: 4, cliente: 4, responsabilidade: 4.5, transparencia: 4 },
    replies: [],
  },
  {
    id: "fb-004",
    sender: CURRENT_USER,
    receiver: person("u-4", "Marcos Lima", "Operações"),
    createdAt: dateAgo(20),
    message: "Marcos, obrigado por compartilhar seu conhecimento e apoiar a integração da equipe.",
    skillsRatings: { proatividade: 5, cliente: 4, responsabilidade: 4.5, transparencia: 4 },
    replies: [],
  },
  {
    id: "req-001",
    sender: person("u-5", "Camila Rocha", "Design"),
    receiver: CURRENT_USER,
    createdAt: dateAgo(4),
    message: "Gostaria de receber seu feedback sobre nossa colaboração no projeto de onboarding.",
    replies: [],
    status: "pending",
  },
  {
    id: "req-002",
    sender: CURRENT_USER,
    receiver: person("u-6", "Bruno Lima", "Engenharia"),
    createdAt: dateAgo(12),
    message: "Você poderia compartilhar um feedback sobre o trabalho conjunto neste mês?",
    replies: [],
    status: "pending",
  },
];

function queryString(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

async function getJson<T>(url: string, fallback: () => T): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao carregar dados (${response.status}).`);
    return (await response.json()) as T;
  } catch (error) {
    if (import.meta.env.DEV) return fallback();
    throw error;
  }
}

async function postJson<T>(url: string, body: unknown, fallback: () => T): Promise<T> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Falha ao salvar dados (${response.status}).`);
    return (await response.json()) as T;
  } catch (error) {
    if (import.meta.env.DEV) return fallback();
    throw error;
  }
}

function withinPeriod(item: FeedbackItem, startDate: string, endDate: string) {
  const createdAt = item.createdAt.slice(0, 10);
  return createdAt >= startDate && createdAt <= endDate;
}

function recordsFor(type: FeedbackListType, startDate: string, endDate: string) {
  return feedbackStore.filter((item) => {
    if (!withinPeriod(item, startDate, endDate)) return false;
    if (type === "received") return item.receiver.id === CURRENT_USER.id && !item.id.startsWith("req-");
    if (type === "sent") return item.sender.id === CURRENT_USER.id && !item.id.startsWith("req-");
    if (type === "requested_received") return item.id.startsWith("req-") && item.receiver.id === CURRENT_USER.id;
    return item.id.startsWith("req-") && item.sender.id === CURRENT_USER.id;
  });
}

export function fetchFeedbackMetrics(startDate: string, endDate: string) {
  const query = queryString({ startDate, endDate });
  return getJson<FeedbackMetrics>(`/api/feedbacks/metrics?${query}`, () => {
    const received = recordsFor("received", startDate, endDate);
    const sent = recordsFor("sent", startDate, endDate);
    const categories = [
      ["Proatividade e Autonomia", "proatividade"],
      ["Encantamento e Foco no Cliente", "cliente"],
      ["Responsabilidade e Produtividade", "responsabilidade"],
      ["Confiabilidade e Transparência", "transparencia"],
    ] as const;
    const radarData = categories.map(([category, key]) => {
      const scores = received
        .map((item) => item.skillsRatings?.[key])
        .filter((score): score is number => typeof score === "number");
      return {
        category,
        userScore: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
        companyAvg: 3.8,
      };
    });
    const months: { month: string; sent: number; received: number }[] = [];
    const cursor = new Date(`${startDate}T12:00:00`);
    const end = new Date(`${endDate}T12:00:00`);
    cursor.setDate(1);
    while (cursor <= end) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const label = `${String(month + 1).padStart(2, "0")}/${year}`;
      months.push({
        month: label,
        sent: sent.filter((item) => {
          const date = new Date(item.createdAt);
          return date.getFullYear() === year && date.getMonth() === month;
        }).length,
        received: received.filter((item) => {
          const date = new Date(item.createdAt);
          return date.getFullYear() === year && date.getMonth() === month;
        }).length,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return { totalReceived: received.length, totalSent: sent.length, radarData, monthlyData: months };
  });
}

export function fetchFeedbacks(
  type: FeedbackListType,
  startDate: string,
  endDate: string,
  search: string,
) {
  const query = queryString({ type, startDate, endDate, search });
  return getJson<FeedbackItem[]>(`/api/feedbacks?${query}`, () => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return recordsFor(type, startDate, endDate).filter((item) => {
      const personToSearch = type.includes("sent") ? item.receiver : item.sender;
      return `${personToSearch.name} ${personToSearch.department}`
        .toLocaleLowerCase()
        .includes(normalizedSearch);
    });
  });
}

export function fetchFeedbackDetail(id: string) {
  return getJson<FeedbackItem>(`/api/feedbacks/${encodeURIComponent(id)}`, () => {
    const item = feedbackStore.find((feedback) => feedback.id === id);
    if (!item) throw new Error("Feedback não encontrado.");
    return item;
  });
}

export function replyToFeedback(id: string, message: string) {
  return postJson<FeedbackReply>(`/api/feedbacks/${encodeURIComponent(id)}/reply`, { message }, () => {
    const item = feedbackStore.find((feedback) => feedback.id === id);
    if (!item) throw new Error("Feedback não encontrado.");
    const reply = { id: `reply-${Date.now()}`, authorId: CURRENT_USER.id, message, createdAt: new Date().toISOString() };
    item.replies = [...(item.replies ?? []), reply];
    return reply;
  });
}

export function sendFeedback(draft: FeedbackDraft) {
  return postJson<FeedbackItem>("/api/feedbacks/send", draft, () => {
    const feedback: FeedbackItem = {
      id: `fb-${Date.now()}`,
      sender: CURRENT_USER,
      receiver: person(draft.receiverId || `person-${Date.now()}`, draft.receiverName, draft.department),
      createdAt: new Date().toISOString(),
      message: draft.message,
      replies: [],
    };
    feedbackStore.unshift(feedback);
    return feedback;
  });
}

export function requestFeedback(draft: FeedbackDraft) {
  return postJson<FeedbackItem>("/api/feedbacks/request", draft, () => {
    const request: FeedbackItem = {
      id: `req-${Date.now()}`,
      sender: CURRENT_USER,
      receiver: person(draft.receiverId || `person-${Date.now()}`, draft.receiverName, draft.department),
      createdAt: new Date().toISOString(),
      message: draft.message,
      replies: [],
      status: "pending",
    };
    feedbackStore.unshift(request);
    return request;
  });
}
