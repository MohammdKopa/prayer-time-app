"use client";

import { useEffect, useState } from "react";
import { computeDay } from "@shared/prayer-engine";
import { DEFAULT_CITY, NRW_TZ } from "@shared/cities";
import type { BandPrayer, Copy } from "./copy";

// Today's prayer day as one band, midnight to midnight, computed in the
// visitor's browser by the same engine the app runs. It is the page's claim
// made visible: nothing here came from a server. Rendered empty on the
// server and filled after mount, so the times are always the visitor's
// "today" and hydration never disagrees about the clock.

const ORDER: BandPrayer[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: NRW_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Minutes since local (Berlin) midnight, as a fraction of the day. */
function dayFraction(d: Date): number {
  const [h, m] = clock.format(d).split(":").map(Number);
  return (h * 60 + m) / 1440;
}

export function DayBand({ copy }: { copy: Copy }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const times = now ? computeDay(DEFAULT_CITY.latitude, DEFAULT_CITY.longitude, now).primary.times : null;
  const at = (p: BandPrayer) => (times ? dayFraction(times[p]) * 100 : 0);
  const next = times && now ? ORDER.find((p) => p !== "sunrise" && times[p] > now) ?? null : null;

  // Night, a green dawn, the long day, a gold dusk at Maghrib, night again.
  const sky = times
    ? `linear-gradient(to ${copy.dir === "rtl" ? "left" : "right"},
        #061712 0%, #061712 ${at("fajr")}%,
        #1d4636 ${at("sunrise")}%, #2c5f47 ${at("dhuhr")}%,
        #3a6b4c ${at("asr")}%, #c9a25e ${at("maghrib")}%,
        #0d2a20 ${at("isha")}%, #061712 100%)`
    : "#0b241b";

  return (
    <figure className="m-0">
      <div
        className="relative h-14 rounded-full border border-[#f4ecd8]/15 sm:h-16"
        style={{ background: sky }}
        aria-hidden="true"
      >
        {times &&
          ORDER.map((p) => (
            <span
              key={p}
              className={`absolute top-2 bottom-2 w-px ${p === "sunrise" ? "bg-[#f4ecd8]/30" : "bg-[#f4ecd8]/70"}`}
              style={{ insetInlineStart: `${at(p)}%` }}
            />
          ))}
        {now && (
          <span
            className="absolute -top-2 -bottom-2 w-[3px] rounded-full bg-[#d9b871] shadow-[0_0_12px_#d9b871]"
            style={{ insetInlineStart: `${dayFraction(now) * 100}%` }}
          >
            <span className="absolute -top-7 -translate-x-1/2 whitespace-nowrap text-sm text-[#d9b871] rtl:translate-x-1/2">
              {copy.now}
            </span>
          </span>
        )}
      </div>

      <ol className="mt-6 grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-6">
        {ORDER.map((p) => {
          const isNext = p === next;
          return (
            <li key={p} className={p === "sunrise" ? "opacity-55" : undefined}>
              <span className={`block text-sm ${isNext ? "text-[#d9b871]" : "text-[#f4ecd8]/70"}`}>
                {copy.prayers[p]}
              </span>
              <span
                className={`block font-[family-name:var(--font-kufi)] text-3xl tabular-nums sm:text-4xl ${isNext ? "text-[#d9b871]" : "text-[#f4ecd8]"}`}
              >
                {times ? clock.format(times[p]) : "--:--"}
              </span>
            </li>
          );
        })}
      </ol>

      <figcaption className="mt-5 max-w-[60ch] text-base text-[#f4ecd8]/70">
        {copy.bandCaption.replace("{city}", DEFAULT_CITY.name)}
      </figcaption>
    </figure>
  );
}
