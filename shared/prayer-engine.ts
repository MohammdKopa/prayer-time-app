import { Coordinates, HighLatitudeRule, PrayerTimes } from "adhan";
import {
  CONSENSUS_METHOD_IDS,
  METHODS,
  type MethodId,
  PRIMARY_METHOD,
} from "./methods";

/**
 * Minimum gap between Maghrib and Isha, in minutes.
 *
 * The imam's ruling (2026-09): there must be **at least** 90 minutes between
 * the two. This is a floor, not a fixed offset — Isha is never moved earlier,
 * only held back when the computed time falls too close to Maghrib.
 *
 * It reads as the companion to the SeventhOfTheNight rule below, not a
 * contradiction of it: as early as is valid, but never less than 90 minutes
 * after Maghrib. At German latitudes the floor binds for roughly 140–150 days
 * a year (early April to early September) and moves Isha up to ~33 minutes
 * later at midsummer.
 */
export const ISHA_MIN_GAP_AFTER_MAGHRIB_MIN = 90;

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
  /** True when the Maghrib→Isha floor held Isha back from its computed time. */
  ishaFloored: boolean;
}

export interface DayComputation {
  coords: { latitude: number; longitude: number };
  /** Start of local day used as the calculation date. */
  date: Date;
  /** The method whose times the clock displays. */
  primary: MethodResult;
  /** All other methods (used only for the consensus badge). */
  alternates: MethodResult[];
  /** True when the displayed Isha was held back by the Maghrib→Isha floor. */
  ishaFloored: boolean;
  /** The floor in force for this computation, in minutes. */
  ishaMinGapMinutes: number;
}

/**
 * Apply the Maghrib→Isha floor. Returns the times plus whether it bound, so
 * the UI can say the time was held rather than silently showing an adjusted
 * number — "no bad times" means no unexplained ones either.
 */
const toTimes = (
  pt: PrayerTimes,
  minGapMinutes: number,
): { times: Record<PrayerName, Date>; ishaFloored: boolean } => {
  const floor = new Date(pt.maghrib.getTime() + minGapMinutes * 60_000);
  const ishaFloored = pt.isha.getTime() < floor.getTime();
  return {
    times: {
      fajr: pt.fajr,
      sunrise: pt.sunrise,
      dhuhr: pt.dhuhr,
      asr: pt.asr,
      maghrib: pt.maghrib,
      isha: ishaFloored ? floor : pt.isha,
    },
    ishaFloored,
  };
};

const computeOne = (
  coords: Coordinates,
  date: Date,
  methodId: MethodId,
  minGapMinutes: number,
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
  // The floor is applied to every method, not just the displayed one, so the
  // consensus badge compares the times we actually show rather than a mix of
  // adjusted and raw values.
  const { times, ishaFloored } = toTimes(pt, minGapMinutes);
  return {
    methodId: def.id,
    label: def.label,
    shortLabel: def.shortLabel,
    times,
    ishaFloored,
  };
};

export function computeDay(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  minGapMinutes: number = ISHA_MIN_GAP_AFTER_MAGHRIB_MIN,
): DayComputation {
  const coords = new Coordinates(latitude, longitude);
  const primary = computeOne(coords, date, PRIMARY_METHOD, minGapMinutes);
  const alternates = CONSENSUS_METHOD_IDS.filter(
    (id) => id !== PRIMARY_METHOD,
  ).map((id) => computeOne(coords, date, id, minGapMinutes));
  return {
    coords: { latitude, longitude },
    date,
    primary,
    alternates,
    ishaFloored: primary.ishaFloored,
    ishaMinGapMinutes: minGapMinutes,
  };
}
