import type { PrayerName } from "@shared/prayer-engine";

// The sky, as it is right now.
//
// The screen is not a fixed dark theme — it carries the colour of the actual
// moment, driven by the day's own prayer times rather than by clock hours. At
// 51°N that difference is the whole point: in June the sky is still pale at
// 22:00 and in December it is black by 17:00, and an app that darkened on a
// fixed schedule would be wrong for half the year.
//
// It stays DARK throughout. This is not a literal sky — bone text has to stay
// readable on it at Dhuhr. What changes is hue and warmth: cold and deep at
// night, warming toward the horizon at Fajr and Maghrib, cooler and a shade
// lighter in the middle of the day.

export interface Sky {
  /** Top-to-bottom gradient stops. */
  colours: [string, string, string];
  /** 0 at full day, 1 at deep night — how strongly to show stars. */
  starAlpha: number;
  /** Warm glow strength at the horizon, 0..1. */
  horizonGlow: number;
}

type RGB = [number, number, number];

const hex = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

const toHex = (c: RGB): string =>
  "#" +
  c
    .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
    .join("");

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Anchor palettes. Each is top / middle / horizon. */
const ANCHORS = {
  night: ["#030D09", "#05130D", "#071A12"],
  dawn: ["#04110C", "#0A1E16", "#24241C"],
  sunrise: ["#061710", "#10271C", "#33291D"],
  midday: ["#061810", "#0A2217", "#0E2B1D"],
  sunset: ["#05140E", "#12211A", "#33261A"],
  dusk: ["#03100B", "#071811", "#171E18"],
} as const satisfies Record<string, readonly [string, string, string]>;

type AnchorName = keyof typeof ANCHORS;

interface Stop {
  at: number; // minutes since local midnight
  anchor: AnchorName;
  star: number;
  glow: number;
}

const minutes = (d: Date) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;

/**
 * Build the day's colour timeline from its own prayer times, then read off the
 * value at `now`. Wraps around midnight, so the small hours resolve against
 * yesterday's Isha rather than falling off the start of the array.
 */
export function skyAt(
  now: Date,
  times: Record<PrayerName, Date>,
): Sky {
  const fajr = minutes(times.fajr);
  const sunrise = minutes(times.sunrise);
  const dhuhr = minutes(times.dhuhr);
  const maghrib = minutes(times.maghrib);
  const isha = minutes(times.isha);

  const stops: Stop[] = ([
    { at: 0, anchor: "night", star: 1, glow: 0 },
    { at: Math.max(1, fajr - 30), anchor: "night", star: 1, glow: 0 },
    { at: fajr, anchor: "dawn", star: 0.55, glow: 0.35 },
    { at: sunrise, anchor: "sunrise", star: 0.1, glow: 0.55 },
    { at: (sunrise + dhuhr) / 2, anchor: "midday", star: 0, glow: 0.1 },
    { at: dhuhr, anchor: "midday", star: 0, glow: 0.08 },
    { at: (dhuhr + maghrib) / 2, anchor: "midday", star: 0, glow: 0.14 },
    { at: Math.max(dhuhr + 1, maghrib - 45), anchor: "sunset", star: 0.05, glow: 0.4 },
    { at: maghrib, anchor: "sunset", star: 0.25, glow: 0.6 },
    { at: isha, anchor: "dusk", star: 0.75, glow: 0.18 },
    { at: Math.min(1439, isha + 60), anchor: "night", star: 1, glow: 0 },
    { at: 1440, anchor: "night", star: 1, glow: 0 },
  ] as Stop[]).sort((a, b) => a.at - b.at);

  const m = minutes(now);

  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (m >= stops[i].at && m <= stops[i + 1].at) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }

  const span = hi.at - lo.at;
  const t = span <= 0 ? 0 : (m - lo.at) / span;

  const a = ANCHORS[lo.anchor];
  const b = ANCHORS[hi.anchor];

  return {
    colours: [
      toHex(mix(hex(a[0]), hex(b[0]), t)),
      toHex(mix(hex(a[1]), hex(b[1]), t)),
      toHex(mix(hex(a[2]), hex(b[2]), t)),
    ],
    starAlpha: lerp(lo.star, hi.star, t),
    horizonGlow: lerp(lo.glow, hi.glow, t),
  };
}

/**
 * Deterministic star field. Seeded so the stars do not jump every render —
 * a sky that reshuffles itself each second is a distraction, not a backdrop.
 */
export function starField(count: number): { x: number; y: number; r: number }[] {
  const out: { x: number; y: number; r: number }[] = [];
  let seed = 20260917;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      x: rnd(),
      // Weighted toward the top: stars low on the screen sit behind content.
      y: rnd() * rnd(),
      r: 0.6 + rnd() * 1.3,
    });
  }
  return out;
}
