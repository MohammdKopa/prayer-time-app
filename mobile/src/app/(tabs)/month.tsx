import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { hijriMonthName } from "@/lib/hijri";
import { useI18n } from "@/lib/i18n";
import { gregorianMonthName } from "@/lib/month/calendar-names";
import { buildMonth, shiftMonth } from "@/lib/month/model";
import { usePrefs } from "@/lib/use-prefs";
import { ShareCard } from "@/lib/month/share-card";
import { shareView } from "@/lib/month/share";
import {
  COMPACT_WIDTH,
  dayKey,
  MonthRows,
  TableHeaderRow,
} from "@/lib/month/table";
import { usePlaceContext } from "@/lib/place-context";
import { COLORS, FONTS, TEXT } from "@/theme";

// The month.
//
// The clock screen answers "how long do I have"; this one answers "when is
// Fajr on the 23rd" and, more often, "send me the timetable". Those are two
// different jobs, which is why the table is dense and unanimated: it is meant
// to be read across, compared, and photographed, not watched.
//
// Three things are marked because three things get looked for: today, so you
// can find your place without counting; Friday, because Jumu'ah is the one
// row a week that has to be right; and the Hijri day, because half the people
// reading this know the date that way round.
//
// Performance is in two places and neither is here. The month itself is built
// and cached in lib/month/model.ts — measured at 1.5 ms on desktop V8 for a
// full month including Hijri conversion, so roughly 8-15 ms under Hermes, and
// zero on a revisit. The rows are memoised in lib/month/table.tsx over an
// object that comes straight out of that cache, so scrolling re-renders
// nothing at all. What is left here is making sure the tap on "next" never
// pays the 8-15 ms: the neighbouring months are built after the interaction
// settles, so by the time the finger lifts they are already in the cache.

/** How long a share error stays on screen before it stops being useful. */
const NOTICE_MS = 5000;

