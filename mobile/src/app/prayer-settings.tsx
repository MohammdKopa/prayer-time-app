import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { computeDay, PRAYER_ORDER, type PrayerName } from "@shared/prayer-engine";
import { useI18n, type Strings, type StringKey } from "@/lib/i18n";
import { usePlaceContext } from "@/lib/place-context";
import {
  applyPrefsDetailed,
  defaultPrefs,
  isDefaultPrefs,
  loadPrefs,
  NOTIFICATION_STYLES,
  nudgeOffset,
  OFFSET_LIMIT_MINUTES,
  prefsScope,
  REMINDER_MAX_MINUTES,
  REMINDER_MIN_MINUTES,
  REMINDER_PRESETS,
  resetPrayer,
  savePrefs,
  withNotify,
  withReminder,
  type NotificationStyle,
  type NotifiedPrayer,
  type PrayerPrefs,
} from "@/lib/prayer-prefs";
import { formatClock, toArabicIndic } from "@/lib/time";
import { COLORS, FONTS, TEXT } from "@/theme";

// Per-prayer personalisation.
//
// One card per prayer, collapsed to a single row until it is opened: six
// prayers with three controls each is a wall, and almost every user comes here
// to change one prayer by three minutes and leave. Collapsed, the row says the
// only two things that matter at a glance — the time that will be shown, and
// whether it differs from the calculation.
//
// The screen owns no rule. Which time a preference produces is decided by
// applyPrefsDetailed in lib/prayer-prefs.ts, and the screen renders what comes
// back, including `capped` — a shrunk offset is explained, never silent.

const NAME_KEY: Record<PrayerName, keyof Strings> = {
  fajr: "fajr",
  sunrise: "sunrise",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
};

const STYLE_KEY: Record<NotificationStyle, StringKey> = {
  adhan: "notifyAdhan",
  beep: "notifyBeep",
  silent: "notifySilent",
  off: "notifyOff",
};

/** Coarse and fine in one row: ±5 gets you across the range in a few taps,
 *  ±1 lands it exactly. A single ±1 stepper would need thirty taps. */
const STEPS = [5, 1] as const;

