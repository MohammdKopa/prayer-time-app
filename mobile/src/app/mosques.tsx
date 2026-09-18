import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useI18n } from "@/lib/i18n";
import {
  formatDistance,
  nearestMosques,
  type MosqueWithDistance,
} from "@/lib/mosques";
import { usePlaceContext } from "@/lib/place-context";
import { toArabicIndic } from "@/lib/time";
import { COLORS, FONTS, TEXT } from "@/theme";

// Mosques.
//
// Nearest-first, from wherever the app currently thinks the user is — the
// same `place` the clock and qibla screens use, GPS when granted, the saved
// or default place otherwise. Stale beats nothing, same principle as the
// rest of the app: a list computed from Marl (the default place) is still
// useful while a real fix is pending.
//
// The dataset is Germany-wide (~1,600 OSM-tagged mosques), so unlike GPS
// denial elsewhere in the app, this list is never actually empty — the
// "locating"/"denied" messaging is shown *above* the list, not instead of
// it, exactly like the city label on the Times screen.

const LIMIT = 25;

export default function MosquesScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { place, state } = usePlaceContext();

  const mosques = useMemo(
    () => nearestMosques(place.latitude, place.longitude, LIMIT),
    [place.latitude, place.longitude],
  );

  const num = useCallback(
    (s: string) => (locale === "ar" ? toArabicIndic(s) : s),
    [locale],
  );

  const displayName = useCallback(
    (m: MosqueWithDistance) =>
      (locale === "ar" && m.nameAr) || m.name || m.city || t("mosqueUnnamed"),
    [locale, t],
  );

  const metaLine = useCallback((m: MosqueWithDistance) => {
    if (m.street && m.city) return `${m.street}, ${m.city}`;
    return m.street || m.city || undefined;
  }, []);

  const distanceLabel = useCallback(
    (m: MosqueWithDistance) => {
      const { value, unit } = formatDistance(m.distanceMeters);
      return num(t(unit === "m" ? "distanceMeters" : "distanceKm", { value }));
    },
    [num, t],
  );

  const openMosque = useCallback((m: MosqueWithDistance) => {
    const label = encodeURIComponent(displayName(m));
    const geoUrl = `geo:${m.lat},${m.lng}?q=${m.lat},${m.lng}(${label})`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`;
    Linking.openURL(geoUrl).catch(() => {
      Linking.openURL(webUrl).catch(() => {});
    });
  }, [displayName]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{t("back")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("mosques")}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {state === "locating" && (
          <Text style={styles.status}>{t("locating")}</Text>
        )}
        {(state === "denied" || state === "unavailable") && (
          <Text style={styles.status}>{t("locationDeniedHint")}</Text>
        )}

        <View style={styles.card}>
          {mosques.map((m, i) => {
            const meta = metaLine(m);
            return (
              <Pressable
                key={m.id}
                style={[styles.row, i > 0 && styles.rowBorder]}
                onPress={() => openMosque(m)}
                accessibilityRole="button"
              >
                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {displayName(m)}
                  </Text>
                  {meta && (
                    <Text style={styles.meta} numberOfLines={1}>
                      {meta}
                    </Text>
                  )}
                </View>
                <Text style={styles.distance}>{distanceLabel(m)}</Text>
              </Pressable>
            );
          })}
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

  content: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  status: {
    color: TEXT.soft,
    fontSize: 14,
    fontFamily: FONTS.body,
    marginBottom: 14,
  },

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
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: COLORS.line },
  rowText: { flex: 1, gap: 2 },
  name: { color: TEXT.full, fontSize: 16, fontFamily: FONTS.body },
  meta: { color: TEXT.soft, fontSize: 13, fontFamily: FONTS.body },
  distance: {
    color: TEXT.strong,
    fontSize: 14,
    fontFamily: FONTS.body,
    fontVariant: ["tabular-nums"],
  },
});
