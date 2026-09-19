// Generate the Germany-wide city list for the mobile app's manual place picker.
//
//   node scripts/fetch-cities-germany.mjs
//
// Queries OpenStreetMap's Overpass API for every place=city / place=town in
// Germany that carries a population tag, keeps those with at least MIN_POP
// inhabitants, and writes a compact JSON file the mobile app ships in its
// bundle: mobile/src/lib/cities/germany.json.
//
// This complements shared/cities.ts (the hand-curated NRW list the website
// is built around) — it does not replace it. The mobile app merges the two
// in mobile/src/lib/location.ts, curated entries winning on a name clash.
//
// No API key, no billing. Re-run anytime to refresh.

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "mobile", "src", "lib", "cities");
const OUT = join(OUT_DIR, "germany.json");

const MIN_POP = 10_000;

const QUERY = `[out:json][timeout:180];
area["ISO3166-1"="DE"]["admin_level"="2"]->.de;
node["place"~"^(city|town)$"]["population"](area.de);
out tags center;`;

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

async function runQuery(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 200_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "prayer-time-app/1.0 (Germany city list)",
      },
      body: "data=" + encodeURIComponent(QUERY),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.elements)) throw new Error("no elements[] in response");
    return json.elements;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchElements() {
  let lastErr = null;
  for (const mirror of MIRRORS) {
    console.log(`Querying ${mirror}…`);
    try {
      const elements = await runQuery(mirror);
      console.log(`  → ${elements.length} elements`);
      return elements;
    } catch (err) {
      lastErr = err;
      console.log(`  → failed: ${err.message}`);
    }
  }
  throw lastErr ?? new Error("all Overpass attempts failed");
}

function pick4(n) {
  return Math.round(n * 10_000) / 10_000;
}

function shape(elements) {
  const out = [];
  for (const el of elements) {
    const t = el.tags || {};
    const name = t["name:de"] || t.name;
    const population = Number(String(t.population).replace(/[^0-9]/g, ""));
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!name || !Number.isFinite(population) || lat == null || lng == null) continue;
    if (population < MIN_POP) continue;
    out.push({
      id: `osm-node-${el.id}`,
      name,
      population,
      latitude: pick4(lat),
      longitude: pick4(lng),
    });
  }
  // Biggest first: the picker shows the top of this list before any search.
  out.sort((a, b) => b.population - a.population || a.name.localeCompare(b.name, "de"));
  return out;
}

const elements = await fetchElements();
const cities = shape(elements);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(cities) + "\n");

console.log(`\nWrote ${cities.length} cities (population ≥ ${MIN_POP}) → ${OUT}`);
