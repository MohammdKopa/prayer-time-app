"use client";

import type { PrayerName } from "@/lib/prayer-engine";
import { PRAYER_LABEL_AR } from "@/lib/format";

// Prayers that sit on the daytime arc.
const ARC_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const W = 1000;
const H = 372;
const MARGIN_X = 70;
const BASELINE_Y = 250;
const ARC_PEAK_Y = 42;
// When two prayer dots fall closer than this (viewBox px), the second label
// drops to a lower row so the text never overlaps (e.g. Maghrib↔Isha in summer).
const LABEL_MIN_GAP = 96;
const ROW_STEP = 30;

// Deterministic star field for the night sky (above the horizon).
const STARS = [
  { x: 120, y: 70, r: 2.4, a: 0.9 },
  { x: 210, y: 120, r: 1.6, a: 0.6 },
  { x: 300, y: 55, r: 2.0, a: 0.8 },
  { x: 390, y: 100, r: 1.4, a: 0.5 },
  { x: 470, y: 48, r: 2.6, a: 1.0 },
  { x: 540, y: 110, r: 1.6, a: 0.55 },
  { x: 620, y: 64, r: 2.0, a: 0.85 },
  { x: 700, y: 116, r: 1.5, a: 0.5 },
  { x: 770, y: 58, r: 2.4, a: 0.9 },
  { x: 850, y: 104, r: 1.7, a: 0.6 },
  { x: 250, y: 170, r: 1.3, a: 0.45 },
  { x: 660, y: 168, r: 1.4, a: 0.5 },
  { x: 430, y: 160, r: 1.5, a: 0.5 },
];
const ARC_RX = (W - MARGIN_X * 2) / 2;
const ARC_RY = BASELINE_Y - ARC_PEAK_Y;
const CX = W / 2;

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

function arcPoint(f: number): { x: number; y: number } {
  const theta = Math.PI * Math.min(Math.max(f, 0), 1);
  return {
    x: CX - ARC_RX * Math.cos(theta),
    y: BASELINE_Y - ARC_RY * Math.sin(theta),
  };
}

// Arabic (Hindu-Arabic 0-9) numerals on the wall display — imam's request.
const hm = (d: Date, tz: string) =>
  d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  });

/**
 * Wall-display sun path: a luminous gold arc tracing the day, with the five
 * daily prayers marked and labelled in Arabic, the next one glowing, and the
 * sun (or moon, at night) gliding along it in real time.
 */
