import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useI18n } from "@/lib/i18n";
import { SURAHS } from "@/lib/quran/meta";
import { surahTitle } from "@/lib/quran/names";
import {
  refKey,
  saveLastRead,
  useBookmarks,
  useTajweedSetting,
  useTextSize,
} from "@/lib/quran/reading-state";
import { TajweedPage } from "@/components/quran/TajweedPage";
import { FAMILY_COLOR, LEGEND } from "@/lib/quran/tajweed-colors";
import type { PageAyah } from "@/lib/quran/tajweed-html";
import { AYAT } from "@/lib/quran/text";
import { splitBasmala, surahMeta } from "@/lib/quran/text-utils";
import { COLORS, FONTS, TEXT } from "@/theme";

// The reading screen: one sūrah, one āyah per block, as the text stands.
//
// What is drawn is AYAT verbatim. The only layout decision is the basmala,
// set on its own line above the sūrah the way a printed mushaf does it
// (`splitBasmala`, tested to re-join to the original line). Āyah numbers sit
// in ornate brackets after each āyah, in 0–9 like the rest of the app.
//
// Arabic is drawn in full-opacity colours only (see TEXT in theme.ts): dimmed
// Arabic on Android shows seams where letters join, and in the Quran that
// would read as a flaw in the text.

interface AyahItem {
  ayah: number;
  /** Index into AYAT, for the tajweed spans. */
  index: number;
  /** The āyah as shown: AYAT[index] from `from` on. */
  text: string;
  /** Characters skipped at the start (the basmala lifted into the header). */
  from: number;
}

