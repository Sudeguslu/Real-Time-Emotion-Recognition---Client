import { api } from "@/lib/api/client";
import type { Log, CreateLogBody } from "@/lib/api/types";

export const logsService = {
  getAll: (limit?: number) => {
    const query = limit !== undefined ? `?limit=${limit}` : "";
    return api.get<Log[]>(`/logs/${query}`);
  },

  getById: (logId: string) => api.get<Log>(`/logs/${logId}`),

  create: (body: CreateLogBody) => api.post<Log>("/logs/", body),
};
