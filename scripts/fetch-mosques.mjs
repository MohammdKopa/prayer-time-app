// Generate the OSM base layer of NRW mosques.
//
//   node scripts/fetch-mosques.mjs
//
// Queries the free OpenStreetMap Overpass API for every Muslim place of worship
// in North Rhine-Westphalia, maps each to one of the cities the app serves
// (src/lib/cities.ts), and writes src/data/mosques.osm.json.
//
// No API key, no billing. Re-run anytime to refresh. The curated overrides in
// src/data/mosques.ts (better names, Arabic names, hidden entries, jamāʿa
// times) are applied on top at runtime — this file never touches them.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "src", "data", "mosques.osm.json");

// ── 1. Read the served cities straight out of cities.ts ────────────────
const citiesSrc = readFileSync(join(ROOT, "src", "lib", "cities.ts"), "utf8");
const CITY_RE =
  /id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*population:\s*\d+,\s*latitude:\s*([\d.]+),\s*longitude:\s*([\d.]+)/g;
const CITIES = [...citiesSrc.matchAll(CITY_RE)].map((m) => ({
  id: m[1],
  name: m[2],
  lat: parseFloat(m[3]),
  lng: parseFloat(m[4]),
}));
if (CITIES.length === 0) throw new Error("Parsed 0 cities from cities.ts");
console.log(`Serving ${CITIES.length} cities.`);

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss")
    .replace(/[^a-z]/g, "");
const firstToken = (s) => norm((s || "").split(/[\s-]/)[0]);

// name-first-token → cityId (e.g. "mulheim" → "muelheim")
const byFirstToken = new Map();
for (const c of CITIES) byFirstToken.set(firstToken(c.name), c.id);

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371, d = (x) => (x * Math.PI) / 180;
  const dLat = d(bLat - aLat), dLng = d(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(d(aLat)) * Math.cos(d(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// addr:city (preferred) → served cityId; else nearest served city within 7 km.
function resolveCity(tags, lat, lng) {
  const ac = tags["addr:city"];
  if (ac) {
    const id = byFirstToken.get(firstToken(ac));
    if (id) return id;
    // addr:city is set but it's a town we don't serve → not ours
    return null;
  }
  if (lat == null || lng == null) return null;
  let best = null, bestKm = Infinity;
  for (const c of CITIES) {
    const km = haversineKm(lat, lng, c.lat, c.lng);
    if (km < bestKm) { bestKm = km; best = c.id; }
  }
  return bestKm <= 7 ? best : null;
}

// ── 2. Query Overpass ──────────────────────────────────────────────────
const query = `[out:json][timeout:180];
area["ISO3166-2"="DE-NW"]["admin_level"="4"]->.nrw;
nwr["amenity"="place_of_worship"]["religion"="muslim"](area.nrw);
out center tags;`;

console.log("Querying Overpass…");
const res = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "prayer-time-app/1.0 (NRW mosque locator)",
  },
  body: "data=" + encodeURIComponent(query),
});
if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
const { elements } = await res.json();
console.log(`Overpass returned ${elements.length} elements.`);

// ── 3. Shape + map to cities ───────────────────────────────────────────
function addressOf(t) {
  const line1 = [t["addr:street"], t["addr:housenumber"]]
    .filter(Boolean)
    .join(" ");
  const line2 = [t["addr:postcode"], t["addr:city"]].filter(Boolean).join(" ");
  return [line1, line2].filter(Boolean).join(", ") || undefined;
}

const out = [];
const perCity = {};
for (const el of elements) {
  const t = el.tags || {};
  if (!t.name) continue; // skip unnamed prayer rooms
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  const cityId = resolveCity(t, lat, lng);
  if (!cityId) continue; // not in a served city

  out.push({
    id: `osm-${el.type}-${el.id}`,
    cityId,
    name: t.name,
    nameAr: t["name:ar"] || undefined,
    address: addressOf(t),
    latitude: lat,
    longitude: lng,
  });
  perCity[cityId] = (perCity[cityId] || 0) + 1;
}

out.sort((a, b) => a.cityId.localeCompare(b.cityId) || a.name.localeCompare(b.name, "de"));
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");

console.log(`\nWrote ${out.length} mosques across ${Object.keys(perCity).length} served cities → ${OUT}`);
console.log(
  "Per city: " +
    Object.entries(perCity).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}:${n}`).join(", "),
);
const empty = CITIES.filter((c) => !perCity[c.id]).map((c) => c.id);
if (empty.length) console.log(`No OSM mosques for: ${empty.join(", ")}`);
