import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { computeDay } from "@shared/prayer-engine";
import { IOS_ADHKAR_BUDGET, soonest } from "@/lib/adhan-schedule";
import type { Place } from "@/lib/location";
import { loadJSON, loadSetting, saveJSON, saveSetting } from "@/lib/storage";
import type { Occasion } from "./content";
import type { StringKey, Translate } from "@/lib/i18n";

// Adhkar reminders.
//
// Same shape as lib/notifications.ts — scheduled locally on a rolling 7-day
// horizon, cancel-then-schedule on every run so it is idempotent — with two
// deliberate differences, both of which exist so this feature cannot damage
// the prayer clock.
//
// 1. ITS OWN ANDROID CHANNEL. The adhan lives on channel "adhan"; these live
//    on "adhkar". A user who wants the adhan loud and the dhikr reminders
//    silent can have that from the system settings, without the app needing a
//    setting for it. The channel is also DEFAULT importance rather than HIGH:
//    an adhan may interrupt you, a nudge to say a dhikr may not.
//
// 2. ITS OWN IDENTIFIER PREFIX, AND NEVER cancelAllScheduledNotificationsAsync.
//    That call is global. Calling it here would silently delete every
//    scheduled adhan on the device, and the user would find out days later by
//    missing a prayer. So every notification this module schedules is given
//    an identifier starting with ID_PREFIX, and cancellation only ever names
//    those identifiers one by one. The adhan's notifications get
//    auto-generated UUIDs, which cannot collide with the prefix.
//
//    The ids are also written to storage, so a fresh process can clean up
//    after a previous one; and the live schedule is filtered by prefix as
//    well, so an id that never made it to disk is still collected. Either
//    source alone would leak notifications in one failure mode or the other.
//
// KNOWN INTERACTION, worth fixing at the call site: lib/notifications.ts
// The adhan scheduler now cancels only its own `adhan-` prefixed ids, so an
// adhan reschedule no longer wipes these reminders. Both systems are
// independent and order does not matter.


const CHANNEL_ID = "adhkar";
const ID_PREFIX = "adhkar-";
const SETTINGS_KEY = "dua:reminders";
const SCHEDULED_KEY = "dua:scheduled";

/** Days ahead to schedule. Matches the adhan's horizon; every app open and
 *  every visit to the screen pushes it back out. */
const HORIZON_DAYS = 7;

/** Friday, for the weekly salawat. `Date#getDay()` numbering. */
const FRIDAY = 5;

export interface ClockTime {
  hour: number;
  minute: number;
}

/** Off is a value rather than a separate boolean, so "enabled but with no
 *  frequency" is not representable. */
export type SalawatMode = "off" | "daily" | "friday";

export interface ReminderSettings {
  morning: boolean;
  evening: boolean;
  sleep: boolean;
  quran: boolean;
  salawat: SalawatMode;
  /** Minutes after the Fajr adhan. Morning adhkar are said after Fajr, but
   *  waking a person at the adhan itself would be the adhan's job, not this
   *  one's. */
  morningAfterFajrMin: number;
  /** Minutes after the Asr adhan. */
  eveningAfterAsrMin: number;
  sleepAt: ClockTime;
  salawatAt: ClockTime;
  quranAt: ClockTime;
}

/**
 * Everything off.
 *
 * This is not a placeholder to be tuned later: nobody gets opted in to a
 * religious reminder without asking for it. A person who installed a prayer
 * clock has consented to a prayer clock, not to being told when to say a
 * dhikr. The times below are only where the pickers start once they say yes.
 */
export const DEFAULT_SETTINGS: ReminderSettings = {
  morning: false,
  evening: false,
  sleep: false,
  quran: false,
  salawat: "off",
  morningAfterFajrMin: 30,
  eveningAfterAsrMin: 30,
  sleepAt: { hour: 22, minute: 30 },
  salawatAt: { hour: 9, minute: 0 },
  quranAt: { hour: 20, minute: 0 },
};

/** The offsets the stepper can reach, in minutes after the adhan. */
export const OFFSET_MIN = 0;
export const OFFSET_MAX = 120;
export const OFFSET_STEP = 15;

/** The clock stepper moves in quarter hours — finer than that is a setting
 *  nobody adjusts twice. */
export const CLOCK_STEP_MIN = 15;

// ---------------------------------------------------------------- settings

function isClockTime(v: unknown): v is ClockTime {
  if (typeof v !== "object" || v === null) return false;
  const t = v as Partial<ClockTime>;
  return (
    Number.isInteger(t.hour) &&
    Number.isInteger(t.minute) &&
    (t.hour as number) >= 0 &&
    (t.hour as number) < 24 &&
    (t.minute as number) >= 0 &&
    (t.minute as number) < 60
  );
}

