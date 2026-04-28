"use client";

import { useState, useRef, useEffect } from "react";
import { eventsService } from "@/lib/services/events";
import type { Event } from "@/lib/api/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateEventModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await eventsService.create({ eventName: name.trim() });
      onCreated();
      onClose();
    } catch {
      setError("Event oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100 mb-4">
          Yeni Event
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
              Event Adı
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Konferans 2025"
              className="h-9 px-3 text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 rounded-md outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder-slate-400 dark:placeholder-zinc-600 transition-colors"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-sm font-medium text-slate-600 dark:text-zinc-400 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-9 px-4 text-sm font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:bg-slate-700 dark:hover:bg-zinc-300 disabled:opacity-40 transition-colors"
            >
              {loading ? "Oluşturuluyor..." : "Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
