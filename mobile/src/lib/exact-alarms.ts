import { Alert } from "react-native";

import type { Translate } from "@/lib/i18n";
import { isEnabled } from "@/lib/notifications";
import { canScheduleExactAlarms, openExactAlarmSettings } from "@/lib/silence";

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

/** True when the adhan is on but Android may deliver it late. */
export async function adhanMayBeLate(): Promise<boolean> {
  if (canScheduleExactAlarms()) return false;
  return isEnabled();
}

/**
 * Explain, then send the user to the "Alarms & reminders" screen. Returns
 * at once; the caller re-checks canScheduleExactAlarms() when the app comes
 * back to the foreground.
 */
export function askForExactAlarms(t: Translate): void {
  if (canScheduleExactAlarms()) return;
  Alert.alert(t("exactAlarmTitle"), t("exactAlarmBody"), [
    { text: t("exactAlarmLater"), style: "cancel" },
    { text: t("exactAlarmGrant"), onPress: () => openExactAlarmSettings() },
  ]);
}
