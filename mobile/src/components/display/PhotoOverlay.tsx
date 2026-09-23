import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { photoAt } from "@/lib/display";
import { DISPLAY_PHOTOS } from "@/lib/display-photos";
import type { Locale } from "@/lib/i18n";
import { FONTS } from "@/theme";
import { LEAF } from "./Ornament";

// Periodic full-screen photograph — al-Aqṣā, Makkah, the Umayyad Mosque —
// each with a duʿāʾ or āyah, exactly as on the website's wall. Sits above
// the clock, below the night-dim wash and the prayer-now takeover. Opacity-
// only cross-fade on the native driver.

export function PhotoOverlay({
  now,
  suppressed,
  locale,
  vh,
  vw,
}: {
  now: Date;
  /** True while the prayer-now takeover is up — yield to it. */
  suppressed: boolean;
  locale: Locale;
  vh: number;
  vw: number;
}) {
  const { photo, line, active, slot } = photoAt(now, DISPLAY_PHOTOS);
  const show = active && !suppressed;

  const opacity = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: show ? 1 : 0, duration: 1600, useNativeDriver: true }),
      Animated.timing(rise, { toValue: show ? 0 : 1, duration: 1600, useNativeDriver: true }),
    ]).start();
  }, [show, opacity, rise]);

  const big = line.text.length > 80 ? Math.min(6 * vh, 4.4 * vw) : Math.min(7.6 * vh, 5.6 * vw);
  const sub = locale === "ar" ? null : photo.placeSub[locale];

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Image key={slot} source={photo.source} style={styles.img} contentFit="cover" />
      <View style={styles.wash} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="pv" cx="50%" cy="48%" rx="80%" ry="72%">
            <Stop offset="0" stopColor="rgb(3,12,9)" stopOpacity={0} />
            <Stop offset="1" stopColor="rgb(3,12,9)" stopOpacity={0.58} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#pv)" />
      </Svg>

      <Animated.View
        style={[
          styles.caption,
          { paddingHorizontal: vw * 8, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, vh * 1.8] }) }] },
        ]}
      >
        <View style={[styles.card, { maxWidth: vw * 84, paddingVertical: vh * 6, paddingHorizontal: vw * 7, borderRadius: vh * 3 }]}>
          <Text style={[styles.text, { fontSize: big, lineHeight: big * 1.7 }]}>
            {line.quran && <Text style={[styles.mark, { fontSize: big * 0.62 }]}>{"﴿ "}</Text>}
            {line.text}
            {line.quran && <Text style={[styles.mark, { fontSize: big * 0.62 }]}>{" ﴾"}</Text>}
          </Text>
          <Text style={[styles.place, { fontSize: Math.min(3.8 * vh, 2.9 * vw), marginTop: vh * 4.5 }]}>
            {photo.place}
          </Text>
          {sub && (
            <Text style={[styles.placeSub, { fontSize: Math.min(2.1 * vh, 1.6 * vw), marginTop: vh * 0.7 }]}>
              {sub}
            </Text>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const FILL = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };

const styles = StyleSheet.create({
  img: { ...FILL, width: "100%", height: "100%" },
  wash: { ...FILL, backgroundColor: "rgba(3,12,9,0.34)" },
  caption: {
    ...FILL,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
    backgroundColor: "rgba(6,20,15,0.55)",
    borderWidth: 1,
    borderColor: "rgba(232,200,120,0.3)",
  },
  text: {
    color: "#c9b57c",
    fontFamily: FONTS.quran,
    textAlign: "center",
    writingDirection: "rtl",
    textShadowColor: "rgba(0,0,0,0.88)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 18,
  },
  mark: { color: "rgba(232,200,120,0.45)" },
  place: {
    color: LEAF,
    fontFamily: FONTS.display,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  placeSub: {
    color: "rgba(232,227,217,0.74)",
    fontFamily: FONTS.display,
    letterSpacing: 1,
    textAlign: "center",
  },
});
