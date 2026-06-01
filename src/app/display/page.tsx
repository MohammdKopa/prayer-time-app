import type { Metadata } from "next";
import { DisplayClient } from "@/components/DisplayClient";
import { DEFAULT_CITY, findCity } from "@/lib/cities";

export const metadata: Metadata = {
  title: "شاشة المسجد — أوقات الصلاة",
  // A wall display has no business being indexed.
  robots: { index: false, follow: false },
};

// The mosque this plasma lives in — Masjid ʿIbād al-Raḥmān, Marl.
const DEFAULT_TITLE = "مسجد عباد الرحمن";

// Jumuʿa is a FIXED congregation time the mosque sets (not astronomically
// computed) — only constraint is that it falls after Dhuhr. Default 14:00,
// overridable live via ?jumua=HH:MM so the imam's time can change without code.
const DEFAULT_JUMUA = "14:00";

// Full-screen plasma/TV display for a mosque. Optional query params:
//   ?city=<id>      pick a city (default: Marl)
//   ?title=<text>   override the header (default: Masjid ʿIbād al-Raḥmān)
//   ?jumua=HH:MM    Friday congregation time (default: 14:00)
//   ?hijri=±N       nudge the Hijri date to match local moon sighting (−2..2)
export default async function DisplayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cityParam = typeof sp.city === "string" ? sp.city : undefined;
  const city = (cityParam ? findCity(cityParam) : undefined) ?? DEFAULT_CITY;
  const title = typeof sp.title === "string" ? sp.title : DEFAULT_TITLE;
  const jumuaParam = typeof sp.jumua === "string" ? sp.jumua : "";
  const jumua = /^\d{1,2}:\d{2}$/.test(jumuaParam) ? jumuaParam : DEFAULT_JUMUA;
  const hijriRaw = Number(typeof sp.hijri === "string" ? sp.hijri : 0);
  const hijriOffset = Number.isFinite(hijriRaw)
    ? Math.max(-2, Math.min(2, Math.trunc(hijriRaw)))
    : 0;

  return (
    <DisplayClient
      city={city}
      title={title}
      jumua={jumua}
      hijriOffset={hijriOffset}
    />
  );
}