export default function QuranReaderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ surah: string; ayah?: string }>();
  const { t, locale, isRTL } = useI18n();
  const { size, canGrow, canShrink, step } = useTextSize();
  const { bookmarks, toggle } = useBookmarks();
  const tajweed = useTajweedSetting();
  const [legendOpen, setLegendOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const surahNo = clamp(Number(params.surah) || 1, 1, 114);
  const meta = surahMeta(surahNo);
  const startAyah = clamp(Number(params.ayah) || 1, 1, meta.ayahs);

  const { basmala, items } = useMemo(() => {
    const list: AyahItem[] = [];
    let opening: string | null = null;
    for (let a = 1; a <= meta.ayahs; a++) {
      const index = meta.start + a - 1;
      const raw = AYAT[index];
      if (a === 1) {
        const split = splitBasmala(surahNo, 1, raw);
        opening = split.basmala;
        list.push({ ayah: 1, index, text: split.text, from: raw.length - split.text.length });
      } else {
        list.push({ ayah: a, index, text: raw, from: 0 });
      }
    }
    return { basmala: opening, items: list };
  }, [meta, surahNo]);

  const marked = useMemo(
    () => new Set(bookmarks.filter((b) => b.surah === surahNo).map(refKey)),
    [bookmarks, surahNo],
  );

  // -------------------------------------------------- opening position --
  const listRef = useRef<FlatList<AyahItem>>(null);
  const scrolledTo = useRef(false);
  const scrollToStart = useCallback(() => {
    if (scrolledTo.current || startAyah <= 1) return;
    scrolledTo.current = true;
    listRef.current?.scrollToIndex({ index: startAyah - 1, animated: false });
  }, [startAyah]);
  // A link to another āyah while this screen is already open changes the
  // params without a new layout pass, so the jump cannot wait for onLayout.
  useEffect(() => {
    scrolledTo.current = false;
    const id = setTimeout(scrollToStart, 50);
    return () => clearTimeout(id);
  }, [surahNo, startAyah, scrollToStart]);

  // ------------------------------------------------------- last read --
  // Saved a moment after scrolling settles, not on every frame.
  const surahNoRef = useRef(surahNo);
  useEffect(() => {
    surahNoRef.current = surahNo;
  }, [surahNo]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable for the screen's life: FlatList does not allow swapping this
  // handler after mount.
  const visibleAyah = useRef(startAyah);
  const noteVisible = useCallback((ayah: number) => {
    visibleAyah.current = ayah;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(
      () => saveLastRead({ surah: surahNoRef.current, ayah }),
      800,
    );
  }, []);
  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<AyahItem>[] }) => {
      const first = viewableItems.find((v) => v.isViewable)?.item;
      if (first) noteVisible(first.ayah);
    },
    [noteVisible],
  );
  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  // ---------------------------------------------------------- toast --
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  const goTo = useCallback(
    (n: number) =>
      router.replace({ pathname: "/quran/[surah]", params: { surah: String(n), ayah: "1" } }),
    [router],
  );

  // ------------------------------------------------------- tajweed --
  // The tajweed view is a different renderer (components/quran/TajweedPage),
  // so switching hands over the āyah being read: the page opens there, and
  // the list scrolls back to it when switching off.
  // The āyah handed over when tajweed was switched on, valid only for the
  // link it was switched on under; a new link opens at its own āyah.
  const [handoff, setHandoff] = useState<{ surah: number; link: number; ayah: number } | null>(
    null,
  );
  const pageStart =
    handoff && handoff.surah === surahNo && handoff.link === startAyah ? handoff.ayah : startAyah;
  const toggleTajweed = useCallback(() => {
    const keep = visibleAyah.current;
    if (!tajweed.on) setHandoff({ surah: surahNo, link: startAyah, ayah: keep });
    tajweed.toggle();
    if (tajweed.on) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: keep - 1, animated: false });
      }, 80);
    }
  }, [tajweed, surahNo, startAyah]);

  const pageAyat = useMemo<PageAyah[]>(
    () => items.map((it) => ({ ayah: it.ayah, index: it.index, from: it.from, raw: AYAT[it.index] })),
    [items],
  );
  const pageBookmarks = useMemo(
    () => bookmarks.filter((b) => b.surah === surahNo).map((b) => b.ayah),
    [bookmarks, surahNo],
  );
  const subtitle = `${t(meta.revelation === "Meccan" ? "quranMeccan" : "quranMedinan")} · ${t(
    "quranAyahCount",
    { count: meta.ayahs },
  )}`;
  const prevNav = useMemo(
    () =>
      surahNo > 1
        ? { label: t("quranPrevSurah"), name: surahTitle(SURAHS[surahNo - 2], locale), surah: surahNo - 1 }
        : null,
    [surahNo, t, locale],
  );
  const nextNav = useMemo(
    () =>
      surahNo < 114
        ? { label: t("quranNextSurah"), name: surahTitle(SURAHS[surahNo], locale), surah: surahNo + 1 }
        : null,
    [surahNo, t, locale],
  );

  const onLongPressAyah = useCallback(
    (ayah: number) =>
      flash(
        t(toggle({ surah: surahNo, ayah }) ? "quranBookmarkAdded" : "quranBookmarkRemoved"),
      ),
    [flash, t, toggle, surahNo],
  );

  const row = isRTL ? styles.rtl : styles.ltr;
  const lineHeight = Math.round(size * 1.9);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, row]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.side}>
          <Text style={styles.back}>{t("back")}</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {surahTitle(meta, locale)}
        </Text>
        <View style={styles.side} />
      </View>

      <View style={[styles.toolbar, row]}>
        <Pressable
          onPress={toggleTajweed}
          style={[styles.chip, tajweed.on && styles.chipOn]}
          accessibilityRole="switch"
          accessibilityState={{ checked: tajweed.on }}
        >
          <Text style={[styles.chipText, tajweed.on && styles.chipTextOn]}>
            {t("tajweed")}
          </Text>
        </Pressable>
        {tajweed.on && (
          <Pressable onPress={() => setLegendOpen((v) => !v)} hitSlop={8}>
            <Text style={styles.legendToggle}>{t("tajweedLegend")}</Text>
          </Pressable>
        )}
        <View style={styles.toolbarSpacer} />
        <View style={[styles.sizeButtons, row]}>
          <Pressable
            onPress={() => step(-1)}
            disabled={!canShrink}
            hitSlop={8}
            accessibilityLabel={t("quranTextSmaller")}
          >
            <Text style={[styles.sizeButton, !canShrink && styles.sizeDisabled]}>A−</Text>
          </Pressable>
          <Pressable
            onPress={() => step(1)}
            disabled={!canGrow}
            hitSlop={8}
            accessibilityLabel={t("quranTextLarger")}
          >
            <Text style={[styles.sizeButtonLarge, !canGrow && styles.sizeDisabled]}>A+</Text>
          </Pressable>
        </View>
      </View>

      {tajweed.on && legendOpen && (
        <View style={styles.legend}>
          {LEGEND.map(({ family, label }) => (
            <View key={family} style={[styles.legendRow, row]}>
              <View style={[styles.legendSwatch, { backgroundColor: FAMILY_COLOR[family] }]} />
              <Text style={[styles.legendLabel, { textAlign: isRTL ? "right" : "left" }]}>
                {t(label)}
              </Text>
            </View>
          ))}
          <Text style={[styles.legendNote, { textAlign: isRTL ? "right" : "left" }]}>
            {t("tajweedSource")}
          </Text>
        </View>
      )}

      {tajweed.on ? (
        <TajweedPage
          key={surahNo}
          surahName={meta.name}
          subtitle={subtitle}
          basmala={basmala}
          ayat={pageAyat}
          fontSize={size}
          startAyah={pageStart}
          bookmarked={pageBookmarks}
          prev={prevNav}
          next={nextNav}
          onVisibleAyah={noteVisible}
          onLongPressAyah={onLongPressAyah}
          onNavigate={goTo}
        />
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(i) => String(i.ayah)}
          contentContainerStyle={styles.content}
          onLayout={scrollToStart}
          onScrollToIndexFailed={({ averageItemLength, index }) => {
            // Āyāt differ wildly in length, so the list cannot know an unseen
            // row's offset. Jump near it, let rows render, then land exactly.
            listRef.current?.scrollToOffset({ offset: averageItemLength * index, animated: false });
            setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false }), 120);
          }}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={VIEWABILITY}
          initialNumToRender={10}
          maxToRenderPerBatch={6}
          windowSize={7}
          ListHeaderComponent={
            <View style={styles.opening}>
              <Text style={styles.surahName}>{meta.name}</Text>
              <Text style={styles.surahSub}>
                {t(meta.revelation === "Meccan" ? "quranMeccan" : "quranMedinan")} ·{" "}
                {t("quranAyahCount", { count: meta.ayahs })}
              </Text>
              {basmala && (
                <Text style={[styles.basmala, { fontSize: size, lineHeight }]}>{basmala}</Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <AyahRow
              item={item}
              size={size}
              lineHeight={lineHeight}
              marked={marked.has(refKey({ surah: surahNo, ayah: item.ayah }))}
              onLongPress={onLongPressAyah}
            />
          )}
          ListFooterComponent={
            <View style={[styles.footer, row]}>
              {surahNo > 1 ? (
                <Pressable style={styles.navButton} onPress={() => goTo(surahNo - 1)}>
                  <Text style={styles.navLabel}>{t("quranPrevSurah")}</Text>
                  <Text style={styles.navName}>{surahTitle(SURAHS[surahNo - 2], locale)}</Text>
                </Pressable>
              ) : (
                <View style={styles.navSpacer} />
              )}
              {surahNo < 114 ? (
                <Pressable style={styles.navButton} onPress={() => goTo(surahNo + 1)}>
                  <Text style={styles.navLabel}>{t("quranNextSurah")}</Text>
                  <Text style={styles.navName}>{surahTitle(SURAHS[surahNo], locale)}</Text>
                </Pressable>
              ) : (
                <View style={styles.navSpacer} />
              )}
            </View>
          }
        />
      )}

      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

