import { Coordinates, HighLatitudeRule, PrayerTimes } from "adhan";
import {
  CONSENSUS_METHOD_IDS,
  METHODS,
  type MethodId,
  PRIMARY_METHOD,
} from "./methods";

/**
 * How a gap rule is applied.
 *
 * - `"fixed"`   — the prayer is placed at exactly this distance, always.
 * - `"minimum"` — the calculated time is used unless the gap would be smaller
 *                 than this, in which case it is widened to it.
 */
export type GapMode = "fixed" | "minimum";

export interface GapRule {
  mode: GapMode;
  minutes: number;
}

/**
 * Sheikh Ayman's ruling (Marl, 2026-06-03), confirmed 2026-09-17 as literal:
 *
 *   "بالنسبة لصلاة العشاء، نجعلها بعد صلاة المغرب بساعة و نصف دائماً"
 *   "و كذلك بالنسبة لصلاة الفجر... قبل شروق الشمس بساعة و نصف كذلك"
 *
 * Isha is always ninety minutes after Maghrib; Fajr is always ninety minutes
 * before sunrise. دائماً — always — so these are FIXED offsets, and the
 * astronomical Isha and Fajr are not used for the adhan at all.
 *
 * His stated reason is the red twilight (الشفق الأحمر): he observed a
 * Maghrib→Isha gap of about an hour and five minutes and judged it too short
 * for the shafaq to go.
 *
 * WHAT FIXED MEANS IN WINTER. This was raised before implementing and
 * confirmed: on 21 December in Marl the calculated Isha is 18:22 and the fixed
 * rule gives 17:54, twenty-eight minutes earlier. Across the year the fixed
 * Isha lands before the calculated one on 217 of 365 days, and the fixed Fajr
 * lands before the calculated dawn on 144 summer days. That is the ruling, and
 * the mosque follows the mosque's ruling — but the trade is real, so the mode
 * is a constant rather than a hardcoded branch. Changing `mode` to `"minimum"`
 * restores the behaviour where the calculated time wins unless the window
 * would be squeezed, which is what the summer complaint was actually about.
 *
 * Whichever mode is in force, the app says on screen when a shown time differs
 * from the calculated one. Principle #4 forbids unexplained times, not just
 * wrong ones.
 */
export const ISHA_GAP_AFTER_MAGHRIB: GapRule = { mode: "fixed", minutes: 90 };
export const FAJR_GAP_BEFORE_SUNRISE: GapRule = { mode: "fixed", minutes: 90 };

/** Disables a gap rule entirely — used to validate raw astronomy against Aladhan. */
export const NO_GAP_RULE: GapRule = { mode: "minimum", minutes: 0 };

export const PRAYER_ORDER = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
] as const;

export type PrayerName = (typeof PRAYER_ORDER)[number];

export interface MethodResult {
  methodId: MethodId;
  label: string;
  shortLabel: string;
  times: Record<PrayerName, Date>;
  /** True when the shown Isha differs from the calculated one. */
  ishaAdjusted: boolean;
  /** True when the shown Fajr differs from the calculated one. */
  fajrAdjusted: boolean;
}

export interface DayComputation {
  coords: { latitude: number; longitude: number };
  /** Start of local day used as the calculation date. */
  date: Date;
  /** The method whose times the clock displays. */
  primary: MethodResult;
  /** All other methods (used only for the consensus badge). */
  alternates: MethodResult[];
  /** True when the displayed Isha differs from the calculated one. */
  ishaAdjusted: boolean;
  /** True when the displayed Fajr differs from the calculated one. */
  fajrAdjusted: boolean;
  /** The Maghrib→Isha rule in force for this computation. */
  ishaRule: GapRule;
  /** The Fajr→sunrise rule in force for this computation. */
  fajrRule: GapRule;
}

/**
 * Apply the Maghrib→Isha floor. Returns the times plus whether it bound, so
 * the UI can say the time was held rather than silently showing an adjusted
 * number — "no bad times" means no unexplained ones either.
 */
