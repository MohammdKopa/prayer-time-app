import { describe, expect, it } from "vitest";

import { PAGE_COUNT } from "@/lib/quran/pages";
import { parsePageQuery } from "@/lib/quran/text-utils";

describe("parsePageQuery", () => {
  it.each([
    ["p 411", 411],
    ["P411", 411],
    ["page 411", 411],
    ["PAGE   7", 7],
    ["s. 411", 411],
    ["S.12", 12],
    ["ص 411", 411],
    ["صفحة 411", 411],
    ["صفحة ٤١١", 411],
    ["ص ٦٠٤", 604],
    ["Seite 411", 411],
    ["sayfa 411", 411],
    ["Sayfa ۴۱۱", 411],
    ["  page 1  ", 1],
  ])("reads %s as page %i", (q, page) => {
    expect(parsePageQuery(q)).toBe(page);
  });

  it.each([
    "",
    "411",
    "2:255",
    "page",
    "page 0",
    "page 605",
    "page 4111",
    "page 4a",
    "page 1.5",
    "kahf",
    "p",
  ])("rejects %j", (q) => {
    expect(parsePageQuery(q)).toBeNull();
  });

  it("agrees with the page count", () => {
    expect(parsePageQuery(`p ${PAGE_COUNT}`)).toBe(PAGE_COUNT);
    expect(parsePageQuery(`p ${PAGE_COUNT + 1}`)).toBeNull();
  });
});
