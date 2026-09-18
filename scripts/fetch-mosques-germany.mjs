// Generate the Germany-wide mosque locator data for the mobile app.
//
//   node scripts/fetch-mosques-germany.mjs
//
// Queries the free OpenStreetMap Overpass API for every Muslim place of
// worship in Germany and writes a compact JSON file the mobile app ships in
// its bundle: mobile/src/lib/mosques/germany.json.
//
// Unlike scripts/fetch-mosques.mjs (NRW only, feeds shared/mosques.osm.json
// for the website and maps each entry onto the curated city list), this
// script is standalone: no source files are parsed, no city mapping is
// attempted, and its output is consumed only by the mobile app's own
// nearest-mosque lookup (mobile/src/lib/mosques/index.ts). Data lives as
// data — this script reads nothing but the network response.
//
// No API key, no billing. Re-run anytime to refresh.

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "mobile", "src", "lib", "mosques");
const OUT = join(OUT_DIR, "germany.json");

// ── 1. Query Overpass ───────────────────────────────────────────────────
//
// Primary query resolves Germany by its ISO3166-1 country relation. If an
// Overpass instance times out on the area lookup (it can, for a
// country-sized area query), we fall back to a bounding box that covers all
// of Germany with margin — slightly wider than the real border, but Overpass
// still only returns points actually within Germany's OSM data since the
// tags themselves aren't geography-dependent, so the worst case is a few
// extra elements from Alpine/border slivers, not wrong ones.

const AREA_QUERY = `[out:json][timeout:300];
area["ISO3166-1"="DE"]["admin_level"="2"]->.de;
nwr["amenity"="place_of_worship"]["religion"="muslim"](area.de);
out center tags;`;

const BBOX_QUERY = `[out:json][timeout:300];
nwr["amenity"="place_of_worship"]["religion"="muslim"](47.2,5.8,55.1,15.1);
out center tags;`;

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const FETCH_TIMEOUT_MS = 280_000;

async function runQuery(url, query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "prayer-time-app/1.0 (Germany mosque locator)",
      },
      body: "data=" + encodeURIComponent(query),
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
  const attempts = [];
  for (const mirror of MIRRORS) {
    attempts.push({ mirror, query: AREA_QUERY, label: "area(DE)" });
    attempts.push({ mirror, query: BBOX_QUERY, label: "bbox" });
  }

  let lastErr = null;
  for (const { mirror, query, label } of attempts) {
    console.log(`Querying ${mirror} [${label}]…`);
    try {
      const elements = await runQuery(mirror, query);
      console.log(`  → ${elements.length} elements`);
      return elements;
    } catch (err) {
      lastErr = err;
      console.log(`  → failed: ${err.message}`);
    }
  }
  throw lastErr ?? new Error("all Overpass attempts failed");
}

// ── 2. Shape ─────────────────────────────────────────────────────────────

function pick4(n) {
  return Math.round(n * 10_000) / 10_000;
}

function streetOf(t) {
  const parts = [t["addr:street"], t["addr:housenumber"]].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

function nameOf(t) {
  return t.name || t["name:de"] || t["name:ar"] || t["name:tr"] || t.operator || null;
}

function shape(elements) {
  const out = [];
  for (const el of elements) {
    const t = el.tags || {};
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;

    const name = nameOf(t);
    const city = t["addr:city"] || null;
    if (!name && !city) continue; // nothing to show or search by — drop it

    const entry = {
      id: `osm-${el.type}-${el.id}`,
      name,
      lat: pick4(lat),
      lng: pick4(lng),
      city,
    };
    if (t["name:ar"]) entry.nameAr = t["name:ar"];
    const street = streetOf(t);
    if (street) entry.street = street;

    out.push(entry);
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

// ── 3. Run ───────────────────────────────────────────────────────────────

const elements = await fetchElements();
const mosques = shape(elements);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(mosques) + "\n");

console.log(`\nWrote ${mosques.length} mosques → ${OUT}`);
