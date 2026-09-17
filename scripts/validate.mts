// Validation gate: compute Marl prayer times today via our engine,
// fetch Aladhan MWL for the same day, diff Maghrib (and the other 4).
// Fails loudly if any prayer differs by >120 seconds from Aladhan's MWL.

// @ts-expect-error -- tsx allows .ts imports; tsc strict-mode does not. This file is run via tsx only, never compiled.
import { computeDay, NO_GAP_RULE, PRAYER_ORDER, type PrayerName } from "../shared/prayer-engine.ts";

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
  // Floor OFF for the Aladhan comparison. Aladhan returns raw astronomical
  // times; our Isha floor is a local fiqh ruling, not a calculation. Comparing
  // floored times against raw ones would fail every summer for the wrong
  // reason. The floor gets its own check below.
  const day = computeDay(MARL_LAT, MARL_LNG, now, NO_GAP_RULE, NO_GAP_RULE);

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

  // Fetch Aladhan MWL for comparison.
  // method=3 = Muslim World League, school=0 = Shafi (matches PRIMARY_METHOD).
  // latitudeAdjustmentMethod=2 = one-seventh of the night, matching the
  // engine's HighLatitudeRule.SeventhOfTheNight. Without it this script
  // compares our times against Aladhan's angle-based ones and fails every
  // day by ~18 min on Fajr — which it silently did from 2026-06-02, when the
  // engine changed and only src/app/api/sanity-check/route.ts was updated.
  const url = `https://api.aladhan.com/v1/timings/${fmtDateForAladhan(now)}?latitude=${MARL_LAT}&longitude=${MARL_LNG}&method=3&school=0&latitudeAdjustmentMethod=2`;
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

  // ── the sheikh's gap rules, checked on their own terms ────────────
  // Sheikh Ayman, Marl (2026-06-03, confirmed literal 2026-09-17): Isha always
  // 90 minutes after Maghrib, Fajr always 90 minutes before sunrise.
  const shown = computeDay(MARL_LAT, MARL_LNG, now);
  const calc = day.primary.times; // the unadjusted run fetched above

  const mins = (a: Date, b: Date) => (a.getTime() - b.getTime()) / 60000;
  const ishaGap = mins(shown.primary.times.isha, shown.primary.times.maghrib);
  const fajrGap = mins(shown.primary.times.sunrise, shown.primary.times.fajr);

  const describe = (r: { mode: string; minutes: number }) =>
    `${r.mode} ${r.minutes}m`;

  console.log(`
Isha rule (${describe(shown.ishaRule)} after Maghrib):`);
  console.log(`  calculated gap ${mins(calc.isha, calc.maghrib).toFixed(0)}m`);
  console.log(`  shown gap      ${ishaGap.toFixed(0)}m`);
  console.log(`  adjusted today ${shown.ishaAdjusted ? "yes" : "no"}`);

  console.log(`Fajr rule (${describe(shown.fajrRule)} before sunrise):`);
  console.log(`  calculated gap ${mins(calc.sunrise, calc.fajr).toFixed(0)}m`);
  console.log(`  shown gap      ${fajrGap.toFixed(0)}m`);
  console.log(`  adjusted today ${shown.fajrAdjusted ? "yes" : "no"}`);

  const problems: string[] = [];
  const EPS = 0.01;

  const checkGap = (
    label: string,
    gap: number,
    rule: { mode: string; minutes: number },
  ) => {
    if (rule.minutes <= 0) return;
    if (rule.mode === "fixed") {
      if (Math.abs(gap - rule.minutes) > EPS) {
        problems.push(
          `${label} gap is ${gap.toFixed(1)}m but the rule is fixed ${rule.minutes}m`,
        );
      }
    } else if (gap < rule.minutes - EPS) {
      problems.push(
        `${label} gap ${gap.toFixed(1)}m is below the ${rule.minutes}m minimum`,
      );
    }
  };

  checkGap("Maghrib-Isha", ishaGap, shown.ishaRule);
  checkGap("Fajr-sunrise", fajrGap, shown.fajrRule);

  // A "minimum" rule must never move a prayer the wrong way. A "fixed" rule
  // may move it either way by design, so direction is only asserted for
  // minimums.
  if (
    shown.ishaRule.mode === "minimum" &&
    shown.primary.times.isha.getTime() < calc.isha.getTime()
  ) {
    problems.push("a minimum rule moved Isha EARLIER, which it must never do");
  }
  if (
    shown.fajrRule.mode === "minimum" &&
    shown.primary.times.fajr.getTime() > calc.fajr.getTime()
  ) {
    problems.push("a minimum rule moved Fajr LATER, which it must never do");
  }

  // The adjusted flags must reflect reality, whatever the mode.
  if (
    shown.ishaAdjusted !==
    (shown.primary.times.isha.getTime() !== calc.isha.getTime())
  ) {
    problems.push("ishaAdjusted disagrees with the computation");
  }
  if (
    shown.fajrAdjusted !==
    (shown.primary.times.fajr.getTime() !== calc.fajr.getTime())
  ) {
    problems.push("fajrAdjusted disagrees with the computation");
  }

  // Order must survive both rules. A fixed Isha moves earlier in winter and a
  // fixed Fajr moves earlier in summer, so this is not a formality.
  for (let i = 1; i < PRAYER_ORDER.length; i++) {
    const prev = shown.primary.times[PRAYER_ORDER[i - 1]];
    const cur = shown.primary.times[PRAYER_ORDER[i]];
    if (cur.getTime() <= prev.getTime()) {
      problems.push(
        `order broken: ${PRAYER_ORDER[i - 1]} is not before ${PRAYER_ORDER[i]}`,
      );
    }
  }

  // The rules touch Isha and Fajr only.
  for (const k of ["sunrise", "dhuhr", "asr", "maghrib"] as const) {
    if (shown.primary.times[k].getTime() !== calc[k].getTime()) {
      problems.push(`the gap rules altered ${k}, which they must not touch`);
    }
  }

  if (problems.length > 0) {
    console.error("\n✗ PRAYER GAP RULES FAILED:");
    for (const pr of problems) console.error(`    - ${pr}`);
    process.exit(3);
  }
  console.log("\n✓ PRAYER GAP RULES OK — gaps exact, flags honest, order intact.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
