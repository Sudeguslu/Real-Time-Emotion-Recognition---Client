"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { emotionsService } from "@/lib/services/emotions";
import type { EmotionLabel } from "@/lib/api/types";
import LiveDashboard from "@/components/Dashboard";

const EMOTION_MAP: Record<string, EmotionLabel> = {
  Mutlu:   "happy",
  Uzgun:   "sad",
  Kizgin:  "angry",
  Saskin:  "surprise",
  Korku:   "fear",
  Igrenme: "disgust",
  Notr:    "neutral",
};

interface Face {
  emotion: string;
  score: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
}

interface Props {
  sessionId: string;
  durationMinutes: number;
  onStop?: () => void;
}

export default function CameraSession({ sessionId, durationMinutes, onStop }: Props) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [faces, setFaces]         = useState<Face[]>([]);
  const [running, setRunning]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const [totalRecords, setTotalRecords] = useState(0);

  const stopCamera = useCallback(() => {
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRunning(false);
    setFaces([]);
    setTimeout(() => onStop?.(), 0);
  }, [onStop]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRemaining(durationMinutes * 60);
      setTotalRecords(0);
      setRunning(true);
      setError(null);
    } catch {
      setError("Kamera erişimi reddedildi.");
    }
  }, [durationMinutes]);

  // Geri sayım
  useEffect(() => {
    if (!running) return;
    countdownRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { stopCamera(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [running, stopCamera]);

  // Kare analizi
  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(async () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);

      const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];

      try {
        const data = await emotionsService.analyzeFrame(base64);
        if (data.faces && data.faces.length > 0) {
          setFaces(data.faces);
          for (const face of data.faces) {
            const mapped = EMOTION_MAP[face.emotion];
            if (mapped) {
              await emotionsService.create({
                emotion: mapped,
                sessionId,
                date: new Date().toISOString(),
              });
              setTotalRecords((n) => n + 1);
            }
          }
        } else {
          setFaces([]);
        }
      } catch (err) {
        console.error("analyzeFrame hatası:", err);
      }
    }, 700);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, sessionId]);

  const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* ── Ana layout: kamera sol, dashboard sağ ── */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* Kamera alanı */}
        <div style={{ flex: "1 1 400px", minWidth: 0 }}>
          <div
            className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-black"
          >
            <video ref={videoRef} className="w-full" muted playsInline />

            {/* Geri sayım */}
            {running && (
              <div className="absolute top-3 right-3 bg-black/60 text-white text-sm font-mono px-2.5 py-1 rounded-md tracking-wider">
                {minutes}:{seconds}
              </div>
            )}

            {/* Canlı göstergesi */}
            {running && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-md">
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#ef4444",
                    display: "inline-block",
                    animation: "ld-blink 1.2s ease-in-out infinite",
                  }}
                />
                <span className="text-red-400 text-xs font-medium">CANLI</span>
              </div>
            )}

            {/* Yüz kutuları */}
            {faces.map((face, i) => (
              <div
                key={i}
                className="absolute border-2 border-green-400 rounded"
                style={{
                  left:   `${(face.bbox.x1 / (videoRef.current?.videoWidth  || 1)) * 100}%`,
                  top:    `${(face.bbox.y1 / (videoRef.current?.videoHeight || 1)) * 100}%`,
                  width:  `${((face.bbox.x2 - face.bbox.x1) / (videoRef.current?.videoWidth  || 1)) * 100}%`,
                  height: `${((face.bbox.y2 - face.bbox.y1) / (videoRef.current?.videoHeight || 1)) * 100}%`,
                }}
              >
                <span className="absolute -top-6 left-0 text-xs font-semibold text-green-400 whitespace-nowrap bg-black/60 px-1 rounded">
                  {face.emotion} {(face.score * 100).toFixed(0)}%
                </span>
              </div>
            ))}

            {/* Kamera kapalıyken placeholder */}
            {!running && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity={0.25}>
                  <rect x="4" y="16" width="48" height="36" rx="6" stroke="white" strokeWidth="2.5"/>
                  <circle cx="28" cy="34" r="10" stroke="white" strokeWidth="2.5"/>
                  <circle cx="28" cy="34" r="4" fill="white" opacity="0.4"/>
                  <path d="M52 22 L60 16 L60 48 L52 42" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
                </svg>
                <p className="text-white/40 text-sm mt-3">Kamera kapalı</p>
              </div>
            )}
          </div>

          {/* Kontrol butonu */}
          <div className="flex gap-3 mt-3">
            {!running ? (
              <button
                onClick={startCamera}
                className="h-9 px-4 text-sm font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:bg-slate-700 dark:hover:bg-zinc-300 transition-colors"
              >
                Kamerayı Başlat
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="h-9 px-4 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Durdur
              </button>
            )}
          </div>
        </div>

        {/* Canlı Dashboard */}
        <LiveDashboard
          faces={faces}
          running={running}
          remaining={remaining}
          totalRecords={totalRecords}
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Global animasyon stili */}
      <style>{`
        @keyframes ld-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        .ld-card {
          background: var(--color-background-primary, #fff);
          border: 0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1));
          border-radius: 12px;
          padding: 14px 16px;
        }
        .ld-card-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          gap: 8px;
        }
        .ld-card-title {
          font-size: 11px;
          font-weight: 500;
          color: var(--color-text-secondary, #64748b);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .ld-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 500;
          color: var(--color-text-success, #16a34a);
          background: var(--color-background-success, #f0fdf4);
          padding: 2px 8px;
          border-radius: 99px;
        }
        .ld-live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--color-text-success, #16a34a);
          animation: ld-blink 1.2s ease-in-out infinite;
        }
        .ld-emotion-icon {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ld-dominant-name {
          font-size: 21px;
          font-weight: 500;
          color: var(--color-text-primary, #0f172a);
          line-height: 1.15;
        }
        .ld-dominant-score {
          font-size: 13px;
          color: var(--color-text-secondary, #64748b);
          margin-top: 2px;
        }
        .ld-bar-row {
          display: grid;
          grid-template-columns: 72px 1fr 34px;
          align-items: center;
          gap: 8px;
        }
        .ld-bar-label {
          font-size: 12px;
          color: var(--color-text-secondary, #64748b);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ld-bar-track {
          height: 6px;
          background: var(--color-background-secondary, #f1f5f9);
          border-radius: 99px;
          overflow: hidden;
        }
        .ld-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.45s cubic-bezier(.4,0,.2,1), background 0.3s;
        }
        .ld-bar-pct {
          font-size: 11px;
          color: var(--color-text-secondary, #64748b);
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .ld-metric-tile {
          background: var(--color-background-secondary, #f8fafc);
          border-radius: 8px;
          padding: 10px 12px;
        }
        .ld-metric-label {
          font-size: 11px;
          color: var(--color-text-secondary, #64748b);
          margin-bottom: 4px;
        }
        .ld-metric-value {
          font-size: 20px;
          font-weight: 500;
          color: var(--color-text-primary, #0f172a);
          font-variant-numeric: tabular-nums;
        }
        .ld-metric-sub {
          font-size: 11px;
          color: var(--color-text-secondary, #64748b);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}