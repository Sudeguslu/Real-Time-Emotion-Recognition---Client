import { api } from "@/lib/api/client";
import type { Event, CreateEventBody } from "@/lib/api/types";

export const eventsService = {
  getAll: () => api.get<Event[]>("/events/"),

  getById: (eventId: string) => api.get<Event>(`/events/${eventId}`),

  create: (body: CreateEventBody) => api.post<Event>("/events/", body),

  delete: (eventId: string) => api.delete<void>(`/events/${eventId}`),
};
