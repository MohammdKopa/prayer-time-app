import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { AyahActions } from "@/components/quran/AyahActions";
import { MushafPager } from "@/components/quran/MushafPager";
import { ReaderSettings } from "@/components/quran/ReaderSettings";
import { useI18n } from "@/lib/i18n";
import type { AyahRef } from "@/lib/quran/meta";
import { surahTitle } from "@/lib/quran/names";
import { PAGE_COUNT, pageInfo, pageOf, pageRange, refOfIndex } from "@/lib/quran/pages";
import {
  refKey,
  saveLastRead,
  useBookmarks,
  usePageBookmarks,
  useTajweedSetting,
  useTextSize,
} from "@/lib/quran/reading-state";
import { surahMeta } from "@/lib/quran/text-utils";
import { COLORS, FONTS, TEXT } from "@/theme";

// The reader: the mushaf page by page, swiped right to left like the printed
// Madani mushaf (604 pages, the same page numbers). The text is drawn by
// components/quran/MushafPager; this screen holds the chrome around it.
//
// Tap an āyah for bookmark / copy / share. The ribbon in the header marks the
// page, like a ribbon left in a printed mushaf. "Aa" holds text size and
// tajweed.
//
// Opened as /quran/<surah>?ayah=<n> (the page holding that āyah) or with
// &page=<n> to open a page directly.

export default function QuranReaderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ surah: string; ayah?: string; page?: string }>();
  const { t, locale, isRTL } = useI18n();
  const textSize = useTextSize();
  const tajweed = useTajweedSetting();
  const { bookmarks, toggle: toggleAyah } = useBookmarks();
  const { pages: pageMarks, toggle: togglePage } = usePageBookmarks();

  const target = useMemo<{ page: number; ref: AyahRef }>(() => {
    const surah = clamp(Number(params.surah) || 1, 1, 114);
    const ayah = clamp(Number(params.ayah) || 1, 1, surahMeta(surah).ayahs);
    const asked = Number(params.page);
    if (Number.isInteger(asked) && asked >= 1 && asked <= PAGE_COUNT) {
      return { page: asked, ref: refOfIndex(pageRange(asked).start) };
    }
    return { page: pageOf({ surah, ayah }), ref: { surah, ayah } };
  }, [params.surah, params.ayah, params.page]);

  const [page, setPage] = useState(target.page);
  // A new link while the screen is open (a bookmark, a search) turns the page.
  const [linked, setLinked] = useState(target.page);
  if (linked !== target.page) {
    setLinked(target.page);
    setPage(target.page);
  }

  // ------------------------------------------------------- last read --
  // The āyah the reader was sent to, then the first āyah of each page turned
  // to; saved a moment after the page settles.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPage = useCallback(
    (p: number) => {
      setPage(p);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const ref = p === target.page ? target.ref : refOfIndex(pageRange(p).start);
      saveTimer.current = setTimeout(() => saveLastRead(ref), 600);
    },
    [target],
  );
  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  // ---------------------------------------------------------- toast --
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  // ------------------------------------------------- āyah and ribbon --
  const [selected, setSelected] = useState<AyahRef | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const marked = useMemo(() => bookmarks.map(refKey), [bookmarks]);
  const selectedMarked = selected ? marked.includes(refKey(selected)) : false;
  const pageMarked = pageMarks.includes(page);

  const info = pageInfo(page);
  const title = surahTitle(surahMeta(info.surahs[0]), locale);
  const row = isRTL ? styles.rtl : styles.ltr;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.header, row]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.side}
          accessibilityRole="button"
          accessibilityLabel={t("back")}
        >
          <Text style={[styles.back, { textAlign: isRTL ? "right" : "left" }]}>{t("back")}</Text>
        </Pressable>

        <View style={styles.titleBlock} accessible accessibilityRole="header">
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {t("quranReaderWhere", { page, juz: info.juz })}
          </Text>
        </View>

        <View style={[styles.side, styles.actions, row]}>
          <Pressable
            onPress={() => flash(t(togglePage(page) ? "quranReaderPageMarked" : "quranReaderPageUnmarked"))}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t(pageMarked ? "quranReaderUnmarkPage" : "quranReaderMarkPage")}
            accessibilityState={{ selected: pageMarked }}
          >
            <Ribbon filled={pageMarked} />
          </Pressable>
          <Pressable
            onPress={() => setSettingsOpen(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("quranReaderSettings")}
          >
            <Text style={styles.aa}>Aa</Text>
          </Pressable>
        </View>
      </View>

      <MushafPager
        page={page}
        tajweed={tajweed.on}
        fontSize={textSize.size}
        marked={marked}
        selected={selected}
        onPage={onPage}
        onAyah={setSelected}
      />

      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <AyahActions
        ayah={selected}
        bookmarked={selectedMarked}
        onToggleBookmark={() => {
          if (!selected) return;
          flash(t(toggleAyah(selected) ? "quranBookmarkAdded" : "quranBookmarkRemoved"));
        }}
        onClose={() => setSelected(null)}
      />
      <ReaderSettings
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tajweed={tajweed}
        size={textSize}
      />
    </SafeAreaView>
  );
}

/** The page ribbon: a bookmark ribbon, filled gold when the page is marked. */
function Ribbon({ filled }: { filled: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6.5 3.5h11v17l-5.5-4-5.5 4z"
        stroke={TEXT.gold}
        strokeWidth={1.7}
        strokeLinejoin="round"
        fill={filled ? TEXT.gold : "none"}
      />
    </Svg>
  );
}

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
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  side: { width: 76 },
  actions: { alignItems: "center", justifyContent: "flex-end", gap: 18 },
  back: { color: COLORS.gold, fontSize: 16, fontFamily: FONTS.body },
  titleBlock: { flex: 1, alignItems: "center", gap: 1 },
  title: { color: TEXT.full, fontSize: 17, fontFamily: FONTS.display },
  subtitle: { color: TEXT.soft, fontSize: 12, fontFamily: FONTS.body, fontVariant: ["tabular-nums"] },
  aa: { color: TEXT.gold, fontSize: 18, fontFamily: FONTS.body },

  toast: {
    position: "absolute",
    bottom: 48,
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

export { TabErrorBoundary as ErrorBoundary } from "@/components/TabErrorBoundary";
