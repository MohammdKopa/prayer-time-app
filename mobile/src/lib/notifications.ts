import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { computeDay, type PrayerName } from "@shared/prayer-engine";
import { formatClock } from "@/lib/time";
import { loadSetting, saveSetting } from "@/lib/storage";
import type { Place } from "@/lib/location";
import type { Strings, Translate } from "@/lib/i18n";

// Adhan notifications.
//
// Scheduled LOCALLY, not pushed from a server. The times are computed on the
// device from coordinates, so the app works with no network at all — on a
// plane, in a basement, with the SIM out. A server round-trip would make a
// prayer clock depend on a VPS being up, which is the wrong trade.
//
// Android reschedules these across a reboot itself; we also reschedule on
// every app open, which covers the rest: the horizon running out, a changed
// location, a changed language.

const ENABLED_KEY = "notifications";
const CHANNEL_ID = "adhan";

/** Days ahead to schedule. Android caps concurrent alarms well above this,
 *  and every app open pushes the horizon back out. */
const HORIZON_DAYS = 7;

/** Sunrise is shown in the app but is not a prayer and gets no adhan. It is
 *  excluded at the type level, so adding it here is a compile error. */
type NotifiedPrayer = Exclude<PrayerName, "sunrise">;
const NOTIFIED: NotifiedPrayer[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const NAME_KEY: Record<NotifiedPrayer, keyof Strings> = {
  fajr: "fajr",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function isEnabled(): Promise<boolean> {
  return (await loadSetting(ENABLED_KEY)) === "1";
}

export async function setEnabled(on: boolean): Promise<void> {
  await saveSetting(ENABLED_KEY, on ? "1" : "0");
}

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
    // Without an explicit channel Android files these under a default one the
    // user cannot tune, and importance cannot be raised later.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Adhan",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 400, 200, 400],
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  return "granted";
}

/**
 * Replace every scheduled adhan with a fresh set for the next HORIZON_DAYS.
 *
 * Cancelling first is what keeps this idempotent: called on every app open, on
 * a location change and on a language change, it must never leave yesterday's
 * schedule behind or stack duplicates.
 */
export async function reschedule(
  place: Place,
  t: Translate,
): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!(await isEnabled())) return 0;
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted") return 0;

  const now = Date.now();
  let scheduled = 0;

  for (let dayOffset = 0; dayOffset < HORIZON_DAYS; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const times = computeDay(place.latitude, place.longitude, date).primary
      .times;

    for (const prayer of NOTIFIED) {
      const at = times[prayer];
      if (at.getTime() <= now) continue; // already gone today

      await Notifications.scheduleNotificationAsync({
        content: {
          title: t("adhanTitle", { prayer: t(NAME_KEY[prayer]) }),
          body: t("adhanBody", {
            city: place.name,
            time: formatClock(at),
          }),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: at,
          channelId: CHANNEL_ID,
        },
      });
      scheduled++;
    }
  }
  return scheduled;
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
