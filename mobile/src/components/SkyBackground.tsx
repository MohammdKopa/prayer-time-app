import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

import type { PrayerName } from "@shared/prayer-engine";
import { skyAt, starField } from "@/lib/sky";
import { COLORS } from "@/theme";

// The backdrop. Everything else renders on top of this.
//
// Recomputed from `now`, but the caller should pass a value that changes on
// the order of a minute, not every second — the colours move far too slowly
// for a per-second update to be visible, and re-rendering a full-screen
// gradient at 1Hz is a waste of battery on a screen people leave open.

const STARS = starField(70);

export function SkyBackground({
  now,
  times,
}: {
  now: Date;
  times: Record<PrayerName, Date>;
}) {
  const { width, height } = useWindowDimensions();
  const sky = useMemo(() => skyAt(now, times), [now, times]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={sky.colours}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {sky.starAlpha > 0.02 && (
        <Svg
          style={StyleSheet.absoluteFill}
          width={width}
          height={height}
          pointerEvents="none"
        >
          {STARS.map((s, i) => (
            <Circle
              key={i}
              cx={s.x * width}
              cy={s.y * height}
              r={s.r}
              fill={COLORS.bone}
              // Vary brightness per star so the field has depth instead of
              // reading as a regular dot screen.
              fillOpacity={sky.starAlpha * (0.25 + ((i * 37) % 60) / 100)}
            />
          ))}
        </Svg>
      )}

      {sky.horizonGlow > 0.02 && (
        <Svg
          style={StyleSheet.absoluteFill}
          width={width}
          height={height}
          pointerEvents="none"
        >
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="100%" r="80%">
              <Stop
                offset="0%"
                stopColor={COLORS.gold}
                stopOpacity={String(sky.horizonGlow * 0.5)}
              />
              <Stop
                offset="60%"
                stopColor={COLORS.gold}
                stopOpacity={String(sky.horizonGlow * 0.12)}
              />
              <Stop offset="100%" stopColor={COLORS.gold} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          {/* Sits below the horizon and bleeds upward, the way real light does
              before Fajr and after Maghrib. */}
          <Ellipse
            cx={width / 2}
            cy={height * 1.02}
            rx={width * 0.85}
            ry={height * 0.42}
            fill="url(#glow)"
          />
        </Svg>
      )}
    </View>
  );
}
