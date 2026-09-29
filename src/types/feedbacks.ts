export type FeedbackListType =
  | "received"
  | "sent"
  | "requested_received"
  | "requested_sent";

export interface FeedbackPerson {
  id: string;
  name: string;
  avatarUrl: string;
  department: string;
}

export interface FeedbackReply {
  id: string;
  authorId: string;
  message: string;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  sender: FeedbackPerson;
  receiver: FeedbackPerson;
  createdAt: string;
  message: string;
  skillsRatings?: Record<string, number>;
  replies?: FeedbackReply[];
  status?: "pending" | "accepted" | "declined";
}

export interface FeedbackMetrics {
  totalReceived: number;
  totalSent: number;
  radarData: { category: string; userScore: number; companyAvg: number }[];
  monthlyData: { month: string; sent: number; received: number }[];
}

export interface FeedbackDraft {
  receiverId: string;
  receiverName: string;
  department: string;
  message: string;
}
