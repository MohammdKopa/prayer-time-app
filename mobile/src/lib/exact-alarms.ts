import { Alert } from "react-native";

import type { Translate } from "@/lib/i18n";
import { isEnabled } from "@/lib/notifications";
import {
  autostartBlocked,
  canScheduleExactAlarms,
  openAutostartSettings,
  openExactAlarmSettings,
} from "@/lib/silence";

// The exact-alarm permission, surfaced where it matters.
//
// From Android 14 the OS denies SCHEDULE_EXACT_ALARM by default, and there is
// no runtime dialog for it — only a system screen the user has to be sent
// to. Without it every adhan is an "inexact" alarm with a one-hour delivery
// window (seen on the device: window=+1h on all 33). A prayer clock that may
// ring an hour late has failed at its one job, so this is asked for the
// moment notifications are switched on, and the clock screen keeps saying so
// until it is granted. It is never asked while notifications are off: an
// alarm permission for alarms the user does not want is noise.

/**
 * Why the adhan may be late, or null when nothing we can see stands in its
 * way. Only asked while the adhan is on. Exact alarms come first: without
 * them every phone is late, while autostart only matters on Xiaomi.
 */
export type LateReason = "exact" | "autostart";

export async function adhanLateReason(): Promise<LateReason | null> {
  if (!(await isEnabled())) return null;
  if (!canScheduleExactAlarms()) return "exact";
  if (autostartBlocked()) return "autostart";
  return null;
}

/** Sends the user to the one system screen that fixes `reason`. */
export function openFixFor(reason: LateReason): void {
  if (reason === "exact") openExactAlarmSettings();
  else openAutostartSettings();
}

/**
 * Explain, then send the user to the "Alarms & reminders" screen. Returns
 * at once; the caller re-checks canScheduleExactAlarms() when the app comes
 * back to the foreground.
 */
export function askForExactAlarms(t: Translate): void {
  if (canScheduleExactAlarms()) {
    askForAutostart(t);
    return;
  }
  Alert.alert(t("exactAlarmTitle"), t("exactAlarmBody"), [
    { text: t("exactAlarmLater"), style: "cancel" },
    { text: t("exactAlarmGrant"), onPress: () => openExactAlarmSettings() },
  ]);
}

/**
 * The Xiaomi half of the same question, asked when the adhan is switched on
 * and exact alarms are already allowed. Silent on every other phone.
 */
export function askForAutostart(t: Translate): void {
  if (!autostartBlocked()) return;
  Alert.alert(t("autostartTitle"), t("autostartBody"), [
    { text: t("exactAlarmLater"), style: "cancel" },
    { text: t("autostartGrant"), onPress: () => openAutostartSettings() },
  ]);
}