export function DisplaySunArc({
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
  const sun = arcPoint(nowF);

  const sunriseF = fractionOfDay(prayerTimes.sunrise, timeZone);
  const sunsetF = fractionOfDay(prayerTimes.maghrib, timeZone);
  const isDay = nowF >= sunriseF && nowF <= sunsetF;

  // Dots are in time order, which is also left→right x order on the arc.
  // Track an alternating "row" so crowded labels stagger vertically.
  let prevX = -Infinity;
  let row = 0;
  const dots = ARC_PRAYERS.map((p) => {
    const pt = arcPoint(fractionOfDay(prayerTimes[p], timeZone));
    row = pt.x - prevX < LABEL_MIN_GAP ? (row === 0 ? 1 : 0) : 0;
    prevX = pt.x;
    return { p, x: pt.x, y: pt.y, row };
  });

  // Elapsed portion of the arc (start → now) drawn brighter.
  const elapsedEnd = arcPoint(nowF);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="مسار الشمس وأوقات الصلاة"
    >
      <defs>
        <linearGradient id="dArc" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(232,200,120,0.12)" />
          <stop offset="50%" stopColor="rgba(232,200,120,0.55)" />
          <stop offset="100%" stopColor="rgba(232,200,120,0.12)" />
        </linearGradient>
        <linearGradient id="dArcElapsed" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(246,228,172,0.9)" />
          <stop offset="100%" stopColor="rgba(246,228,172,0.5)" />
        </linearGradient>
        <linearGradient id="dSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(232,200,120,0.10)" />
          <stop offset="100%" stopColor="rgba(232,200,120,0)" />
        </linearGradient>
        <radialGradient id="dSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,244,214,1)" />
          <stop offset="35%" stopColor="rgba(246,228,172,0.95)" />
          <stop offset="70%" stopColor="rgba(232,200,120,0.45)" />
          <stop offset="100%" stopColor="rgba(232,200,120,0)" />
        </radialGradient>
        <radialGradient id="dMoon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(226,234,255,0.95)" />
          <stop offset="55%" stopColor="rgba(150,170,220,0.35)" />
          <stop offset="100%" stopColor="rgba(150,170,220,0)" />
        </radialGradient>
      </defs>

      {/* Sky fill under the arc for depth */}
      <path
        d={`M ${MARGIN_X} ${BASELINE_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${W - MARGIN_X} ${BASELINE_Y} Z`}
        fill="url(#dSky)"
      />

      {/* Star field — bright at night, a whisper by day */}
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="rgba(244,236,216,1)"
          opacity={(isDay ? 0.06 : 0.7) * s.a}
        >
          {!isDay && (
            <animate
              attributeName="opacity"
              values={`${0.7 * s.a};${0.2 * s.a};${0.7 * s.a}`}
              dur={`${3 + (i % 4)}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}

      {/* Horizon */}
      <line
        x1={MARGIN_X - 10}
        x2={W - MARGIN_X + 10}
        y1={BASELINE_Y}
        y2={BASELINE_Y}
        stroke="rgba(244,236,216,0.14)"
        strokeWidth={1.5}
      />

      {/* Full-day arc */}
      <path
        d={`M ${MARGIN_X} ${BASELINE_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${W - MARGIN_X} ${BASELINE_Y}`}
        fill="none"
        stroke="url(#dArc)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      {/* Elapsed arc (start → now) */}
      {nowF > 0.001 && (
        <path
          d={`M ${MARGIN_X} ${BASELINE_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${elapsedEnd.x} ${elapsedEnd.y}`}
          fill="none"
          stroke="url(#dArcElapsed)"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.9}
        />
      )}

      {/* Sunrise / sunset ticks */}
      {[sunriseF, sunsetF].map((f, i) => {
        const x = MARGIN_X + (W - 2 * MARGIN_X) * f;
        return (
          <line
            key={i}
            x1={x}
            x2={x}
            y1={BASELINE_Y - 7}
            y2={BASELINE_Y + 7}
            stroke="rgba(244,236,216,0.28)"
            strokeWidth={1.5}
          />
        );
      })}

      {/* Prayer markers */}
      {dots.map(({ p, x, y, row }) => {
        const isNext = nextPrayer === p;
        const labelY = BASELINE_Y + 34 + row * ROW_STEP;
        const timeY = labelY + 26;
        return (
          <g key={p}>
            <line
              x1={x}
              x2={x}
              y1={y}
              y2={row ? labelY - 22 : BASELINE_Y}
              stroke={
                isNext ? "rgba(246,228,172,0.45)" : "rgba(232,200,120,0.16)"
              }
              strokeWidth={1.2}
              strokeDasharray={isNext ? "0" : "3 5"}
            />
            {/* Static soft halo (cheap radial fill) replaces a GPU-heavy
                blur filter — the pulse lives on the solid dot instead. */}
            {isNext && <circle cx={x} cy={y} r={22} fill="url(#dSun)" />}
            <circle
              cx={x}
              cy={y}
              r={isNext ? 11 : 6}
              fill={isNext ? "rgba(255,244,214,1)" : "rgba(232,200,120,0.9)"}
            >
              {isNext && (
                <animate
                  attributeName="r"
                  values="9;13;9"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <text
              x={x}
              y={labelY}
              textAnchor="middle"
              className="font-kufi"
              fontSize={isNext ? 29 : 25}
              fill={isNext ? "rgba(246,228,172,1)" : "rgba(244,236,216,0.72)"}
              fontWeight={isNext ? 600 : 500}
            >
              {PRAYER_LABEL_AR[p]}
            </text>
            <text
              x={x}
              y={timeY}
              textAnchor="middle"
              fontSize={18}
              fill={isNext ? "rgba(246,228,172,0.85)" : "rgba(244,236,216,0.4)"}
              style={{ direction: "ltr" }}
            >
              {hm(prayerTimes[p], timeZone)}
            </text>
          </g>
        );
      })}

      {/* Sun by day on the arc; glowing moon gliding the night sky otherwise */}
      {isDay ? (
        <>
          <circle cx={sun.x} cy={sun.y} r={46} fill="url(#dSun)" />
          <circle cx={sun.x} cy={sun.y} r={14} fill="rgba(255,248,224,1)" />
        </>
      ) : (
        (() => {
          // Crescent (hilāl) rides high across the top, tracking the night.
          const mx = MARGIN_X + (W - 2 * MARGIN_X) * nowF;
          const my = ARC_PEAK_Y + 36;
          const r = 18;
          return (
            <>
              <mask id="hilal">
                <rect x="0" y="0" width={W} height={H} fill="black" />
                <circle cx={mx} cy={my} r={r} fill="white" />
                <circle cx={mx + 8} cy={my - 4} r={r} fill="black" />
              </mask>
              {/* soft halo */}
              <circle cx={mx} cy={my} r={36} fill="url(#dMoon)" />
              {/* crescent */}
              <circle
                cx={mx}
                cy={my}
                r={r}
                fill="rgba(240,243,255,1)"
                mask="url(#hilal)"
              />
            </>
          );
        })()
      )}
    </svg>
  );
}
