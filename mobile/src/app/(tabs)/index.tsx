import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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
  isValidTime,
  toArabicIndic,
} from "@/lib/time";
import { SkyBackground } from "@/components/SkyBackground";
import { hijriMonthName, toHijri } from "@/lib/hijri";
import { COLORS, FONTS, TEXT } from "@/theme";

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
  const { t, locale } = useI18n();
  const { place, state } = usePlaceContext();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const day = useMemo(
    () => computeDay(place.latitude, place.longitude, new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey, place.latitude, place.longitude],
  );
  const times = day.primary.times;

  const tomorrowFajr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return computeDay(place.latitude, place.longitude, d).primary.times.fajr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, place.latitude, place.longitude]);

  const next = useMemo(() => {
    for (const p of PRAYERS) {
      // Skip prayers the engine could not compute (>66N, midnight sun), or
      // the hero would count down to an Invalid Date.
      if (!isValidTime(times[p])) continue;
      if (times[p].getTime() > now.getTime()) return p;
    }
    return null;
  }, [times, now]);

  /** The prayer whose time we are currently inside — the one just passed. */
  const current = useMemo(() => {
    let found: PrayerName | null = null;
    for (const p of PRAYERS) {
      if (!isValidTime(times[p])) continue;
      if (times[p].getTime() <= now.getTime()) found = p;
    }
    return found;
  }, [times, now]);

  const target = next ? times[next] : tomorrowFajr;
  const hasTarget = isValidTime(target);
  const countdown = countdownTo(target, now);

  const scheduleKey = `${place.latitude},${place.longitude},${locale},${dayKey}`;
  const lastScheduled = useRef<string | null>(null);
  useEffect(() => {
    if (lastScheduled.current === scheduleKey) return;
    lastScheduled.current = scheduleKey;
    void reschedule(place, t);
  }, [scheduleKey, place, t]);

  // The sky moves over minutes, not seconds. Rebuilding a full-screen
  // gradient every tick would burn battery for a change no eye can see.
  const skyNow = useMemo(
    () => now,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [`${now.getHours()}:${now.getMinutes()}`],
  );

  const num = (s: string) => (locale === "ar" ? toArabicIndic(s) : s);

  // Deterministic Umm al-Qura, never Intl — Hermes falls back to the Gregorian
  // calendar silently, which would print a Gregorian date wearing a هـ.
  // Out of range (before 1300 AH or after 1600 AH) it throws; the date is
  // ornament, so losing it must not take the prayer times down with it.
  const hijri = useMemo(() => {
    try {
      const h = toHijri(new Date());
      return `${num(String(h.day))} ${hijriMonthName(h.month, locale)} ${num(
        String(h.year),
      )} ${t("hijriSuffix")}`;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, locale]);

  return (
    <SafeAreaView style={styles.safe}>
      <SkyBackground now={skyNow} times={times} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.city} numberOfLines={1}>
              {state === "locating" ? t("locating") : place.name}
            </Text>
            {hijri && <Text style={styles.hijri}>{hijri}</Text>}
            <Text style={styles.clockSmall}>
              {num(formatClockWithSeconds(now))}
            </Text>
          </View>
        </View>

        {/* The hero. On a prayer clock the thing you came to know is how long
            you have, so it gets the size — not the wall clock. */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>
            {next ? t("nextPrayer") : t("tomorrowFajr")}
          </Text>
          <Text style={styles.heroName}>
            {next ? t(NAME_KEY[next]) : t("fajr")}
          </Text>
          <Text style={styles.heroCountdown}>
            {hasTarget ? num(formatCountdown(countdown)) : "—"}
          </Text>
          <Text style={styles.heroTime}>{num(formatClock(target))}</Text>
        </View>

        <View style={styles.list}>
          {PRAYER_ORDER.map((p) => {
            const isNext = p === next;
            const isCurrent = p === current;
            const isSunrise = p === "sunrise";
            const passed = times[p].getTime() <= now.getTime();
            return (
              <View
                key={p}
                style={[
                  styles.row,
                  isNext && styles.rowNext,
                  isCurrent && styles.rowCurrent,
                ]}
              >
                <View style={styles.rowLeft}>
                  <View
                    style={[
                      styles.dot,
                      isNext && styles.dotNext,
                      isCurrent && styles.dotCurrent,
                    ]}
                  />
                  <Text
                    style={[
                      styles.rowName,
                      passed && !isCurrent && styles.passed,
                      isSunrise && styles.sunriseText,
                      (isNext || isCurrent) && styles.gold,
                    ]}
                  >
                    {t(NAME_KEY[p])}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.rowTime,
                    passed && !isCurrent && styles.passed,
                    isSunrise && styles.sunriseText,
                    (isNext || isCurrent) && styles.gold,
                  ]}
                >
                  {num(formatClock(times[p]))}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  // rows sit directly on the sky; only the hero gets a pane
  // Fills the screen rather than scrolling: the six times, the next prayer
  // and the date are the whole content, and a prayer clock you have to scroll
  // has failed at being glanceable.
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
    justifyContent: "space-between",
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: { flexShrink: 1, gap: 2 },
  city: {
    color: TEXT.strong,
    fontSize: 17,
    fontFamily: FONTS.bodyMedium,
  },
  hijri: {
    color: TEXT.soft,
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  clockSmall: {
    color: TEXT.faint,
    fontSize: 14,
    fontFamily: FONTS.displayRegular,
    fontVariant: ["tabular-nums"],
  },
  actions: { flexDirection: "row", gap: 6 },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  icon: { color: TEXT.soft, fontSize: 21 },

  hero: {
    backgroundColor: "rgba(12,16,24,0.55)",
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 4,
  },
  heroLabel: {
    color: TEXT.faint,
    fontSize: 13,
    fontFamily: FONTS.body,
    letterSpacing: 0.5,
  },
  heroName: {
    color: COLORS.gold,
    fontSize: 32,
    fontFamily: FONTS.display,
    lineHeight: 44,
  },
  heroCountdown: {
    color: COLORS.bone,
    fontSize: 40,
    fontFamily: FONTS.displayRegular,
    fontVariant: ["tabular-nums"],
    lineHeight: 50,
  },
  heroTime: {
    color: TEXT.soft,
    fontSize: 16,
    fontFamily: FONTS.displayRegular,
    fontVariant: ["tabular-nums"],
  },

  list: { gap: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  rowNext: { backgroundColor: COLORS.goldWash },
  rowCurrent: { backgroundColor: "rgba(232,227,217,0.04)" },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.bone,
    opacity: 0.18,
  },
  dotNext: { backgroundColor: COLORS.gold, opacity: 1 },
  dotCurrent: { backgroundColor: COLORS.bone, opacity: 0.5 },
  rowName: { color: COLORS.bone, fontSize: 20, fontFamily: FONTS.display },
  rowTime: {
    color: COLORS.bone,
    fontSize: 20,
    fontFamily: FONTS.displayRegular,
    fontVariant: ["tabular-nums"],
  },
  passed: { color: TEXT.faint },
  sunriseText: { color: TEXT.faint, fontSize: 17 },
  gold: { color: COLORS.gold },
});
