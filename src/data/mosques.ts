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
// │ Both are where the imam's announcements (`info`) and `verified` live.  │
// └────────────────────────────────────────────────────────────────────────┘
//
// We deliberately do NOT store prayer/jamāʿa or Jumuʿa times here: the app
// already computes prayer times, and Jumuʿa times shift constantly — not worth
// maintaining. The per-mosque `info` field is for imam announcements / needs.
//
// Nothing here is `verified` until the imam confirms it → the UI shows
// "قيد المراجعة" until then.

import osmData from "./mosques.osm.json";

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

// ── OVERRIDES — patch a specific OSM entry by its generated id ──────────
// Find ids by name in src/data/mosques.osm.json after a regenerate.
const OVERRIDES: Record<string, Partial<Mosque>> = {
  // Marl — clean up what OSM has
  "osm-way-336507003": { hidden: true }, // Alevi-Bektaşi: theologically distinct, imam's call
  "osm-way-250110022": {
    name: "DITIB Yunus Emre Camii (Brassert)",
    nameAr: "جامع يونس إمره – ديتيب (براسرت)",
  },
  "osm-way-300417075": {
    name: "DITIB Fatih Camii (Marl-Hamm)",
    nameAr: "جامع الفاتح – ديتيب (مارل-هام)",
    phone: "+49 2365 23150",
  },
  "osm-way-303382998": {
    name: "Süleymaniye Camii (VIKZ)",
    nameAr: "جامع السليمانية – VIKZ",
  },
};

// ── CURATED — mosques OSM is missing (verified by hand / pending imam) ──
const CURATED: Mosque[] = [
  // Marl — OSM has neither of these three
  {
    id: "marl-igmg-kuba",
    cityId: "marl",
    name: "IGMG Kuba Camii (Hüls)",
    nameAr: "جامع قُباء – IGMG (هولس)",
    address: "Sickingstr. 40, 45772 Marl",
  },
  {
    id: "marl-ibad-al-rahman",
    cityId: "marl",
    name: "Ibad Al-Rahman Moschee (arabisch)",
    nameAr: "مسجد عباد الرحمن (عربي)",
    address: "Heyerhoffstr. 152A, 45770 Marl",
  },
  {
    // Mohamed's local mosque — official name مسجد الخضر / "El Khodr Moschee".
    // Exact pin from the Google Maps link he shared.
    id: "marl-el-khodr",
    cityId: "marl",
    name: "El Khodr Moschee (Drewer)",
    nameAr: "مسجد الخضر",
    address: "Bergstr. 156, 45770 Marl",
    latitude: 51.6609159,
    longitude: 7.1126207,
  },
];

// ── Merge: OSM (patched, minus hidden) + curated ───────────────────────
export const MOSQUES: Mosque[] = [
  ...(osmData as unknown as Mosque[])
    .map((m) => ({ ...m, ...OVERRIDES[m.id] }))
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
