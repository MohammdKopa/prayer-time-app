import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ErrorBoundaryProps } from "expo-router";

import { useI18n } from "@/lib/i18n";
import { COLORS, FONTS, TEXT } from "@/theme";

// One quiet error screen for every tab. expo-router wraps each route that
// exports `ErrorBoundary` in its own boundary, so a crash in one tab renders
// this in that tab only; the other tabs, and the clock, keep running.
// Nothing is reported anywhere — the app has no network and no analytics.

export function TabErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { t } = useI18n();
  if (__DEV__) console.error(error);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>{t("errorTitle")}</Text>
        <Text style={styles.body}>{t("errorBody")}</Text>
        <Pressable
          style={styles.button}
          onPress={() => void retry()}
          accessibilityRole="button"
          accessibilityLabel={t("errorRetry")}
        >
          <Text style={styles.buttonText}>{t("errorRetry")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  title: { color: TEXT.full, fontSize: 22, fontFamily: FONTS.display, textAlign: "center" },
  body: {
    color: TEXT.soft,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: FONTS.body,
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: COLORS.goldWash,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
  },
  buttonText: { color: TEXT.gold, fontSize: 16, fontFamily: FONTS.display },
});
