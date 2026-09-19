import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import type { PrayerName } from "@shared/prayer-engine";

import { FONTS } from "@/theme";

// Wall-display sun path, ported from the website's DisplaySunArc: a luminous
// gold arc tracing the day, the five prayers marked and labelled, the next
// one glowing, the sun by day — or a crescent gliding a starred sky at night.
// Time-of-day fractions come straight off the Date: the device is in the
// local zone, and Hermes' Intl is not to be trusted with time zones.

const ARC_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const W = 1000;
const H = 372;
const MARGIN_X = 70;
const BASELINE_Y = 250;
const ARC_PEAK_Y = 42;
const LABEL_MIN_GAP = 96;
const ROW_STEP = 30;

const STARS = [
  { x: 120, y: 70, r: 2.4, a: 0.9 },
  { x: 210, y: 120, r: 1.6, a: 0.6 },
  { x: 300, y: 55, r: 2.0, a: 0.8 },
  { x: 390, y: 100, r: 1.4, a: 0.5 },
  { x: 470, y: 48, r: 2.6, a: 1.0 },
  { x: 540, y: 110, r: 1.6, a: 0.55 },
  { x: 620, y: 64, r: 2.0, a: 0.85 },
  { x: 700, y: 116, r: 1.5, a: 0.5 },
  { x: 770, y: 58, r: 2.4, a: 0.9 },
  { x: 850, y: 104, r: 1.7, a: 0.6 },
  { x: 250, y: 170, r: 1.3, a: 0.45 },
  { x: 660, y: 168, r: 1.4, a: 0.5 },
  { x: 430, y: 160, r: 1.5, a: 0.5 },
];

const ARC_RX = (W - MARGIN_X * 2) / 2;
const ARC_RY = BASELINE_Y - ARC_PEAK_Y;
const CX = W / 2;

function fractionOfDay(d: Date): number {
  if (Number.isNaN(d.getTime())) return 0.5;
  return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
}

function arcPoint(f: number): { x: number; y: number } {
  const theta = Math.PI * Math.min(Math.max(f, 0), 1);
  return { x: CX - ARC_RX * Math.cos(theta), y: BASELINE_Y - ARC_RY * Math.sin(theta) };
}

