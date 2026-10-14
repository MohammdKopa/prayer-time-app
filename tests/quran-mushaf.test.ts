import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { SURAHS } from "@/lib/quran/meta";
import {
  mushafShellHtml,
  pageContentHtml,
} from "@/lib/quran/mushaf-html";
import {
  PAGE_COUNT,
  indexOfRef,
  pageInfo,
  pageOf,
  pageRange,
  quarterMarksOn,
  refOfIndex,
} from "@/lib/quran/pages";
import { AYAT } from "@/lib/quran/text";
import { splitBasmala } from "@/lib/quran/text-utils";

// The reader shows the Madani mushaf page by page. Two things must hold: the
// pages are the printed ones (same page numbers as the Madinah print), and
// what a page shows is AYAT verbatim — nothing dropped, nothing doubled.

const xml = readFileSync(
  path.resolve(__dirname, "../mobile/src/lib/quran/source/tanzil-quran-data.xml"),
  "utf8",
);

describe("mushaf pages", () => {
  it("are the 604 Madani pages, as Tanzil lists them", () => {
    const pages = [...xml.matchAll(/<page index="(\d+)" sura="(\d+)" aya="(\d+)"/g)];
    expect(PAGE_COUNT).toBe(604);
    expect(pages.length).toBe(604);
    for (const [, p, s, a] of pages) {
      const ref = { surah: Number(s), ayah: Number(a) };
      expect(pageRange(Number(p)).start).toBe(indexOfRef(ref));
      expect(pageOf(ref)).toBe(Number(p));
    }
  });

  it("cover every āyah exactly once, in order", () => {
    let next = 0;
    for (let p = 1; p <= PAGE_COUNT; p++) {
      const { start, end } = pageRange(p);
      expect(start).toBe(next);
      expect(end).toBeGreaterThan(start);
      next = end;
    }
    expect(next).toBe(AYAT.length);
  });

  it("find the page of well-known āyāt", () => {
    expect(pageOf({ surah: 1, ayah: 1 })).toBe(1);
    expect(pageOf({ surah: 2, ayah: 1 })).toBe(2);
    expect(pageOf({ surah: 2, ayah: 255 })).toBe(42);
    expect(pageOf({ surah: 18, ayah: 1 })).toBe(293);
    expect(pageOf({ surah: 36, ayah: 1 })).toBe(440);
    expect(pageOf({ surah: 67, ayah: 1 })).toBe(562);
    expect(pageOf({ surah: 114, ayah: 6 })).toBe(604);
  });

  it("map offsets to sūrah and āyah and back", () => {
    for (let i = 0; i < AYAT.length; i += 37) expect(indexOfRef(refOfIndex(i))).toBe(i);
    expect(refOfIndex(0)).toEqual({ surah: 1, ayah: 1 });
    expect(refOfIndex(AYAT.length - 1)).toEqual({ surah: 114, ayah: 6 });
  });

  it("head each page with its juzʾ and sūrahs", () => {
    expect(pageInfo(1)).toMatchObject({ juz: 1, hizb: 1, surahs: [1] });
    expect(pageInfo(22).juz).toBe(2); // 2:142 opens juzʾ 2 on page 22
    expect(pageInfo(411).surahs).toEqual([31]);
    expect(pageInfo(604).surahs).toEqual([112, 113, 114]);
    expect(pageInfo(604).juz).toBe(30);
  });

  it("place the 239 quarter marks after 1:1 on the pages that hold them", () => {
    let count = 0;
    for (let p = 1; p <= PAGE_COUNT; p++) {
      const { start, end } = pageRange(p);
      for (const m of quarterMarksOn(p)) {
        expect(m.index).toBeGreaterThanOrEqual(start);
        expect(m.index).toBeLessThan(end);
        count++;
      }
    }
    expect(count).toBe(239);
  });
});

describe("mushaf page html", () => {
  const unescape = (h: string) =>
    h.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  /** The text of every āyah span on a page, in order. */
  const ayahTexts = (html: string) =>
    [...html.matchAll(/<span class="a[^"]*" data-k="(\d+):(\d+)">([\s\S]*?)<\/span><span class="n">/g)].map(
      ([, s, a, inner]) => ({
        surah: Number(s),
        ayah: Number(a),
        text: unescape(inner.replace(/<[^>]+>/g, "")),
      }),
    );

  for (const tajweed of [false, true]) {
    it(`shows every āyah of all 604 pages verbatim (tajweed ${tajweed ? "on" : "off"})`, () => {
      const opts = { tajweed, marked: new Set<string>() };
      let i = 0;
      for (let p = 1; p <= PAGE_COUNT; p++) {
        const html = pageContentHtml(p, opts);
        for (const a of ayahTexts(html)) {
          expect(refOfIndex(i)).toEqual({ surah: a.surah, ayah: a.ayah });
          const raw = AYAT[i];
          // The basmala of a sūrah's first āyah is shown above it, once.
          const { basmala, text } = splitBasmala(a.surah, a.ayah, raw);
          expect(a.text).toBe(text);
          if (basmala) expect(html).toContain(`<div class="bs">${basmala}</div>`);
          i++;
        }
      }
      expect(i).toBe(AYAT.length);
    });
  }

  it("opens each sūrah with its name band where it starts", () => {
    const html = pageContentHtml(411, { tajweed: false, marked: new Set() });
    expect(html).toContain(`سورة ${SURAHS[30].name}`);
    expect(pageContentHtml(604, { tajweed: false, marked: new Set() }).match(/class="sh"/g)?.length).toBe(3);
  });

  it("marks bookmarked āyāt", () => {
    const html = pageContentHtml(411, { tajweed: false, marked: new Set(["31:6"]) });
    expect(html).toContain('class="a m" data-k="31:6"');
    expect(html).not.toContain('class="a m" data-k="31:7"');
  });

  it("is a document that loads nothing from the network", () => {
    const html = mushafShellHtml({
      startPage: 411,
      fontSize: 26,
      prefilled: new Map([[411, pageContentHtml(411, { tajweed: true, marked: new Set() })]]),
      marked: [],
      fontSrc: "url(data:font/ttf;base64,AAAA)",
      colors: { bg: "#000", text: "#fff", gold: "#d9b871", soft: "#888", line: "#222", wash: "#111", raised: "#0a2117" },
    });
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toMatch(/<(img|link|iframe)/);
    expect(html.match(/<section class="pg"/g)?.length).toBe(604);
  });
});
