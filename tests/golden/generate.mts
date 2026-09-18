// Regenerates tests/golden/engine.json from the current shared/prayer-engine.ts.
//
// Run from the repo root:
//
//   npx tsx tests/golden/generate.mts > tests/golden/engine.json
//
// This freezes 3 cities x 4 dates from the engine's PRIMARY method (MWL,
// Shafi, SeventhOfTheNight, the mosque's fixed 90-minute Isha/Fajr gaps —
// i.e. exactly what computeDay() returns with its defaults).
//
// DO NOT run this blindly after an engine change and commit the result — a
// golden file that regenerates itself to match a bug is worthless. Instead:
//
//   1. Run this script and diff the output against the committed
//      tests/golden/engine.json.
//   2. For any of dhuhr/asr/maghrib/sunrise that changed, re-validate the
//      new value against Aladhan (https://api.aladhan.com/v1/timings/
//      DD-MM-YYYY?latitude=..&longitude=..&method=3&school=0&
//      latitudeAdjustmentMethod=2 — method=3/school=0 matches
//      shared/methods.ts PRIMARY_METHOD "MWL"+Shafi, and
//      latitudeAdjustmentMethod=2 matches HighLatitudeRule.SeventhOfTheNight)
//      and only accept it if it still agrees within 120 seconds.
//   3. fajr/isha are never compared to Aladhan directly — they are the
//      mosque's fixed 90-minute offsets from sunrise/maghrib. The engine
//      test (tests/engine.golden.test.ts) asserts that structurally
//      (isha - maghrib === 90min, sunrise - fajr === 90min) rather than by
//      value, so they don't need re-validation, only regeneration.
//   4. Only then overwrite tests/golden/engine.json with the new output.
//
// @ts-expect-error -- tsx allows .ts imports; tsc strict-mode does not.
import { computeDay, PRAYER_ORDER } from "../../shared/prayer-engine.ts";

const CITIES = [
  { id: "marl", lat: 51.657, lng: 7.091 },
  { id: "berlin", lat: 52.52, lng: 13.405 },
  { id: "munich", lat: 48.137, lng: 11.575 },
];

const DATES = ["2026-03-20", "2026-06-21", "2026-09-17", "2026-12-21"];

const out: Record<string, Record<string, Record<string, string>>> = {};

for (const city of CITIES) {
  out[city.id] = {};
  for (const dateStr of DATES) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0, 0);
    const day = computeDay(city.lat, city.lng, date);
    const times: Record<string, string> = {};
    for (const p of PRAYER_ORDER) {
      times[p] = day.primary.times[p].toISOString();
    }
    out[city.id][dateStr] = {
      dhuhr: times.dhuhr,
      asr: times.asr,
      maghrib: times.maghrib,
      sunrise: times.sunrise,
      fajr: times.fajr,
      isha: times.isha,
    };
  }
}

console.log(JSON.stringify(out, null, 2));
