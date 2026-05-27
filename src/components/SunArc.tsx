"use client";

import type { PrayerName } from "@/lib/prayer-engine";
import { PRAYER_LABEL_EN } from "@/lib/format";

const PRAYER_DOTS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

// SVG canvas. Width is scaled by viewBox; the consumer just sets a width on a parent div.
const W = 320;
const H = 170;
const MARGIN_X = 18;
const BASELINE_Y = 138;
const ARC_PEAK_Y = 30;
const ARC_RX = (W - MARGIN_X * 2) / 2;
const ARC_RY = BASELINE_Y - ARC_PEAK_Y;
const CX = W / 2;

/** Convert a Date → fraction-of-local-day in the given tz. 0=midnight, 1=next midnight. */
function fractionOfDay(d: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  const h = Number(parts.hour ?? 0);
  const m = Number(parts.minute ?? 0);
  const s = Number(parts.second ?? 0);
  return (h * 3600 + m * 60 + s) / 86400;
}

/** For a fraction f ∈ [0,1], return (x,y) on the semicircle arc. */
function arcPoint(f: number): { x: number; y: number } {
  const theta = Math.PI * f; // 0 → π
  const x = CX - ARC_RX * Math.cos(theta);
  const y = BASELINE_Y - ARC_RY * Math.sin(theta);
  return { x, y };
}

export function SunArc({
  now,
  prayerTimes,
  timeZone,
  nextPrayer,
}: {
  now: Date;
  prayerTimes: Record<PrayerName, Date>;
  timeZone: string;
  nextPrayer: PrayerName | null;
}) {
  const nowF = fractionOfDay(now, timeZone);
  const sunPos = arcPoint(nowF);

  // Day vs night: sun is "above ground" only between sunrise and sunset.
  const sunriseF = fractionOfDay(prayerTimes.sunrise, timeZone);
  const sunsetF = fractionOfDay(prayerTimes.maghrib, timeZone);
  const isDay = nowF >= sunriseF && nowF <= sunsetF;

  const prayerPositions = PRAYER_DOTS.map((p) => {
    const f = fractionOfDay(prayerTimes[p], timeZone);
    return { p, f, ...arcPoint(f) };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      role="img"
      aria-label="Today's sun path with prayer markers"
    >
      <defs>
        <linearGradient id="arcStroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(212,166,74,0.15)" />
          <stop offset="50%" stopColor="rgba(212,166,74,0.7)" />
          <stop offset="100%" stopColor="rgba(212,166,74,0.15)" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(232,200,120,1)" />
          <stop offset="50%" stopColor="rgba(212,166,74,0.6)" />
          <stop offset="100%" stopColor="rgba(212,166,74,0)" />
        </radialGradient>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(220,228,255,0.95)" />
          <stop offset="60%" stopColor="rgba(140,160,210,0.3)" />
          <stop offset="100%" stopColor="rgba(140,160,210,0)" />
        </radialGradient>
      </defs>

      {/* Horizon baseline */}
      <line
        x1={MARGIN_X}
        x2={W - MARGIN_X}
        y1={BASELINE_Y}
        y2={BASELINE_Y}
        stroke="rgba(243,238,217,0.12)"
        strokeWidth={1}
      />

      {/* Arc — full day path */}
      <path
        d={`M ${MARGIN_X} ${BASELINE_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${W - MARGIN_X} ${BASELINE_Y}`}
        fill="none"
        stroke="url(#arcStroke)"
        strokeWidth={1.2}
        strokeLinecap="round"
      />

      {/* Sunrise / sunset markers (small ticks on baseline) */}
      {[sunriseF, sunsetF].map((f, i) => {
        const x = MARGIN_X + (W - 2 * MARGIN_X) * f;
        return (
          <line
            key={i}
            x1={x}
            x2={x}
            y1={BASELINE_Y - 4}
            y2={BASELINE_Y + 4}
            stroke="rgba(243,238,217,0.25)"
            strokeWidth={1}
          />
        );
      })}

      {/* Prayer dots */}
      {prayerPositions.map(({ p, x, y }) => {
        const isNext = nextPrayer === p;
        return (
          <g key={p}>
            <circle
              cx={x}
              cy={y}
              r={isNext ? 4.5 : 2.8}
              fill={isNext ? "rgba(232,200,120,1)" : "rgba(212,166,74,0.85)"}
              stroke={isNext ? "rgba(232,200,120,0.4)" : "none"}
              strokeWidth={isNext ? 6 : 0}
              style={isNext ? { filter: "drop-shadow(0 0 6px rgba(212,166,74,0.8))" } : undefined}
            >
              {isNext && (
                <animate
                  attributeName="r"
                  values="4;5.5;4"
                  dur="2.2s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <text
              x={x}
              y={BASELINE_Y + 18}
              textAnchor="middle"
              fontSize={9}
              fill={isNext ? "rgba(232,200,120,1)" : "rgba(154,147,126,0.85)"}
              fontWeight={isNext ? 600 : 400}
              letterSpacing={0.5}
              style={{ textTransform: "uppercase" }}
            >
              {PRAYER_LABEL_EN[p]}
            </text>
          </g>
        );
      })}

      {/* Sun or moon at current position */}
      {isDay ? (
        <>
          <circle cx={sunPos.x} cy={sunPos.y} r={18} fill="url(#sunGlow)" />
          <circle
            cx={sunPos.x}
            cy={sunPos.y}
            r={6}
            fill="rgba(243,225,170,1)"
          />
        </>
      ) : (
        // Moon — same arc position but mirrored below horizon, anchored at the bottom
        <>
          <circle
            cx={MARGIN_X + (W - 2 * MARGIN_X) * nowF}
            cy={BASELINE_Y + 12}
            r={14}
            fill="url(#moonGlow)"
          />
          <circle
            cx={MARGIN_X + (W - 2 * MARGIN_X) * nowF}
            cy={BASELINE_Y + 12}
            r={4.5}
            fill="rgba(230,236,255,0.85)"
          />
        </>
      )}
    </svg>
  );
}
