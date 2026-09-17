// Engine parity gate.
//
//   npx tsx scripts/engine-parity.mts
//
// The push worker (scripts/push-worker.mjs) runs in its own container with its
// own package.json and cannot import the TypeScript engine, so it carries a
// duplicate of the prayer-time computation. This gate proves the duplicate
// still agrees with shared/prayer-engine.ts — to the second, across a full
// year, at the latitudes we actually serve.
//
// It exists because the duplicate silently drifted once: the engine moved to
// HighLatitudeRule.SeventhOfTheNight on the imam's ruling (2026-06) and the
// worker kept TwilightAngle. In midsummer that fired the Marl Fajr push at
// 03:01 while the app displayed 04:11 — seventy minutes early, every night,
// for anyone who had enabled notifications.
//
// A prayer app is allowed to be wrong about many things. Not this one.

// @ts-expect-error -- tsx allows .ts imports; tsc strict-mode does not. Run via tsx only.
import { computeDay, type PrayerName } from "../shared/prayer-engine.ts";
import { computeTimesFor } from "./push-worker.mjs";

/** Prayers the worker actually notifies for. Sunrise is excluded at the type
 *  level, not by convention: the worker has no sunrise push and its return
 *  type has no such key, so adding one here is a compile error, not a crash. */
type NotifiedPrayer = Exclude<PrayerName, "sunrise">;
const NOTIFIED: NotifiedPrayer[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

/** The latitude range we serve. Flensburg is Germany's northernmost city and
 *  the worst case for high-latitude Fajr/Isha; Munich is the southernmost. */
const SITES = [
  { name: "Flensburg", lat: 54.7837, lng: 9.4365 },
  { name: "Hamburg", lat: 53.5511, lng: 9.9937 },
  { name: "Marl", lat: 51.6564, lng: 7.0907 },
  { name: "Köln", lat: 50.9375, lng: 6.9603 },
  { name: "München", lat: 48.1351, lng: 11.582 },
];

const DAYS = 366;

interface Drift {
  site: string;
  date: string;
  prayer: NotifiedPrayer;
  seconds: number;
}

function main() {
  const drifts: Drift[] = [];
  const start = new Date();
  start.setHours(12, 0, 0, 0);

  for (const site of SITES) {
    for (let i = 0; i < DAYS; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const engine = computeDay(site.lat, site.lng, date).primary.times;
      const worker = computeTimesFor(site.lat, site.lng, date);

      for (const prayer of NOTIFIED) {
        const diff = Math.round(
          (worker[prayer].getTime() - engine[prayer].getTime()) / 1000,
        );
        if (diff !== 0) {
          drifts.push({
            site: site.name,
            date: date.toISOString().slice(0, 10),
            prayer,
            seconds: diff,
          });
        }
      }
    }
  }

  const checks = SITES.length * DAYS * NOTIFIED.length;

  if (drifts.length === 0) {
    console.info(
      `✓ engine parity: ${checks} comparisons across ${SITES.length} cities ` +
        `× ${DAYS} days — worker and engine agree to the second.`,
    );
    process.exit(0);
  }

  const worst = drifts.reduce((a, b) =>
    Math.abs(b.seconds) > Math.abs(a.seconds) ? b : a,
  );

  console.error(
    `✗ ENGINE PARITY BROKEN — ${drifts.length} of ${checks} comparisons differ.\n`,
  );
  console.error(
    "  scripts/push-worker.mjs no longer agrees with shared/prayer-engine.ts.",
  );
  console.error(
    "  The adhan will fire at a different time than the app displays.\n",
  );
  console.error(
    `  Worst: ${worst.site} ${worst.date} ${worst.prayer} — ` +
      `${worst.seconds > 0 ? "+" : ""}${worst.seconds}s ` +
      `(${(worst.seconds / 60).toFixed(1)} min).\n`,
  );

  // Show a sample rather than thousands of lines.
  console.error("  Sample:");
  for (const d of drifts.slice(0, 10)) {
    console.error(
      `    ${d.site.padEnd(10)} ${d.date}  ${d.prayer.padEnd(8)} ` +
        `${d.seconds > 0 ? "+" : ""}${d.seconds}s`,
    );
  }
  if (drifts.length > 10) {
    console.error(`    … and ${drifts.length - 10} more.`);
  }

  process.exit(1);
}

main();