export default function PrayerSettingsScreen() {
  const router = useRouter();
    const { t } = useI18n();
  const { place } = usePlaceContext();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>{t("back")}</Text>
          </Pressable>
          <Text style={styles.title}>{t("prayerAdjustTitle")}</Text>
          <View style={styles.spacer} />
        </View>

        <Text style={styles.intro}>{t("prayerAdjustIntro")}</Text>
        <Text style={styles.scope}>
          {t("prayerAdjustScope", { city: place.name })}
        </Text>

        {/*
          Keyed on the place. Offsets are stored per city, so moving to another
          town has to drop everything this screen is holding — the loaded
          preferences, which card is open, a half-typed reminder. Remounting on
          the key does that in one move, and leaves the effect below with
          nothing to do but load.
        */}
        <CityPrefs key={prefsScope(place)} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CityPrefs() {
  const { t, locale } = useI18n();
    const { place } = usePlaceContext();

  const [prefs, setPrefs] = useState<PrayerPrefs | null>(null);
  const [openPrayer, setOpenPrayer] = useState<PrayerName | null>(null);
  const [customText, setCustomText] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadPrefs(place);
      if (!cancelled) setPrefs(loaded);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const base = useMemo(
    () => computeDay(place.latitude, place.longitude, new Date()).primary.times,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey, place.latitude, place.longitude],
  );

  // Defaults stand in while the stored prefs load, so the card layout does not
  // jump once they arrive. Memoised so the adjusted times are not recomputed
  // on every keystroke in the custom-reminder field.
  const shown = useMemo(() => prefs ?? defaultPrefs(), [prefs]);
  const adjusted = useMemo(
    () => applyPrefsDetailed(base, shown),
    [base, shown],
  );

  function update(next: PrayerPrefs) {
    setPrefs(next);
    setConfirmReset(false);
    void savePrefs(place, next);
  }

  function resetEverything() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    const next = defaultPrefs();
    setPrefs(next);
    setConfirmReset(false);
    setCustomText("");
    void savePrefs(place, next);
  }

  const num = (s: string) => (locale === "ar" ? toArabicIndic(s) : s);

  function offsetLine(prayer: PrayerName): string {
    const minutes = shown.offsets[prayer];
    if (minutes === 0) return t("offsetNone");
    return num(
      minutes > 0
        ? t("offsetAfter", { minutes })
        : t("offsetBefore", { minutes: -minutes }),
    );
  }

  function offsetBadge(prayer: PrayerName): string | null {
    const minutes = adjusted.applied[prayer];
    if (minutes === 0) return null;
    return num(
      minutes > 0
        ? t("plusMinutes", { minutes })
        : t("minusMinutes", { minutes: -minutes }),
    );
  }

  return (
    <>
      {prefs === null ? (
        <Text style={styles.intro}>{t("loadingPrefs")}</Text>
      ) : (
        PRAYER_ORDER.map((prayer) => {
          const open = openPrayer === prayer;
          const badge = offsetBadge(prayer);
          return (
            <View key={prayer} style={styles.card}>
              <Pressable
                style={styles.option}
                onPress={() => {
                  setOpenPrayer(open ? null : prayer);
                  setCustomText("");
                }}
              >
                <Text
                  style={[styles.optionText, badge !== null && styles.selected]}
                >
                  {t(NAME_KEY[prayer])}
                </Text>
                <View style={styles.rowEnd}>
                  {badge !== null && (
                    <Text style={styles.badge}>{badge}</Text>
                  )}
                  <Text style={styles.time}>
                    {num(formatClock(adjusted.times[prayer]))}
                  </Text>
                </View>
              </Pressable>
  
              {open && (
                <View style={styles.body}>
                  <Text style={styles.calculated}>
                    {num(
                      t("calculatedAt", {
                        time: formatClock(base[prayer]),
                      }),
                    )}
                  </Text>
  
                  <Text style={styles.label}>{t("offsetLabel")}</Text>
                  <View style={styles.stepper}>
                    {STEPS.map((step) => (
                      <Pressable
                        key={`minus-${step}`}
                        style={styles.step}
                        onPress={() =>
                          update(nudgeOffset(shown, prayer, -step))
                        }
                        disabled={
                          shown.offsets[prayer] <= -OFFSET_LIMIT_MINUTES
                        }
                      >
                        <Text
                          style={[
                            styles.stepText,
                            shown.offsets[prayer] <= -OFFSET_LIMIT_MINUTES &&
                              styles.stepDisabled,
                          ]}
                        >
                          {num(t("minusMinutes", { minutes: step }))}
                        </Text>
                      </Pressable>
                    ))}
                    <Text style={styles.offsetValue}>
                      {offsetLine(prayer)}
                    </Text>
                    {[...STEPS].reverse().map((step) => (
                      <Pressable
                        key={`plus-${step}`}
                        style={styles.step}
                        onPress={() =>
                          update(nudgeOffset(shown, prayer, step))
                        }
                        disabled={
                          shown.offsets[prayer] >= OFFSET_LIMIT_MINUTES
                        }
                      >
                        <Text
                          style={[
                            styles.stepText,
                            shown.offsets[prayer] >= OFFSET_LIMIT_MINUTES &&
                              styles.stepDisabled,
                          ]}
                        >
                          {num(t("plusMinutes", { minutes: step }))}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
  
                  {adjusted.capped[prayer] && (
                    <Text style={styles.warn}>{t("offsetCapped")}</Text>
                  )}
  
                  {prayer === "sunrise" ? (
                    <Text style={styles.hint}>{t("sunriseNote")}</Text>
                  ) : (
                    <PrayerAlerts
                      prayer={prayer}
                      prefs={shown}
                      t={t}
                      num={num}
                      customText={customText}
                      setCustomText={setCustomText}
                      update={update}
                    />
                  )}
  
                  <Pressable
                    style={styles.reset}
                    onPress={() => update(resetPrayer(shown, prayer))}
                  >
                    <Text style={styles.resetText}>{t("resetPrayer")}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}
  
      {prefs !== null && !isDefaultPrefs(prefs) && (
        <Pressable style={styles.resetAll} onPress={resetEverything}>
          <Text style={styles.resetText}>
            {confirmReset ? t("resetAllConfirm") : t("resetAll")}
          </Text>
        </Pressable>
      )}
    </>
  );
}

/** Notification style and pre-prayer reminder — everything sunrise does not
 *  get. Split out so the prayer card above stays readable. */
function PrayerAlerts({
  prayer,
  prefs,
  t,
  num,
  customText,
  setCustomText,
  update,
}: {
  prayer: NotifiedPrayer;
  prefs: PrayerPrefs;
  t: (key: any, vars?: Record<string, string | number>) => string;
  num: (s: string) => string;
  customText: string;
  setCustomText: (s: string) => void;
  update: (next: PrayerPrefs) => void;
}) {
  const reminder = prefs.reminderMinutes[prayer];
  const isPreset =
    reminder !== null && (REMINDER_PRESETS as readonly number[]).includes(reminder);

  function commitCustom() {
    const parsed = Number.parseInt(customText, 10);
    setCustomText("");
    if (!Number.isFinite(parsed)) return;
    update(withReminder(prefs, prayer, parsed));
  }

  return (
    <>
      <Text style={styles.label}>{t("notifyLabel")}</Text>
      <View style={styles.chips}>
        {NOTIFICATION_STYLES.map((style) => {
          const active = prefs.notify[prayer] === style;
          return (
            <Pressable
              key={style}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => update(withNotify(prefs, prayer, style))}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t(STYLE_KEY[style])}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>{t("reminderLabel")}</Text>
      <View style={styles.chips}>
        <Pressable
          style={[styles.chip, reminder === null && styles.chipActive]}
          onPress={() => update(withReminder(prefs, prayer, null))}
        >
          <Text
            style={[
              styles.chipText,
              reminder === null && styles.chipTextActive,
            ]}
          >
            {t("reminderOff")}
          </Text>
        </Pressable>
        {REMINDER_PRESETS.map((minutes) => {
          const active = reminder === minutes;
          return (
            <Pressable
              key={minutes}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => update(withReminder(prefs, prayer, minutes))}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {num(t("reminderMinutes", { minutes }))}
              </Text>
            </Pressable>
          );
        })}
        {reminder !== null && !isPreset && (
          <View style={[styles.chip, styles.chipActive]}>
            <Text style={[styles.chipText, styles.chipTextActive]}>
              {num(t("reminderMinutes", { minutes: reminder }))}
            </Text>
          </View>
        )}
      </View>

      <TextInput
        style={styles.custom}
        value={customText}
        onChangeText={(s) => setCustomText(s.replace(/[^0-9]/g, ""))}
        onSubmitEditing={commitCustom}
        onBlur={commitCustom}
        keyboardType="number-pad"
        returnKeyType="done"
        placeholder={t("reminderCustom")}
        placeholderTextColor={TEXT.faint}
      />
      <Text style={styles.hint}>
        {num(
          t("reminderCustomHint", {
            min: REMINDER_MIN_MINUTES,
            max: REMINDER_MAX_MINUTES,
          }),
        )}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 10, paddingBottom: 48 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  back: { color: COLORS.gold, fontSize: 16, fontFamily: FONTS.body },
  title: { color: COLORS.bone, fontSize: 18, fontFamily: FONTS.display },
  spacer: { width: 44 },
  intro: {
    color: TEXT.soft,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 20,
  },
  scope: {
    color: TEXT.faint,
    fontFamily: FONTS.body,
    fontSize: 12,
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 15,
    minHeight: 48,
  },
  optionText: {
    color: COLORS.bone,
    fontSize: 16,
    flexShrink: 1,
    fontFamily: FONTS.display,
  },
  selected: { color: COLORS.gold },
  rowEnd: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: {
    color: COLORS.gold,
    fontFamily: FONTS.body,
    fontSize: 13,
    backgroundColor: COLORS.goldWash,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
  },
  time: { color: TEXT.full, fontSize: 17, fontFamily: FONTS.display },
  body: {
    paddingHorizontal: 15,
    paddingBottom: 14,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 12,
  },
  calculated: { color: TEXT.faint, fontFamily: FONTS.body, fontSize: 13 },
  label: {
    color: TEXT.soft,
    fontFamily: FONTS.body,
    fontSize: 12,
    marginTop: 4,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  step: {
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    borderRadius: 10,
    minWidth: 44,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: COLORS.gold, fontSize: 15, fontFamily: FONTS.body },
  stepDisabled: { color: TEXT.faint },
  offsetValue: {
    flex: 1,
    textAlign: "center",
    color: TEXT.full,
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  warn: { color: COLORS.gold, fontFamily: FONTS.body, fontSize: 12, lineHeight: 18 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: "center",
  },
  chipActive: { borderColor: COLORS.goldEdge, backgroundColor: COLORS.goldWash },
  chipText: { color: TEXT.soft, fontFamily: FONTS.body, fontSize: 13 },
  chipTextActive: { color: COLORS.gold },
  custom: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.bone,
    fontSize: 15,
    marginTop: 4,
  },
  hint: {
    color: TEXT.faint,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
  },
  reset: {
    marginTop: 6,
    minHeight: 44,
    justifyContent: "center",
  },
  resetAll: {
    marginTop: 8,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
  },
  resetText: { color: COLORS.gold, fontFamily: FONTS.body, fontSize: 14 },
});
