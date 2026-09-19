import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { PrayerName } from "@shared/prayer-engine";
import { formatClock } from "@/lib/time";
import { loadSetting, saveSetting } from "@/lib/storage";
import {
  CHANNEL_BEEP,
  CHANNEL_SILENT,
  channelFor,
  loadAdhanVoice,
  RECORDED_VOICES,
  RETIRED_CHANNELS,
  VOICE_FILES,
  voiceChannel,
  type AdhanVoice,
  type RecordedVoice,
} from "@/lib/adhan-voice";
import {
  alertIdentifier,
  HORIZON_DAYS,
  ID_PREFIX,
  isOrphanIdentifier,
  localDayKey,
  ownIdentifiers,
  PREVIEW_ID,
  scheduleFingerprint,
} from "@/lib/adhan-schedule";
import { planAlerts, type PrayerAlert } from "@/lib/prayer-prefs";
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
// location, a changed language. "Reschedule" is cheap when nothing changed —
// see the fingerprint in adhan-schedule.ts.

const ENABLED_KEY = "notifications";

/**
 * The fingerprint of the schedule this PROCESS last built successfully.
 *
 * Deliberately not persisted. A "force stop" — by the user, or by Xiaomi's
 * battery manager, which does the same thing to apps it dislikes — wipes
 * every alarm the app holds while leaving expo-notifications' own store
 * intact. Seen on the Redmi Note 13 (2026-09-19): the store said 33
 * scheduled, AlarmManager had none, and a persisted fingerprint would have
 * kept saying "nothing to do" forever. So every cold start rebuilds, and the
 * skip only covers re-runs within one process: the GPS fix landing after
 * the saved place, a screen regaining focus, a jittered coordinate.
 */
let lastFingerprint: string | null = null;

export { HORIZON_DAYS, ownIdentifiers };

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

  await ensureChannels();
  return "granted";
}

/** Channel names show in Android's own settings UI, which has no access to
 *  our i18n table — plain English there is better than a locale frozen at
 *  channel creation. */
const VOICE_LABEL: Record<RecordedVoice, string> = {
  full: "full",
  short: "short",
};

/**
 * Create every channel the scheduler posts to. Idempotent: Android ignores
 * changes to an existing channel's sound, which is exactly why each voice
 * has its own channel instead of one channel whose sound we'd try to swap.
 *
 * Without explicit channels Android files these under a default one the user
 * cannot tune, and importance cannot be raised later.
 *
 * Done once per process. Channels outlive the app, so re-creating them on
 * every reschedule and every "play sample" was seven native round trips for
 * nothing; the promise is kept so concurrent callers share one run, and
 * dropped on failure so the next caller retries.
 */
let channelsReady: Promise<void> | null = null;

function ensureChannels(): Promise<void> {
  if (Platform.OS !== "android") return Promise.resolve();
  if (!channelsReady) {
    channelsReady = createChannels().catch((e: unknown) => {
      channelsReady = null;
      throw e;
    });
  }
  return channelsReady;
}

async function createChannels(): Promise<void> {
  const base = {
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 400, 200, 400],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  };
  await Promise.all([
    // The "system" voice posts on the beep channel below — no channel of
    // its own.
    ...RECORDED_VOICES.map((voice) =>
      Notifications.setNotificationChannelAsync(voiceChannel(voice), {
        ...base,
        name: `Adhan – ${VOICE_LABEL[voice]}`,
        sound: VOICE_FILES[voice],
      }),
    ),
    Notifications.setNotificationChannelAsync(CHANNEL_BEEP, {
      ...base,
      name: "Adhan – beep",
      sound: "default",
    }),
    Notifications.setNotificationChannelAsync(CHANNEL_SILENT, {
      ...base,
      name: "Adhan – silent",
      sound: null,
    }),
    ...RETIRED_CHANNELS.map((id) =>
      Notifications.deleteNotificationChannelAsync(id).catch(() => {}),
    ),
  ]);
}