export default function MonthScreen() {
  const router = useRouter();
  const { t, locale, isRTL } = useI18n();
    const { place } = usePlaceContext();
  const { width } = useWindowDimensions();

  const compact = width < COMPACT_WIDTH;

  // ---------------------------------------------------------------------
  // Which month
  // ---------------------------------------------------------------------

  const [today, setToday] = useState(() => new Date());
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Left open past midnight, the "today" stripe would sit on yesterday. One
  // timer, rearmed each time it fires.
  useEffect(() => {
    const midnight = new Date(today);
    midnight.setHours(24, 0, 0, 0);
    const id = setTimeout(
      () => setToday(new Date()),
      Math.max(1000, midnight.getTime() - Date.now()),
    );
    return () => clearTimeout(id);
  }, [today]);

  const { prefs, key: prefsKey } = usePrefs(place);
  const table = useMemo(
    () =>
      buildMonth(
        cursor.year,
        cursor.month,
        place.latitude,
        place.longitude,
        prefs,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cursor.year, cursor.month, place.latitude, place.longitude, prefsKey],
  );

  // Warm the neighbours once the screen is idle, so stepping is instant. The
  // results go into the module cache; the return value is deliberately unused.
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      for (const step of [1, -1]) {
        const next = shiftMonth(cursor.year, cursor.month, step);
        buildMonth(
          next.year,
          next.month,
          place.latitude,
          place.longitude,
          prefs,
        );
      }
    });
    return () => handle.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.year, cursor.month, place.latitude, place.longitude, prefsKey]);

  const todayKey =
    today.getFullYear() === cursor.year && today.getMonth() === cursor.month
      ? dayKey(today)
      : null;

  const step = useCallback((by: number) => {
    setCursor((c) => shiftMonth(c.year, c.month, by));
  }, []);

  // ---------------------------------------------------------------------
  // Headings
  // ---------------------------------------------------------------------

  const heading = t("monthHeading", {
    month: gregorianMonthName(cursor.month, locale),
    year: cursor.year,
  });

  const hijriHeading = useMemo(() => {
    const span = table.hijriSpan;
    if (span.length === 0) return null; // outside the Umm al-Qura table

    const first = span[0];
    const last = span[span.length - 1];
    const suffix = t("hijriSuffix");

    if (span.length === 1) {
      return `${t("hijriMonthSingle", {
        month: hijriMonthName(first.month, locale),
        year: first.year,
      })} ${suffix}`;
    }
    if (first.year === last.year) {
      return `${t("hijriMonthSpan", {
        from: hijriMonthName(first.month, locale),
        to: hijriMonthName(last.month, locale),
        year: last.year,
      })} ${suffix}`;
    }
    return `${t("hijriMonthSpanYears", {
      from: hijriMonthName(first.month, locale),
      fromYear: first.year,
      to: hijriMonthName(last.month, locale),
      toYear: last.year,
    })} ${suffix}`;
  }, [table, locale, t]);

  // ---------------------------------------------------------------------
  // Where the month opens
  // ---------------------------------------------------------------------

  // This month opens on today — nobody wants to scroll to the 23rd to find
  // out about the 23rd. Any other month opens at its first day, because a
  // ScrollView keeps its offset when the content under it changes, and
  // landing halfway down a month you just stepped into is disorienting.

  const scroller = useRef<ScrollView>(null);
  const rowHeight = useRef(0);
  const placedFor = useRef<string | null>(null);

  const placeScroll = useCallback(() => {
    const key = `${cursor.year}-${cursor.month}`;
    // Nothing measured yet — the layout callback will come back here.
    if (placedFor.current === key || rowHeight.current === 0) return;
    placedFor.current = key;
    // Two rows of context above today, so it does not sit against the heading.
    const index = todayKey === null ? 0 : Math.max(0, today.getDate() - 3);
    scroller.current?.scrollTo({
      y: index * rowHeight.current,
      animated: false,
    });
  }, [cursor.year, cursor.month, todayKey, today]);

  // Rows are uniform, so the block's height over its row count is the row
  // height — more robust than measuring one row and hoping it is a plain one.
  // This fires on mount and whenever the month's length changes; the effect
  // below covers the months where it does not fire at all.
  const onRowsLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const count = table.days.length;
      if (count > 0) rowHeight.current = e.nativeEvent.layout.height / count;
      placeScroll();
    },
    [table.days.length, placeScroll],
  );

  useEffect(placeScroll, [placeScroll]);

  // ---------------------------------------------------------------------
  // Share
  // ---------------------------------------------------------------------

  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const card = useRef<View>(null);
  const awaitingLayout = useRef(false);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(id);
  }, [notice]);

  const onShare = useCallback(() => {
    if (sharing) return;
    setNotice(null);
    awaitingLayout.current = true;
    setSharing(true); // mounts the offstage card
  }, [sharing]);

  // If the card somehow never lays out, the button must not spin forever.
  // Once the capture itself has started this does nothing — the share sheet
  // is allowed to take as long as the user takes.
  useEffect(() => {
    if (!sharing) return;
    const id = setTimeout(() => {
      if (!awaitingLayout.current) return;
      awaitingLayout.current = false;
      setSharing(false);
      setNotice(t("shareFailed"));
    }, 2500);
    return () => clearTimeout(id);
  }, [sharing, t]);

  // The card is captured on its first layout — that is the point at which the
  // native views exist and have a size. One frame further on for the paint,
  // because `captureRef` reads pixels, not the shadow tree.
  const onCardLayout = useCallback(() => {
    if (!awaitingLayout.current) return;
    awaitingLayout.current = false;

    requestAnimationFrame(() => {
      void (async () => {
        const result = await shareView(card, {
          fileName: `prayer-times-${cursor.year}-${String(
            cursor.month + 1,
          ).padStart(2, "0")}`,
          dialogTitle: t("shareTitle", { month: heading }),
        });
        setSharing(false);
        if (result === "unavailable") setNotice(t("shareUnavailable"));
        else if (result === "failed") setNotice(t("shareFailed"));
      })();
    });
  }, [cursor.year, cursor.month, heading, t]);

  // ---------------------------------------------------------------------

  const rowDirection = isRTL ? styles.rtl : styles.ltr;

  return (
    <View style={styles.root}>
      {/* Offstage, and behind the opaque screen below it, so nothing flashes.
          Clipping by a parent does not affect what `captureRef` draws — the
          bitmap is the size of this view, which is its full content height. */}
      {sharing && (
        <View style={styles.offstage} pointerEvents="none">
          <ShareCard
            ref={card}
            onLayout={onCardLayout}
            table={table}
            todayKey={todayKey}
            heading={heading}
            hijriHeading={hijriHeading}
            placeName={place.name}
            width={width}
            locale={locale}
            isRTL={isRTL}
            compact={compact}
            t={t}
          />
        </View>
      )}

      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
        <View />
          <Text style={styles.title}>{t("monthlyTimetable")}</Text>
          <Pressable
            onPress={onShare}
            hitSlop={12}
            disabled={sharing}
            style={styles.shareButton}
            accessibilityRole="button"
            accessibilityLabel={t("share")}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={COLORS.gold} />
            ) : (
              <Text style={styles.shareIcon}>&#10548;</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.nav, rowDirection]}>
          <Pressable
            onPress={() => step(-1)}
            hitSlop={14}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel={t("prevMonth")}
          >
            <Text style={styles.navIcon}>{isRTL ? "›" : "‹"}</Text>
          </Pressable>

          <View style={styles.navCentre}>
            <Text style={styles.month}>{heading}</Text>
            {hijriHeading && <Text style={styles.hijri}>{hijriHeading}</Text>}
          </View>

          <Pressable
            onPress={() => step(1)}
            hitSlop={14}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel={t("nextMonth")}
          >
            <Text style={styles.navIcon}>{isRTL ? "‹" : "›"}</Text>
          </Pressable>
        </View>

        {/* The column heading stays put while the month scrolls under it —
            six unlabelled columns of numbers are useless. */}
        <View style={styles.table}>
          <TableHeaderRow t={t} isRTL={isRTL} compact={compact} />

          <ScrollView
            ref={scroller}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View onLayout={onRowsLayout}>
              <MonthRows
                table={table}
                todayKey={todayKey}
                locale={locale}
                isRTL={isRTL}
                compact={compact}
              />
            </View>

            <View style={[styles.legend, rowDirection]}>
              <View style={[styles.legendItem, rowDirection]}>
                <View style={[styles.swatch, styles.swatchToday]} />
                <Text style={styles.legendText}>{t("today")}</Text>
              </View>
              <View style={[styles.legendItem, rowDirection]}>
                <View style={[styles.swatch, styles.swatchFriday]} />
                <Text style={styles.legendText}>{t("friday")}</Text>
              </View>
            </View>

            <Text style={styles.note}>{t("mosqueTiming")}</Text>
            {notice && <Text style={styles.notice}>{notice}</Text>}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  offstage: { position: "absolute", top: 0, left: 0 },
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  back: { color: COLORS.gold, fontSize: 16, fontFamily: FONTS.body },
  title: { color: COLORS.bone, fontSize: 18, fontFamily: FONTS.display },
  shareButton: {
    width: 44,
    height: 28,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  shareIcon: { color: COLORS.gold, fontSize: 22 },

  ltr: { flexDirection: "row" },
  rtl: { flexDirection: "row-reverse" },

  nav: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: { color: COLORS.gold, fontSize: 30, lineHeight: 36 },
  navCentre: { flex: 1, alignItems: "center", gap: 1 },
  month: { color: COLORS.bone, fontSize: 21, fontFamily: FONTS.display },
  hijri: { color: TEXT.goldSoft, fontSize: 13, fontFamily: FONTS.body },

  table: { flex: 1, paddingHorizontal: 8 },
  scroll: { paddingBottom: 28 },

  legend: {
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingTop: 14,
    paddingHorizontal: 6,
  },
  legendItem: { alignItems: "center", gap: 6 },
  swatch: {
    width: 11,
    height: 11,
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
  },
  swatchToday: {
    backgroundColor: COLORS.goldWash,
    borderColor: COLORS.goldEdge,
  },
  swatchFriday: { backgroundColor: "rgba(232,227,217,0.04)" },
  legendText: { color: TEXT.faint, fontSize: 12, fontFamily: FONTS.body },

  note: {
    paddingTop: 10,
    textAlign: "center",
    color: TEXT.faint,
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  notice: {
    paddingTop: 8,
    textAlign: "center",
    color: TEXT.goldSoft,
    fontSize: 13,
    fontFamily: FONTS.body,
  },
});
