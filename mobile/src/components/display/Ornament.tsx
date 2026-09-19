import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

// The wall's atmosphere and ornament, ported from the website's plasma view:
// an emerald nebula wash, a vignette, a faint eight-point-star lattice, an
// illuminated double-rule frame with arabesque corners, and gold dust
// rising slowly through it all. Everything sits BEHIND the content; nothing
// here reads the time.

export const LEAF = "#e8c878";
export const LEAF_BRIGHT = "#f6e4ac";

/** The static colour wash. Radial gradients in SVG so weak tablet GPUs
 *  composite one bitmap, not five overlapping views. */
export function Atmosphere({ width, height }: { width: number; height: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="n1" cx="22%" cy="26%" r="42%">
            <Stop offset="0" stopColor="rgb(70,210,150)" stopOpacity={0.3} />
            <Stop offset="0.6" stopColor="rgb(70,210,150)" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="n2" cx="80%" cy="22%" r="46%">
            <Stop offset="0" stopColor="rgb(28,150,120)" stopOpacity={0.3} />
            <Stop offset="0.62" stopColor="rgb(28,150,120)" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="n3" cx="30%" cy="84%" r="44%">
            <Stop offset="0" stopColor="rgb(90,220,160)" stopOpacity={0.22} />
            <Stop offset="0.64" stopColor="rgb(90,220,160)" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="n4" cx="86%" cy="88%" r="50%">
            <Stop offset="0" stopColor="rgb(18,110,86)" stopOpacity={0.3} />
            <Stop offset="0.66" stopColor="rgb(18,110,86)" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="n5" cx="56%" cy="50%" r="34%">
            <Stop offset="0" stopColor="rgb(232,200,120)" stopOpacity={0.1} />
            <Stop offset="0.7" stopColor="rgb(232,200,120)" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="vignette" cx="50%" cy="42%" r="75%">
            <Stop offset="0.58" stopColor="rgb(2,10,7)" stopOpacity={0} />
            <Stop offset="1" stopColor="rgb(2,10,7)" stopOpacity={0.55} />
          </RadialGradient>
          <Pattern
            id="stars"
            width={74}
            height={74}
            patternUnits="userSpaceOnUse"
          >
            <G fill="none" stroke="rgba(232,200,120,0.09)" strokeWidth={1}>
              <Rect x={19} y={19} width={36} height={36} />
              <Rect
                x={19}
                y={19}
                width={36}
                height={36}
                transform="rotate(45 37 37)"
              />
            </G>
          </Pattern>
        </Defs>
        {["n1", "n2", "n3", "n4", "n5"].map((id) => (
          <Rect key={id} width="100%" height="100%" fill={`url(#${id})`} />
        ))}
        <Rect width="100%" height="100%" fill="url(#stars)" opacity={0.5} />
        <Rect width="100%" height="100%" fill="url(#vignette)" />
      </Svg>
    </View>
  );
}

/** The illuminated double rule of a muṣḥaf border, with the four corners. */
export function Frame({ vh, vw }: { vh: number; vw: number }) {
  const inset = { top: vh * 1.6, bottom: vh * 1.6, left: vw * 1.4, right: vw * 1.4 };
  const size = vh * 5.2;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.outer, inset, { borderRadius: vh * 1.4 }]}>
        <View style={[styles.inner, { margin: vh * 0.7, borderRadius: vh }]} />
      </View>
      <Corner size={size} style={{ top: inset.top, left: inset.left }} rotate={0} />
      <Corner size={size} style={{ top: inset.top, right: inset.right }} rotate={90} />
      <Corner size={size} style={{ bottom: inset.bottom, right: inset.right }} rotate={180} />
      <Corner size={size} style={{ bottom: inset.bottom, left: inset.left }} rotate={270} />
    </View>
  );
}

function Corner({
  size,
  style,
  rotate,
}: {
  size: number;
  style: object;
  rotate: number;
}) {
  return (
    <View style={[styles.corner, style, { width: size, height: size, transform: [{ rotate: `${rotate}deg` }] }]}>
      <Svg viewBox="0 0 100 100" width={size} height={size}>
        <G fill="none" stroke={LEAF} strokeWidth={2.4} strokeLinecap="round" opacity={0.7}>
          <Path d="M6 56 Q6 6 56 6" />
          <Path d="M20 56 Q20 20 56 20" />
          <Path d="M6 56 L6 82" />
          <Path d="M56 6 L82 6" />
          <Circle cx={20} cy={20} r={2.6} fill={LEAF} stroke="none" />
        </G>
      </Svg>
    </View>
  );
}