interface AyahRowProps {
  item: AyahItem;
  size: number;
  lineHeight: number;
  marked: boolean;
  onLongPress: (ayah: number) => void;
}

/** One āyah. Memoised: scrolling and bookmarking re-render only what changed. */
const AyahRow = memo(function AyahRow({
  item,
  size,
  lineHeight,
  marked,
  onLongPress,
}: AyahRowProps) {
  return (
    <Pressable
      onLongPress={() => onLongPress(item.ayah)}
      delayLongPress={350}
      style={[styles.ayah, marked && styles.ayahMarked]}
    >
      <Text style={[styles.ayahText, { fontSize: size, lineHeight }]}>
        {item.text}
        <Text style={styles.ayahNumber}>{` ﴿${item.ayah}﴾`}</Text>
      </Text>
    </Pressable>
  );
});

const VIEWABILITY = { itemVisiblePercentThreshold: 60, minimumViewTime: 300 };

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  ltr: { flexDirection: "row" },
  rtl: { flexDirection: "row-reverse" },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  side: { width: 72 },
  back: { color: COLORS.gold, fontSize: 16, fontFamily: FONTS.body },
  title: {
    flex: 1,
    textAlign: "center",
    color: TEXT.full,
    fontSize: 18,
    fontFamily: FONTS.display,
  },
  toolbar: {
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  toolbarSpacer: { flex: 1 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  chipOn: { borderColor: COLORS.goldEdge, backgroundColor: COLORS.goldWash },
  chipText: { color: TEXT.soft, fontSize: 14, fontFamily: FONTS.body },
  chipTextOn: { color: TEXT.gold },
  legendToggle: { color: TEXT.gold, fontSize: 13, fontFamily: FONTS.body },
  legend: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 7,
    backgroundColor: COLORS.raised,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  legendRow: { alignItems: "center", gap: 10 },
  legendSwatch: { width: 14, height: 14, borderRadius: 4 },
  legendLabel: { flex: 1, color: TEXT.full, fontSize: 14, fontFamily: FONTS.body },
  legendNote: { color: TEXT.soft, fontSize: 12, fontFamily: FONTS.body, marginTop: 4 },
  sizeButtons: { alignItems: "center", gap: 16 },
  sizeButton: { color: TEXT.gold, fontSize: 14, fontFamily: FONTS.body },
  sizeButtonLarge: { color: TEXT.gold, fontSize: 19, fontFamily: FONTS.body },
  sizeDisabled: { color: TEXT.faint },

  content: { paddingHorizontal: 18, paddingBottom: 40 },
  opening: { alignItems: "center", paddingTop: 22, paddingBottom: 10, gap: 4 },
  surahName: { color: TEXT.gold, fontSize: 30, fontFamily: FONTS.quran },
  surahSub: { color: TEXT.soft, fontSize: 13, fontFamily: FONTS.body },
  basmala: {
    color: TEXT.full,
    fontFamily: FONTS.mushaf,
    textAlign: "center",
    writingDirection: "rtl",
    marginTop: 14,
  },

  ayah: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  ayahMarked: { backgroundColor: COLORS.goldWash, borderRadius: 10 },
  ayahText: {
    color: TEXT.full,
    fontFamily: FONTS.mushaf,
    textAlign: "right",
    writingDirection: "rtl",
  },
  ayahNumber: { color: TEXT.gold },

  footer: { justifyContent: "space-between", gap: 12, paddingTop: 24 },
  navButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 12,
    gap: 2,
    alignItems: "center",
  },
  navSpacer: { flex: 1 },
  navLabel: { color: TEXT.soft, fontSize: 12, fontFamily: FONTS.body },
  navName: { color: TEXT.full, fontSize: 15, fontFamily: FONTS.body },

  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: COLORS.raised,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  toastText: { color: TEXT.full, fontSize: 14, fontFamily: FONTS.body },
});
