import { Coordinates, HighLatitudeRule, PrayerTimes } from "adhan";
import {
  CONSENSUS_METHOD_IDS,
  METHODS,
  type MethodId,
  PRIMARY_METHOD,
} from "./methods";

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
}

export interface DayComputation {
  coords: { latitude: number; longitude: number };
  /** Start of local day used as the calculation date. */
  date: Date;
  /** The method whose times the clock displays. */
  primary: MethodResult;
  /** All other methods (used only for the consensus badge). */
  alternates: MethodResult[];
}

const toTimes = (pt: PrayerTimes): Record<PrayerName, Date> => ({
  fajr: pt.fajr,
  sunrise: pt.sunrise,
  dhuhr: pt.dhuhr,
  asr: pt.asr,
  maghrib: pt.maghrib,
  isha: pt.isha,
});

const computeOne = (
  coords: Coordinates,
  date: Date,
  methodId: MethodId,
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
  return {
    methodId: def.id,
    label: def.label,
    shortLabel: def.shortLabel,
    times: toTimes(pt),
  };
};

export function computeDay(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
): DayComputation {
  const coords = new Coordinates(latitude, longitude);
  const primary = computeOne(coords, date, PRIMARY_METHOD);
  const alternates = CONSENSUS_METHOD_IDS.filter(
    (id) => id !== PRIMARY_METHOD,
  ).map((id) => computeOne(coords, date, id));
  return {
    coords: { latitude, longitude },
    date,
    primary,
    alternates,
  };
}
