// Validation gate: compute Marl prayer times today via our engine,
// fetch Aladhan MWL for the same day, diff Maghrib (and the other 4).
// Fails loudly if any prayer differs by >120 seconds from Aladhan's MWL.

// @ts-expect-error -- tsx allows .ts imports; tsc strict-mode does not. This file is run via tsx only, never compiled.
import { computeDay, PRAYER_ORDER, type PrayerName } from "../src/lib/prayer-engine.ts";

const MARL_LAT = 51.6564;
const MARL_LNG = 7.0907;
const TOLERANCE_SECONDS = 120;

const fmtTime = (d: Date): string =>
  d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Berlin",
  });

const fmtDateForAladhan = (d: Date): string => {
  // Aladhan wants DD-MM-YYYY
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const parseAladhanTimeOnDate = (hhmm: string, refDate: Date): Date => {
  // Aladhan returns times like "05:23 (CEST)" — strip the tz suffix
  const clean = hhmm.split(" ")[0];
  const [h, m] = clean.split(":").map(Number);
  // Build a Date in Europe/Berlin time. We assume the validation
  // script runs in Europe/Berlin or UTC; we use the JS Date local-time
  // constructor with year/month/day from refDate.
  const out = new Date(refDate);
  out.setHours(h, m, 0, 0);
  return out;
};

async function main() {
  const now = new Date();
  const day = computeDay(MARL_LAT, MARL_LNG, now);

  console.log(`\n== Marl, today ${fmtDateForAladhan(now)} ==`);
  console.log(
    `Coords: ${MARL_LAT}, ${MARL_LNG}   |   Primary method: ${day.primary.label}`,
  );

  console.log("\nLocal (adhan-js) — all methods:");
  console.log(
    [
      "method".padEnd(18),
      ...PRAYER_ORDER.map((p) => p.padEnd(8)),
    ].join(""),
  );
  const allMethods = [day.primary, ...day.alternates];
  for (const m of allMethods) {
    console.log(
      [
        m.shortLabel.padEnd(18),
        ...PRAYER_ORDER.map((p) =>
          m.times[p]
            .toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Berlin",
            })
            .padEnd(8),
        ),
      ].join(""),
    );
  }

  // Fetch Aladhan MWL for comparison (method=3)
  const url = `https://api.aladhan.com/v1/timings/${fmtDateForAladhan(now)}?latitude=${MARL_LAT}&longitude=${MARL_LNG}&method=3&school=0`;
  console.log(`\nFetching Aladhan: ${url}`);

  let aladhan: Record<string, string>;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { data: { timings: Record<string, string> } };
    aladhan = json.data.timings;
  } catch (err) {
    console.error(`\n✗ Aladhan fetch failed: ${err}`);
    console.error("Cannot validate without ground truth. Aborting.");
    process.exit(1);
  }

  console.log("\nAladhan MWL response (raw):", aladhan);

  const aladhanKeys: Record<PrayerName, string> = {
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
  };

  console.log("\nDiff: local MWL vs Aladhan MWL");
  let worstDiff = 0;
  let worstPrayer = "";
  for (const p of PRAYER_ORDER) {
    const localT = day.primary.times[p];
    const aladhanT = parseAladhanTimeOnDate(aladhan[aladhanKeys[p]], now);
    const diffSec = Math.round((localT.getTime() - aladhanT.getTime()) / 1000);
    const absDiff = Math.abs(diffSec);
    if (absDiff > worstDiff) {
      worstDiff = absDiff;
      worstPrayer = p;
    }
    const flag =
      absDiff <= 30
        ? "✓"
        : absDiff <= TOLERANCE_SECONDS
          ? "~"
          : "✗";
    console.log(
      `  ${flag} ${p.padEnd(8)} local=${fmtTime(localT)}  aladhan=${fmtTime(aladhanT)}  Δ=${diffSec >= 0 ? "+" : ""}${diffSec}s`,
    );
  }

  console.log(
    `\nWorst diff: ${worstPrayer} ${worstDiff}s   (tolerance: ${TOLERANCE_SECONDS}s)`,
  );

  if (worstDiff > TOLERANCE_SECONDS) {
    console.error(
      `\n✗ VALIDATION FAILED — local engine diverges from Aladhan MWL by more than ${TOLERANCE_SECONDS}s. Stop and debug the algorithm before continuing.`,
    );
    process.exit(2);
  }
  console.log(`\n✓ VALIDATION PASSED — local engine agrees with Aladhan MWL within ${TOLERANCE_SECONDS}s.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