/** Apply a gap rule. `direction` is +1 when the prayer sits after the anchor
 *  (Isha after Maghrib) and -1 when it sits before it (Fajr before sunrise). */
const applyGap = (
  calculated: Date,
  anchor: Date,
  rule: GapRule,
  direction: 1 | -1,
): { time: Date; adjusted: boolean } => {
  if (rule.minutes <= 0) return { time: calculated, adjusted: false };

  const target = new Date(anchor.getTime() + direction * rule.minutes * 60_000);

  if (rule.mode === "fixed") {
    return {
      time: target,
      adjusted: target.getTime() !== calculated.getTime(),
    };
  }

  // "minimum": widen the window only if the calculated time sits inside it.
  const tooClose =
    direction === 1
      ? calculated.getTime() < target.getTime()
      : calculated.getTime() > target.getTime();
  return tooClose
    ? { time: target, adjusted: true }
    : { time: calculated, adjusted: false };
};

const toTimes = (
  pt: PrayerTimes,
  ishaRule: GapRule,
  fajrRule: GapRule,
): {
  times: Record<PrayerName, Date>;
  ishaAdjusted: boolean;
  fajrAdjusted: boolean;
} => {
  const isha = applyGap(pt.isha, pt.maghrib, ishaRule, 1);
  const fajr = applyGap(pt.fajr, pt.sunrise, fajrRule, -1);

  return {
    times: {
      fajr: fajr.time,
      sunrise: pt.sunrise,
      dhuhr: pt.dhuhr,
      asr: pt.asr,
      maghrib: pt.maghrib,
      isha: isha.time,
    },
    ishaAdjusted: isha.adjusted,
    fajrAdjusted: fajr.adjusted,
  };
};

const computeOne = (
  coords: Coordinates,
  date: Date,
  methodId: MethodId,
  ishaRule: GapRule,
  fajrRule: GapRule,
): MethodResult => {
  const def = METHODS[methodId];
  const params = def.params();
  // High-latitude correction — without this, Fajr/Isha at >48°N can wrap
  // into the wrong day in summer (sun never dips far enough below horizon).
  // SeventhOfTheNight = the eased ruling (taqdīr bi-sub' al-layl): Isha capped
  // at sunset + 1/7 night, Fajr at sunrise − 1/7 night. Chosen on the imam's
  // ruling "use whatever is easier for Muslims" (2026-06) — gives the earliest
  // Isha / latest Fajr of the available rules. Aladhan equivalent is
  // latitudeAdjustmentMethod=2 (kept in sync in the sanity-check route).
  params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  const pt = new PrayerTimes(coords, date, params);
  // The rules are applied to every method, not just the displayed one, so the
  // consensus badge compares the times we actually show rather than a mix of
  // adjusted and raw values.
  const { times, ishaAdjusted, fajrAdjusted } = toTimes(pt, ishaRule, fajrRule);
  return {
    methodId: def.id,
    label: def.label,
    shortLabel: def.shortLabel,
    times,
    ishaAdjusted,
    fajrAdjusted,
  };
};

export function computeDay(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  ishaRule: GapRule = ISHA_GAP_AFTER_MAGHRIB,
  fajrRule: GapRule = FAJR_GAP_BEFORE_SUNRISE,
): DayComputation {
  const coords = new Coordinates(latitude, longitude);
  const primary = computeOne(coords, date, PRIMARY_METHOD, ishaRule, fajrRule);
  const alternates = CONSENSUS_METHOD_IDS.filter(
    (id) => id !== PRIMARY_METHOD,
  ).map((id) => computeOne(coords, date, id, ishaRule, fajrRule));
  return {
    coords: { latitude, longitude },
    date,
    primary,
    alternates,
    ishaAdjusted: primary.ishaAdjusted,
    fajrAdjusted: primary.fajrAdjusted,
    ishaRule,
    fajrRule,
  };
}
