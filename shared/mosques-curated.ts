// Hand-maintained mosque layer — shared by the website and the mobile app.
//
// Both apps get their base data from OpenStreetMap (shared/mosques.osm.json
// for the NRW website list, mobile/src/lib/mosques/germany.json for the
// Germany-wide mobile locator). OSM is broad but messy: bad names ("DITB"),
// missing mosques, the odd non-Sunni entry. This file fixes that once, for
// both consumers, without re-touching either generated file:
//
//   • OSM_OVERRIDES — patch/rename/hide a specific OSM entry by its id. Both
//     fetch scripts mint ids the same way (`osm-<type>-<id>`), so one key
//     hits the same mosque in both datasets.
//   • CURATED_MOSQUES — mosques OSM is missing. Each needs coordinates so the
//     mobile locator can rank it by distance; pins come from the mosque's own
//     Mawaqit page or a Google Maps share link, never from geocoding a street.
//
// Nothing here is `verified` until the imam confirms it.

export interface OsmOverride {
  /** Drop this OSM entry (wrong/duplicate/not a Sunni jamāʿa). */
  hidden?: boolean;
  name?: string;
  nameAr?: string;
  phone?: string;
  /** Free-text announcement from the imam (Arabic). */
  info?: string;
  verified?: boolean;
}

export interface CuratedMosque {
  id: string;
  /** Website city id — must match a City.id in shared/cities.ts. */
  cityId: string;
  /** Common / German name. */
  name: string;
  nameAr?: string;
  /** Street + house number, e.g. "Heyerhoffstr. 152A". */
  street?: string;
  postcode?: string;
  /** Display city, e.g. "Marl". */
  city: string;
  lat: number;
  lng: number;
  phone?: string;
  info?: string;
  verified?: boolean;
}

// ── OSM_OVERRIDES — patch a specific OSM entry by its generated id ──────
// Find ids by name in either generated JSON after a regenerate.
export const OSM_OVERRIDES: Record<string, OsmOverride> = {
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

// ── CURATED_MOSQUES — mosques OSM is missing ────────────────────────────
export const CURATED_MOSQUES: CuratedMosque[] = [
  // Marl — OSM has none of these three
  {
    id: "marl-igmg-kuba",
    cityId: "marl",
    name: "IGMG Kuba Camii (Hüls)",
    nameAr: "جامع قُباء – IGMG (هولس)",
    street: "Sickingstr. 40",
    postcode: "45772",
    city: "Marl",
    // OSM building outline for Sickingstraße 40.
    lat: 51.6711,
    lng: 7.125,
  },
  {
    // Sheikh Ayman's mosque. Publishes its own times on Mawaqit:
    // https://mawaqit.net/en/ibad-al-rahman-moschee-msjd-bd-lrhmn-marl-45770-germany
    id: "marl-ibad-al-rahman",
    cityId: "marl",
    name: "Ibad Al-Rahman Moschee (arabisch)",
    nameAr: "مسجد عباد الرحمن",
    street: "Heyerhoffstr. 152A",
    postcode: "45770",
    city: "Marl",
    // Pin as set by the mosque on its Mawaqit page.
    lat: 51.6689,
    lng: 7.1264,
  },
  {
    // Official name مسجد الخضر / "El Khodr Moschee". Exact pin from the
    // Google Maps link Mohamed shared.
    id: "marl-el-khodr",
    cityId: "marl",
    name: "El Khodr Moschee (Drewer)",
    nameAr: "مسجد الخضر",
    street: "Bergstr. 156",
    postcode: "45770",
    city: "Marl",
    lat: 51.6609159,
    lng: 7.1126207,
  },
];