function clampOffset(v: unknown, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.min(OFFSET_MAX, Math.max(OFFSET_MIN, Math.round(v)));
}

/**
 * Read the stored settings, field by field.
 *
 * Deliberately not a cast over whatever JSON came back: a half-written or
 * older record must degrade to the defaults, and the defaults are all off.
 * A corrupted store that turned reminders ON would be the one failure mode
 * this feature is not allowed to have.
 */
export async function loadSettings(): Promise<ReminderSettings> {
  const raw = await loadJSON<Partial<ReminderSettings>>(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;

  const salawat: SalawatMode =
    raw.salawat === "daily" || raw.salawat === "friday" ? raw.salawat : "off";

  return {
    morning: raw.morning === true,
    evening: raw.evening === true,
    sleep: raw.sleep === true,
    quran: raw.quran === true,
    salawat,
    morningAfterFajrMin: clampOffset(
      raw.morningAfterFajrMin,
      DEFAULT_SETTINGS.morningAfterFajrMin,
    ),
    eveningAfterAsrMin: clampOffset(
      raw.eveningAfterAsrMin,
      DEFAULT_SETTINGS.eveningAfterAsrMin,
    ),
    sleepAt: isClockTime(raw.sleepAt) ? raw.sleepAt : DEFAULT_SETTINGS.sleepAt,
    salawatAt: isClockTime(raw.salawatAt)
      ? raw.salawatAt
      : DEFAULT_SETTINGS.salawatAt,
    quranAt: isClockTime(raw.quranAt) ? raw.quranAt : DEFAULT_SETTINGS.quranAt,
  };
}

export async function saveSettings(s: ReminderSettings): Promise<void> {
  await saveJSON(SETTINGS_KEY, s);
}

export function anyEnabled(s: ReminderSettings): boolean {
  return s.morning || s.evening || s.sleep || s.quran || s.salawat !== "off";
}

// ------------------------------------------------------------- permission

export type PermissionResult = "granted" | "denied";

export async function requestPermission(): Promise<PermissionResult> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== "granted") return "denied";

  if (Platform.OS === "android") {
    // A separate channel from the adhan's, so silencing one does not silence
    // the other. DEFAULT importance: this should arrive, not interrupt.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Adhkar",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      vibrationPattern: [0, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }
  return "granted";
}

// ------------------------------------------------------------- scheduling

const TITLE_KEY: Record<Occasion, StringKey> = {
  morning: "notifyMorningTitle",
  evening: "notifyEveningTitle",
  sleep: "notifySleepTitle",
  salawat: "notifySalawatTitle",
  quran: "notifyQuranTitle",
};

const BODY_KEY: Record<Occasion, StringKey> = {
  morning: "notifyMorningBody",
  evening: "notifyEveningBody",
  sleep: "notifySleepBody",
  salawat: "notifySalawatBody",
  quran: "notifyQuranBody",
};

/** Deterministic, prefixed, and unique per occasion per day — so a second
 *  run over the same horizon replaces rather than stacks. */
function identifierFor(occasion: Occasion, dayOffset: number): string {
  return `${ID_PREFIX}${occasion}-${dayOffset}`;
}

function at(date: Date, time: ClockTime): Date {
  const d = new Date(date);
  d.setHours(time.hour, time.minute, 0, 0);
  return d;
}

/** Ids this module has scheduled, from storage AND from the live schedule.
 *  Storage alone misses anything a crash lost; the live list alone misses
 *  nothing, but reading it can fail, and then storage is all we have. */
async function ourScheduledIds(): Promise<string[]> {
  const ids = new Set<string>();

  const stored = await loadJSON<string[]>(SCHEDULED_KEY);
  if (Array.isArray(stored)) {
    for (const id of stored) {
      if (typeof id === "string" && id.startsWith(ID_PREFIX)) ids.add(id);
    }
  }

  try {
    for (const req of await Notifications.getAllScheduledNotificationsAsync()) {
      if (req.identifier.startsWith(ID_PREFIX)) ids.add(req.identifier);
    }
  } catch {
    // Fall back to what storage knew. Never widen to a cancel-all.
  }

  return [...ids];
}

/**
 * Cancel this module's notifications and nothing else.
 *
 * There is no cancel-all here and there must never be one: the adhan's
 * notifications live in the same queue, and losing them is the failure this
 * whole design exists to prevent.
 */
