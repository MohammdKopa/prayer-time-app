import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { qiblaBearing } from "@shared/qibla";
import { useI18n } from "@/lib/i18n";
import { usePlaceContext } from "@/lib/place-context";
import { toArabicIndic } from "@/lib/time";
import { COLORS } from "@/theme";

// Qibla.
//
// TRUE north only. The magnetometer reports MAGNETIC north, and the difference
// in Germany is a few degrees east — small on a compass rose, wrong when you
// are pointing at a building 4,500 km away. expo-location's heading reports
// both and marks trueHeading as -1 when the device cannot determine it; when
// that happens the app says it has no reliable compass rather than drawing an
// arrow it does not believe in. That is principle #4 applied to a direction.

export default function QiblaScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { place } = usePlaceContext();

  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number>(3);
  const [unavailable, setUnavailable] = useState(false);

  const target = useMemo(
    () => qiblaBearing(place.latitude, place.longitude),
    [place.latitude, place.longitude],
  );

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          if (!cancelled) setUnavailable(true);
          return;
        }
        sub = await Location.watchHeadingAsync((h) => {
          if (cancelled) return;
          // -1 means the platform could not resolve true north.
          if (h.trueHeading < 0) {
            setUnavailable(true);
            setHeading(null);
          } else {
            setUnavailable(false);
            setHeading(h.trueHeading);
            setAccuracy(h.accuracy);
          }
        });
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  const num = (s: string) => (locale === "ar" ? toArabicIndic(s) : s);

  // Where to point the arrow on screen: the qibla bearing, minus how far the
  // phone itself has turned.
  const rotation = heading === null ? 0 : target - heading;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{t("back")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("qibla")}</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.body}>
        <View style={styles.dial}>
          <View
            style={[styles.arrow, { transform: [{ rotate: `${rotation}deg` }] }]}
          >
            <Text style={styles.arrowGlyph}>&#10148;</Text>
          </View>
        </View>

        <Text style={styles.bearing}>
          {num(t("degrees", { value: Math.round(target) }))}
        </Text>

        {unavailable ? (
          <Text style={styles.warn}>{t("qiblaNoCompass")}</Text>
        ) : (
          <>
            <Text style={styles.hint}>{t("qiblaHint")}</Text>
            {accuracy < 2 && (
              <Text style={styles.warn}>{t("qiblaCalibrate")}</Text>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const SIZE = 240;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  back: { color: COLORS.gold, fontSize: 16 },
  title: { color: COLORS.bone, fontSize: 18 },
  spacer: { width: 44 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: 22 },
  dial: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: { alignItems: "center", justifyContent: "center" },
  arrowGlyph: {
    color: COLORS.gold,
    fontSize: 96,
    // The glyph points right at 0deg; turn it to point up so that a rotation
    // of 0 means "straight ahead".
    transform: [{ rotate: "-90deg" }],
  },
  bearing: {
    color: COLORS.bone,
    fontSize: 30,
    fontVariant: ["tabular-nums"],
  },
  hint: {
    color: COLORS.bone,
    opacity: 0.5,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  warn: {
    color: COLORS.gold,
    opacity: 0.85,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
