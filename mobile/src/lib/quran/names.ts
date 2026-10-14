import type { Locale } from "@/lib/i18n";

import type { SurahMeta } from "./meta";

/** The sūrah's name as the reader's language would say it. Tanzil supplies
 *  Arabic, a transliteration and an English meaning; German and Turkish
 *  readers know the sūrahs by their transliterated names. */
export function surahTitle(s: SurahMeta, locale: Locale): string {
  if (locale === "ar") return s.name;
  if (locale === "en") return `${s.transliteration} · ${s.english}`;
  return s.transliteration;
}
