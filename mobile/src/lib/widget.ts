// The home-screen widget: next prayer name, time, and countdown, live
// without opening the app.
//
// JS's only job is to hand the native side a flat, pre-translated schedule —
// Kotlin does no i18n except digit substitution, which it cannot avoid since
// it generates the clock and countdown text itself from a raw timestamp. See
// modules/prayer-widget/android/.../PrayerWidgetProvider.kt for the render.
//
// `PrayerWidget` is null on iOS/web (the local module only declares the
// "android" platform in expo-module.config.json), so every export here is a
// silent no-op off Android rather than a throw.

import * as Localization from "expo-localization";
import type { PrayerName } from "@shared/prayer-engine";
import { LOCALES, type Locale, type Strings, type Translate } from "@/lib/i18n";
import { loadSetting } from "@/lib/storage";

import PrayerWidget from "../../modules/prayer-widget";

type NotifiedPrayer = Exclude<PrayerName, "sunrise">;
const WIDGET_PRAYERS: readonly NotifiedPrayer[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

const NAME_KEY: Record<NotifiedPrayer, keyof Strings> = {
  fajr: "fajr",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
};

/** Same storage key i18n/index.tsx persists the user's chosen locale under.
 *  Duplicated rather than imported because that module keeps it private and
 *  this file does not own it — see the STORAGE_KEY constant there. */
const LOCALE_STORAGE_KEY = "locale";

/**
 * The active locale, for callers (like notifications.ts's reschedule) that
 * run outside the I18nProvider tree and have no `locale` value on hand —
 * only a `Translate`. Mirrors i18n/index.tsx's own fallback order: the
 * user's saved choice, then the device's language, then Arabic.
 */
export async function resolveWidgetLocale(): Promise<Locale> {
  const stored = await loadSetting(LOCALE_STORAGE_KEY);
  const saved = LOCALES.find((l) => l === stored);
  if (saved) return saved;

  for (const tag of Localization.getLocales()) {
    const code = tag.languageCode?.toLowerCase();
    const match = LOCALES.find((l) => l === code);
    if (match) return match;
  }
  return "ar";
}

/**
 * Push the next several days of ADJUSTED prayer times (offsets already
 * applied — pass what notifications.ts schedules from, not raw engine
 * output) to the widget. No-op off Android, and never throws: a widget that
 * fails to update should never take a reschedule pass down with it.
 */
export function pushWidgetSchedule(
  days: Record<PrayerName, Date>[],
  t: Translate,
  locale: Locale,
): void {
  if (!PrayerWidget) return;

  try {
    const prayers: { key: NotifiedPrayer; at: number }[] = [];
    for (const times of days) {
      for (const prayer of WIDGET_PRAYERS) {
        const at = times[prayer];
        if (!at || !Number.isFinite(at.getTime())) continue; // polar night etc.
        prayers.push({ key: prayer, at: at.getTime() });
      }
    }
    prayers.sort((a, b) => a.at - b.at);

    const names = {} as Record<NotifiedPrayer, string>;
    for (const prayer of WIDGET_PRAYERS) names[prayer] = t(NAME_KEY[prayer]);

    const payload = {
      locale,
      names,
      labelNext: t("widgetNext"),
      labelIn: t("widgetIn"),
      labelEmpty: t("widgetEmpty"),
      prayers,
    };

    PrayerWidget.setSchedule(JSON.stringify(payload));
  } catch {
    // Best-effort only — see the doc comment above.
  }
}
