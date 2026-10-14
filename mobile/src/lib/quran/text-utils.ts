import { JUZ_STARTS, SURAHS, type AyahRef, type SurahMeta } from "./meta";

// Lookups over the Quran text. Pure functions, no React, so tests/quran.test.ts
// can hold them to the source file.
//
// Nothing here changes the text. `splitBasmala` only decides where a line
// break goes: Tanzil carries the basmala inside the first āyah of 112 sūrahs,
// a printed mushaf sets it on its own line above the sūrah, and so does the
// reader. The characters shown are the characters in AYAT, in order.

/** The basmala exactly as it opens 1:1 in the Tanzil text. Written as code
 *  points on purpose: typed by hand, the shadda/fatḥa order came out different
 *  from Tanzil's and the visually identical string never matched. */
export const BASMALA =
  "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

/** At-Tīn (95) and al-Qadr (97) carry a shadda on the bāʾ in Tanzil, as the
 *  Madani mushaf prints them. Same words, different characters, so the header
 *  shows whichever form that sūrah's own text has. */
const BASMALA_SHADDA = "بّ" + BASMALA.slice(1);

/** Al-Fātiḥa counts the basmala as its first āyah; at-Tawba has none. */
const NO_SEPARATE_BASMALA = new Set([1, 9]);

export function surahMeta(surah: number): SurahMeta {
  const meta = SURAHS[surah - 1];
  if (!meta) throw new RangeError(`No sūrah ${surah}`);
  return meta;
}

export function ayahIndex(surah: number, ayah: number): number {
  const meta = surahMeta(surah);
  if (ayah < 1 || ayah > meta.ayahs) throw new RangeError(`No āyah ${surah}:${ayah}`);
  return meta.start + ayah - 1;
}

/**
 * The basmala line to show above a sūrah, and the first āyah without it.
 * For 1 and 9, and for any āyah but the first, `basmala` is null and the text
 * is returned untouched.
 */
export function splitBasmala(
  surah: number,
  ayah: number,
  text: string,
): { basmala: string | null; text: string } {
  if (ayah !== 1 || NO_SEPARATE_BASMALA.has(surah)) return { basmala: null, text };
  for (const form of [BASMALA, BASMALA_SHADDA]) {
    if (text.startsWith(form + " ")) {
      return { basmala: form, text: text.slice(form.length + 1) };
    }
  }
  return { basmala: null, text };
}

/** The juzʾ (1–30) an āyah belongs to. */
export function juzOf(surah: number, ayah: number): number {
  const at = ayahIndex(surah, ayah);
  let juz = 1;
  for (const start of JUZ_STARTS) {
    if (ayahIndex(start.surah, start.ayah) <= at) juz = start.index;
    else break;
  }
  return juz;
}

export function juzStart(juz: number): AyahRef {
  const start = JUZ_STARTS[juz - 1];
  if (!start) throw new RangeError(`No juzʾ ${juz}`);
  return { surah: start.surah, ayah: start.ayah };
}

/** Folds Arabic for matching: drops tashkīl and Quranic marks, unifies alif
 *  forms, tāʾ marbūṭa and alif maqṣūra. Used for search only, never shown. */
export function foldArabic(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/^ال/, "")
    .trim();
}

function foldLatin(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
    // Tanzil spells long vowels doubled ("Yaseen", "Al-Faatiha"); people type
    // them single.
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/aa/g, "a");
}

/**
 * Sūrahs matching a query: a number ("18", or "2:255" for the sūrah part),
 * an Arabic name with or without "ال" and tashkīl, or a transliterated or
 * English name, loosely ("kahf", "Al-Kahf", "the cave").
 */
export function searchSurahs(query: string): SurahMeta[] {
  const q = query.trim();
  if (q === "") return [...SURAHS];
  const num = q.match(/^(\d{1,3})(?::\d+)?$/);
  if (num) {
    const n = Number(num[1]);
    return n >= 1 && n <= 114 ? [SURAHS[n - 1]] : [];
  }
  const ar = foldArabic(q);
  const lat = foldLatin(q.replace(/^(al|an|ar|as|at|ash|ad|az)[- ]/i, ""));
  return SURAHS.filter((s) => {
    if (ar && /[؀-ۿ]/.test(q)) return foldArabic(s.name).includes(ar);
    if (!lat) return false;
    return (
      foldLatin(s.transliteration).includes(lat) || foldLatin(s.english).includes(lat)
    );
  });
}

/** Parses "2:255" into a reference, if both numbers exist. */
export function parseAyahRef(query: string): AyahRef | null {
  const m = query.trim().match(/^(\d{1,3})\s*[:.]\s*(\d{1,3})$/);
  if (!m) return null;
  const surah = Number(m[1]);
  const ayah = Number(m[2]);
  const meta = SURAHS[surah - 1];
  if (!meta || ayah < 1 || ayah > meta.ayahs) return null;
  return { surah, ayah };
}
