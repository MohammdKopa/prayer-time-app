import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { useI18n, type Locale, type Translate } from "@/lib/i18n";
import { JUZ_STARTS, type AyahRef, type SurahMeta } from "@/lib/quran/meta";
import { surahTitle } from "@/lib/quran/names";
import {
  PAGE_COUNT,
  pageInfo,
  pageOf,
  pageRange,
  refOfIndex,
} from "@/lib/quran/pages";
import {
  loadLastRead,
  refKey,
  useBookmarks,
  usePageBookmarks,
} from "@/lib/quran/reading-state";
import {
  parseAyahRef,
  parsePageQuery,
  searchSurahs,
  surahMeta,
} from "@/lib/quran/text-utils";
import { COLORS, FONTS, TEXT } from "@/theme";

// The Quran tab: sūrah, juzʾ and page index, search, where you left off,
// bookmarks (āyah and page).
// Riwāyat Ḥafṣ ʿan ʿĀṣim, the Madani mushaf text from Tanzil.
//
// Only this screen and the reader import the text modules, and expo-router
// loads a route's module when it is first opened, so the 1.4 MB of text never
// sits on the clock's cold start.

type Tab = "surahs" | "juz" | "pages";

const TABS: { key: Tab; label: "quranSurahs" | "quranJuz" | "quranIndexPages" }[] = [
  { key: "surahs", label: "quranSurahs" },
  { key: "juz", label: "quranJuz" },
  { key: "pages", label: "quranIndexPages" },
];

const BOOKMARKS_SHOWN = 5;
const UNDO_MS = 4000;

type Removed = { kind: "ayah"; ref: AyahRef } | { kind: "page"; page: number };

/** Each juzʾ with the page it opens on and the last page before the next. */
const JUZ_PAGES = JUZ_STARTS.map((j, i) => {
  const from = pageOf(j);
  const next = JUZ_STARTS[i + 1];
  return { ...j, from, to: next ? Math.max(from, pageOf(next) - 1) : PAGE_COUNT };
});

/** The first āyah on a page, for the reader's { surah, ayah, page } params. */
function firstOnPage(page: number): AyahRef {
  return refOfIndex(pageRange(page).start);
}

function BookIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2zM12 6.5v13"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function CloseIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function RibbonIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M7 3.5h10v17l-5-4-5 4z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity={0.25}
      />
    </Svg>
  );
}

