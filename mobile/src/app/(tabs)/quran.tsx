import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useI18n, type Locale, type Translate } from "@/lib/i18n";
import { JUZ_STARTS, type AyahRef, type SurahMeta } from "@/lib/quran/meta";
import { surahTitle } from "@/lib/quran/names";
import {
  loadLastRead,
  refKey,
  useBookmarks,
} from "@/lib/quran/reading-state";
import { parseAyahRef, searchSurahs, surahMeta } from "@/lib/quran/text-utils";
import { COLORS, FONTS, TEXT } from "@/theme";

// The Quran tab: sūrah and juzʾ index, search, where you left off, bookmarks.
// Riwāyat Ḥafṣ ʿan ʿĀṣim, the Madani mushaf text from Tanzil.
//
// Only this screen and the reader import the text modules, and expo-router
// loads a route's module when it is first opened, so the 1.4 MB of text never
// sits on the clock's cold start.

type Tab = "surahs" | "juz";

export default function QuranIndexScreen() {
  const router = useRouter();
  const { t, locale, isRTL } = useI18n();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("surahs");
  const [lastRead, setLastRead] = useState<AyahRef | null>(null);
  const { bookmarks, reload } = useBookmarks();

  // Both change while the reader is open, so re-read them on every return.
  useFocusEffect(
    useCallback(() => {
      loadLastRead().then(setLastRead);
      reload();
    }, [reload]),
  );

  const open = useCallback(
    (ref: AyahRef) =>
      router.push({
        pathname: "/quran/[surah]",
        params: { surah: String(ref.surah), ayah: String(ref.ayah) },
      }),
    [router],
  );

  const results = useMemo(() => searchSurahs(query), [query]);
  const jump = useMemo(() => parseAyahRef(query), [query]);
  const row = isRTL ? styles.rtl : styles.ltr;
  const align = isRTL ? styles.alignRight : styles.alignLeft;
  const searching = query.trim() !== "";

  const header = (
    <View style={styles.headerBlock}>
      {lastRead && !searching && (
        <Pressable style={styles.continueCard} onPress={() => open(lastRead)}>
          <Text style={[styles.continueLabel, align]}>{t("quranContinue")}</Text>
          <Text style={[styles.continueWhere, align]}>
            {t("quranContinueAt", {
              surah: surahTitle(surahMeta(lastRead.surah), locale),
              ayah: lastRead.ayah,
            })}
          </Text>
        </Pressable>
      )}

      <TextInput
        style={[styles.search, align]}
        value={query}
        onChangeText={setQuery}
        placeholder={t("quranSearch")}
        placeholderTextColor={TEXT.faint}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={() => jump && open(jump)}
      />

      {jump && (
        <Pressable style={[styles.jump, row]} onPress={() => open(jump)}>
          <Text style={styles.jumpText}>
            {surahTitle(surahMeta(jump.surah), locale)} {jump.surah}:{jump.ayah}
          </Text>
          <Text style={styles.chevron}>{isRTL ? "‹" : "›"}</Text>
        </Pressable>
      )}

      {!searching && bookmarks.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, align]}>{t("quranBookmarks")}</Text>
          <View style={styles.card}>
            {bookmarks.map((b, i) => (
              <Pressable
                key={refKey(b)}
                style={[styles.row, row, i === bookmarks.length - 1 && styles.rowLast]}
                onPress={() => open(b)}
              >
                <Text style={[styles.rowTitle, align]}>
                  {surahTitle(surahMeta(b.surah), locale)}
                </Text>
                <Text style={styles.rowMeta}>
                  {b.surah}:{b.ayah}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {!searching && (
        <View style={[styles.tabs, row]}>
          {(["surahs", "juz"] as const).map((k) => (
            <Pressable
              key={k}
              style={[styles.tab, tab === k && styles.tabActive]}
              onPress={() => setTab(k)}
            >
              <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>
                {t(k === "surahs" ? "quranSurahs" : "quranJuz")}
              </Text>
            </Pressable>
          ))}
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

      {tab === "juz" && !searching ? (
        <FlatList
          data={JUZ_STARTS}
          keyExtractor={(j) => String(j.index)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <JuzRow
              index={item.index}
              start={item}
              t={t}
              locale={locale}
              row={row}
              align={align}
              onPress={() => open(item)}
            />
          )}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(s) => String(s.index)}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Text style={styles.empty}>{t("quranNoResults")}</Text>
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
    </SafeAreaView>
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
  return (
    <Pressable style={[styles.listRow, row]} onPress={onPress}>
      <View style={styles.number}>
        <Text style={styles.numberText}>{surah.index}</Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={[styles.rowTitle, align]}>{surahTitle(surah, locale)}</Text>
        <Text style={[styles.rowSub, align]}>
          {t(surah.revelation === "Meccan" ? "quranMeccan" : "quranMedinan")} ·{" "}
          {t("quranAyahCount", { count: surah.ayahs })}
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
  index,
  start,
  t,
  locale,
  row,
  align,
  onPress,
}: RowProps & { index: number; start: AyahRef }) {
  return (
    <Pressable style={[styles.listRow, row]} onPress={onPress}>
      <View style={styles.number}>
        <Text style={styles.numberText}>{index}</Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={[styles.rowTitle, align]}>{t("quranJuzLabel", { n: index })}</Text>
        <Text style={[styles.rowSub, align]}>
          {surahTitle(surahMeta(start.surah), locale)} {start.surah}:{start.ayah}
        </Text>
      </View>
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
    backgroundColor: COLORS.raised,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
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
