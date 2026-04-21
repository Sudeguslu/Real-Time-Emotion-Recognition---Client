import { api } from "@/lib/api/client";
import type { Emotion, EmotionCount, CreateEmotionBody } from "@/lib/api/types";

export const emotionsService = {
  getBySession: (sessionId: string) =>
    api.get<Emotion[]>(`/emotions/by-session/${sessionId}`),

  getCountBySession: (sessionId: string) =>
    api.get<EmotionCount[]>(`/emotions/count/${sessionId}`),

  create: (body: CreateEmotionBody) => api.post<Emotion>("/emotions/", body),

  deleteBySession: (sessionId: string) =>
    api.delete<void>(`/emotions/by-session/${sessionId}`),
};
