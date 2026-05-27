// A thin horizontal bar showing fraction-of-day-elapsed in the user's timezone.
// 0 = midnight, 1 = next midnight. The marker glows.

export function DayProgress({
  now,
  timeZone,
}: {
  now: Date;
  timeZone: string;
}) {
  // Compute fraction of local day elapsed
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});

  const h = Number(parts.hour ?? 0);
  const m = Number(parts.minute ?? 0);
  const s = Number(parts.second ?? 0);
  const fraction = (h * 3600 + m * 60 + s) / 86400;

  return (
    <div className="relative h-px w-full mx-auto bg-bone/10 rounded-full overflow-visible">
      <div
        className="absolute left-0 top-0 h-px bg-gradient-to-r from-gold-dim/60 via-gold to-gold-soft"
        style={{ width: `${fraction * 100}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-gold shadow-[0_0_12px_2px] shadow-gold/60"
        style={{ left: `${fraction * 100}%` }}
      />
    </div>
  );
}
