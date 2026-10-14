import Svg, { Circle, Path } from "react-native-svg";

// The six tab glyphs, 24-unit line drawings at one stroke width. Drawn rather
// than typed as Unicode: a glyph comes from whichever font the device falls
// back to, so the same character looked different on every phone.
//
// Nothing here is a face, a figure or a sun. The adhkar tab is a ring of prayer
// beads, which says "remembrance" without depicting anyone.
export type TabIconName =
  | "times"
  | "month"
  | "quran"
  | "dua"
  | "qibla"
  | "more";

// Eight beads on a ring centred at (12, 9), radius 5.5, the lowest one sitting
// on the tassel.
const BEADS: [number, number][] = [
  [17.5, 9],
  [15.9, 12.9],
  [12, 14.5],
  [8.1, 12.9],
  [6.5, 9],
  [8.1, 5.1],
  [12, 3.5],
  [15.9, 5.1],
];

export function TabIcon({
  name,
  color,
  size = 24,
}: {
  name: TabIconName;
  color: string;
  size?: number;
}) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {name === "times" ? (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M12 7v5l3 2" {...stroke} />
        </>
      ) : name === "month" ? (
        <>
          <Path d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" {...stroke} />
          <Path d="M4 9.5h16M8 3v4M16 3v4" {...stroke} />
          <Path d="M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01" {...stroke} />
        </>
      ) : name === "quran" ? (
        <>
          <Path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5z" {...stroke} />
          <Path d="M12 6.5v13" {...stroke} />
        </>
      ) : name === "dua" ? (
        <>
          {BEADS.map(([cx, cy]) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.3} {...stroke} />
          ))}
          <Path d="M12 15.8V21" {...stroke} />
        </>
      ) : name === "qibla" ? (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="m15.5 8.5-2 5-5 2 2-5z" {...stroke} />
        </>
      ) : (
        <Path d="M4 7h16M4 12h16M4 17h16" {...stroke} />
      )}
    </Svg>
  );
}
