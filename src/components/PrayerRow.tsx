import type { PrayerName } from "@/lib/prayer-engine";
import type { PrayerConsensus } from "@/lib/consensus";
import { PRAYER_LABEL_AR, formatHM } from "@/lib/format";

export function PrayerRow({
  prayer,
  time,
  consensus,
  isNext,
  isPast,
  timeZone,
}: {
  prayer: PrayerName;
  time: Date;
  consensus: PrayerConsensus;
  isNext: boolean;
  isPast: boolean;
  timeZone: string;
}) {
  const alt = consensus.alternative;

  return (
    <div
      className={`glass glass-interactive rounded-2xl px-4 py-3.5 grid grid-cols-[1fr_auto] items-center gap-3 ${
        isNext ? "glass-tint-gold" : isPast ? "opacity-50" : ""
      }`}
    >
      {/* Arabic name */}
      <div className="min-w-0">
        <div
          className={`ar text-3xl font-medium leading-none ${
            isNext ? "text-gold-soft" : "text-bone"
          }`}
          dir="rtl"
        >
          {PRAYER_LABEL_AR[prayer]}
        </div>
        {alt && (
          <div
            className="ar mt-1.5 text-[11px] text-bone-dim flash-target"
            dir="rtl"
          >
            <span className="opacity-70">حسب </span>
            <span className="text-bone">{alt.shortLabel}</span>
            <span className="opacity-70">: </span>
            <span className="tnum text-bone" dir="ltr">
              {formatHM(alt.time, timeZone)}
            </span>
          </div>
        )}
      </div>

      {/* Time */}
      <div
        className={`flash-target text-3xl font-light tnum tabular-nums ${
          isNext ? "text-gold-soft" : isPast ? "text-bone-dim" : "text-bone"
        }`}
        dir="ltr"
      >
        {formatHM(time, timeZone)}
      </div>
    </div>
  );
}
