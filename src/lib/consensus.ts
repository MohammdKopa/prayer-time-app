import type { DayComputation, PrayerName } from "./prayer-engine";
import { PRAYER_ORDER } from "./prayer-engine";
import type { MethodId } from "./methods";

export type Confidence = "high" | "medium" | "low";

export interface PrayerAlternative {
  /** Short Arabic label of the alternative method (e.g. "الحنفي"). */
  shortLabel: string;
  /** The alternative time itself. */
  time: Date;
  /** Difference from the primary in seconds (signed: +/- from primary). */
  diffSeconds: number;
}

export interface PrayerConsensus {
  /** Spread between earliest and latest method, in seconds. */
  spreadSeconds: number;
  confidence: Confidence;
  /** Method id whose time was earliest for this prayer. */
  earliestMethodId: string;
  /** Method id whose time was latest for this prayer. */
  latestMethodId: string;
  /** The single most useful alternative time to show inline, if any. */
  alternative: PrayerAlternative | null;
}

export type DayConsensus = Record<PrayerName, PrayerConsensus>;

const HIGH_THRESHOLD_S = 120; // 2 min
const MEDIUM_THRESHOLD_S = 600; // 10 min

const rate = (spreadSeconds: number): Confidence => {
  if (spreadSeconds < HIGH_THRESHOLD_S) return "high";
  if (spreadSeconds < MEDIUM_THRESHOLD_S) return "medium";
  return "low";
};

/**
 * Pick the most useful alternative to surface inline.
 * - For Asr: always the Hanafi method if present (well-known fiqh distinction).
 * - For other prayers: the method furthest from the primary, if the gap is ≥2 min.
 */
function pickAlternative(
  day: DayComputation,
  prayer: PrayerName,
): PrayerAlternative | null {
  const primaryT = day.primary.times[prayer].getTime();

  if (prayer === "asr") {
    const hanafi = day.alternates.find((m) => m.methodId === ("Hanafi" as MethodId));
    if (hanafi) {
      const diff = Math.round((hanafi.times[prayer].getTime() - primaryT) / 1000);
      if (Math.abs(diff) >= 60) {
        return {
          shortLabel: hanafi.shortLabel,
          time: hanafi.times[prayer],
          diffSeconds: diff,
        };
      }
    }
    return null;
  }

  let furthest = day.alternates[0];
  let furthestAbs = 0;
  for (const m of day.alternates) {
    if (m.methodId === ("Hanafi" as MethodId)) continue; // Hanafi only matters for Asr
    const d = Math.abs(m.times[prayer].getTime() - primaryT);
    if (d > furthestAbs) {
      furthestAbs = d;
      furthest = m;
    }
  }
  if (furthestAbs < 120 * 1000) return null; // hide if <2 min difference
  return {
    shortLabel: furthest.shortLabel,
    time: furthest.times[prayer],
    diffSeconds: Math.round(
      (furthest.times[prayer].getTime() - primaryT) / 1000,
    ),
  };
}

export function computeConsensus(day: DayComputation): DayConsensus {
  const allMethods = [day.primary, ...day.alternates];
  const out = {} as DayConsensus;
  for (const prayer of PRAYER_ORDER) {
    let earliest = allMethods[0];
    let latest = allMethods[0];
    for (const m of allMethods) {
      if (m.times[prayer].getTime() < earliest.times[prayer].getTime()) {
        earliest = m;
      }
      if (m.times[prayer].getTime() > latest.times[prayer].getTime()) {
        latest = m;
      }
    }
    const spreadSeconds = Math.round(
      (latest.times[prayer].getTime() - earliest.times[prayer].getTime()) /
        1000,
    );
    out[prayer] = {
      spreadSeconds,
      confidence: rate(spreadSeconds),
      earliestMethodId: earliest.methodId,
      latestMethodId: latest.methodId,
      alternative: pickAlternative(day, prayer),
    };
  }
  return out;
}

/** Human-readable spread for the UI badge. */
export function formatSpread(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm === 0 ? `${h}h` : `${h}h ${rm}m`;
}
