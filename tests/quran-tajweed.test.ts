import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { SURAHS as SURAH_TABLE } from "@/lib/quran/meta";
import { TAJWEED, TAJWEED_RULES, type TajweedRule } from "@/lib/quran/tajweed";
import { AYAT } from "@/lib/quran/text";

// The tajweed colours were computed on a 2017 copy of the Tanzil text and
// remapped onto the text the app ships (scripts/build-tajweed.py, which
// already refuses any span whose letters changed). These tests check the
// result independently: every span must sit on the letters its rule is about.
// A drifted offset lands on the wrong letter and fails here.

const SOURCE = path.resolve(__dirname, "../mobile/src/lib/quran/source");
const sha256 = (file: string) =>
  createHash("sha256").update(readFileSync(path.join(SOURCE, file))).digest("hex");

/** Base letters of a span, without marks. */
const letters = (s: string) => [...s].filter((c) => /[ء-يٱ]/.test(c)).join("");

function* spans(): Generator<{ rule: TajweedRule; text: string; ayah: number }> {
  for (let i = 0; i < TAJWEED.length; i++) {
    const row = TAJWEED[i];
    for (let k = 0; k < row.length; k += 3) {
      yield { rule: TAJWEED_RULES[row[k]], text: AYAT[i].slice(row[k + 1], row[k + 2]), ayah: i };
    }
  }
}

describe("tajweed data", () => {
  it("comes from the pinned sources", () => {
    expect(sha256("cpfair-tajweed-hafs.json")).toBe(
      "7e058d6e0c928a04a97f9496a7ea84d8e9303bbe4719b78dfacc69d6cce21b22",
    );
    expect(sha256("cpfair-tanzil-uthmani-2017.txt")).toBe(
      "abe6447a5d29bb126383ba9120628060cf96dc9ef5b402a506fc251f6ed0b9a2",
    );
  });

  it("has one row per āyah and every span inside its āyah, in order", () => {
    expect(TAJWEED.length).toBe(AYAT.length);
    let count = 0;
    TAJWEED.forEach((row, i) => {
      expect(row.length % 3).toBe(0);
      for (let k = 0; k < row.length; k += 3) {
        const [rule, start, end] = [row[k], row[k + 1], row[k + 2]];
        expect(rule).toBeLessThan(TAJWEED_RULES.length);
        expect(start).toBeGreaterThanOrEqual(0);
        expect(end).toBeGreaterThan(start);
        expect(end).toBeLessThanOrEqual(AYAT[i].length);
        if (k > 0) expect(start).toBeGreaterThanOrEqual(row[k - 2]);
        count++;
      }
    });
    expect(count).toBe(60057);
  });

  it("puts every rule on the letters it is about", () => {
    const expectLetters: Partial<Record<TajweedRule, RegExp>> = {
      hamzat_wasl: /^ٱ$/,
      lam_shamsiyyah: /^ل$/,
      ghunnah: /^[نم]$/,
      qalqalah: /^[قطبجد]$/,
      ikhfa_shafawi: /^مب$/,
      idghaam_shafawi: /^مم$/,
      iqlab: /ب$/,
      // A madd on a dagger alif is carried by a tatweel (ـٰ).
      madd_246: /[اويـ]|^$/,
    };
    const wrong: string[] = [];
    for (const { rule, text, ayah } of spans()) {
      const re = expectLetters[rule];
      if (re && !re.test(letters(text))) wrong.push(`${rule} @${ayah}: ${text}`);
    }
    expect(wrong).toEqual([]);
  });

  it("never colours only a space or a pause mark", () => {
    for (const { rule, text } of spans()) {
      expect(text.replace(/[\sۖ-۞۩]/g, "").length, rule).toBeGreaterThan(0);
    }
  });

  it("offsets are code points and code units alike (no astral characters)", () => {
    for (const a of AYAT) expect([...a].length).toBe(a.length);
  });
});

// Offset of each sūrah's first āyah in AYAT, by sūrah number.
const SURAHS_START: Record<number, number> = Object.fromEntries(
  SURAH_TABLE.map((s) => [s.index, s.start]),
);

describe("tajweed font", () => {
  it("embeds the installed Amiri Quran font byte for byte", async () => {
    const { readFileSync } = await import("node:fs");
    const { AMIRI_QURAN_TTF_BASE64 } = await import("@/lib/quran/font-data");
    const ttf = readFileSync(
      "mobile/node_modules/@expo-google-fonts/amiri-quran/400Regular/AmiriQuran_400Regular.ttf",
    );
    // A mismatch means the font package changed: run scripts/build-quran-font.mts.
    expect(AMIRI_QURAN_TTF_BASE64 === ttf.toString("base64")).toBe(true);
  });
});

