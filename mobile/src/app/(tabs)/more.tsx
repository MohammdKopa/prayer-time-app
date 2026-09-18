import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useI18n, type Strings } from "@/lib/i18n";
import { COLORS, FONTS, TEXT } from "@/theme";

// Everything that does not earn a slot in the bar. Labelled rows, not a grid
// of glyphs — the whole point of this screen is that you can read it.

interface Row {
  href: "/tasbih" | "/prayer-settings" | "/settings" | "/calendar" | "/mosques";
  glyph: string;
  key: keyof Strings;
}

const ROWS: Row[] = [
  { href: "/tasbih", glyph: "◎", key: "tasbih" },
  { href: "/prayer-settings", glyph: "⏱", key: "prayerAdjustTitle" },
  { href: "/settings", glyph: "⚙", key: "settings" },
  { href: "/calendar", glyph: "☾", key: "islamicCalendar" },
  { href: "/mosques", glyph: "◈", key: "mosques" },
];

export default function MoreScreen() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.spacer} />
        <Text style={styles.title}>{t("navMore")}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {ROWS.map((row) => (
            <Link key={row.href} href={row.href} asChild>
              <Pressable style={styles.row}>
                <Text style={styles.glyph}>{row.glyph}</Text>
                <Text style={styles.label}>{t(row.key)}</Text>
                <Text style={styles.chevron}>{"›"}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  back: { color: COLORS.gold, fontSize: 16, fontFamily: FONTS.body },
  title: { color: TEXT.full, fontSize: 18, fontFamily: FONTS.display },
  spacer: { width: 44 },
  content: { padding: 20, paddingTop: 0 },
  card: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  glyph: { color: TEXT.soft, fontSize: 18, width: 24, textAlign: "center" },
  label: { color: TEXT.full, fontSize: 17, fontFamily: FONTS.body, flex: 1 },
  chevron: { color: TEXT.faint, fontSize: 20 },
});
