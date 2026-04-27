"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { emotionsService } from "@/lib/services/emotions";
import type { EmotionLabel } from "@/lib/api/types";

const EMOTION_MAP: Record<string, EmotionLabel> = {
  Mutlu: "happy",
  Uzgun: "sad",
  Kizgin: "angry",
  Saskin: "surprise",
  Korku: "fear",
  Igrenme: "disgust",
  Notr: "neutral",
};

interface Face {
  emotion: string;
  score: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
}

interface Props {
  sessionId: string;
  onStop?: () => void;
}

export default function CameraSession({ sessionId, onStop }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [faces, setFaces]     = useState<Face[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRunning(true);
      setError(null);
    } catch {
      setError("Kamera erişimi reddedildi.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRunning(false);
    setFaces([]);
    onStop?.();
  }, [onStop]);

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
                sessionId: sessionId,
                date: new Date().toISOString(),
              });
            }
          }
        } else {
          setFaces([]);
        }
      } catch {
        // sessiz geç
      }
    }, 700);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, sessionId]);

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-black">
        <video
          ref={videoRef}
          className="w-full max-w-2xl"
          muted
          playsInline
        />
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
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-3">
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
  );
}