import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { JUZ_STARTS, SAJDAS, SURAHS } from "@/lib/quran/meta";
import { AYAT } from "@/lib/quran/text";
import {
  BASMALA,
  ayahIndex,
  foldArabic,
  juzOf,
  parseAyahRef,
  searchSurahs,
  splitBasmala,
} from "@/lib/quran/text-utils";

// The Quran text is the one thing this app must never get wrong by a single
// character. These tests pin the Tanzil file as downloaded and prove the
// module the app ships is that file, line for line.

const SOURCE = path.resolve(__dirname, "../mobile/src/lib/quran/source");
// tanzil.net, Uthmani v1.1, "txt-2" with pause marks, sajdah signs and
// superscript alif tatweel, downloaded 2026-10-14. Change only together with a
// new download, and say so in the commit.
const TEXT_SHA256 = "7f30c647331a61100ebf24a80507dc0fcdd9f2df97f1312b5b2dfcb982a7f326";
const META_SHA256 = "8867c1d88191472adec9db694b3cd9f135b1a2ef580574d32cf888dcb22c5c7a";

const sha256 = (file: string) =>
  createHash("sha256").update(readFileSync(path.join(SOURCE, file))).digest("hex");

describe("Quran text", () => {
  it("the Tanzil source files are the pinned downloads", () => {
    expect(sha256("tanzil-uthmani-1.1.txt")).toBe(TEXT_SHA256);
    expect(sha256("tanzil-quran-data.xml")).toBe(META_SHA256);
  });

  it("text.ts is the source, āyah for āyah, in order", () => {
    const lines = readFileSync(path.join(SOURCE, "tanzil-uthmani-1.1.txt"), "utf8")
      .split("\n")
      .filter((l) => l !== "" && !l.startsWith("#"));
    expect(AYAT.length).toBe(6236);
    expect(lines.length).toBe(6236);
    lines.forEach((line, i) => {
      const [surah, ayah, ...rest] = line.split("|");
      expect(AYAT[ayahIndex(Number(surah), Number(ayah))]).toBe(rest.join("|"));
      expect(ayahIndex(Number(surah), Number(ayah))).toBe(i);
    });
  });

  it("the sūrah table covers every āyah exactly once", () => {
    expect(SURAHS.length).toBe(114);
    let next = 0;
    for (const s of SURAHS) {
      expect(s.start).toBe(next);
      next += s.ayahs;
    }
    expect(next).toBe(6236);
    expect(SURAHS[0].name).toBe("الفاتحة");
    expect(SURAHS[113].name).toBe("الناس");
  });

  it("juzʾ and sajda tables point at real āyāt", () => {
    expect(JUZ_STARTS.length).toBe(30);
    expect(SAJDAS.length).toBe(15);
    for (const ref of [...JUZ_STARTS, ...SAJDAS]) {
      expect(() => ayahIndex(ref.surah, ref.ayah)).not.toThrow();
    }
    expect(juzOf(1, 1)).toBe(1);
    expect(juzOf(2, 141)).toBe(1);
    expect(juzOf(2, 142)).toBe(2);
    expect(juzOf(114, 6)).toBe(30);
  });
});

describe("basmala", () => {
  it("opens al-Fātiḥa as its first āyah", () => {
    expect(AYAT[0]).toBe(BASMALA);
    expect(splitBasmala(1, 1, AYAT[0])).toEqual({ basmala: null, text: BASMALA });
  });

  it("is lifted off the first āyah of the 112 sūrahs that carry it, and nothing else is touched", () => {
    for (const s of SURAHS) {
      if (s.index === 1 || s.index === 9) continue;
      const text = AYAT[s.start];
      const { basmala, text: rest } = splitBasmala(s.index, 1, text);
      expect(basmala, `sūrah ${s.index}`).not.toBeNull();
      // 95 and 97 carry a shadda on the bāʾ; every other sūrah the 1:1 form.
      if (s.index === 95 || s.index === 97) expect(basmala).toBe("بّ" + BASMALA.slice(1));
      else expect(basmala).toBe(BASMALA);
      // Re-joined, it is the original line exactly.
      expect(`${basmala} ${rest}`).toBe(text);
      expect(rest.length).toBeGreaterThan(0);
    }
  });

  it("at-Tawba has none, and 27:30 keeps it mid-āyah", () => {
    expect(splitBasmala(9, 1, AYAT[ayahIndex(9, 1)]).basmala).toBeNull();
    const naml = AYAT[ayahIndex(27, 30)];
    expect(naml.includes(BASMALA)).toBe(true);
    expect(splitBasmala(27, 30, naml)).toEqual({ basmala: null, text: naml });
  });
});

describe("search", () => {
  it("finds a sūrah by number, Arabic name or transliteration", () => {
    expect(searchSurahs("18")[0].index).toBe(18);
    expect(searchSurahs("2:255")[0].index).toBe(2);
    expect(searchSurahs("الكهف")[0].index).toBe(18);
    expect(searchSurahs("كهف")[0].index).toBe(18);
    expect(searchSurahs("kahf")[0].index).toBe(18);
    expect(searchSurahs("Al-Kahf")[0].index).toBe(18);
    expect(searchSurahs("yasin").map((s) => s.index)).toContain(36);
    expect(searchSurahs("115")).toEqual([]);
  });

  it("folds tashkīl and alif forms only for matching", () => {
    expect(foldArabic("عِمْرَانَ")).toBe("عمران");
    expect(foldArabic("ٱلْكَهْف")).toBe("كهف");
    expect(searchSurahs("آل عمران")[0].index).toBe(3);
    expect(searchSurahs("faatiha")[0].index).toBe(1);
    expect(searchSurahs("fatiha")[0].index).toBe(1);
    expect(parseAyahRef("2:255")).toEqual({ surah: 2, ayah: 255 });
    expect(parseAyahRef("2:287")).toBeNull();
  });
});