export default function QuranIndexScreen() {
  const router = useRouter();
  const { t, locale, isRTL } = useI18n();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("surahs");
  const [lastRead, setLastRead] = useState<AyahRef | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [pageText, setPageText] = useState("");
  const [pageTouched, setPageTouched] = useState(false);
  const { bookmarks, toggle: toggleAyah, reload } = useBookmarks();
  const { pages: pageMarks, toggle: togglePage, reload: reloadPages } = usePageBookmarks();
  const [removed, setRemoved] = useState<Removed | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  const removeMark = (m: Removed) => {
    if (m.kind === "ayah") toggleAyah(m.ref);
    else togglePage(m.page);
    setRemoved(m);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), UNDO_MS);
  };
  const undoRemove = () => {
    if (!removed) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (removed.kind === "ayah") toggleAyah(removed.ref);
    else togglePage(removed.page);
    setRemoved(null);
  };

  // These change while the reader is open, so re-read them on every return.
  useFocusEffect(
    useCallback(() => {
      loadLastRead().then(setLastRead);
      reload();
      reloadPages();
    }, [reload, reloadPages]),
  );

  const open = useCallback(
    (ref: AyahRef) =>
      router.push({
        pathname: "/quran/[surah]",
        params: { surah: String(ref.surah), ayah: String(ref.ayah) },
      }),
    [router],
  );

  const openPage = useCallback(
    (page: number) => {
      const ref = firstOnPage(page);
      router.push({
        pathname: "/quran/[surah]",
        params: {
          surah: String(ref.surah),
          ayah: String(ref.ayah),
          page: String(page),
        },
      });
    },
    [router],
  );

  const results = useMemo(() => searchSurahs(query), [query]);
  const jump = useMemo(() => parseAyahRef(query), [query]);
  const pageJump = useMemo(() => parsePageQuery(query), [query]);
  const typedPage = useMemo(() => parsePageQuery(`p ${pageText}`), [pageText]);
  const row = isRTL ? styles.rtl : styles.ltr;
  const align = isRTL ? styles.alignRight : styles.alignLeft;
  const searching = query.trim() !== "";

  const surahName = (n: number) => surahTitle(surahMeta(n), locale);
  const goToTypedPage = () => {
    setPageTouched(true);
    if (typedPage) openPage(typedPage);
  };

  const marks = useMemo(
    () => [
      ...bookmarks.map((b) => ({ kind: "ayah" as const, ref: b })),
      ...pageMarks.map((p) => ({ kind: "page" as const, page: p })),
    ],
    [bookmarks, pageMarks],
  );
  const shownMarks = showAll ? marks : marks.slice(0, BOOKMARKS_SHOWN);

  const lastPage = lastRead ? pageOf(lastRead) : 0;
  const lastWhere = lastRead
    ? t("quranContinueAt", { surah: surahName(lastRead.surah), ayah: lastRead.ayah })
    : "";
  const lastPageText = lastRead
    ? t("quranIndexContinuePage", { page: lastPage, juz: pageInfo(lastPage).juz })
    : "";

  const chevron = (
    <Text style={styles.chevron} accessible={false}>
      {isRTL ? "‹" : "›"}
    </Text>
  );

  const header = (
    <View style={styles.headerBlock}>
      {lastRead && !searching && (
        <Pressable
          style={[styles.continueCard, row]}
          onPress={() => open(lastRead)}
          accessibilityRole="button"
          accessibilityLabel={`${t("quranContinue")}. ${lastWhere}. ${lastPageText}`}
        >
          <View style={styles.continueIcon}>
            <BookIcon color={TEXT.gold} />
          </View>
          <View style={styles.continueMain}>
            <Text style={[styles.continueLabel, align]}>{t("quranContinue")}</Text>
            <Text style={[styles.continueWhere, align]}>{lastWhere}</Text>
            <Text style={[styles.rowSub, align]}>{lastPageText}</Text>
          </View>
          {chevron}
        </Pressable>
      )}

      <TextInput
        style={[styles.search, align]}
        value={query}
        onChangeText={setQuery}
        placeholder={t("quranSearch")}
        placeholderTextColor={TEXT.faint}
        accessibilityLabel={t("quranSearch")}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={() => {
          if (jump) open(jump);
          else if (pageJump) openPage(pageJump);
        }}
      />

      {jump && (
        <Pressable
          style={[styles.jump, row]}
          onPress={() => open(jump)}
          accessibilityRole="button"
        >
          <Text style={styles.jumpText}>
            {surahName(jump.surah)} {jump.surah}:{jump.ayah}
          </Text>
          {chevron}
        </Pressable>
      )}

      {pageJump && (
        <Pressable
          style={[styles.jump, row]}
          onPress={() => openPage(pageJump)}
          accessibilityRole="button"
          accessibilityLabel={t("quranIndexOpenPage", { page: pageJump })}
        >
          <Text style={styles.jumpText}>
            {t("quranIndexPageLabel", { page: pageJump })}
          </Text>
          {chevron}
        </Pressable>
      )}

      {!searching && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, align]} accessibilityRole="header">
            {t("quranBookmarks")}
          </Text>
          {marks.length === 0 ? (
            <Text style={[styles.hint, align]}>{t("quranIndexBookmarksEmpty")}</Text>
          ) : (
            <View style={styles.card}>
              {shownMarks.map((m, i) => {
                const last = i === shownMarks.length - 1 && marks.length <= BOOKMARKS_SHOWN;
                if (m.kind === "ayah") {
                  const page = pageOf(m.ref);
                  const title = surahName(m.ref.surah);
                  return (
                    <View
                      key={`a${refKey(m.ref)}`}
                      style={[styles.markRow, row, last && styles.rowLast]}
                    >
                      <Pressable
                        style={[styles.markOpen, row]}
                        onPress={() => open(m.ref)}
                        accessibilityRole="button"
                        accessibilityLabel={`${title} ${m.ref.surah}:${m.ref.ayah}, ${t(
                          "quranIndexPageLabel",
                          { page },
                        )}`}
                      >
                        <Text style={[styles.rowTitle, styles.markTitle, align]}>{title}</Text>
                        <Text style={styles.rowMeta}>
                          {m.ref.surah}:{m.ref.ayah} · {t("quranIndexPageShort", { page })}
                        </Text>
                      </Pressable>
                      <RemoveButton
                        label={t("quranBookmarkRemoveLabel")}
                        onPress={() => removeMark({ kind: "ayah", ref: m.ref })}
                      />
                    </View>
                  );
                }
                const title = surahName(pageInfo(m.page).surahs[0]);
                return (
                  <View key={`p${m.page}`} style={[styles.markRow, row, last && styles.rowLast]}>
                    <Pressable
                      style={[styles.markOpen, row]}
                      onPress={() => openPage(m.page)}
                      accessibilityRole="button"
                      accessibilityLabel={`${t("quranIndexPageLabel", { page: m.page })}, ${title}`}
                    >
                      <View style={[styles.markMain, row]}>
                        <RibbonIcon color={TEXT.gold} />
                        <Text style={[styles.rowTitle, styles.markTitle, align]}>{title}</Text>
                      </View>
                      <Text style={styles.rowMeta}>
                        {t("quranIndexPageLabel", { page: m.page })}
                      </Text>
                    </Pressable>
                    <RemoveButton
                      label={t("quranBookmarkRemoveLabel")}
                      onPress={() => removeMark({ kind: "page", page: m.page })}
                    />
                  </View>
                );
              })}
              {marks.length > BOOKMARKS_SHOWN && (
                <Pressable
                  style={styles.more}
                  onPress={() => setShowAll((v) => !v)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showAll }}
                >
                  <Text style={styles.moreText}>
                    {showAll
                      ? t("quranIndexShowLess")
                      : t("quranIndexShowAll", { count: marks.length })}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}

      {!searching && (
        <View style={[styles.tabs, row]} accessibilityRole="tablist">
          {TABS.map((k) => (
            <Pressable
              key={k.key}
              style={[styles.tab, tab === k.key && styles.tabActive]}
              onPress={() => setTab(k.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === k.key }}
            >
              <Text style={[styles.tabText, tab === k.key && styles.tabTextActive]}>
                {t(k.label)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {!searching && tab === "pages" && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, align]}>{t("quranIndexGoToPage")}</Text>
          <View style={[styles.goRow, row]}>
            <TextInput
              style={[styles.search, styles.goInput, align]}
              value={pageText}
              onChangeText={(v) => {
                setPageText(v);
                setPageTouched(false);
              }}
              placeholder={t("quranIndexPageInput")}
              placeholderTextColor={TEXT.faint}
              accessibilityLabel={t("quranIndexGoToPage")}
              keyboardType="number-pad"
              maxLength={3}
              returnKeyType="go"
              onSubmitEditing={goToTypedPage}
            />
            <Pressable
              style={[styles.goButton, !typedPage && styles.goButtonOff]}
              onPress={goToTypedPage}
              accessibilityRole="button"
              accessibilityLabel={t("quranIndexGo")}
              accessibilityState={{ disabled: !typedPage }}
            >
              <Text style={styles.goText}>{t("quranIndexGo")}</Text>
            </Pressable>
          </View>
          {pageTouched && !typedPage && (
            <Text style={[styles.invalid, align]} accessibilityLiveRegion="polite">
              {t("quranIndexPageInvalid")}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("quran")}</Text>
        <Text style={styles.riwaya}>{t("quranRiwaya")}</Text>
      </View>

      {(tab === "juz" || tab === "pages") && !searching ? (
        <FlatList
          data={JUZ_PAGES}
          keyExtractor={(j) => String(j.index)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <JuzRow
              item={item}
              byPage={tab === "pages"}
              t={t}
              locale={locale}
              row={row}
              align={align}
              onPress={() => (tab === "pages" ? openPage(item.from) : open(item))}
            />
          )}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(s) => String(s.index)}
          ListHeaderComponent={header}
          ListEmptyComponent={
            jump || pageJump ? null : (
              <Text style={styles.empty}>{t("quranNoResults")}</Text>
            )
          }
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <SurahRow
              surah={item}
              t={t}
              locale={locale}
              row={row}
              align={align}
              onPress={() => open({ surah: item.index, ayah: 1 })}
            />
          )}
        />
      )}

      {removed && (
        <View style={[styles.toast, row]} accessibilityLiveRegion="polite">
          <Text style={[styles.toastText, align]}>{t("quranBookmarkRemoved")}</Text>
          <Pressable
            style={styles.toastAction}
            onPress={undoRemove}
            accessibilityRole="button"
            accessibilityLabel={t("quranBookmarkRemoveUndo")}
          >
            <Text style={styles.toastActionText}>{t("quranBookmarkRemoveUndo")}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function RemoveButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={styles.remove}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <CloseIcon color={TEXT.soft} />
    </Pressable>
  );
}

interface RowProps {
  t: Translate;
  locale: Locale;
  row: object;
  align: object;
  onPress: () => void;
}

function SurahRow({ surah, t, locale, row, align, onPress }: RowProps & { surah: SurahMeta }) {
  const page = pageOf({ surah: surah.index, ayah: 1 });
  return (
    <Pressable
      style={[styles.listRow, row]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.number}>
        <Text style={styles.numberText}>{surah.index}</Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={[styles.rowTitle, align]}>{surahTitle(surah, locale)}</Text>
        <Text style={[styles.rowSub, align]}>
          {t(surah.revelation === "Meccan" ? "quranMeccan" : "quranMedinan")} ·{" "}
          {t("quranAyahCount", { count: surah.ayahs })} ·{" "}
          {t("quranIndexPageShort", { page })}
        </Text>
      </View>
      {locale !== "ar" && (
        <Text style={styles.arabicName} numberOfLines={1}>
          {surah.name}
        </Text>
      )}
    </Pressable>
  );
}

function JuzRow({
  item,
  byPage,
  t,
  locale,
  row,
  align,
  onPress,
}: RowProps & { item: (typeof JUZ_PAGES)[number]; byPage: boolean }) {
  const range = t("quranIndexPageRange", { from: item.from, to: item.to });
  return (
    <Pressable
      style={[styles.listRow, row]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        byPage
          ? t("quranIndexOpenJuz", { n: item.index, range })
          : `${t("quranJuzLabel", { n: item.index })}, ${surahTitle(
              surahMeta(item.surah),
              locale,
            )} ${item.surah}:${item.ayah}, ${t("quranIndexPageShort", { page: item.from })}`
      }
    >
      <View style={styles.number}>
        <Text style={styles.numberText}>{item.index}</Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={[styles.rowTitle, align]}>{t("quranJuzLabel", { n: item.index })}</Text>
        <Text style={[styles.rowSub, align]}>
          {surahTitle(surahMeta(item.surah), locale)} {item.surah}:{item.ayah}
        </Text>
      </View>
      <Text style={styles.pageTag}>
        {byPage ? range : t("quranIndexPageShort", { page: item.from })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  ltr: { flexDirection: "row" },
  rtl: { flexDirection: "row-reverse" },
  alignLeft: { textAlign: "left" },
  alignRight: { textAlign: "right" },
  header: { alignItems: "center", paddingTop: 20, paddingBottom: 16, gap: 2 },
  title: { color: TEXT.full, fontSize: 18, fontFamily: FONTS.display },
  riwaya: { color: TEXT.soft, fontSize: 12, fontFamily: FONTS.body },
  content: { paddingHorizontal: 20, paddingBottom: 32 },

  headerBlock: { gap: 14, marginBottom: 6 },
  continueCard: {
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.raised,
    borderWidth: 1.5,
    borderColor: COLORS.goldEdge,
    borderRadius: 14,
    padding: 16,
  },
  continueIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.goldWash,
    alignItems: "center",
    justifyContent: "center",
  },
  continueMain: { flex: 1, gap: 3 },
  continueLabel: { color: TEXT.gold, fontSize: 13, fontFamily: FONTS.body },
  continueWhere: { color: TEXT.full, fontSize: 17, fontFamily: FONTS.bodyMedium },
  search: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: TEXT.full,
    fontSize: 15,
    fontFamily: FONTS.body,
  },
  jump: {
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  jumpText: { color: TEXT.gold, fontSize: 15, fontFamily: FONTS.bodyMedium },
  chevron: { color: TEXT.faint, fontSize: 20 },

  section: { gap: 8 },
  sectionTitle: { color: TEXT.soft, fontSize: 13, fontFamily: FONTS.body },
  card: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  rowLast: { borderBottomWidth: 0 },
  markRow: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  markOpen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  remove: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  toast: {
    position: "absolute",
    start: 20,
    end: 20,
    bottom: 24,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.raised,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    borderRadius: 14,
    paddingStart: 16,
    paddingEnd: 4,
  },
  toastText: { flex: 1, color: TEXT.full, fontSize: 14, fontFamily: FONTS.body },
  toastAction: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center" },
  toastActionText: { color: TEXT.gold, fontSize: 14, fontFamily: FONTS.bodyMedium },
  markMain: { flex: 1, alignItems: "center", gap: 10 },
  markTitle: { flexShrink: 1 },
  hint: { color: TEXT.faint, fontSize: 13, fontFamily: FONTS.body, lineHeight: 20 },
  more: { alignItems: "center", paddingVertical: 12 },
  moreText: { color: TEXT.gold, fontSize: 14, fontFamily: FONTS.body },
  goRow: { gap: 8, alignItems: "center" },
  goInput: { flex: 1 },
  goButton: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    backgroundColor: COLORS.goldWash,
  },
  goButtonOff: { opacity: 0.5 },
  goText: { color: TEXT.gold, fontSize: 15, fontFamily: FONTS.bodyMedium },
  invalid: { color: TEXT.soft, fontSize: 13, fontFamily: FONTS.body },
  pageTag: {
    color: TEXT.soft,
    fontSize: 13,
    fontFamily: FONTS.body,
    fontVariant: ["tabular-nums"],
  },

  tabs: { gap: 8 },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  tabActive: { backgroundColor: COLORS.goldWash, borderColor: COLORS.goldEdge },
  tabText: { color: TEXT.soft, fontSize: 15, fontFamily: FONTS.body },
  tabTextActive: { color: TEXT.gold },

  listRow: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  number: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  numberText: {
    color: TEXT.gold,
    fontSize: 13,
    fontFamily: FONTS.body,
    fontVariant: ["tabular-nums"],
    transform: [{ rotate: "-45deg" }],
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { color: TEXT.full, fontSize: 17, fontFamily: FONTS.body },
  rowSub: { color: TEXT.soft, fontSize: 13, fontFamily: FONTS.body },
  rowMeta: {
    color: TEXT.soft,
    fontSize: 13,
    fontFamily: FONTS.body,
    fontVariant: ["tabular-nums"],
  },
  // Never wraps: "آل عمران" once broke after "آل" and lost its second word.
  arabicName: {
    color: TEXT.strong,
    fontSize: 20,
    fontFamily: FONTS.quran,
    flexShrink: 0,
    maxWidth: "40%",
  },
  empty: {
    color: TEXT.soft,
    fontSize: 15,
    fontFamily: FONTS.body,
    textAlign: "center",
    paddingVertical: 24,
  },
});

export { TabErrorBoundary as ErrorBoundary } from "@/components/TabErrorBoundary";
