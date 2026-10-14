import type { AyahRef } from "./meta";
import { AYAT } from "./text";
import { ayahIndex, surahMeta } from "./text-utils";

/** Western digits to Arabic-Indic, for the ﴿n﴾ marker. */
function arabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
}

/**
 * What copy and share send: the āyah exactly as AYAT stores it, its number in
 * ornate brackets, and on a new line the sūrah and reference. The Quran text
 * is never altered, trimmed or re-joined.
 */
export function ayahShareText(ref: AyahRef): string {
  const text = AYAT[ayahIndex(ref.surah, ref.ayah)];
  const meta = surahMeta(ref.surah);
  return `${text} ﴿${arabicDigits(ref.ayah)}﴾\n— ${meta.name} ${ref.surah}:${ref.ayah}`;
}
