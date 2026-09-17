import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { qiblaBearing } from "@shared/qibla";
import { angleBetween, approachAngle, isAligned } from "@/lib/compass";
import { useI18n, type Strings } from "@/lib/i18n";
import { usePlaceContext } from "@/lib/place-context";
import { toArabicIndic } from "@/lib/time";
import { COLORS } from "@/theme";

// Qibla.
//
// The screen is a compass ROSE, not a lone arrow. The dial turns so that north
// keeps pointing at real north, and the Kaaba marker rides on the dial at the
// qibla bearing. A fixed notch at the top is where the phone points, so aiming
// is "turn until the marker reaches the notch". An arrow floating in an empty
// circle gives the eye nothing to anchor to, which is what made the first
// version feel untrustworthy.
//
// TRUE north only. The magnetometer reports MAGNETIC north, a few degrees off
// in Germany — nothing on a compass rose, wrong when aiming at a building
// 4,500 km away. expo-location reports both and marks trueHeading as -1 when
// it cannot resolve true north; the screen then says it has no reliable
// compass rather than drawing something it does not believe in.
//
// The dial angle is kept UNWRAPPED and smoothed (lib/compass.ts): fed the raw
// heading, a rotation style spins the long way round whenever the bearing
// crosses 0/360, and twitches constantly in between.

const SIZE = 280;
const RADIUS = SIZE / 2 - 26;

const CARDINALS: { key: keyof Strings; deg: number }[] = [
  { key: "north", deg: 0 },
  { key: "east", deg: 90 },
  { key: "south", deg: 180 },
  { key: "west", deg: 270 },
];

const TICKS = Array.from({ length: 24 }, (_, i) => i * 15);

export default function QiblaScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { place } = usePlaceContext();

  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState(3);
  const [unavailable, setUnavailable] = useState(false);
  const [aligned, setAligned] = useState(false);

  const target = useMemo(
    () => qiblaBearing(place.latitude, place.longitude),
    [place.latitude, place.longitude],
  );

  const unwrapped = useRef(0);
  const dial = useRef(new Animated.Value(0)).current;

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
          if (h.trueHeading < 0) {
            setUnavailable(true);
            setHeading(null);
            return;
          }
          setUnavailable(false);
          setHeading(h.trueHeading);
          setAccuracy(h.accuracy);
          setAligned(isAligned(h.trueHeading, target));

          // The dial turns opposite the phone, so north stays north.
          unwrapped.current = approachAngle(unwrapped.current, -h.trueHeading);
          Animated.timing(dial, {
            toValue: unwrapped.current,
            duration: 90,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
        });
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [target, dial]);

  const num = (s: string) => (locale === "ar" ? toArabicIndic(s) : s);
  const spin = dial.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });
  const counterSpin = dial.interpolate({
    inputRange: [-360, 360],
    outputRange: ["360deg", "-360deg"],
  });
  const off =
    heading === null ? null : Math.round(angleBetween(heading, target));

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
        <View style={styles.compass}>
          {/* Fixed notch: where the phone itself points. */}
          <View style={[styles.notch, aligned && styles.notchAligned]} />

          <Animated.View
            style={[styles.dial, { transform: [{ rotate: spin }] }]}
          >
            {TICKS.map((deg) => (
              <View
                key={deg}
                style={[
                  styles.tickHolder,
                  { transform: [{ rotate: `${deg}deg` }] },
                ]}
              >
                <View
                  style={[styles.tick, deg % 90 === 0 && styles.tickMajor]}
                />
              </View>
            ))}

            {/* Line from the centre out to the Kaaba, so the direction reads at
                a glance instead of having to find the dot. */}
            <View
              style={[
                styles.rayHolder,
                { transform: [{ rotate: `${target}deg` }] },
              ]}
            >
              <View style={[styles.ray, aligned && styles.rayAligned]} />
            </View>

            {CARDINALS.map((c) => (
              <View
                key={c.key}
                style={[
                  styles.labelHolder,
                  {
                    transform: [
                      { rotate: `${c.deg}deg` },
                      { translateY: -RADIUS + 20 },
                    ],
                  },
                ]}
              >
                {/* Counter-rotated so the letter stays upright as the dial turns. */}
                <Animated.Text
                  style={[
                    styles.cardinal,
                    c.deg === 0 && styles.cardinalNorth,
                    {
                      transform: [
                        { rotate: `${-c.deg}deg` },
                        { rotate: counterSpin },
                      ],
                    },
                  ]}
                >
                  {t(c.key)}
                </Animated.Text>
              </View>
            ))}

            {/* The Kaaba, riding on the dial at the qibla bearing. */}
            <View
              style={[
                styles.markerHolder,
                {
                  transform: [
                    { rotate: `${target}deg` },
                    { translateY: -RADIUS + 2 },
                  ],
                },
              ]}
            >
              <View style={[styles.marker, aligned && styles.markerAligned]} />
            </View>
          </Animated.View>
        </View>

        <Text style={styles.bearing}>
          {num(t("degrees", { value: Math.round(target) }))}
        </Text>

        {unavailable ? (
          <Text style={styles.warn}>{t("qiblaNoCompass")}</Text>
        ) : aligned ? (
          <Text style={[styles.hint, styles.alignedText]}>
            {t("qiblaAligned")}
          </Text>
        ) : (
          <>
            <Text style={styles.hint}>{t("qiblaHint")}</Text>
            {off !== null && (
              <Text style={styles.off}>
                {num(t("degrees", { value: off }))}
              </Text>
            )}
            {accuracy < 2 && (
              <Text style={styles.warn}>{t("qiblaCalibrate")}</Text>
            )}
          </>
        )}
      </View>
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
  back: { color: COLORS.gold, fontSize: 16 },
  title: { color: COLORS.bone, fontSize: 18 },
  spacer: { width: 44 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },

  compass: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  notch: {
    position: "absolute",
    top: -2,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.bone,
    opacity: 0.7,
    zIndex: 2,
  },
  notchAligned: { borderTopColor: COLORS.gold, opacity: 1 },

  dial: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
  },
  tickHolder: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    alignItems: "center",
  },
  tick: {
    width: 1,
    height: 7,
    marginTop: 6,
    backgroundColor: COLORS.bone,
    opacity: 0.25,
  },
  tickMajor: { height: 13, width: 2, opacity: 0.55 },

  labelHolder: { position: "absolute", alignItems: "center" },
  cardinal: { color: COLORS.bone, opacity: 0.55, fontSize: 15 },
  cardinalNorth: { color: COLORS.bone, opacity: 0.9, fontWeight: "600" },

  rayHolder: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    alignItems: "center",
  },
  ray: {
    width: 2,
    height: SIZE / 2 - 24,
    marginTop: 24,
    backgroundColor: COLORS.gold,
    opacity: 0.35,
  },
  rayAligned: { opacity: 0.9 },

  markerHolder: { position: "absolute", alignItems: "center" },
  marker: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
    opacity: 0.8,
  },
  markerAligned: { opacity: 1, width: 22, height: 22, borderRadius: 5 },

  bearing: { color: COLORS.bone, fontSize: 30, fontVariant: ["tabular-nums"] },
  hint: {
    color: COLORS.bone,
    opacity: 0.5,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  alignedText: { color: COLORS.gold, opacity: 1 },
  off: {
    color: COLORS.bone,
    opacity: 0.35,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
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
