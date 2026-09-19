// Mosques per NRW city — hybrid data layer.
//
// ┌─ BASE (automatic, all of NRW) ────────────────────────────────────────┐
// │ src/data/mosques.osm.json is generated from OpenStreetMap by           │
// │ `node scripts/fetch-mosques.mjs` — 300+ mosques across ~38 cities,     │
// │ no API key, re-runnable anytime. This is what makes coverage scale:    │
// │ every city the app serves gets mosques with zero manual entry.         │
// └────────────────────────────────────────────────────────────────────────┘
// ┌─ OVERRIDES + CURATED (small, hand/imam-maintained) ───────────────────┐
// │ OSM is broad but messy: bad names ("DITB"), missing mosques, the odd   │
// │ non-Sunni entry. The two layers below fix that WITHOUT re-touching the  │
// │ generated file:                                                        │
// │   • OVERRIDES — patch/rename/hide a specific OSM entry by its id        │
// │   • CURATED   — add mosques OSM is missing                             │
// │ Both live in shared/mosques-curated.ts, shared with the mobile app.    │
// └────────────────────────────────────────────────────────────────────────┘
//
// We deliberately do NOT store prayer/jamāʿa or Jumuʿa times here: the app
// already computes prayer times, and Jumuʿa times shift constantly — not worth
// maintaining. The per-mosque `info` field is for imam announcements / needs.
//
// Nothing here is `verified` until the imam confirms it → the UI shows
// "قيد المراجعة" until then.

import osmData from "./mosques.osm.json";
import { CURATED_MOSQUES, OSM_OVERRIDES } from "./mosques-curated";

export interface Mosque {
  id: string;
  cityId: string; // must match a City.id in src/lib/cities.ts
  name: string; // common / German name
  nameAr?: string; // Arabic name when known
  address?: string; // full street address; blank = not yet confirmed
  phone?: string; // "+49…"; optional
  /** A Google Maps share link (e.g. https://maps.app.goo.gl/…) pasted straight
   *  from the app. When present it wins over coords/address — the most reliable
   *  way to pin a mosque, no Places API or geocoding needed. */
  mapsLink?: string;
  latitude?: number;
  longitude?: number;
  /** Free-text announcement / community note from the imam (Arabic). Optional;
   *  shown in the mosque card when present. */
  info?: string;
  /** true only once the imam has confirmed this entry's accuracy. */
  verified?: boolean;
  /** Drop this OSM entry from the list (wrong/duplicate/not a Sunni jamāʿa). */
  hidden?: boolean;
}

// ── OVERRIDES + CURATED live in shared/mosques-curated.ts ───────────────
// The same layer feeds the mobile app's Germany-wide locator, so a rename,
// a hide, or a mosque OSM is missing is fixed once for both. Here we only
// project the curated shape onto the website's Mosque (street + postcode +
// city → address, lat/lng → latitude/longitude).
const CURATED: Mosque[] = CURATED_MOSQUES.map((c) => ({
  id: c.id,
  cityId: c.cityId,
  name: c.name,
  nameAr: c.nameAr,
  address: [c.street, [c.postcode, c.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", "),
  phone: c.phone,
  latitude: c.lat,
  longitude: c.lng,
  info: c.info,
  verified: c.verified,
}));

// ── Merge: OSM (patched, minus hidden) + curated ───────────────────────
export const MOSQUES: Mosque[] = [
  ...(osmData as unknown as Mosque[])
    .map((m) => ({ ...m, ...OSM_OVERRIDES[m.id] }))
    .filter((m) => !m.hidden),
  ...CURATED,
];

/** Mosques for a city — alphabetical by name. */
export function mosquesForCity(cityId: string): Mosque[] {
  return MOSQUES.filter((m) => m.cityId === cityId).sort((a, b) =>
    a.name.localeCompare(b.name, "de"),
  );
}

/** A Google Maps deep link. Priority: a pasted share link → exact coordinates →
 *  a text search of name + address. No Places API needed — the text search
 *  lands on the mosque the same way the Maps search box does. Works on web and
 *  opens the native Maps app on mobile. */
export function mapsUrl(m: Mosque): string {
  if (m.mapsLink) return m.mapsLink;
  if (m.latitude != null && m.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`;
  }
  const q = encodeURIComponent([m.name, m.address].filter(Boolean).join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
