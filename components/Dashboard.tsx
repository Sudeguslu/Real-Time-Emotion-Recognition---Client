"use client";

import { useEffect, useRef, useState, useMemo } from "react";

// ─── Tipler ──────────────────────────────────────────────────────────────────

type EmotionKey =
  | "Mutlu"
  | "Notr"
  | "Uzgun"
  | "Kizgin"
  | "Saskin"
  | "Korku"
  | "Igrenme";

interface Face {
  emotion: string;
  score: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
}

interface Props {
  faces: Face[];
  running: boolean;
  remaining: number;
  totalRecords: number;
}

// ─── Sabitler ────────────────────────────────────────────────────────────────

const EMOTION_META: Record<
  EmotionKey,
  { emoji: string; color: string; positive: boolean }
> = {
  Mutlu:   { emoji: "😊", color: "#4ade80", positive: true  },
  Saskin:  { emoji: "😲", color: "#fbbf24", positive: true  },
  Notr:    { emoji: "😐", color: "#94a3b8", positive: false },
  Uzgun:   { emoji: "😢", color: "#60a5fa", positive: false },
  Kizgin:  { emoji: "😠", color: "#f87171", positive: false },
  Korku:   { emoji: "😨", color: "#c084fc", positive: false },
  Igrenme: { emoji: "🤢", color: "#34d399", positive: false },
};

const EMOTION_KEYS = Object.keys(EMOTION_META) as EmotionKey[];
const TIMELINE_LEN = 40;

// ─── Yardımcılar ─────────────────────────────────────────────────────────────


function getScores(faces: Face[]): Record<EmotionKey, number> {
  const base = Object.fromEntries(EMOTION_KEYS.map((k) => [k, 0])) as Record<
    EmotionKey,
    number
  >;
  if (faces.length === 0) return base;
  for (const face of faces) {
    const key = face.emotion as EmotionKey;
    if (key in base) base[key] = Math.max(base[key], face.score);
  }
  return base;
}

// ─── Bileşen ─────────────────────────────────────────────────────────────────

export default function LiveDashboard({
  faces,
  running,
  remaining,
  totalRecords,
}: Props) {
  // Timeline: son TIMELINE_LEN karenin baskın duygusu
  const [timeline, setTimeline] = useState<EmotionKey[]>([]);
  const [positiveCount, setPositiveCount] = useState(0);
  const [fps, setFps] = useState(1.4);
  const fpsRef = useRef<number[]>([]);
  const lastTickRef = useRef<number>(Date.now());

  // Skorlar ve baskın duygu
  const scores = useMemo(() => getScores(faces), [faces]);
  const dominant = useMemo(
    () =>
      EMOTION_KEYS.reduce((a, b) => (scores[a] >= scores[b] ? a : b)),
    [scores]
  );
  const dominantScore = scores[dominant];

  // Timeline güncelle (her faces değişiminde)
  useEffect(() => {
    if (!running || faces.length === 0) return;

    const now = Date.now();
    const delta = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;

    fpsRef.current = [...fpsRef.current.slice(-9), 1 / Math.max(delta, 0.1)];
    const avgFps = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length;
    setFps(Math.round(avgFps * 10) / 10);

    setTimeline((prev) => {
      const next = [...prev, dominant];
      return next.length > TIMELINE_LEN ? next.slice(-TIMELINE_LEN) : next;
    });

    if (EMOTION_META[dominant]?.positive) {
      setPositiveCount((n) => n + 1);
    }
  }, [faces, running, dominant]);

  // Sıralı duygu listesi (büyükten küçüğe)
  const sortedEmotions = useMemo(
    () => [...EMOTION_KEYS].sort((a, b) => scores[b] - scores[a]),
    [scores]
  );

  const positiveRatio =
    timeline.length > 0
      ? Math.round((positiveCount / timeline.length) * 100)
      : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "320px",
        flexShrink: 0,
      }}
    >
      {/* ── Baskın Duygu ── */}
      <div className="ld-card">
        <div className="ld-card-header">
          <span className="ld-card-title">Baskın duygu</span>
          {running && (
            <span className="ld-live-badge">
              <span className="ld-live-dot" />
              canlı
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            className="ld-emotion-icon"
            style={{
              background: running
                ? `${EMOTION_META[dominant]?.color}22`
                : "var(--color-background-secondary)",
              border: `1.5px solid ${
                running
                  ? (EMOTION_META[dominant]?.color ?? "transparent")
                  : "var(--color-border-tertiary)"
              }`,
              transition: "all 0.4s",
            }}
          >
          </div>
          <div>
            <div className="ld-dominant-name">
              {running ? dominant : "—"}
            </div>
            <div className="ld-dominant-score">
              Güven:{" "}
              <span
                style={{
                  color: running
                    ? (EMOTION_META[dominant]?.color ?? "var(--color-text-success)")
                    : "var(--color-text-secondary)",
                  fontWeight: 500,
                }}
              >
                {running ? `${Math.round(dominantScore * 100)}%` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Duygu Dağılımı ── */}
      <div className="ld-card">
        <div className="ld-card-title" style={{ marginBottom: "10px" }}>
          Duygu dağılımı
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {sortedEmotions.map((key) => {
            const meta = EMOTION_META[key];
            const pct = Math.round(scores[key] * 100);
            const isTop = key === dominant && running && pct > 0;
            return (
              <div key={key} className="ld-bar-row">
                <span className="ld-bar-label">
                   {key}
                </span>
                <div className="ld-bar-track">
                  <div
                    className="ld-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: isTop ? meta.color : `${meta.color}88`,
                    }}
                  />
                </div>
                <span className="ld-bar-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Zaman Çizelgesi ── */}
      <div className="ld-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <span className="ld-card-title">Zaman çizelgesi</span>
          <span
            style={{
              fontSize: "11px",
              color: "var(--color-text-secondary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            son {TIMELINE_LEN} kare
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "2px",
            height: "52px",
          }}
        >
          {Array.from({ length: TIMELINE_LEN }).map((_, i) => {
            const entry = timeline[i - (TIMELINE_LEN - timeline.length)];
            const color = entry
              ? EMOTION_META[entry]?.color ?? "#94a3b8"
              : "var(--color-border-tertiary)";
            const height = entry ? "100%" : "20%";
            return (
              <div
                key={i}
                title={entry ?? ""}
                style={{
                  flex: 1,
                  height,
                  background: color,
                  borderRadius: "2px",
                  transition: "height 0.3s ease, background 0.3s ease",
                  opacity: entry ? 1 : 0.35,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── Metrikler ── */}
      <div className="ld-card">
        <div className="ld-card-title" style={{ marginBottom: "10px" }}>
          Oturum metrikleri
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          {[
            {
              label: "Tespit edilen yüz",
              value: running ? String(faces.length) : "0",
              sub: "bu kare",
            },
            {
              label: "Analiz hızı",
              value: running ? fps.toFixed(1) : "0.0",
              sub: "kare/sn",
            },
            {
              label: "Toplam kayıt",
              value: String(totalRecords),
              sub: "duygu kaydı",
            },
            {
              label: "Pozitif oran",
              value: `${positiveRatio}%`,
              sub: "mutlu + şaşkın",
            },
          ].map(({ label, value, sub }) => (
            <div key={label} className="ld-metric-tile">
              <div className="ld-metric-label">{label}</div>
              <div className="ld-metric-value">{value}</div>
              <div className="ld-metric-sub">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}