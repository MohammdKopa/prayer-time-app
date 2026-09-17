import { Link } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { computeDay, PRAYER_ORDER, type PrayerName } from "@shared/prayer-engine";
import { useI18n, type Strings } from "@/lib/i18n";
import { usePlaceContext } from "@/lib/place-context";
import { reschedule } from "@/lib/notifications";
import {
  countdownTo,
  formatClock,
  formatClockWithSeconds,
  formatCountdown,
  toArabicIndic,
} from "@/lib/time";
import { COLORS } from "@/theme";

const NAME_KEY: Record<PrayerName, keyof Strings> = {
  fajr: "fajr",
  sunrise: "sunrise",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
};

/** Sunrise is shown but is never "the next prayer". */
const PRAYERS = PRAYER_ORDER.filter((p) => p !== "sunrise");

export default function ClockScreen() {
  const { t, locale, isRTL } = useI18n();
  const { place, state } = usePlaceContext();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Recomputed when the day or the place changes, not every tick.
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const day = useMemo(
    () => computeDay(place.latitude, place.longitude, new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey, place.latitude, place.longitude],
  );
  const times = day.primary.times;

  // Tomorrow, so the screen still counts down to something after Isha.
  const tomorrowFajr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return computeDay(place.latitude, place.longitude, d).primary.times.fajr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, place.latitude, place.longitude]);

  const next = useMemo(() => {
    for (const p of PRAYERS) {
      if (times[p].getTime() > now.getTime()) return p;
    }
    return null;
  }, [times, now]);

  const target = next ? times[next] : tomorrowFajr;
  const countdown = countdownTo(target, now);

  // Keep the scheduled adhans in step with the place and the language. Guarded
  // so a ticking clock does not reschedule 35 notifications every second.
  const scheduleKey = `${place.latitude},${place.longitude},${locale},${dayKey}`;
  const lastScheduled = useRef<string | null>(null);
  useEffect(() => {
    if (lastScheduled.current === scheduleKey) return;
    lastScheduled.current = scheduleKey;
    void reschedule(place, t);
  }, [scheduleKey, place, t]);

  const num = (s: string) => (locale === "ar" ? toArabicIndic(s) : s);
  const align = isRTL ? ("right" as const) : ("left" as const);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.city} numberOfLines={1}>
            {state === "locating" ? t("locating") : place.name}
          </Text>
          <View style={styles.actions}>
            <Link href="/qibla" asChild>
              <Pressable hitSlop={12} accessibilityLabel={t("qibla")}>
                <Text style={styles.gear}>&#9737;</Text>
              </Pressable>
            </Link>
            <Link href="/settings" asChild>
              <Pressable hitSlop={12} accessibilityLabel={t("settings")}>
                <Text style={styles.gear}>&#9881;</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <Text style={styles.clock}>{num(formatClockWithSeconds(now))}</Text>

        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>
            {next ? t("nextPrayer") : t("tomorrowFajr")}
          </Text>
          <Text style={styles.nextName}>
            {next ? t(NAME_KEY[next]) : t("fajr")}
          </Text>
          <Text style={styles.nextTime}>{num(formatClock(target))}</Text>
          <Text style={styles.nextCountdown}>
            {num(formatCountdown(countdown))}
          </Text>
        </View>

        <View style={styles.list}>
          {PRAYER_ORDER.map((p) => {
            const isNext = p === next;
            const isSunrise = p === "sunrise";
            return (
              <View key={p} style={[styles.row, isNext && styles.rowNext]}>
                <Text
                  style={[
                    styles.rowName,
                    { textAlign: align },
                    isSunrise && styles.muted,
                    isNext && styles.gold,
                  ]}
                >
                  {t(NAME_KEY[p])}
                </Text>
                <Text
                  style={[
                    styles.rowTime,
                    isSunrise && styles.muted,
                    isNext && styles.gold,
                  ]}
                >
                  {num(formatClock(times[p]))}
                </Text>
              </View>
            );
          })}
        </View>

        {/*
          Principle #4, "no bad times", also means no unexplained ones. The
          mosque places Fajr and Isha at a fixed distance from sunrise and
          Maghrib, so these usually differ from the calculated times. Say so.
        */}
        {(day.fajrAdjusted || day.ishaAdjusted) && (
          <View style={styles.noteBlock}>
            <Text style={styles.noteTitle}>{t("mosqueTiming")}</Text>
            {day.fajrAdjusted && (
              <Text style={styles.note}>
                {t("fajrBeforeSunrise", {
                  minutes: num(String(day.fajrRule.minutes)),
                })}
              </Text>
            )}
            {day.ishaAdjusted && (
              <Text style={styles.note}>
                {t("ishaAfterMaghrib", {
                  minutes: num(String(day.ishaRule.minutes)),
                })}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24, gap: 18 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  city: { color: COLORS.bone, opacity: 0.74, fontSize: 18, flexShrink: 1 },
  actions: { flexDirection: "row", gap: 18, alignItems: "center" },
  gear: { color: COLORS.bone, opacity: 0.6, fontSize: 22 },
  clock: {
    color: COLORS.bone,
    fontSize: 52,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  nextCard: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 16,
    padding: 20,
    gap: 6,
    alignItems: "center",
  },
  nextLabel: { color: COLORS.bone, opacity: 0.5, fontSize: 14 },
  nextName: { color: COLORS.gold, fontSize: 30, textAlign: "center" },
  nextTime: { color: COLORS.bone, fontSize: 24, fontVariant: ["tabular-nums"] },
  nextCountdown: {
    color: COLORS.gold,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
  },
  list: { gap: 2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  rowNext: { backgroundColor: "rgba(217,184,113,0.10)" },
  rowName: { color: COLORS.bone, fontSize: 19, flex: 1 },
  rowTime: { color: COLORS.bone, fontSize: 19, fontVariant: ["tabular-nums"] },
  muted: { opacity: 0.5 },
  gold: { color: COLORS.gold },
  noteBlock: { gap: 4, paddingTop: 4, alignItems: "center" },
  noteTitle: { color: COLORS.gold, opacity: 0.7, fontSize: 13 },
  note: {
    color: COLORS.bone,
    opacity: 0.5,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
