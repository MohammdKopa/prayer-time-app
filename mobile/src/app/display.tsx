import { useKeepAwake } from "expo-keep-awake";
import * as NavigationBar from "expo-navigation-bar";
import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { PRAYER_ORDER, type PrayerName } from "@shared/prayer-engine";

import {
  Atmosphere,
  BurnShift,
  Dust,
  Flourish,
  Frame,
  LEAF,
  LEAF_BRIGHT,
} from "@/components/display/Ornament";
import { PhotoOverlay } from "@/components/display/PhotoOverlay";
import { DisplaySetup } from "@/components/display/Setup";
import { WallSunArc } from "@/components/display/WallSunArc";
import {
  displayTimes,
  EMPTY_DISPLAY_SETTINGS,
  loadDisplaySettings,
  nightDimAt,
  prayerNowAt,
  saveDisplaySettings,
  sayingAt,
  SAYING_PERIOD_S,
  sayingMarks,
  type DisplaySettings,
} from "@/lib/display";
import { hijriMonthName, toHijri } from "@/lib/hijri";
import { useI18n, type Strings } from "@/lib/i18n";
import { usePlaceContext } from "@/lib/place-context";
import { adjustedDay } from "@/lib/schedule";
import {
  countdownTo,
  formatClock,
  formatClockWithSeconds,
  formatCountdown,
  isValidTime,
  toArabicIndic,
} from "@/lib/time";
import { usePrefs } from "@/lib/use-prefs";
import { COLORS, FONTS } from "@/theme";

// The mosque display — the website's "illuminated muṣḥaf" wall, on a phone
// or tablet laid on any mosque's plasma.
//
// Landscape, screen kept awake, no chrome. Same engine, same place, same
// per-prayer offsets as the Times screen, so the wall and the phones in the
// pockets below it never disagree. Two things are the mosque's own: its
// name and its Jumuʿa time, asked for the first time the display opens and
// kept on this device only.
//
// Sizes derive from the window: `vh`/`vw` are 1% of height/width, so the
// `min(Xvh, Yvw)` sizing of the website maps one-to-one. A 7" tablet and a
// 55" plasma through an HDMI dongle both get a layout that fills them.

const NAME_KEY: Record<PrayerName, keyof Strings> = {
  fajr: "fajr",
  sunrise: "sunrise",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
};

const AR_NAME: Record<PrayerName, string> = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

const PRAYERS = PRAYER_ORDER.filter((p) => p !== "sunrise");

/** How long the tap menu stays after a tap — long enough to reach it with a
 *  TV remote's D-pad. */
const MENU_VISIBLE_MS = 8000;

const BONE = "#f4ecd8";
const BONE_DIM = "rgba(244,236,216,0.74)";
const BONE_FAINT = "rgba(244,236,216,0.5)";
const GOLD_SOFT = "#c9b57c";

