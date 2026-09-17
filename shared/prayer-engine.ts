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

/**
 * Minimum gap between Fajr and sunrise, in minutes.
 *
 * The second half of the same ruling (Sheikh Ayman, Marl, 2026-06-03): "we make
 * the Fajr adhan an hour and a half before sunrise as well". Like the Isha rule
 * it is applied as a floor — Fajr is never moved later, only earlier, so the
 * window before sunrise is never shorter than this.
 *
 * Both rules address the same thing: the high-latitude summer squeeze. In June
 * at 51°N the seventh-of-the-night rule leaves barely an hour either side of
 * the night, and the sheikh wants ninety minutes.
 *
 * They are floors rather than fixed offsets deliberately. Applied literally as
 * "always 90" they would REVERSE his stated reason for 217 days of the year:
 * in December the Maghrib→Isha gap is already 118 minutes, and forcing it to
 * 90 would call Isha up to 29 minutes before the calculated time, while the
 * red twilight he is waiting on takes longer in winter, not less. A fixed
 * Fajr would likewise fall before dawn on 144 summer days. As floors, both
 * widen the squeezed summer windows and leave winter untouched.
 */
export const FAJR_MIN_GAP_BEFORE_SUNRISE_MIN = 90;

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
  /** True when the Fajr→sunrise floor moved Fajr earlier than computed. */
  fajrFloored: boolean;
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
  /** True when the displayed Fajr was moved earlier by the Fajr→sunrise floor. */
  fajrFloored: boolean;
  /** The Maghrib→Isha floor in force for this computation, in minutes. */
  ishaMinGapMinutes: number;
  /** The Fajr→sunrise floor in force for this computation, in minutes. */
  fajrMinGapMinutes: number;
}

/**
 * Apply the Maghrib→Isha floor. Returns the times plus whether it bound, so
 * the UI can say the time was held rather than silently showing an adjusted
 * number — "no bad times" means no unexplained ones either.
 */
const toTimes = (
  pt: PrayerTimes,
  ishaMinGapMinutes: number,
  fajrMinGapMinutes: number,
): {
  times: Record<PrayerName, Date>;
  ishaFloored: boolean;
  fajrFloored: boolean;
} => {
  // Isha: never closer to Maghrib than the minimum. Only ever moved later.
  const ishaFloor = new Date(pt.maghrib.getTime() + ishaMinGapMinutes * 60_000);
  const ishaFloored = pt.isha.getTime() < ishaFloor.getTime();

  // Fajr: never closer to sunrise than the minimum. Only ever moved earlier.
  const fajrFloor = new Date(pt.sunrise.getTime() - fajrMinGapMinutes * 60_000);
  const fajrFloored = pt.fajr.getTime() > fajrFloor.getTime();

  return {
    times: {
      fajr: fajrFloored ? fajrFloor : pt.fajr,
      sunrise: pt.sunrise,
      dhuhr: pt.dhuhr,
      asr: pt.asr,
      maghrib: pt.maghrib,
      isha: ishaFloored ? ishaFloor : pt.isha,
    },
    ishaFloored,
    fajrFloored,
  };
};

const computeOne = (
  coords: Coordinates,
  date: Date,
  methodId: MethodId,
  ishaMinGapMinutes: number,
  fajrMinGapMinutes: number,
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
  const { times, ishaFloored, fajrFloored } = toTimes(
    pt,
    ishaMinGapMinutes,
    fajrMinGapMinutes,
  );
  return {
    methodId: def.id,
    label: def.label,
    shortLabel: def.shortLabel,
    times,
    ishaFloored,
    fajrFloored,
  };
};

export function computeDay(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  ishaMinGapMinutes: number = ISHA_MIN_GAP_AFTER_MAGHRIB_MIN,
  fajrMinGapMinutes: number = FAJR_MIN_GAP_BEFORE_SUNRISE_MIN,
): DayComputation {
  const coords = new Coordinates(latitude, longitude);
  const primary = computeOne(
    coords,
    date,
    PRIMARY_METHOD,
    ishaMinGapMinutes,
    fajrMinGapMinutes,
  );
  const alternates = CONSENSUS_METHOD_IDS.filter(
    (id) => id !== PRIMARY_METHOD,
  ).map((id) =>
    computeOne(coords, date, id, ishaMinGapMinutes, fajrMinGapMinutes),
  );
  return {
    coords: { latitude, longitude },
    date,
    primary,
    alternates,
    ishaFloored: primary.ishaFloored,
    fajrFloored: primary.fajrFloored,
    ishaMinGapMinutes,
    fajrMinGapMinutes,
  };
}
