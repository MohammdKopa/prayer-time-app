import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, Text } from "react-native";

import { adhanLateReason, openFixFor, type LateReason } from "@/lib/exact-alarms";
import { useI18n } from "@/lib/i18n";
import { COLORS, FONTS } from "@/theme";

/**
 * One line on the clock screen, shown only while the adhan is on and the
 * phone is free to deliver it late: exact alarms off, or on a Xiaomi, the
 * Autostart switch off. Tapping opens the system screen that fixes it.
 * Re-checked on every focus and every return from the background, so it
 * disappears the moment the permission is granted.
 */
export function ExactAlarmBanner() {
  const { t } = useI18n();
  const [reason, setReason] = useState<LateReason | null>(null);

  const refresh = useCallback(() => {
    void adhanLateReason().then(setReason);
  }, []);

  useFocusEffect(refresh);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  if (!reason) return null;

  return (
    <Pressable style={styles.banner} onPress={() => openFixFor(reason)}>
      <Text style={styles.text}>
        {t(reason === "exact" ? "exactAlarmBanner" : "autostartBanner")}
      </Text>
      <Text style={styles.chevron}>{"›"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    backgroundColor: COLORS.goldWash,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  text: {
    flex: 1,
    color: COLORS.gold,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    lineHeight: 19,
  },
  chevron: { color: COLORS.gold, fontSize: 20 },
});
