import type { Confidence } from "@/lib/consensus";
import { toArabicDigits } from "@/lib/format";

const DOT_COLOR: Record<Confidence, string> = {
  high: "bg-good shadow-[0_0_10px_0] shadow-good/70",
  medium: "bg-warn shadow-[0_0_10px_0] shadow-warn/70",
  low: "bg-bad shadow-[0_0_12px_0] shadow-bad/70",
};

function shortSpread(seconds: number): string {
  if (seconds < 60) return `${toArabicDigits(seconds)}ث`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${toArabicDigits(m)}د`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm === 0
    ? `${toArabicDigits(h)}س`
    : `${toArabicDigits(h)}س${toArabicDigits(rm)}`;
}

export function ConfidenceBadge({
  confidence,
  spreadSeconds,
}: {
  confidence: Confidence;
  spreadSeconds: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-bone-dim"
      title={`Spread across calculation methods: ${spreadSeconds}s`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[confidence]}`} />
      <span className="text-[11px] tnum">{shortSpread(spreadSeconds)}</span>
    </span>
  );
}
