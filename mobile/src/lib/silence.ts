import type { PrayerName } from "@shared/prayer-engine";
import { adjustedDaysFor, type DayTimes } from "@/lib/schedule";
import type { PrefsScopeSource } from "@/lib/prayer-prefs";
import { loadSetting, saveSetting } from "@/lib/storage";
import { isValidTime } from "@/lib/time";
import PrayerSilence, { type SilenceWindow } from "../../modules/prayer-silence";

// Auto-silence during prayer (Android Do Not Disturb), off by default.
//
// Fed the SAME adjusted days notifications.ts schedules from (lib/schedule.ts,
// per-prayer offsets already applied): the phone must go quiet exactly when
// the adhan fires, not at a separately computed time.
//
// Android only. On iOS and web the native module is a no-op (see
// modules/prayer-silence/index.ts) that reports no access and does nothing
// when asked to schedule, so every call here is safe to make unconditionally
// on any platform.

const ENABLED_KEY = "silenceEnabled";
const MINUTES_KEY = "silenceMinutes";

export const SILENCE_DURATIONS = [10, 15, 20, 30] as const;
export type SilenceDuration = (typeof SILENCE_DURATIONS)[number];
export const DEFAULT_SILENCE_MINUTES: SilenceDuration = 20;

/** Same five as the adhan notifications — sunrise gets neither. */
const SILENCED_PRAYERS: readonly Exclude<PrayerName, "sunrise">[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

/** Only for the convenience overload that computes its own days. */
const HORIZON_DAYS = 7;

export async function isSilenceEnabled(): Promise<boolean> {
  return (await loadSetting(ENABLED_KEY)) === "1";
}

export async function setSilenceEnabled(on: boolean): Promise<void> {
  await saveSetting(ENABLED_KEY, on ? "1" : "0");
}

export async function loadSilenceMinutes(): Promise<SilenceDuration> {
  const raw = await loadSetting(MINUTES_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return (SILENCE_DURATIONS as readonly number[]).includes(parsed)
    ? (parsed as SilenceDuration)
    : DEFAULT_SILENCE_MINUTES;
}

export async function setSilenceMinutes(minutes: SilenceDuration): Promise<void> {
  await saveSetting(MINUTES_KEY, String(minutes));
}

/** Whether the app currently holds Do Not Disturb access. Always false on
 *  iOS and web. */
export function hasPolicyAccess(): boolean {
  return PrayerSilence.hasPolicyAccess();
}

/** Opens the system screen where that access is granted. No-op where there
 *  is nothing to grant. */
export function openPolicyAccessSettings(): void {
  PrayerSilence.openPolicyAccessSettings();
}

/**
 * Whether Android will fire this app's alarms on the minute. Off by default
 * from Android 14: the adhan and the silence windows then ride "inexact"
 * alarms the OS is free to delay by minutes. Always true off Android.
 */
export function canScheduleExactAlarms(): boolean {
  return PrayerSilence.canScheduleExactAlarms();
}

/** Opens the "Alarms & reminders" system screen for this app. */
export function openExactAlarmSettings(): void {
  PrayerSilence.openExactAlarmSettings();
}

/**
 * True only on a Xiaomi phone whose "Autostart" switch is off for this app.
 * There an alarm cannot restart the app once the system has killed it, so
 * the adhan can wait hours for the next app start. Exact alarms do not help
 * with that; only the user can flip the switch. False everywhere else,
 * including when the state could not be read.
 */
export function autostartBlocked(): boolean {
  return PrayerSilence.autostartState() === "denied";
}

/** Opens Xiaomi's Autostart screen (or this app's settings page). */
export function openAutostartSettings(): void {
  PrayerSilence.openAutostartSettings();
}

/**
 * Replace every scheduled silence window with a fresh set for the next
 * HORIZON_DAYS, or cancel outright when the feature is off or access has
 * not been granted. Meant to be called from notifications.ts's reschedule()
 * so it stays keyed to the same triggers — app open, a location change, a
 * language change — and from the settings screen so a toggle takes effect
 * immediately rather than waiting for the next app open.
 */
export async function rescheduleSilence(days: DayTimes[]): Promise<void> {
  if (!(await isSilenceEnabled())) {
    PrayerSilence.cancelSilence();
    return;
  }
  if (!PrayerSilence.hasPolicyAccess()) return;

  const minutes = await loadSilenceMinutes();
  const now = Date.now();
  const windows: SilenceWindow[] = [];

  for (const times of days) {
    for (const prayer of SILENCED_PRAYERS) {
      const at = times[prayer];
      if (!isValidTime(at)) continue; // high-latitude midnight sun — see time.ts
      if (at.getTime() <= now) continue; // already gone today
      windows.push({ start: at.getTime(), durationMinutes: minutes });
    }
  }

  PrayerSilence.scheduleSilence(windows);
}

/** For the settings screen, which has a place but no day list on hand. */
export async function rescheduleSilenceFor(
  place: PrefsScopeSource,
): Promise<void> {
  const { days } = await adjustedDaysFor(place, HORIZON_DAYS);
  await rescheduleSilence(days);
}
