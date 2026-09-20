import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { askForExactAlarms } from "@/lib/exact-alarms";
import { useI18n, type StringKey } from "@/lib/i18n";
import { usePlaceContext } from "@/lib/place-context";
import {
  DUAS,
  HAS_UNREVIEWED_TRANSLATIONS,
  OCCASIONS,
  duasFor,
  type DuaItem,
  type Occasion,
} from "@/lib/dua/content";
import {
  CLOCK_STEP_MIN,
  DEFAULT_SETTINGS,
  OFFSET_STEP,
  anyEnabled,
  formatClockTime,
  loadScheduledCount,
  loadSettings,
  requestPermission,
  reschedule,
  saveScheduledCount,
  saveSettings,
  stepClockTime,
  stepOffset,
  type ClockTime,
  type ReminderSettings,
} from "@/lib/dua/reminders";

import { COLORS, FONTS, TEXT } from "@/theme";

// Dua & Adhkar.
//
// Two halves on one screen, in this order on purpose. The reminders come
// first because that is the thing with a consequence — it writes to the
// notification queue — and the library second because it is the thing you
// come back to. Every reminder starts off; nothing here opts a person into a
// religious notification they did not ask for.
//
// A reminder is stored, then rescheduled, on every toggle and every step of a
// time picker. That is more scheduling work than strictly needed, but the
// alternative is a "save" button whose absence would leave the queue
// disagreeing with the switches, and a prayer app that quietly disagrees with
// its own settings is worse than one that does a little extra work.
//
// The library rows expand in place rather than pushing a detail screen. These
// are short texts read at a glance, often with the phone already in one hand
// on a prayer mat; a navigation transition for four lines of Arabic is a
// tax on that.

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Which reminder each library section belongs to, in reading order. */
const SECTION_KEY: Record<Occasion, StringKey> = {
  morning: "sectionMorning",
  evening: "sectionEvening",
  sleep: "sectionSleep",
  salawat: "sectionSalawat",
  quran: "sectionQuran",
};

const REMINDER_KEY: Record<Occasion, StringKey> = {
  morning: "remindMorning",
  evening: "remindEvening",
  sleep: "remindSleep",
  salawat: "remindSalawat",
  quran: "remindQuran",
};

