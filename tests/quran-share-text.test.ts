import { describe, expect, it } from "vitest";

import { SURAHS } from "@/lib/quran/meta";
import { ayahShareText } from "@/lib/quran/share-text";
import { AYAT } from "@/lib/quran/text";

describe("ayahShareText", () => {
  it("carries the āyah verbatim, the ﴿n﴾ marker and the reference", () => {
    const text = ayahShareText({ surah: 2, ayah: 255 });
    const ayah = AYAT[SURAHS[1]!.start + 254]!;
    expect(text.startsWith(ayah + " ﴿٢٥٥﴾\n")).toBe(true);
    expect(text.endsWith(`— ${SURAHS[1]!.name} 2:255`)).toBe(true);
  });

  it("keeps the basmala in āyah 1 as stored", () => {
    const text = ayahShareText({ surah: 112, ayah: 1 });
    expect(text.startsWith(AYAT[SURAHS[111]!.start]!)).toBe(true);
  });

  it("rejects an āyah that does not exist", () => {
    expect(() => ayahShareText({ surah: 1, ayah: 8 })).toThrow(RangeError);
  });
});
