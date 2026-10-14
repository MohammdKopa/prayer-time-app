import { describe, expect, it } from "vitest";

import {
  ADHAN_URL,
  ADHKAR_URL,
  QURAN_CONTINUE_URL,
  urlForOccasion,
  urlFromData,
} from "@/lib/notification-links";

describe("urlForOccasion", () => {
  it("sends the Quran reminder to continue-reading", () => {
    expect(urlForOccasion("quran")).toBe(QURAN_CONTINUE_URL);
  });

  it("sends every adhkar occasion to the adhkar tab", () => {
    for (const o of ["morning", "evening", "sleep", "salawat"] as const) {
      expect(urlForOccasion(o)).toBe(ADHKAR_URL);
    }
  });
});

describe("urlFromData", () => {
  it("accepts the urls this app schedules", () => {
    for (const url of [ADHAN_URL, ADHKAR_URL, QURAN_CONTINUE_URL]) {
      expect(urlFromData({ url })).toBe(url);
    }
  });

  it("ignores notifications scheduled before data existed", () => {
    expect(urlFromData({})).toBeNull();
    expect(urlFromData(undefined)).toBeNull();
    expect(urlFromData(null)).toBeNull();
  });

  it("rejects anything off the allowlist", () => {
    expect(urlFromData({ url: "https://evil.example" })).toBeNull();
    expect(urlFromData({ url: "/settings" })).toBeNull();
    expect(urlFromData({ url: "/dua?x=1" })).toBeNull();
    expect(urlFromData({ url: 5 })).toBeNull();
    expect(urlFromData("/dua")).toBeNull();
  });
});
