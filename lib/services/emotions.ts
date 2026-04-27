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

  analyzeFrame: (base64Frame: string) =>
    api.post<{ faces: { emotion: string; score: number; bbox: { x1: number; y1: number; x2: number; y2: number } }[] }>(
      "/emotions/analyze-frame",
      { frame: base64Frame }
    ),
};
