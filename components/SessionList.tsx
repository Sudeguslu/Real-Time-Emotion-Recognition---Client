"use client";
import CameraSession from "@/components/CameraSession";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CreateSessionModal from "@/components/CreateSessionModal";
import { eventsService } from "@/lib/services/events";
import { eventSessionsService } from "@/lib/services/eventSessions";
import type { Event, EventSession } from "@/lib/api/types";

interface Props {
  eventId: string;
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionList({ eventId }: Props) {
  const [event, setEvent] = useState<Event | null>(null);
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [durationInput, setDurationInput] = useState("");
  const [durationError, setDurationError] = useState<string | null>(null);
  const [activeDuration, setActiveDuration] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      eventsService.getById(eventId),
      eventSessionsService.getByEvent(eventId),
    ])
      .then(([ev, sess]) => {
        setEvent(ev);
        setSessions(sess);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  function handleCreated() {
    eventSessionsService.getByEvent(eventId).then(setSessions);
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm("Bu session'ı silmek istediğine emin misin?")) return;
    setDeletingSessionId(sessionId);
    try {
      await eventSessionsService.delete(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) setActiveSessionId(null);
    } catch (err) {
      console.error(err);
      alert("Silme işlemi başarısız oldu.");
    } finally {
      setDeletingSessionId(null);
    }
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 px-6 py-8 max-w-4xl w-full mx-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <span className="text-sm text-slate-400 dark:text-zinc-500">Yükleniyor...</span>
          </div>
        ) : !event ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-sm text-slate-400 dark:text-zinc-500 mb-4">Event bulunamadı</p>
            <Link href="/" className="text-sm font-medium text-slate-900 dark:text-zinc-100 hover:underline">
              Geri dön
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/" className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">
                Eventler
              </Link>
              <span className="text-xs text-slate-300 dark:text-zinc-700">/</span>
              <span className="text-xs text-slate-600 dark:text-zinc-400">{event.eventName}</span>
            </div>

            <div className="flex items-center justify-between mt-4 mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">{event.eventName}</h1>
                {sessions.length > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-zinc-700 font-light select-none">|</span>
                    <span className="text-sm text-slate-400 dark:text-zinc-500">{sessions.length} session</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="h-8 px-3 text-sm font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:bg-slate-700 dark:hover:bg-zinc-300 transition-colors"
                >
                  Session Oluştur
                </button>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh]">
                <p className="text-sm text-slate-400 dark:text-zinc-500 mb-4">Bu event için henüz session yok</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="h-9 px-4 text-sm font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:bg-slate-700 dark:hover:bg-zinc-300 transition-colors"
                >
                  Session Oluştur
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between px-4 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                        {session.sessionName}
                      </span>
                      {session.date && (
                        <span className="text-xs text-slate-400 dark:text-zinc-500">
                          {formatDate(session.date)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={deletingSessionId === session.id}
                        className="h-8 px-2.5 text-xs font-medium border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-40"
                      >
                        {deletingSessionId === session.id ? "Siliniyor..." : "Sil"}
                      </button>
                      <button
                        onClick={() => {
                          setPendingSessionId(session.id);
                          setDurationInput("");
                          setDurationError(null);
                          setDurationModalOpen(true);
                        }}
                        className="h-8 px-3 text-xs font-medium border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Başlat
                      </button>
                    </div>
                  </div>
                ))}

                {activeSessionId && (
  <div className="mt-6">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
        Aktif Session: {sessions.find((s) => s.id === activeSessionId)?.sessionName}
      </span>
      <button
        onClick={() => setActiveSessionId(null)}
        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
      >
        Kapat
      </button>
    </div>
    <CameraSession
      sessionId={activeSessionId}
      durationMinutes={activeDuration}
      onStop={() => setActiveSessionId(null)}
    />
  </div>
)}
              </div>
            )}
          </>
        )}
      </main>
{durationModalOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    onClick={() => setDurationModalOpen(false)}
  >
    <div
      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-lg w-full max-w-sm p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100 mb-4">
        Süre Belirle
      </h2>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
            Çalışma Süresi (dakika)
          </label>
          <input
            type="number"
            min={1}
            value={durationInput}
            onChange={(e) => {
              setDurationInput(e.target.value);
              setDurationError(null);
            }}
            placeholder="örn. 30"
            className="h-9 px-3 text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 rounded-md outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder-slate-400 dark:placeholder-zinc-600 transition-colors"
            autoFocus
          />
          {durationError && (
            <p className="text-xs text-red-500">{durationError}</p>
          )}
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={() => setDurationModalOpen(false)}
            className="h-9 px-4 text-sm font-medium text-slate-600 dark:text-zinc-400 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => {
              const val = parseInt(durationInput);
              if (!durationInput || isNaN(val) || val < 1) {
                setDurationError("Lütfen geçerli bir dakika girin.");
                return;
              }
              setActiveDuration(val);
              setActiveSessionId(pendingSessionId);
              setDurationModalOpen(false);
            }}
            className="h-9 px-4 text-sm font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:bg-slate-700 dark:hover:bg-zinc-300 transition-colors"
          >
            Başlat
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      {event && (
        <CreateSessionModal
          open={modalOpen}
          eventId={event.id}
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}