/**
 * Fire one notification right now on the chosen voice's channel, so the
 * picker can let the user hear it without a media player dependency. It is
 * a real notification — the user dismisses it like any other.
 *
 * A channel-only trigger, deliberately: it is handed straight to the
 * presenter. The earlier one-second interval trigger went through
 * AlarmManager, and on Android 14+ — where exact alarms are off unless the
 * user grants them — an "inexact" one-second alarm landed two seconds or
 * more later. A sample button that answers late feels broken.
 */
export async function previewVoice(voice: AdhanVoice, t: Translate): Promise<void> {
  await ensureChannels();
  const { channelId, sound } = channelFor("adhan", voice);
  await Notifications.scheduleNotificationAsync({
    identifier: PREVIEW_ID,
    content: {
      title: t("voicePreviewTitle"),
      body: t("voicePreviewBody"),
      sound,
    },
    trigger: { channelId },
  });
}

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
  const ids = new Set(ownIdentifiers());
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      // Ours by prefix, plus the identifier-less leftovers of the first
      // builds (see isOrphanIdentifier) — those rang alongside ours.
      if (n.identifier.startsWith(ID_PREFIX) || isOrphanIdentifier(n.identifier)) {
        ids.add(n.identifier);
      }
    }
  } catch {
    // The listing failed — the deterministic set below still covers every
    // identifier this app has ever scheduled, so nothing is left behind.
  }
  await Promise.all(
    [...ids].map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
}

/** How many adhan/reminder alarms expo-notifications still holds. Fired
 *  ones are dropped from its store on delivery, so on an intact schedule
 *  this equals the number of alerts still ahead. */
async function pendingOwnCount(): Promise<number | null> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.filter(
      (n) => n.identifier.startsWith(ID_PREFIX) && n.identifier !== PREVIEW_ID,
    ).length;
  } catch {
    return null;
  }
}

/**
 * Reschedules run one after another, never interleaved.
 *
 * Two used to run at once on every app open — the saved place fires the
 * effect, then the GPS fix fires it again a second later — each cancelling
 * what the other was in the middle of creating. The ids are identical so the
 * final state was still one alarm per id, but the work was doubled and the
 * order of writes was luck. Now the second waits for the first, finds the
 * fingerprint it wrote, and returns after one listing.
 */
let chain: Promise<unknown> = Promise.resolve();

/**
 * Replace every scheduled adhan with a fresh set for the next HORIZON_DAYS —
 * or, when nothing that feeds the schedule has changed since the last run
 * and the alarms are still in place, leave them alone.
 *
 * Called on every app open, on a location change, on a language change and
 * on every settings change that touches the times, so it must never leave
 * yesterday's schedule behind or stack duplicates. Resolves to the number of
 * alerts on the queue.
 */
export function reschedule(place: Place, t: Translate): Promise<number> {
  const run = chain.then(() => runReschedule(place, t));
  chain = run.catch(() => undefined);
  return run;
}

