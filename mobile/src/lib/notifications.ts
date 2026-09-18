import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { PrayerName } from "@shared/prayer-engine";
import { formatClock } from "@/lib/time";
import { loadSetting, saveSetting } from "@/lib/storage";
import { planAlerts } from "@/lib/prayer-prefs";
import { adjustedDaysFor } from "@/lib/schedule";
import { rescheduleSilence } from "@/lib/silence";
import { pushWidgetSchedule, resolveWidgetLocale } from "@/lib/widget";
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
/** Every adhan notification carries this prefix, so it can be cancelled
 *  without touching anything else scheduled by the app. */
const ID_PREFIX = "adhan-";

/**
 * Cancel ONLY the adhan notifications.
 *
 * This used to call cancelAllScheduledNotificationsAsync(), which also wiped
 * the dua reminders every time a prayer reschedule ran — on app open, on a
 * location change, on a language change. The reminders would silently vanish
 * and only come back if the user happened to open the dua screen again.
 *
 * Ordering the two reschedules would have hidden it rather than fixed it:
 * whoever ran last would win, and a future caller would trip over it again.
 */
async function cancelOwn(): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => n.identifier.startsWith(ID_PREFIX))
        .map((n) =>
          Notifications.cancelScheduledNotificationAsync(n.identifier),
        ),
    );
  } catch {
    // If the list cannot be read there is nothing safe to cancel. Better to
    // risk a duplicate adhan than to wipe every notification in the app.
  }
}

export async function reschedule(
  place: Place,
  t: Translate,
): Promise<number> {
  await cancelOwn();

  // The same adjusted days feed everything below. Widget and silence are
  // pushed BEFORE the notification-permission gate: a user who never wanted
  // the adhan to ring still gets a correct widget, and silence has its own
  // permission and its own toggle.
  const { prefs, days } = await adjustedDaysFor(place, HORIZON_DAYS);

  // Fire-and-forget: a widget or DND hiccup never blocks the adhan.
  void resolveWidgetLocale().then((locale) =>
    pushWidgetSchedule(days, t, locale),
  );
  void rescheduleSilence(days);

  if (!(await isEnabled())) return 0;
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted") return 0;

  const now = new Date();
  let scheduled = 0;

  for (let dayOffset = 0; dayOffset < days.length; dayOffset++) {
    // planAlerts applies the per-prayer style ("off" drops the prayer, its
    // reminder included), the reminder minutes, and skips anything already
    // past or uncomputable (above ~66N the engine returns an Invalid Date
    // for Fajr/Maghrib/Isha in the midnight-sun weeks; scheduling one throws
    // and would take the whole pass down with it).
    for (const alert of planAlerts(days[dayOffset], prefs, now)) {
      const prayerName = t(NAME_KEY[alert.prayer]);
      const title =
        alert.kind === "adhan"
          ? t("adhanTitle", { prayer: prayerName })
          : t("reminderTitle", {
              prayer: prayerName,
              minutes: alert.minutesBefore ?? 0,
            });

      await Notifications.scheduleNotificationAsync({
        identifier: `${ID_PREFIX}${alert.prayer}-${alert.kind}-${dayOffset}`,
        content: {
          title,
          body: t("adhanBody", {
            city: place.name,
            time: formatClock(days[dayOffset][alert.prayer]),
          }),
          // "silent" shows the banner and plays nothing. "beep" and "adhan"
          // both use the channel sound until a real adhan asset ships.
          sound: alert.style !== "silent",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: alert.at,
          channelId: CHANNEL_ID,
        },
      });
      scheduled++;
    }
  }

  return scheduled;
}

/** Turn the adhan off. Leaves dua reminders and anything else untouched. */
export async function cancelAll(): Promise<void> {
  await cancelOwn();
}