export async function cancelAllAdhkar(): Promise<void> {
  for (const id of await ourScheduledIds()) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Already fired, already gone, or never existed. Carry on: one id that
      // cannot be cancelled must not strand the rest.
    }
  }
  await saveJSON(SCHEDULED_KEY, []);
}

interface Planned {
  occasion: Occasion;
  when: Date;
  dayOffset: number;
}

/** When each enabled reminder falls over the horizon, in order. Pure, so the
 *  schedule can be reasoned about (and eyeballed) without a device. */
export function planReminders(
  place: Place,
  settings: ReminderSettings,
  now: Date = new Date(),
): Planned[] {
  const out: Planned[] = [];

  for (let dayOffset = 0; dayOffset < HORIZON_DAYS; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);

    const add = (occasion: Occasion, when: Date) => {
      if (when.getTime() > now.getTime()) {
        out.push({ occasion, when, dayOffset });
      }
    };

    if (settings.morning || settings.evening) {
      const times = computeDay(place.latitude, place.longitude, date).primary
        .times;
      if (settings.morning) {
        add(
          "morning",
          new Date(
            times.fajr.getTime() + settings.morningAfterFajrMin * 60_000,
          ),
        );
      }
      if (settings.evening) {
        add(
          "evening",
          new Date(times.asr.getTime() + settings.eveningAfterAsrMin * 60_000),
        );
      }
    }

    if (settings.sleep) add("sleep", at(date, settings.sleepAt));
    if (settings.quran) add("quran", at(date, settings.quranAt));

    if (
      settings.salawat === "daily" ||
      (settings.salawat === "friday" && date.getDay() === FRIDAY)
    ) {
      add("salawat", at(date, settings.salawatAt));
    }
  }

  return out.sort((a, b) => a.when.getTime() - b.when.getTime());
}

/**
 * Replace this module's scheduled reminders with a fresh set.
 *
 * Cancel-then-schedule, like the adhan's — called on every visit to the
 * screen and on every settings change, so it must never stack duplicates or
 * leave a disabled reminder behind.
 *
 * Takes a `Translate` like the adhan scheduler does — these keys now live in
 * the main string table.
 */
export async function reschedule(
  place: Place,
  t: Translate,
): Promise<number> {
  await cancelAllAdhkar();

  const settings = await loadSettings();
  if (!anyEnabled(settings)) return 0;

  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted") return 0;

  const scheduled: string[] = [];

  // iOS keeps only 64 pending notifications app-wide, shared with the
  // adhan; see IOS_ADHKAR_BUDGET in adhan-schedule.ts.
  const plans = soonest(
    planReminders(place, settings),
    Platform.OS === "ios" ? IOS_ADHKAR_BUDGET : Infinity,
    (p) => p.when,
  );
  for (const plan of plans) {
    const identifier = identifierFor(plan.occasion, plan.dayOffset);
    try {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: t(TITLE_KEY[plan.occasion]),
          body: t(BODY_KEY[plan.occasion]),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: plan.when,
          channelId: CHANNEL_ID,
        },
      });
      scheduled.push(identifier);
    } catch {
      // One rejected alarm — an OS limit, a clock that moved — must not cost
      // the rest of the horizon. Record what did get through.
    }
  }

  await saveJSON(SCHEDULED_KEY, scheduled);
  return scheduled.length;
}

// ------------------------------------------------------------- formatting

/** Zero-padded 24-hour clock, matching lib/time.ts. Kept here rather than
 *  imported because that module formats a Date and this is a wall time with
 *  no date attached. */
export function formatClockTime(t: ClockTime): string {
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(
    2,
    "0",
  )}`;
}

/** Step a wall time, wrapping at midnight so the stepper never dead-ends. */
export function stepClockTime(t: ClockTime, deltaMin: number): ClockTime {
  const total = (t.hour * 60 + t.minute + deltaMin + 24 * 60) % (24 * 60);
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

export function stepOffset(current: number, deltaMin: number): number {
  return Math.min(OFFSET_MAX, Math.max(OFFSET_MIN, current + deltaMin));
}

// ------------------------------------------------- last-known schedule size

const COUNT_KEY = "dua:count";

/** How many reminders the last run put on the queue. Shown on the screen so
 *  "on" is visibly different from "on but the OS dropped them". */
export async function loadScheduledCount(): Promise<number> {
  const raw = await loadSetting(COUNT_KEY);
  const n = raw === null ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function saveScheduledCount(n: number): Promise<void> {
  await saveSetting(COUNT_KEY, String(n));
}
