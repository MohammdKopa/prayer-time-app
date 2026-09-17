import { useEffect, useMemo, useState } from "react";
import { I18nManager, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { computeDay, PRAYER_ORDER, type PrayerName } from "@shared/prayer-engine";
import {
  countdownTo,
  formatClock,
  formatClockWithSeconds,
  formatCountdown,
  toArabicIndic,
} from "@/lib/time";

// Marl. Replaced by expo-location in the next step — GPS is the primary input
// Germany-wide, with the city picker demoted to manual override.
const FALLBACK = { name: "مارل", latitude: 51.6564, longitude: 7.0907 };

// Arabic only for now. These move into the i18n layer (ar/de/tr/en) before
// anything ships — no string literals in components is the standard.
const NAMES: Record<PrayerName, string> = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

/** Prayers that are actual prayers. Sunrise is shown but never "next". */
const PRAYERS = PRAYER_ORDER.filter((p) => p !== "sunrise");

export default function ClockScreen() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Recomputed only when the calendar day changes, not every tick.
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const day = useMemo(
    () => computeDay(FALLBACK.latitude, FALLBACK.longitude, new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey],
  );

  const times = day.primary.times;

  const next = useMemo(() => {
    for (const p of PRAYERS) {
      if (times[p].getTime() > now.getTime()) return p;
    }
    return null; // all of today's prayers have passed; Fajr tomorrow
  }, [times, now]);

  const countdown = next ? countdownTo(times[next], now) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.city}>{FALLBACK.name}</Text>
        <Text style={styles.clock}>
          {toArabicIndic(formatClockWithSeconds(now))}
        </Text>

        {next && countdown ? (
          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>الصلاة القادمة</Text>
            <Text style={styles.nextName}>{NAMES[next]}</Text>
            <Text style={styles.nextTime}>
              {toArabicIndic(formatClock(times[next]))}
            </Text>
            <Text style={styles.nextCountdown}>
              {toArabicIndic(formatCountdown(countdown))}
            </Text>
          </View>
        ) : (
          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>انتهت صلوات اليوم</Text>
          </View>
        )}

        <View style={styles.list}>
          {PRAYER_ORDER.map((p) => {
            const isNext = p === next;
            const isSunrise = p === "sunrise";
            return (
              <View
                key={p}
                style={[styles.row, isNext && styles.rowNext]}
              >
                <Text
                  style={[
                    styles.rowName,
                    isSunrise && styles.rowMuted,
                    isNext && styles.rowNextText,
                  ]}
                >
                  {NAMES[p]}
                </Text>
                <Text
                  style={[
                    styles.rowTime,
                    isSunrise && styles.rowMuted,
                    isNext && styles.rowNextText,
                  ]}
                >
                  {toArabicIndic(formatClock(times[p]))}
                </Text>
              </View>
            );
          })}
        </View>

        {/*
          Principle #4, "no bad times", also means no unexplained ones. From
          April to September the Isha shown here is held back from its
          calculated time by the imam's 90-minute minimum, and the app says so
          rather than quietly showing a different number.
        */}
        {day.ishaFloored && (
          <Text style={styles.note}>
            العشاء مؤخَّر ليكون بعد المغرب بـ
            {" "}
            {toArabicIndic(String(day.ishaMinGapMinutes))} دقيقة على الأقل
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const GOLD = "#D9B871";
const BONE = "#E8E3D9";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#07090F" },
  content: {
    padding: 24,
    gap: 20,
    alignItems: "stretch",
  },
  city: {
    color: BONE,
    opacity: 0.74,
    fontSize: 18,
    textAlign: "center",
    writingDirection: "rtl",
  },
  clock: {
    color: BONE,
    fontSize: 52,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  nextCard: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 16,
    padding: 20,
    gap: 6,
    alignItems: "center",
  },
  nextLabel: { color: BONE, opacity: 0.5, fontSize: 14 },
  nextName: { color: GOLD, fontSize: 30 },
  nextTime: {
    color: BONE,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
  },
  nextCountdown: {
    color: GOLD,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
  },
  list: { gap: 2 },
  row: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  rowNext: { backgroundColor: "rgba(217,184,113,0.10)" },
  rowName: { color: BONE, fontSize: 19 },
  rowTime: {
    color: BONE,
    fontSize: 19,
    fontVariant: ["tabular-nums"],
  },
  rowMuted: { opacity: 0.5 },
  rowNextText: { color: GOLD },
  note: {
    color: BONE,
    opacity: 0.5,
    fontSize: 13,
    textAlign: "center",
    writingDirection: "rtl",
    lineHeight: 20,
  },
});
