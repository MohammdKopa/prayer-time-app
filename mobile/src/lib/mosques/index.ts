// Germany-wide mosque locator data. Three layers, all bundled — the app
// makes no network request for this (see docs/privacy-policy.md):
//
//   1. germany.json — OpenStreetMap (ODbL), via scripts/fetch-mosques-germany.mjs.
//   2. overture.json — Overture Maps places (CDLA-Permissive 2.0) that OSM
//      lacks, via scripts/fetch-mosques-overture.py (already deduped against 1).
//   3. shared/mosques-curated.ts — hand-maintained renames, hides and
//      additions, shared with the website. Wins over both.
//
// This module merges them once, then adds distance: haversine from
// wherever the app currently thinks the user is (mobile/src/lib/place-context.tsx).
//
// The JSON is loaded with a lazy `require` inside nearestMosques rather than
// a top-level import, so screens that never open the mosque locator (the
// Times screen, above all — it is the one screen opened every single time)
// never pull roughly 1,600 mosque records into their module graph.

import { CURATED_MOSQUES, OSM_OVERRIDES } from "@shared/mosques-curated";

export interface Mosque {
  id: string;
  /** Falls back through name → name:de → name:ar → name:tr → operator while
   *  the data is generated; null when OSM had none of those but did have an
   *  addr:city, which is still enough to show and navigate to. */
  name: string | null;
  /** Present only when OSM carried a name:ar tag. */
  nameAr?: string;
  lat: number;
  lng: number;
  city: string | null;
  /** Street + house number, when OSM had both. */
  street?: string;
}

export interface MosqueWithDistance extends Mosque {
  /** Great-circle distance from the query point, in metres. */
  distanceMeters: number;
}

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(s));
}

/** An Overture pin this close to a curated one is the same mosque. */
const CURATED_MATCH_M = 150;

let merged: Mosque[] | null = null;

function loadMosques(): Mosque[] {
  if (merged) return merged;
  const osm = require("./germany.json") as Mosque[];
  const patched: Mosque[] = [];
  for (const m of osm) {
    const o = OSM_OVERRIDES[m.id];
    if (!o) {
      patched.push(m);
      continue;
    }
    if (o.hidden) continue;
    patched.push({
      ...m,
      name: o.name ?? m.name,
      ...(o.nameAr ? { nameAr: o.nameAr } : {}),
    });
  }
  const curated: Mosque[] = CURATED_MOSQUES.map((c) => ({
    id: c.id,
    name: c.name,
    ...(c.nameAr ? { nameAr: c.nameAr } : {}),
    lat: c.lat,
    lng: c.lng,
    city: c.city,
    ...(c.street ? { street: c.street } : {}),
  }));
  // Overture is deduped against OSM at build time, but not against the
  // curated pins — do that here (three entries, trivial).
  const overture = (require("./overture.json") as Mosque[]).filter(
    (m) =>
      !curated.some(
        (c) => haversineMeters(c.lat, c.lng, m.lat, m.lng) <= CURATED_MATCH_M,
      ),
  );
  merged = [...patched, ...curated, ...overture];
  return merged;
}

/** The `limit` nearest mosques to a point, closest first. */
export function nearestMosques(
  lat: number,
  lng: number,
  limit = 25,
): MosqueWithDistance[] {
  const mosques = loadMosques();
  const withDistance: MosqueWithDistance[] = mosques.map((m) => ({
    ...m,
    distanceMeters: haversineMeters(lat, lng, m.lat, m.lng),
  }));
  withDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return withDistance.slice(0, limit);
}

export interface FormattedDistance {
  value: string;
  unit: "m" | "km";
}

/**
 * Splits a metre distance into a value + unit so the UI can localize both —
 * digits through toArabicIndic, and the unit through the strings table
 * (distanceMeters / distanceKm) rather than a hardcoded "m"/"km" in a
 * component.
 */
export function formatDistance(meters: number): FormattedDistance {
  if (meters < 1000) {
    return { value: String(Math.round(meters)), unit: "m" };
  }
  const km = meters / 1000;
  // One decimal below 10 km (e.g. "3.4"), whole numbers above (e.g. "42").
  const value = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return { value, unit: "km" };
}