describe("tajweed segments", () => {
  it("re-join to the exact āyah text, for every āyah, with and without the basmala header", async () => {
    const { tajweedSegments } = await import("@/lib/quran/tajweed-colors");
    const { SURAHS } = await import("@/lib/quran/meta");
    const { splitBasmala } = await import("@/lib/quran/text-utils");
    AYAT.forEach((text, i) => {
      expect(tajweedSegments(i, text).map((s) => s.text).join("")).toBe(text);
    });
    for (const s of SURAHS) {
      const text = AYAT[s.start];
      const { basmala, text: rest } = splitBasmala(s.index, 1, text);
      if (!basmala) continue;
      const from = text.length - rest.length;
      expect(tajweedSegments(s.start, text, from).map((x) => x.text).join("")).toBe(rest);
    }
  });

  it("colours only the source letter where two letters meet (ikhfāʾ, idghām, iqlāb)", async () => {
    const { tajweedSegments } = await import("@/lib/quran/tajweed-colors");
    const ref = (s: number, a: number) => AYAT[SURAHS_START[s] + a - 1];
    const coloured = (i: number) =>
      tajweedSegments(i, AYAT[i]).filter((s) => s.family === "ghunna" || s.family === "silent");
    // No ghunna-family colour may run across a space into the next word.
    AYAT.forEach((_, i) => {
      for (const seg of coloured(i)) expect(seg.text.includes(" "), `${i}: ${seg.text}`).toBe(false);
    });
    // 2:3 يُنفِقُونَ: the nūn alone is coloured, not the fāʾ after it.
    const yunfiqun = tajweedSegments(SURAHS_START[2] + 2, ref(2, 3)).find((s) => s.text.startsWith("نف") || s.text === "ن");
    expect(yunfiqun?.text).toBe("ن");
  });

  it("greys the merged nūn of an idghām with ghunna and greens the letter it merges into", async () => {
    const { tajweedSegments } = await import("@/lib/quran/tajweed-colors");
    // 31:6 وَمِنَ ٱلنَّاسِ مَن يَشۡتَرِي — checked against the Dar al-Maʿrifa print.
    const i = SURAHS_START[31] + 5;
    const segs = tajweedSegments(i, AYAT[i]);
    const at = segs.findIndex((s) => s.family === "silent" && s.text === "ن");
    expect(at).toBeGreaterThan(0);
    expect(segs[at - 1].text.endsWith("مَ")).toBe(true);
    expect(segs[at + 1]).toEqual({ text: " ", family: null });
    expect(segs[at + 2].family).toBe("ghunna");
    expect(segs[at + 2].text.startsWith("ي")).toBe(true);
  });

  it("colours the small wāw/yāʾ of a madd alone, not the hāʾ before it", async () => {
    const { tajweedSegments } = await import("@/lib/quran/tajweed-colors");
    // 2:255 … عِندَهُۥٓ إِلَّا: madd munfaṣil on the small wāw.
    const i = SURAHS_START[2] + 254;
    const seg = tajweedSegments(i, AYAT[i]).find((s) => s.family && s.text.includes("ۥ"));
    expect(seg?.family).toBe("maddRequired");
    expect(seg?.text.startsWith("ۥ")).toBe(true);
  });

  it("starts a madd on the madd letter, not on the letter whose vowel precedes it", async () => {
    const { tajweedSegments } = await import("@/lib/quran/tajweed-colors");
    // 2:255 … إِلَّا بِمَا شَآءَ: the madd muttaṣil is on آ, the shīn stays plain.
    const i = SURAHS_START[2] + 254;
    const text = AYAT[i];
    const at = text.indexOf("شَآ"); // شَآ, alif + maddah
    expect(at).toBeGreaterThan(0);
    // Family of the segment covering each character offset.
    const familyAt = (pos: number) => {
      let o = 0;
      for (const seg of tajweedSegments(i, text)) {
        if (pos < o + seg.text.length) return seg.family;
        o += seg.text.length;
      }
      return null;
    };
    expect(familyAt(at)).toBeNull(); // ش
    expect(familyAt(at + 2)).toBe("maddRequired"); // ا
    expect(familyAt(at + 3)).toBe("maddRequired"); // its maddah
  });

  it("leaves the natural madd (2) plain, as the printed mushafs do", async () => {
    const { tajweedSegments } = await import("@/lib/quran/tajweed-colors");
    const all = AYAT.flatMap((t, i) => tajweedSegments(i, t)).map((s) => s.family);
    expect(all).not.toContain("maddNatural");
  });

  it("colours al-Fātiḥa 1:1 as the printed mushaf does", async () => {
    const { tajweedSegments } = await import("@/lib/quran/tajweed-colors");
    const fams = tajweedSegments(0, AYAT[0]).filter((s) => s.family).map((s) => s.family);
    // hamzat al-waṣl of ٱللَّه, ٱلرَّحْمَـٰن, ٱلرَّحِيم; lām shamsiyya; the madd
    // of ـٰ; the madd ʿāriḍ at the end.
    expect(fams).toContain("silent");
    expect(fams[fams.length - 1]).toBe("maddLong");
  });
});