/** Calligraphic flourish flanking the mosque name. */
export function Flourish({ width, mirror = false }: { width: number; mirror?: boolean }) {
  return (
    <Svg
      viewBox="0 0 80 24"
      width={width}
      height={(width * 24) / 80}
      style={mirror ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      <G fill="none" stroke={LEAF} strokeWidth={1.6} strokeLinecap="round" opacity={0.75}>
        <Path d="M2 12 H46 Q58 12 60 6 Q62 0 68 2 Q74 4 70 10" />
        <Path d="M70 10 Q66 14 60 12" />
        <Circle cx={74} cy={12} r={2.4} fill={LEAF} stroke="none" />
        <Path d="M2 16 H40" opacity={0.5} />
      </G>
    </Svg>
  );
}

const DUST = [
  { left: 6, size: 3, dur: 26, delay: 0, tw: 3.2 },
  { left: 14, size: 2, dur: 34, delay: 4, tw: 4.1 },
  { left: 23, size: 4, dur: 29, delay: 9, tw: 2.8 },
  { left: 31, size: 2, dur: 40, delay: 2, tw: 3.9 },
  { left: 42, size: 3, dur: 31, delay: 12, tw: 3.3 },
  { left: 50, size: 2, dur: 37, delay: 6, tw: 4.6 },
  { left: 58, size: 4, dur: 27, delay: 15, tw: 2.9 },
  { left: 66, size: 2, dur: 33, delay: 3, tw: 3.7 },
  { left: 74, size: 3, dur: 30, delay: 10, tw: 3.1 },
  { left: 82, size: 2, dur: 39, delay: 7, tw: 4.3 },
  { left: 90, size: 3, dur: 28, delay: 13, tw: 3.4 },
  { left: 96, size: 2, dur: 35, delay: 1, tw: 4.0 },
];

/** Gold dust drifting up the wall. Native-driver transforms only. */
export function Dust({ width, height }: { width: number; height: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DUST.map((d, i) => (
        <Mote key={i} {...d} width={width} height={height} />
      ))}
    </View>
  );
}

function Mote({
  left,
  size,
  dur,
  delay,
  tw,
  width,
  height,
}: (typeof DUST)[number] & { width: number; height: number }) {
  const y = useRef(new Animated.Value(0)).current;
  const o = useRef(new Animated.Value(0.15)).current;
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.delay(delay * 1000),
        Animated.timing(y, { toValue: 1, duration: dur * 1000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 0.85, duration: (tw * 1000) / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(o, { toValue: 0.15, duration: (tw * 1000) / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    float.start();
    twinkle.start();
    return () => {
      float.stop();
      twinkle.stop();
    };
  }, [y, o, dur, delay, tw]);
  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [height * 1.08, height * -0.08] });
  const px = Math.max(2, size * (height / 540));
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: (left / 100) * width,
        top: 0,
        width: px,
        height: px,
        borderRadius: px,
        backgroundColor: LEAF_BRIGHT,
        opacity: o,
        transform: [{ translateY }],
      }}
    />
  );
}

/**
 * Imperceptible whole-layout drift (~±9 px over 137 s) so static numerals
 * never ghost a plasma. Wrap the content in it.
 */
export function BurnShift({ children }: { children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 5, duration: 137_000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  const keyframes = useMemo(
    () => ({
      x: v.interpolate({ inputRange: [0, 1, 2, 3, 4, 5], outputRange: [0, 7, -5, -8, 6, 0] }),
      y: v.interpolate({ inputRange: [0, 1, 2, 3, 4, 5], outputRange: [0, 5, 8, -4, -7, 0] }),
    }),
    [v],
  );
  return (
    <Animated.View style={[styles.fill, { transform: [{ translateX: keyframes.x }, { translateY: keyframes.y }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  outer: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(232,200,120,0.32)",
  },
  inner: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(232,200,120,0.16)",
  },
  corner: { position: "absolute" },
});