export default function DuaScreen() {
  const router = useRouter();
  const { t, locale, isRTL } = useI18n();
  const { place } = usePlaceContext();

  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [denied, setDenied] = useState(false);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  const d = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) =>
      t(key, vars),
    [locale],
  );

  // Read the stored settings, then push the 7-day horizon back out. Opening
  // the screen is the one moment we can be sure the app is awake, and
  // lib/notifications.ts clears the whole queue when the adhan reschedules,
  // so this doubles as the repair for that.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stored, lastCount] = await Promise.all([
        loadSettings(),
        loadScheduledCount(),
      ]);
      if (cancelled) return;
      setSettings(stored);
      setCount(lastCount);

      if (!anyEnabled(stored)) return;
      const n = await reschedule(place, t);
      if (cancelled) return;
      setCount(n);
      void saveScheduledCount(n);
    })();
    return () => {
      cancelled = true;
    };
  }, [place, locale]);

  const apply = useCallback(
    async (next: ReminderSettings) => {
      setSettings(next);
      await saveSettings(next);
      const n = await reschedule(place, t);
      setCount(n);
      void saveScheduledCount(n);
    },
    [place, locale],
  );

  /** Turning anything on needs permission first; being refused must leave the
   *  switch where it was rather than showing an "on" that does nothing. */
  const enable = useCallback(
    async (next: ReminderSettings) => {
      const perm = await requestPermission();
      if (perm === "denied") {
        setDenied(true);
        return;
      }
      setDenied(false);
      // A reminder at "30 minutes after Fajr" rides the same inexact alarms
      // as the adhan unless this is granted.
      askForExactAlarms(t);
      await apply(next);
    },
    [apply, t],
  );

  const toggle = useCallback(
    (key: "morning" | "evening" | "sleep" | "quran", on: boolean) => {
      if (!settings) return;
      const next = { ...settings, [key]: on };
      LayoutAnimation.easeInEaseOut();
      void (on ? enable(next) : apply(next));
    },
    [settings, enable, apply],
  );

  const setTime = useCallback(
    (key: "sleepAt" | "salawatAt" | "quranAt", delta: number) => {
      if (!settings) return;
      void apply({ ...settings, [key]: stepClockTime(settings[key], delta) });
    },
    [settings, apply],
  );

  const setOffset = useCallback(
    (key: "morningAfterFajrMin" | "eveningAfterAsrMin", delta: number) => {
      if (!settings) return;
      void apply({ ...settings, [key]: stepOffset(settings[key], delta) });
    },
    [settings, apply],
  );

  const s = settings ?? DEFAULT_SETTINGS;
  const align = isRTL ? ("right" as const) : ("left" as const);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
        <View style={styles.spacer} />
          <Text style={styles.title}>{d("duaTitle")}</Text>
          <View style={styles.spacer} />
        </View>

        {/* ------------------------------------------------- reminders -- */}

        <Text style={[styles.section, { textAlign: align }]}>
          {d("duaReminders")}
        </Text>
        <Text style={[styles.hint, { textAlign: align }]}>
          {d("duaRemindersHint")}
        </Text>

        <View style={styles.card}>
          <ToggleRow
            label={d(REMINDER_KEY.morning)}
            value={s.morning}
            onChange={(on) => toggle("morning", on)}
          />
          {s.morning && (
            <Stepper
              label={d("afterFajr", { minutes: String(s.morningAfterFajrMin) })}
              earlier={d("duaEarlier")}
              later={d("duaLater")}
              onEarlier={() => setOffset("morningAfterFajrMin", -OFFSET_STEP)}
              onLater={() => setOffset("morningAfterFajrMin", OFFSET_STEP)}
            />
          )}

          <ToggleRow
            label={d(REMINDER_KEY.evening)}
            value={s.evening}
            onChange={(on) => toggle("evening", on)}
          />
          {s.evening && (
            <Stepper
              label={d("afterAsr", { minutes: String(s.eveningAfterAsrMin) })}
              earlier={d("duaEarlier")}
              later={d("duaLater")}
              onEarlier={() => setOffset("eveningAfterAsrMin", -OFFSET_STEP)}
              onLater={() => setOffset("eveningAfterAsrMin", OFFSET_STEP)}
            />
          )}

          <ToggleRow
            label={d(REMINDER_KEY.sleep)}
            value={s.sleep}
            onChange={(on) => toggle("sleep", on)}
          />
          {s.sleep && (
            <ClockStepper
              time={s.sleepAt}
              render={(v) => d("atTime", { time: v })}
              earlier={d("duaEarlier")}
              later={d("duaLater")}
              onStep={(delta) => setTime("sleepAt", delta)}
            />
          )}

          <ToggleRow
            label={d(REMINDER_KEY.salawat)}
            value={s.salawat !== "off"}
            onChange={(on) => {
              if (!settings) return;
              const next: ReminderSettings = {
                ...settings,
                salawat: on ? "daily" : "off",
              };
              LayoutAnimation.easeInEaseOut();
              void (on ? enable(next) : apply(next));
            }}
          />
          {s.salawat !== "off" && (
            <>
              <View style={styles.pills}>
                <Pill
                  label={d("salawatDaily")}
                  active={s.salawat === "daily"}
                  onPress={() =>
                    settings && void apply({ ...settings, salawat: "daily" })
                  }
                />
                <Pill
                  label={d("salawatFriday")}
                  active={s.salawat === "friday"}
                  onPress={() =>
                    settings && void apply({ ...settings, salawat: "friday" })
                  }
                />
              </View>
              <ClockStepper
                time={s.salawatAt}
                render={(v) => d("atTime", { time: v })}
                earlier={d("duaEarlier")}
                later={d("duaLater")}
                onStep={(delta) => setTime("salawatAt", delta)}
              />
            </>
          )}

          <ToggleRow
            label={d(REMINDER_KEY.quran)}
            value={s.quran}
            onChange={(on) => toggle("quran", on)}
          />
          {s.quran && (
            <ClockStepper
              time={s.quranAt}
              render={(v) => d("atTime", { time: v })}
              earlier={d("duaEarlier")}
              later={d("duaLater")}
              onStep={(delta) => setTime("quranAt", delta)}
            />
          )}

          {denied && (
            <Text style={[styles.hint, styles.inCard, { textAlign: align }]}>
              {d("duaPermissionDenied")}
            </Text>
          )}
          {!denied && anyEnabled(s) && (
            <Text style={[styles.hint, styles.inCard, { textAlign: align }]}>
              {count > 0
                ? d("duaScheduled", { count: String(count) })
                : d("duaNoneScheduled")}
            </Text>
          )}
        </View>

        {/* --------------------------------------------------- library -- */}

        <Text style={[styles.section, { textAlign: align }]}>
          {d("duaLibrary")}
        </Text>
        {HAS_UNREVIEWED_TRANSLATIONS && locale !== "ar" && (
          <Text style={[styles.hint, { textAlign: align }]}>
            {d("duaReviewPending")}
          </Text>
        )}

        {OCCASIONS.map((occasion) => {
          const items = duasFor(occasion);
          if (items.length === 0) return null;
          return (
            <View key={occasion}>
              <Text style={[styles.subsection, { textAlign: align }]}>
                {d(SECTION_KEY[occasion])}
              </Text>
              <View style={styles.card}>
                {items.map((item, i) => (
                  <DuaRow
                    key={`${occasion}-${item.id}`}
                    item={item}
                    first={i === 0}
                    expanded={open === `${occasion}-${item.id}`}
                    onPress={() => {
                      LayoutAnimation.easeInEaseOut();
                      setOpen((cur) =>
                        cur === `${occasion}-${item.id}`
                          ? null
                          : `${occasion}-${item.id}`,
                      );
                    }}
                    locale={locale}
                    align={align}
                    d={d}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <Text style={[styles.footnote, { textAlign: align }]}>
          {String(DUAS.length)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ------------------------------------------------------------ small parts

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <View style={styles.option}>
      <Text style={[styles.optionText, value && styles.selected]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: COLORS.gold, false: "#333" }}
        thumbColor={COLORS.bone}
      />
    </View>
  );
}

/** A minus/plus pair around a read-only value. Deliberately not a native date
 *  picker: the project has no picker dependency, and a modal wheel for "15
 *  minutes later" is more ceremony than the choice deserves. */
function Stepper({
  label,
  earlier,
  later,
  onEarlier,
  onLater,
}: {
  label: string;
  earlier: string;
  later: string;
  onEarlier: () => void;
  onLater: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        style={styles.step}
        onPress={onEarlier}
        hitSlop={8}
        accessibilityLabel={earlier}
        accessibilityRole="button"
      >
        <Text style={styles.stepGlyph}>&#8722;</Text>
      </Pressable>
      <Text style={styles.stepValue}>{label}</Text>
      <Pressable
        style={styles.step}
        onPress={onLater}
        hitSlop={8}
        accessibilityLabel={later}
        accessibilityRole="button"
      >
        <Text style={styles.stepGlyph}>+</Text>
      </Pressable>
    </View>
  );
}

function ClockStepper({
  time,
  render,
  earlier,
  later,
  onStep,
}: {
  time: ClockTime;
  render: (formatted: string) => string;
  earlier: string;
  later: string;
  onStep: (deltaMin: number) => void;
}) {
  return (
    <Stepper
      label={render(formatClockTime(time))}
      earlier={earlier}
      later={later}
      onEarlier={() => onStep(-CLOCK_STEP_MIN)}
      onLater={() => onStep(CLOCK_STEP_MIN)}
    />
  );
}

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function DuaRow({
  item,
  first,
  expanded,
  onPress,
  locale,
  align,
  d,
}: {
  item: DuaItem;
  first: boolean;
  expanded: boolean;
  onPress: () => void;
  locale: string;
  align: "left" | "right";
  d: (key: StringKey, vars?: Record<string, string | number>) => string;
}) {
  const translation =
    locale === "ar"
      ? null
      : item.translation[locale as keyof typeof item.translation];

  return (
    <View style={[styles.duaRow, !first && styles.divided]}>
      <Pressable onPress={onPress} style={styles.duaHead}>
        <Text style={[styles.duaTitle, expanded && styles.selected]}>
          {item.title[locale as keyof typeof item.title] ?? item.title.en}
        </Text>
        {item.repeat !== undefined && (
          <Text style={styles.repeat}>{`${item.repeat}×`}</Text>
        )}
      </Pressable>

      {expanded && (
        <View style={styles.duaBody}>
          {/* The verified text. Always right-aligned and RTL regardless of
              the interface language — it is Arabic, not a translation. */}
          <Text style={styles.arabic}>{item.arabic}</Text>

          <Text style={[styles.label, { textAlign: align }]}>
            {d("duaPronunciation")}
          </Text>
          <Text style={[styles.translit, { textAlign: align }]}>
            {item.transliteration}
          </Text>

          {translation !== null && (
            <Text style={[styles.translation, { textAlign: align }]}>
              {translation}
            </Text>
          )}

          {item.repeat !== undefined && (
            <Text style={[styles.label, { textAlign: align }]}>
              {d("duaRepeatCount", { count: String(item.repeat) })}
            </Text>
          )}

          <Text style={[styles.label, { textAlign: align }]}>
            {d("duaSource")}
          </Text>
          <Text style={[styles.source, { textAlign: align }]}>
            {item.source}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 8, paddingBottom: 56 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  back: { color: COLORS.gold, fontSize: 16, fontFamily: FONTS.body },
  title: { color: COLORS.bone, fontSize: 18, fontFamily: FONTS.display },
  spacer: { width: 44 },

  section: {
    color: TEXT.soft,
    fontFamily: FONTS.display,
    fontSize: 14,
    marginTop: 16,
  },
  subsection: {
    color: TEXT.faint,
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: 14,
    marginBottom: 2,
  },
  hint: {
    color: TEXT.faint,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
  },
  inCard: { paddingHorizontal: 15, paddingBottom: 12 },
  footnote: { color: TEXT.faint, fontSize: 12, marginTop: 18 },

  card: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 6,
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
    color: TEXT.full,
    fontSize: 16,
    flexShrink: 1,
    fontFamily: FONTS.body,
  },
  selected: { color: TEXT.gold },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingBottom: 12,
    gap: 12,
  },
  step: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    backgroundColor: COLORS.goldWash,
    alignItems: "center",
    justifyContent: "center",
  },
  stepGlyph: { color: COLORS.gold, fontSize: 18, lineHeight: 22 },
  stepValue: {
    flex: 1,
    textAlign: "center",
    color: TEXT.goldSoft,
    fontFamily: FONTS.body,
    fontSize: 14,
  },

  pills: { flexDirection: "row", gap: 8, paddingHorizontal: 15, paddingBottom: 10 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  pillActive: {
    borderColor: COLORS.goldEdge,
    backgroundColor: COLORS.goldWash,
  },
  pillText: { color: TEXT.soft, fontFamily: FONTS.body, fontSize: 13 },
  pillTextActive: { color: TEXT.gold },

  duaRow: { paddingHorizontal: 15 },
  divided: { borderTopWidth: 1, borderTopColor: COLORS.line },
  duaHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingVertical: 12,
    gap: 10,
  },
  duaTitle: {
    color: TEXT.full,
    fontFamily: FONTS.body,
    fontSize: 15,
    flexShrink: 1,
  },
  repeat: {
    color: TEXT.goldSoft,
    fontFamily: FONTS.body,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },

  duaBody: { paddingBottom: 16, gap: 6 },
  // Never dimmed with `opacity` — see the note in theme.ts. Line height is
  // generous because vowelled Arabic stacks marks above and below and a
  // tight leading makes two lines collide.
  arabic: {
    color: TEXT.full,
    fontFamily: FONTS.body,
    fontSize: 20,
    lineHeight: 40,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 4,
  },
  label: {
    color: TEXT.faint,
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 6,
  },
  translit: {
    color: TEXT.goldSoft,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 22,
  },
  translation: {
    color: TEXT.strong,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  source: {
    color: TEXT.faint,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
  },
});