export default function DisplayScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { place } = usePlaceContext();
  const { width, height } = useWindowDimensions();

  useKeepAwake();
  // Landscape and truly full-screen: the status bar goes via <StatusBar hidden>,
  // the Android navigation bar here. Both come back when the screen unmounts.
  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    if (Platform.OS === "android") {
      // Immersive: a swipe from the edge brings the bar back briefly.
      void NavigationBar.setVisibilityAsync("hidden").catch(() => {});
    }
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      if (Platform.OS === "android") {
        void NavigationBar.setVisibilityAsync("visible").catch(() => {});
      }
    };
  }, []);

  // ── Settings + first-run setup ─────────────────────────────────────
  const [settings, setSettings] = useState<DisplaySettings | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  useEffect(() => {
    void loadDisplaySettings().then((s) => {
      setSettings(s);
      if (!s.configured) setSetupOpen(true);
    });
  }, []);
  function finishSetup(s: DisplaySettings) {
    setSettings(s);
    setSetupOpen(false);
    void saveDisplaySettings(s);
  }
  const effective = settings ?? EMPTY_DISPLAY_SETTINGS;

  // ── Clock ──────────────────────────────────────────────────────────
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  const { prefs, key: prefsKey } = usePrefs(place);
  const raw = useMemo(
    () => adjustedDay(place.latitude, place.longitude, new Date(), prefs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey, place.latitude, place.longitude, prefsKey],
  );
  const tomorrowFajr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return adjustedDay(place.latitude, place.longitude, d, prefs).fajr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, place.latitude, place.longitude, prefsKey]);

  const { times, jumua } = useMemo(
    () => displayTimes(raw, now, effective.jumua),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [raw, dayKey, effective.jumua],
  );

  const next = useMemo(() => {
    for (const p of PRAYERS) {
      if (!isValidTime(times[p])) continue;
      if (times[p].getTime() > now.getTime()) return p;
    }
    return null;
  }, [times, now]);
  const current = useMemo(() => {
    let found: PrayerName = "isha";
    for (const p of PRAYERS) {
      if (!isValidTime(times[p])) continue;
      if (times[p].getTime() <= now.getTime()) found = p;
    }
    return found;
  }, [times, now]);

  const target = next ? times[next] : tomorrowFajr;
  const countdown = countdownTo(target, now);
  const prayerNow = prayerNowAt(times, now);
  const nightDim = nightDimAt(now);

  const num = (s: string) => (locale === "ar" ? toArabicIndic(s) : s);
  const clock = (d: Date) => num(formatClock(d));

  const hijri = useMemo(() => {
    try {
      const h = toHijri(new Date());
      return `${num(String(h.day))} ${hijriMonthName(h.month, locale)} ${num(String(h.year))} ${t("hijriSuffix")}`;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, locale]);
  const gregorian = useMemo(() => {
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return num(`${dd}.${mm}.${now.getFullYear()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, locale]);

  const sayingSlot = Math.floor(now.getTime() / 1000 / SAYING_PERIOD_S);
  const saying = useMemo(
    () => sayingAt(now, jumua),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sayingSlot, jumua],
  );
  const marks = sayingMarks(saying);

  // ── Tap menu ───────────────────────────────────────────────────────
  const [menu, setMenu] = useState(false);
  const menuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function reveal() {
    setMenu(true);
    if (menuTimer.current) clearTimeout(menuTimer.current);
    menuTimer.current = setTimeout(() => setMenu(false), MENU_VISIBLE_MS);
  }
  useEffect(
    () => () => {
      if (menuTimer.current) clearTimeout(menuTimer.current);
    },
    [],
  );

  // A TV remote or a phone's back gesture: Back closes whatever is open
  // (the setup card, then the tap menu) and only then leaves the display,
  // so a stray press on the remote never drops the wall back to the app.
  // The D-pad's OK on the wall itself reveals the menu, like a tap.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (setupOpen && settings?.configured) {
        setSetupOpen(false);
        return true;
      }
      if (setupOpen) return true; // first-run setup: Back does nothing
      if (menu) {
        setMenu(false);
        return true;
      }
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [setupOpen, settings, menu, router]);

  // ── Animated layers ────────────────────────────────────────────────
  const dim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(dim, { toValue: nightDim, duration: 3000, useNativeDriver: true }).start();
  }, [nightDim, dim]);

  const takeover = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(takeover, { toValue: prayerNow ? 1 : 0, duration: 900, useNativeDriver: true }).start();
  }, [prayerNow, takeover]);

  const ayah = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    ayah.setValue(0);
    Animated.sequence([
      Animated.timing(ayah, { toValue: 1, duration: SAYING_PERIOD_S * 120, useNativeDriver: true }),
      Animated.delay(SAYING_PERIOD_S * 760),
      Animated.timing(ayah, { toValue: 0, duration: SAYING_PERIOD_S * 120, useNativeDriver: true }),
    ]).start();
  }, [sayingSlot, ayah]);

  // ── Sizing ─────────────────────────────────────────────────────────
  const vh = height / 100;
  const vw = width / 100;
  const fs = (h: number, w: number) => Math.min(h * vh, w * vw);

  const label = (p: PrayerName) => (jumua && p === "dhuhr" ? t("jumua") : t(NAME_KEY[p]));
  const labelAr = (p: PrayerName) => (jumua && p === "dhuhr" ? "الجمعة" : AR_NAME[p]);
  const subtitle = (p: PrayerName) => (locale === "ar" ? null : labelAr(p));

  const title = effective.mosqueName.trim() || `${t("mosqueUnnamed")} ${place.name}`;

  return (
    <Pressable style={styles.root} onPress={reveal} focusable>
      <StatusBar hidden />

      <Atmosphere width={width} height={height} />
      <Dust width={width} height={height} />
      <Frame vh={vh} vw={vw} />

      <BurnShift>
        <View style={[styles.content, { paddingHorizontal: vw * 5, paddingVertical: vh * 3.8 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.titleRow, { gap: vw * 1.6 }]}>
              <Flourish width={fs(9, 7)} />
              <Text style={[styles.title, { fontSize: fs(6.2, 4.6) }]} numberOfLines={1}>
                {title}
              </Text>
              <Flourish width={fs(9, 7)} mirror />
            </View>
            <View style={[styles.dateRow, { marginTop: vh * 1.4, gap: vw * 1.2 }]}>
              <Text style={[styles.date, { fontSize: fs(2.7, 2) }]}>{gregorian}</Text>
              {hijri && (
                <>
                  <Text style={[styles.diamond, { fontSize: fs(2.7, 2) }]}>◆</Text>
                  <Text style={[styles.hijri, { fontSize: fs(2.7, 2) }]}>{hijri}</Text>
                </>
              )}
              <Text style={[styles.diamond, { fontSize: fs(2.7, 2) }]}>◆</Text>
              <Text style={[styles.placeName, { fontSize: fs(2.7, 2) }]}>{place.name}</Text>
            </View>
          </View>

          {/* Hero: clock + next prayer */}
          <View style={[styles.hero, { marginTop: vh * 1.2, gap: vw * 2.2 }]}>
            <View style={[styles.glass, styles.clockCard, { borderRadius: vh * 2, paddingHorizontal: vw * 2, paddingVertical: vh * 1.1 }]}>
              <Text style={[styles.nowLabel, { fontSize: fs(2.6, 1.9), letterSpacing: fs(2.6, 1.9) * 0.4 }]}>
                {t("now")}
              </Text>
              <Text style={[styles.clock, { fontSize: fs(10.5, 8), lineHeight: fs(10.5, 8) * 1.1 }]} numberOfLines={1}>
                {num(formatClockWithSeconds(now))}
              </Text>
              <Text style={[styles.currentLabel, { fontSize: fs(2.6, 1.9), marginTop: vh }]}>
                {t("timeOf", { prayer: label(current) })}
              </Text>
            </View>

            <View style={[styles.glass, styles.glassGold, styles.nextCard, { borderRadius: vh * 2, paddingHorizontal: vw * 2, paddingVertical: vh * 1.1 }]}>
              <Text style={[styles.nextLabel, { fontSize: fs(2.8, 2.1), letterSpacing: 2 }]}>
                {next ? t("nextPrayer") : t("firstPrayerTomorrow")}
              </Text>
              <Text style={[styles.nextName, { fontSize: fs(6.8, 5.2), lineHeight: fs(6.8, 5.2) * 1.15, marginTop: vh * 0.4 }]}>
                {next ? label(next) : t("fajr")}
              </Text>
              {subtitle(next ?? "fajr") && (
                <Text style={[styles.nextSub, { fontSize: fs(2.4, 1.8) }]}>{subtitle(next ?? "fajr")}</Text>
              )}
              <Text style={[styles.nextTime, { fontSize: fs(5.6, 4.3), lineHeight: fs(5.6, 4.3) * 1.1, marginTop: vh * 0.4 }]}>
                {clock(target)}
              </Text>
              <Text style={[styles.nextCountdown, { fontSize: fs(3, 2.2), marginTop: vh * 0.8 }]}>
                {isValidTime(target) ? num(formatCountdown(countdown)) : "—"}
              </Text>
            </View>
          </View>

          {/* Sun arc */}
          <View style={[styles.arc, { marginTop: vh, minHeight: vh * 24 }]}>
            <WallSunArc now={now} times={times} next={next} label={label} clock={clock} />
          </View>

          {/* Prayer cards */}
          <View style={[styles.grid, { gap: vw, height: vh * 15 }]}>
            {PRAYER_ORDER.map((p) => {
              const isNext = p === next;
              const isPast = isValidTime(times[p]) && times[p].getTime() < now.getTime();
              const isJumua = jumua && p === "dhuhr";
              const hot = isNext || isJumua;
              return (
                <View
                  key={p}
                  style={[
                    styles.glass,
                    styles.card,
                    { borderRadius: vh * 1.4 },
                    hot && styles.glassGold,
                    isNext && styles.cardNext,
                    isJumua && !isNext && styles.cardJumua,
                    isPast && !hot && styles.cardPast,
                  ]}
                >
                  <Text style={[styles.cardName, { fontSize: fs(3.4, 2.3), color: hot ? GOLD_SOFT : BONE_DIM }]} numberOfLines={1}>
                    {label(p)}
                  </Text>
                  {subtitle(p) && (
                    <Text style={[styles.cardSub, { fontSize: fs(1.7, 1.25), color: hot ? "rgba(232,200,120,0.65)" : BONE_FAINT }]} numberOfLines={1}>
                      {subtitle(p)}
                    </Text>
                  )}
                  <Text style={[styles.cardTime, { fontSize: fs(5.6, 3.9), lineHeight: fs(5.6, 3.9) * 1.1, marginTop: vh * 0.5 }]}>
                    {clock(times[p])}
                  </Text>
                  {isJumua && (
                    <Text style={[styles.cardOpens, { fontSize: fs(1.9, 1.4), marginTop: vh * 0.5 }]}>
                      {t("timeOpensAt", { time: clock(raw.dhuhr) })}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Qurʾān / ḥadīth ticker */}
          <Animated.View
            style={[
              styles.footer,
              { height: vh * 8.5, opacity: ayah, transform: [{ translateY: ayah.interpolate({ inputRange: [0, 1], outputRange: [vh * 0.8, 0] }) }] },
            ]}
          >
            <Text
              style={[
                styles.saying,
                saying.kind === "dhikr" ? styles.sayingDhikr : styles.sayingText,
                { fontSize: fs(3.6, 2.7), lineHeight: fs(3.6, 2.7) * 1.5 },
              ]}
              numberOfLines={2}
            >
              <Text style={[styles.sayingMark, { fontSize: saying.kind === "dhikr" ? fs(1.8, 1.3) : fs(3.6, 2.7) }]}>
                {`${marks.open}  `}
              </Text>
              {saying.text}
              <Text style={[styles.sayingMark, { fontSize: saying.kind === "dhikr" ? fs(1.8, 1.3) : fs(3.6, 2.7) }]}>
                {`  ${marks.close}`}
              </Text>
            </Text>
            {saying.kind === "hadith" && saying.source && (
              <Text style={[styles.sayingSource, { fontSize: fs(1.9, 1.45), marginTop: vh * 0.5 }]}>
                {`ﷺ · ${saying.source}`}
              </Text>
            )}
          </Animated.View>
        </View>
      </BurnShift>

      {/* Full-screen photo with a duʿāʾ, every few minutes */}
      <PhotoOverlay now={now} suppressed={prayerNow !== null} locale={locale} vh={vh} vw={vw} />

      {/* Night-dim wash */}
      <Animated.View pointerEvents="none" style={[styles.nightDim, { opacity: dim }]} />

      {/* "It's prayer time now" takeover */}
      {prayerNow && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.takeover,
            { opacity: takeover, transform: [{ scale: takeover.interpolate({ inputRange: [0, 1], outputRange: [1.04, 1] }) }] },
          ]}
        >
          <Text style={[styles.takeoverLead, { fontSize: fs(4, 3), letterSpacing: 3 }]}>{t("prayerNowTitle")}</Text>
          <Text style={[styles.takeoverName, { fontSize: fs(18, 13), lineHeight: fs(18, 13) * 1.15, marginVertical: vh * 1.5 }]}>
            {t("prayerNowName", { prayer: label(prayerNow) })}
          </Text>
          {subtitle(prayerNow) && (
            <Text style={[styles.takeoverSub, { fontSize: fs(3.2, 2.4), marginBottom: vh * 1.5 }]}>
              {`صلاةِ ${labelAr(prayerNow)}`}
            </Text>
          )}
          <Text style={[styles.takeoverHayya, { fontSize: fs(4.5, 3.4) }]}>{t("hayyaAlaSalah")}</Text>
        </Animated.View>
      )}

      {/* Tap menu */}
      {menu && !setupOpen && (
        <View style={[styles.menu, { top: vh * 3, right: vw * 3, gap: vw }]}>
          <Pressable
            style={[styles.menuButton, { paddingVertical: vh * 1.6, paddingHorizontal: vw * 2 }]}
            onPress={() => setSetupOpen(true)}
            focusable
            hasTVPreferredFocus
          >
            <Text style={[styles.menuText, { fontSize: fs(3.2, 2.4) }]}>{t("displaySettings")}</Text>
          </Pressable>
          <Pressable
            style={[styles.menuButton, { paddingVertical: vh * 1.6, paddingHorizontal: vw * 2 }]}
            onPress={() => router.back()}
            focusable
          >
            <Text style={[styles.menuText, { fontSize: fs(3.2, 2.4) }]}>{t("displayExit")}</Text>
          </Pressable>
        </View>
      )}

      {/* First-run setup (and the Settings entry of the tap menu) */}
      {setupOpen && settings && (
        <DisplaySetup
          initial={settings}
          placeName={place.name}
          onDone={finishSetup}
          onCancel={settings.configured ? () => setSetupOpen(false) : undefined}
        />
      )}
    </Pressable>
  );
}

const FILL = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1 },

  header: { alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  title: {
    color: LEAF,
    fontFamily: FONTS.display,
    textAlign: "center",
    textShadowColor: "rgba(232,200,120,0.18)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
    flexShrink: 1,
  },
  dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  date: { color: BONE_DIM, fontFamily: FONTS.display },
  hijri: { color: "rgba(232,200,120,0.85)", fontFamily: FONTS.display, fontVariant: ["tabular-nums"] },
  diamond: { color: "rgba(232,200,120,0.4)" },
  placeName: { color: BONE_FAINT, fontFamily: FONTS.display },

  hero: { flexDirection: "row", alignItems: "stretch" },
  glass: {
    backgroundColor: "rgba(12,32,24,0.52)",
    borderWidth: 1,
    borderColor: "rgba(232,200,120,0.18)",
  },
  glassGold: { backgroundColor: "rgba(56,68,44,0.5)", borderColor: "rgba(232,200,120,0.34)" },
  clockCard: { flex: 1.05, alignItems: "center", justifyContent: "center" },
  nextCard: { flex: 0.95, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  nowLabel: { color: BONE_FAINT, fontFamily: FONTS.display },
  clock: {
    color: BONE,
    fontFamily: FONTS.display,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 20,
  },
  currentLabel: { color: "rgba(232,200,120,0.8)", fontFamily: FONTS.display },
  nextLabel: { color: "rgba(232,200,120,0.85)", fontFamily: FONTS.display },
  nextName: { color: BONE, fontFamily: FONTS.display, textAlign: "center" },
  nextSub: { color: BONE_FAINT, fontFamily: FONTS.display, letterSpacing: 1 },
  nextTime: { color: LEAF_BRIGHT, fontFamily: FONTS.display, fontVariant: ["tabular-nums"] },
  nextCountdown: { color: BONE_DIM, fontFamily: FONTS.display, fontVariant: ["tabular-nums"] },

  arc: { flex: 1 },

  grid: { flexDirection: "row" },
  card: { flex: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  cardNext: { borderColor: "rgba(232,200,120,0.55)" },
  cardJumua: { borderWidth: 2, borderColor: "rgba(232,200,120,0.4)" },
  cardPast: { opacity: 0.45 },
  cardName: { fontFamily: FONTS.display },
  cardSub: { fontFamily: FONTS.display, letterSpacing: 0.5 },
  cardTime: { color: BONE, fontFamily: FONTS.display, fontVariant: ["tabular-nums"] },
  cardOpens: { color: "rgba(232,200,120,0.6)", fontFamily: FONTS.display, fontVariant: ["tabular-nums"] },

  footer: { alignItems: "center", justifyContent: "center" },
  saying: { textAlign: "center", writingDirection: "rtl", fontFamily: FONTS.quran },
  sayingText: { color: BONE },
  sayingDhikr: { color: GOLD_SOFT },
  sayingMark: { color: "rgba(232,200,120,0.55)" },
  sayingSource: { color: "rgba(232,200,120,0.55)", fontFamily: FONTS.display, letterSpacing: 1 },

  nightDim: { ...FILL, backgroundColor: "#04100c" },

  takeover: {
    ...FILL,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(4,16,11,0.92)",
  },
  takeoverLead: { color: "rgba(232,200,120,0.8)", fontFamily: FONTS.display },
  takeoverName: {
    color: LEAF,
    fontFamily: FONTS.display,
    textAlign: "center",
    textShadowColor: "rgba(232,200,120,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
  },
  takeoverSub: { color: "rgba(232,200,120,0.7)", fontFamily: FONTS.display },
  takeoverHayya: { color: BONE_DIM, fontFamily: FONTS.quran, textAlign: "center" },

  menu: { position: "absolute", flexDirection: "row" },
  menuButton: {
    backgroundColor: "rgba(8,24,18,0.9)",
    borderWidth: 1,
    borderColor: "rgba(232,200,120,0.5)",
    borderRadius: 999,
  },
  menuText: { color: LEAF_BRIGHT, fontFamily: FONTS.body },
});
