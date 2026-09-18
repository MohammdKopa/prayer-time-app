import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import type { PrayerName } from "@shared/prayer-engine";
import { COLORS } from "@/theme";

// The day as a curve rather than a table.
//
// Ported from the web app's SunArc, with one deliberate difference: the web
// version resolves the time of day through Intl with an explicit timeZone.
// Here the device is already in the local zone, and Hermes' Intl is not
// trustworthy enough to rely on, so the fraction comes straight off the Date.
//
// The arc is the whole 24 hours, midnight to midnight, so Fajr sits near the
// left edge and Isha near the right. The horizon line is where the sun rises
// and sets, which is what makes the night hours read as night.

const W = 320;
const H = 150;
const MARGIN_X = 22;
const BASELINE_Y = 120;
const ARC_PEAK_Y = 26;
const ARC_RX = (W - MARGIN_X * 2) / 2;
const ARC_RY = BASELINE_Y - ARC_PEAK_Y;
const CX = W / 2;

const DOTS: PrayerName[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

/** Fraction of the local day: 0 at midnight, 1 at the next midnight. */
function fractionOfDay(d: Date): number {
  return (
    (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400
  );
}

function arcPoint(f: number): { x: number; y: number } {
  const theta = Math.PI * Math.min(1, Math.max(0, f));
  return {
    x: CX - ARC_RX * Math.cos(theta),
    y: BASELINE_Y - ARC_RY * Math.sin(theta),
  };
}

export function SunArc({
  now,
  times,
  next,
}: {
  now: Date;
  times: Record<PrayerName, Date>;
  next: PrayerName | null;
}) {
  const nowF = fractionOfDay(now);
  const sun = arcPoint(nowF);

  const sunriseF = fractionOfDay(times.sunrise);
  const sunsetF = fractionOfDay(times.maghrib);
  const isDay = nowF >= sunriseF && nowF <= sunsetF;

  const dots = useMemo(
    () =>
      DOTS.map((p) => {
        const f = fractionOfDay(times[p]);
        return { p, f, ...arcPoint(f) };
      }),
    [times],
  );

  // The arc, drawn as a half ellipse from left horizon to right horizon.
  const arc = `M ${MARGIN_X} ${BASELINE_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${
    W - MARGIN_X
  } ${BASELINE_Y}`;

  // The portion of the day already behind us, drawn brighter so the curve
  // itself shows how far through the day you are.
  const elapsed = `M ${MARGIN_X} ${BASELINE_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${sun.x} ${sun.y}`;

  return (
    <View style={styles.wrap}>
      <Svg viewBox={`0 0 ${W} ${H}`} style={styles.svg}>
        <Defs>
          <LinearGradient id="arcStroke" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={COLORS.gold} stopOpacity="0.12" />
            <Stop offset="0.5" stopColor={COLORS.gold} stopOpacity="0.45" />
            <Stop offset="1" stopColor={COLORS.gold} stopOpacity="0.12" />
          </LinearGradient>
        </Defs>

        {/* Horizon. Below it is night. */}
        <Line
          x1={MARGIN_X - 10}
          y1={BASELINE_Y}
          x2={W - MARGIN_X + 10}
          y2={BASELINE_Y}
          stroke={COLORS.bone}
          strokeOpacity={0.12}
          strokeWidth={1}
        />

        <Path
          d={arc}
          stroke="url(#arcStroke)"
          strokeWidth={1.5}
          fill="none"
        />
        <Path
          d={elapsed}
          stroke={COLORS.gold}
          strokeOpacity={0.55}
          strokeWidth={2}
          fill="none"
        />

        {dots.map((d) => {
          const isNext = d.p === next;
          const isSunrise = d.p === "sunrise";
          return (
            <Circle
              key={d.p}
              cx={d.x}
              cy={d.y}
              r={isNext ? 5 : isSunrise ? 2.5 : 3.5}
              fill={isNext ? COLORS.gold : COLORS.bone}
              fillOpacity={isNext ? 1 : isSunrise ? 0.35 : 0.5}
            />
          );
        })}

        {/* The sun by day, a crescent by night. */}
        {isDay ? (
          <>
            <Circle
              cx={sun.x}
              cy={sun.y}
              r={13}
              fill={COLORS.gold}
              fillOpacity={0.14}
            />
            <Circle cx={sun.x} cy={sun.y} r={6.5} fill={COLORS.gold} />
          </>
        ) : (
          <>
            <Circle
              cx={sun.x}
              cy={sun.y}
              r={11}
              fill={COLORS.bone}
              fillOpacity={0.08}
            />
            <Circle cx={sun.x} cy={sun.y} r={6} fill={COLORS.bone} />
            {/* Bite out of the disc to make a crescent. */}
            <Circle
              cx={sun.x + 3}
              cy={sun.y - 2.5}
              r={5.5}
              fill={COLORS.bg}
            />
          </>
        )}
      </Svg>
      <Text style={styles.hidden} accessibilityRole="image">
        {""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", aspectRatio: W / H },
  svg: { width: "100%", height: "100%" },
  hidden: { height: 0 },
});
