import { api } from "@/lib/api/client";
import type {
  EventSession,
  CreateEventSessionBody,
  UpdateSessionDurationBody,
} from "@/lib/api/types";

export const eventSessionsService = {
  getByEvent: (eventId: string) =>
    api.get<EventSession[]>(`/event-sessions/by-event/${eventId}`),

  getById: (sessionId: string) =>
    api.get<EventSession>(`/event-sessions/${sessionId}`),

  create: (body: CreateEventSessionBody) =>
    api.post<EventSession>("/event-sessions/", body),

  updateDuration: (sessionId: string, body: UpdateSessionDurationBody) =>
    api.put<EventSession>(`/event-sessions/${sessionId}/duration`, body),

  delete: (sessionId: string) =>
    api.delete<void>(`/event-sessions/${sessionId}`),
};
