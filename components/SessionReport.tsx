"use client";

import { useEffect, useState } from "react";
import { emotionsService } from "@/lib/services/emotions";
import type { Emotion, EmotionLabel } from "@/lib/api/types";

const EMOTION_TR: Record<EmotionLabel, string> = {
  happy: "Mutlu",
  sad: "Üzgün",
  angry: "Kızgın",
  surprise: "Şaşkın",
  fear: "Korku",
  disgust: "İğrenme",
  neutral: "Nötr",
};

const EMOTION_COLOR: Record<EmotionLabel, string> = {
  happy: "#22c55e",
  neutral: "#64748b",
  surprise: "#3b82f6",
  sad: "#f59e0b",
  angry: "#ef4444",
  disgust: "#a855f7",
  fear: "#f97316",
};

const POSITIVE: EmotionLabel[] = ["happy", "neutral", "surprise"];
const NEGATIVE: EmotionLabel[] = ["angry", "sad", "disgust", "fear"];

interface Props {
  sessionId: string;
  sessionName: string;
  onClose: () => void;
}

export default function SessionReport({ sessionId, sessionName, onClose }: Props) {
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    emotionsService.getBySession(sessionId)
      .then(setEmotions)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-sm text-slate-400">
          Rapor yükleniyor...
        </div>
      </div>
    );
  }

  if (emotions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-8 max-w-sm text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
            Bu oturum için kayıtlı duygu verisi bulunamadı.
          </p>
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md">
            Kapat
          </button>
        </div>
      </div>
    );
  }

  // ── Pasta grafik verisi ──
  const totalCount = emotions.length;
  const emotionCounts = emotions.reduce((acc, e) => {
    acc[e.emotion] = (acc[e.emotion] || 0) + 1;
    return acc;
  }, {} as Record<EmotionLabel, number>);
  const pieSlices = (Object.entries(emotionCounts) as [EmotionLabel, number][]).sort((a, b) => b[1] - a[1]);

  // ── Odaklanma süresi ──
  const INTERVAL_SEC = 0.7;
  let positiveSec = 0;
  let negativeSec = 0;
  emotions.forEach((e) => {
    if (POSITIVE.includes(e.emotion)) positiveSec += INTERVAL_SEC;
    else if (NEGATIVE.includes(e.emotion)) negativeSec += INTERVAL_SEC;
  });

  const totalScoredSec = positiveSec + negativeSec;
  const focusScore = totalScoredSec > 0 ? Math.round((positiveSec / totalScoredSec) * 100) : 0;
  const focusColor = focusScore >= 70 ? "#22c55e" : focusScore >= 40 ? "#f59e0b" : "#ef4444";
  const focusLabel = focusScore >= 70 ? "İyi" : focusScore >= 40 ? "Orta" : "Düşük";

  const fmtDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return m === 0 ? `${s}sn` : `${m}dk ${s}sn`;
  };

  // ── Halka grafik ──
  const RING_R = 36;
  const RING_CX = 50;
  const RING_CY = 50;
  const circumference = 2 * Math.PI * RING_R;
  const strokeDashoffset = circumference * (1 - focusScore / 100);

  // ── Çizgi grafik: dakika bazlı bucket ──
  const buckets: Record<string, Record<EmotionLabel, number>> = {};
  emotions.forEach((e) => {
    if (!e.date) return;
    const d = new Date(e.date);
    const key = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    if (!buckets[key]) buckets[key] = {} as Record<EmotionLabel, number>;
    buckets[key][e.emotion] = (buckets[key][e.emotion] || 0) + 1;
  });

  const timeLabels = Object.keys(buckets).sort();
  const allEmotionsInData = Array.from(new Set(emotions.map((e) => e.emotion))) as EmotionLabel[];

  const CHART_W = 600, CHART_H = 180;
  const PAD_L = 32, PAD_R = 16, PAD_T = 16, PAD_B = 32;
  const innerW = CHART_W - PAD_L - PAD_R;
  const innerH = CHART_H - PAD_T - PAD_B;

  const maxVal = Math.max(1, ...timeLabels.flatMap((t) => allEmotionsInData.map((em) => buckets[t][em] || 0)));
  const xPos = (i: number) => timeLabels.length <= 1 ? PAD_L + innerW / 2 : PAD_L + (i / (timeLabels.length - 1)) * innerW;
  const yPos = (val: number) => PAD_T + innerH - (val / maxVal) * innerH;
  const makePath = (emotion: EmotionLabel) => {
    const pts = timeLabels.map((t, i) => ({ x: xPos(i), y: yPos(buckets[t][emotion] || 0) }));
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  };

  // ── Pasta SVG ──
  const PIE_R = 110;
  const PIE_CX = 130;
  const PIE_CY = 130;
  let cumulativeAngle = -Math.PI / 2;

  const pieArcs = pieSlices.map(([emotion, count]) => {
    const angle = (count / totalCount) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    const midAngle = startAngle + angle / 2;
    const x1 = PIE_CX + PIE_R * Math.cos(startAngle);
    const y1 = PIE_CY + PIE_R * Math.sin(startAngle);
    const x2 = PIE_CX + PIE_R * Math.cos(cumulativeAngle);
    const y2 = PIE_CY + PIE_R * Math.sin(cumulativeAngle);
    const LABEL_R = PIE_R * 0.62;
    const lx = PIE_CX + LABEL_R * Math.cos(midAngle);
    const ly = PIE_CY + LABEL_R * Math.sin(midAngle);
    const pct = (count / totalCount) * 100;
    return {
      emotion,
      count,
      path: `M ${PIE_CX} ${PIE_CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${PIE_R} ${PIE_R} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
      pct: pct.toFixed(1),
      showLabel: pct >= 4,
      lx,
      ly,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Oturum Raporu</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{sessionName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-8">

          {/* Odaklanma Kartları */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1 px-4 py-3 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg">
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Pozitif Süre</span>
              <span className="text-2xl font-bold text-green-700 dark:text-green-300">{fmtDuration(positiveSec)}</span>
              <span className="text-xs text-green-500">Mutlu · Nötr · Şaşkın</span>
            </div>

            <div className="flex flex-col gap-1 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg">
              <span className="text-xs font-medium text-red-600 dark:text-red-400">Negatif Süre</span>
              <span className="text-2xl font-bold text-red-700 dark:text-red-300">{fmtDuration(negativeSec)}</span>
              <span className="text-xs text-red-500">Kızgın · Üzgün · İğrenme · Korku</span>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 px-4 py-3 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Odaklanma Skoru</span>
              <svg viewBox="0 0 100 100" className="w-20 h-20">
                <circle cx={RING_CX} cy={RING_CY} r={RING_R} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={10} />
                <circle
                  cx={RING_CX} cy={RING_CY} r={RING_R}
                  fill="none"
                  stroke={focusColor}
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${RING_CX} ${RING_CY})`}
                />
                <text x={RING_CX} y={RING_CY - 4} textAnchor="middle" fontSize={18} fontWeight="bold" fill={focusColor}>{focusScore}%</text>
                <text x={RING_CX} y={RING_CY + 13} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.5}>{focusLabel}</text>
              </svg>
            </div>
          </div>

          {/* Çizgi Grafik */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              Dakika Bazlı Duygu Dağılımı
            </h3>
            {timeLabels.length < 2 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500">Grafik için yeterli zaman verisi yok.</p>
            ) : (
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" style={{ minWidth: 320 }}>
                  {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                    <line key={t} x1={PAD_L} y1={PAD_T + innerH * (1 - t)} x2={PAD_L + innerW} y2={PAD_T + innerH * (1 - t)} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
                  ))}
                  {timeLabels.map((label, i) => {
                    if (timeLabels.length > 12 && i % Math.ceil(timeLabels.length / 12) !== 0) return null;
                    return <text key={label} x={xPos(i)} y={CHART_H - 6} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.4}>{label}</text>;
                  })}
                  {allEmotionsInData.map((emotion) => (
                    <path key={emotion} d={makePath(emotion)} fill="none" stroke={EMOTION_COLOR[emotion]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                  ))}
                  {allEmotionsInData.map((emotion) =>
                    timeLabels.map((t, i) => {
                      const val = buckets[t][emotion] || 0;
                      if (val === 0) return null;
                      return <circle key={`${emotion}-${t}`} cx={xPos(i)} cy={yPos(val)} r={3} fill={EMOTION_COLOR[emotion]} />;
                    })
                  )}
                </svg>
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-2">
              {allEmotionsInData.map((emotion) => (
                <div key={emotion} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EMOTION_COLOR[emotion] }} />
                  <span className="text-xs text-slate-500 dark:text-zinc-400">{EMOTION_TR[emotion]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pasta Grafik */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              Toplam Duygu Oranları
            </h3>
            <div className="flex justify-center">
              <svg viewBox="0 0 260 260" className="w-64 h-64">
                {pieArcs.map(({ emotion, path }) => (
                  <path key={emotion} d={path} fill={EMOTION_COLOR[emotion]} stroke="white" strokeWidth={1.5} />
                ))}
                {pieArcs.map(({ emotion, lx, ly, pct, showLabel }) =>
                  showLabel ? (
                    <g key={`label-${emotion}`}>
                      <text
                        x={lx}
                        y={ly - 5}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight="600"
                        fill="white"
                      >
                        {EMOTION_TR[emotion]}
                      </text>
                      <text
                        x={lx}
                        y={ly + 8}
                        textAnchor="middle"
                        fontSize={9}
                        fill="white"
                        opacity={0.85}
                      >
                        {pct}%
                      </text>
                    </g>
                  ) : null
                )}
              </svg>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-100 dark:border-zinc-800">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:bg-slate-700 dark:hover:bg-zinc-300 transition-colors">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}