export function WallSunArc({
  now,
  times,
  next,
  label,
  clock,
}: {
  now: Date;
  times: Record<PrayerName, Date>;
  next: PrayerName | null;
  /** Localised prayer label (Jumuʿa relabel included). */
  label: (p: PrayerName) => string;
  /** Localised "HH:MM" (Arabic-Indic when the app is in Arabic). */
  clock: (d: Date) => string;
}) {
  const nowF = fractionOfDay(now);
  const sun = arcPoint(nowF);
  const sunriseF = fractionOfDay(times.sunrise);
  const sunsetF = fractionOfDay(times.maghrib);
  const isDay = nowF >= sunriseF && nowF <= sunsetF;

  const dots = useMemo(() => {
    let prevX = -Infinity;
    let row = 0;
    return ARC_PRAYERS.map((p) => {
      const pt = arcPoint(fractionOfDay(times[p]));
      row = pt.x - prevX < LABEL_MIN_GAP ? (row === 0 ? 1 : 0) : 0;
      prevX = pt.x;
      return { p, x: pt.x, y: pt.y, row };
    });
  }, [times]);

  const elapsedEnd = arcPoint(nowF);
  const mx = MARGIN_X + (W - 2 * MARGIN_X) * nowF;
  const my = ARC_PEAK_Y + 36;

  return (
    <View style={styles.wrap}>
      <Svg viewBox={`0 0 ${W} ${H}`} style={styles.svg} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <LinearGradient id="wArc" x1="0" x2="1" y1="0" y2="0">
            <Stop offset="0" stopColor="rgb(232,200,120)" stopOpacity={0.12} />
            <Stop offset="0.5" stopColor="rgb(232,200,120)" stopOpacity={0.55} />
            <Stop offset="1" stopColor="rgb(232,200,120)" stopOpacity={0.12} />
          </LinearGradient>
          <LinearGradient id="wArcElapsed" x1="0" x2="1" y1="0" y2="0">
            <Stop offset="0" stopColor="rgb(246,228,172)" stopOpacity={0.9} />
            <Stop offset="1" stopColor="rgb(246,228,172)" stopOpacity={0.5} />
          </LinearGradient>
          <LinearGradient id="wSky" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="rgb(232,200,120)" stopOpacity={0.1} />
            <Stop offset="1" stopColor="rgb(232,200,120)" stopOpacity={0} />
          </LinearGradient>
          <RadialGradient id="wSun" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="rgb(255,244,214)" stopOpacity={1} />
            <Stop offset="0.35" stopColor="rgb(246,228,172)" stopOpacity={0.95} />
            <Stop offset="0.7" stopColor="rgb(232,200,120)" stopOpacity={0.45} />
            <Stop offset="1" stopColor="rgb(232,200,120)" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="wMoon" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="rgb(226,234,255)" stopOpacity={0.95} />
            <Stop offset="0.55" stopColor="rgb(150,170,220)" stopOpacity={0.35} />
            <Stop offset="1" stopColor="rgb(150,170,220)" stopOpacity={0} />
          </RadialGradient>
          <Mask id="hilal">
            <Rect x={0} y={0} width={W} height={H} fill="black" />
            <Circle cx={mx} cy={my} r={18} fill="white" />
            <Circle cx={mx + 8} cy={my - 4} r={18} fill="black" />
          </Mask>
        </Defs>

        <Path
          d={`M ${MARGIN_X} ${BASELINE_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${W - MARGIN_X} ${BASELINE_Y} Z`}
          fill="url(#wSky)"
        />

        {STARS.map((s, i) => (
          <Circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="rgb(244,236,216)"
            opacity={(isDay ? 0.06 : 0.7) * s.a}
          />
        ))}

        <Line
          x1={MARGIN_X - 10}
          x2={W - MARGIN_X + 10}
          y1={BASELINE_Y}
          y2={BASELINE_Y}
          stroke="rgba(244,236,216,0.14)"
          strokeWidth={1.5}
        />
        <Path
          d={`M ${MARGIN_X} ${BASELINE_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${W - MARGIN_X} ${BASELINE_Y}`}
          fill="none"
          stroke="url(#wArc)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {nowF > 0.001 && (
          <Path
            d={`M ${MARGIN_X} ${BASELINE_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${elapsedEnd.x} ${elapsedEnd.y}`}
            fill="none"
            stroke="url(#wArcElapsed)"
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.9}
          />
        )}

        {[sunriseF, sunsetF].map((f, i) => {
          const x = MARGIN_X + (W - 2 * MARGIN_X) * f;
          return (
            <Line
              key={i}
              x1={x}
              x2={x}
              y1={BASELINE_Y - 7}
              y2={BASELINE_Y + 7}
              stroke="rgba(244,236,216,0.28)"
              strokeWidth={1.5}
            />
          );
        })}

        {dots.map(({ p, x, y, row }) => {
          const isNext = next === p;
          const labelY = BASELINE_Y + 34 + row * ROW_STEP;
          const timeY = labelY + 26;
          return (
            <G key={p}>
              <Line
                x1={x}
                x2={x}
                y1={y}
                y2={row ? labelY - 22 : BASELINE_Y}
                stroke={isNext ? "rgba(246,228,172,0.45)" : "rgba(232,200,120,0.16)"}
                strokeWidth={1.2}
                strokeDasharray={isNext ? undefined : "3 5"}
              />
              {isNext && <Circle cx={x} cy={y} r={22} fill="url(#wSun)" />}
              <Circle
                cx={x}
                cy={y}
                r={isNext ? 11 : 6}
                fill={isNext ? "rgb(255,244,214)" : "rgba(232,200,120,0.9)"}
              />
              <SvgText
                x={x}
                y={labelY}
                textAnchor="middle"
                fontFamily={FONTS.display}
                fontSize={isNext ? 29 : 25}
                fill={isNext ? "rgb(246,228,172)" : "rgba(244,236,216,0.72)"}
              >
                {label(p)}
              </SvgText>
              <SvgText
                x={x}
                y={timeY}
                textAnchor="middle"
                fontFamily={FONTS.display}
                fontSize={18}
                fill={isNext ? "rgba(246,228,172,0.85)" : "rgba(244,236,216,0.4)"}
              >
                {clock(times[p])}
              </SvgText>
            </G>
          );
        })}

        {isDay ? (
          <>
            <Circle cx={sun.x} cy={sun.y} r={46} fill="url(#wSun)" />
            <Circle cx={sun.x} cy={sun.y} r={14} fill="rgb(255,248,224)" />
          </>
        ) : (
          <>
            <Circle cx={mx} cy={my} r={36} fill="url(#wMoon)" />
            <Circle cx={mx} cy={my} r={18} fill="rgb(240,243,255)" mask="url(#hilal)" />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, width: "100%" },
  svg: { width: "100%", height: "100%" },
});