async function runReschedule(place: Place, t: Translate): Promise<number> {
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

  const enabled = await isEnabled();
  const perm = enabled ? await Notifications.getPermissionsAsync() : null;
  if (!enabled || perm?.status !== "granted") {
    // Off, or the permission was revoked in system settings: whatever was
    // scheduled must go. Only worth the hundred cancels if the store still
    // holds something — a fresh install with the adhan off pays one listing.
    lastFingerprint = null;
    const pending = await pendingOwnCount();
    if (pending === null || pending > 0) await cancelOwn();
    return 0;
  }

  const voice = await loadAdhanVoice();
  const now = new Date();

  // planAlerts applies the per-prayer style ("off" drops the prayer, its
  // reminder included), the reminder minutes, and skips anything already
  // past or uncomputable (above ~66N the engine returns an Invalid Date
  // for Fajr/Maghrib/Isha in the midnight-sun weeks; scheduling one throws
  // and would take the whole pass down with it).
  const plan: { alert: PrayerAlert; dayOffset: number }[] = [];
  days.forEach((day, dayOffset) => {
    for (const alert of planAlerts(day, prefs, now)) plan.push({ alert, dayOffset });
  });

  const fingerprint = scheduleFingerprint({
    latitude: place.latitude,
    longitude: place.longitude,
    placeName: place.name,
    prefsKey: JSON.stringify(prefs),
    voice,
    textSample: [
      t("adhanTitle", { prayer: t("fajr") }),
      t("reminderTitle", { prayer: t("fajr"), minutes: 0 }),
      t("adhanBody", { city: place.name, time: "" }),
    ].join("|"),
    day: localDayKey(now),
  });

  if (lastFingerprint === fingerprint) {
    const pending = await pendingOwnCount();
    if (pending === plan.length) return pending;
    // Fewer or more than expected: something fired, something was dropped,
    // or something is stacked. Either way, rebuild.
  }

  // Cleared first so a run that dies halfway can never be mistaken for a
  // complete one by the next call.
  lastFingerprint = null;
  await ensureChannels();
  await cancelOwn();

  let scheduled = 0;
  for (const { alert, dayOffset } of plan) {
    const prayerName = t(NAME_KEY[alert.prayer]);
    const route = channelFor(alert.style, voice);
    const title =
      alert.kind === "adhan"
        ? t("adhanTitle", { prayer: prayerName })
        : t("reminderTitle", {
            prayer: prayerName,
            minutes: alert.minutesBefore ?? 0,
          });

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: alertIdentifier(alert.prayer, alert.kind, dayOffset),
        content: {
          title,
          body: t("adhanBody", {
            city: place.name,
            time: formatClock(days[dayOffset][alert.prayer]),
          }),
          // Android 8+ takes the sound from the channel, older Android from
          // here; channelFor gives both for the same style + voice.
          sound: route.sound,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: alert.at,
          channelId: route.channelId,
        },
      });
      scheduled++;
    } catch {
      // One rejected alarm — an OS limit, a clock that moved under us —
      // must not cost the rest of the horizon.
    }
  }

  if (scheduled === plan.length) lastFingerprint = fingerprint;
  return scheduled;
}

/** Turn the adhan off. Leaves dua reminders and anything else untouched. */
export async function cancelAll(): Promise<void> {
  lastFingerprint = null;
  await cancelOwn();
}

// ------------------------------------------------------------- diagnostics

export interface ScheduledAlert {
  id: string;
  /** When it will fire, or null for a trigger with no fixed time. */
  at: Date | null;
  title: string;
  channelId: string | null;
}

/**
 * Every adhan/reminder alarm expo-notifications currently holds, soonest
 * first. For the settings screen: "the phone rang twice" is answered by
 * whether two entries share a time here, or whether this list is clean and
 * the second ring came from somewhere else entirely.
 */
export async function listScheduledAlerts(): Promise<ScheduledAlert[]> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const out: ScheduledAlert[] = [];
  for (const n of all) {
    // Orphans are listed too: if one is still there, the user should see it.
    if (!n.identifier.startsWith(ID_PREFIX) && !isOrphanIdentifier(n.identifier)) {
      continue;
    }
    const trigger = n.trigger as {
      value?: unknown;
      channelId?: unknown;
    } | null;
    const at =
      trigger && typeof trigger.value === "number"
        ? new Date(trigger.value)
        : null;
    out.push({
      id: n.identifier,
      at,
      title: n.content.title ?? "",
      channelId:
        trigger && typeof trigger.channelId === "string"
          ? trigger.channelId
          : null,
    });
  }
  return out.sort((a, b) => {
    if (a.at && b.at) return a.at.getTime() - b.at.getTime();
    if (a.at) return -1;
    if (b.at) return 1;
    return a.id.localeCompare(b.id);
  });
}
