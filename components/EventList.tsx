"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import CreateEventModal from "@/components/CreateEventModal";
import { eventsService } from "@/lib/services/events";
import type { Event } from "@/lib/api/types";

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    eventsService.getAll().then(setEvents).finally(() => setLoading(false));
  }, []);

  function handleCreated(event: Event) {
    setEvents((prev) => [...prev, event]);
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 px-6 py-8 max-w-4xl w-full mx-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <span className="text-sm text-slate-400 dark:text-zinc-500">Yükleniyor...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-sm text-slate-400 dark:text-zinc-500 mb-4">Henüz event yok</p>
            <button
              onClick={() => setModalOpen(true)}
              className="h-9 px-4 text-sm font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:bg-slate-700 dark:hover:bg-zinc-300 transition-colors"
            >
              Event Tanımla
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Eventler</h1>
                <span className="text-slate-300 dark:text-zinc-700 font-light select-none">|</span>
                <span className="text-sm text-slate-400 dark:text-zinc-500">{events.length} kayıt</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="h-8 px-3 text-sm font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:bg-slate-700 dark:hover:bg-zinc-300 transition-colors"
                >
                  Event Tanımla
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="flex items-center justify-between w-full px-4 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-left hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-sm dark:hover:shadow-none transition-all"
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                    {event.eventName}
                  </span>
                  <svg className="w-4 h-4 text-slate-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      <CreateEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
