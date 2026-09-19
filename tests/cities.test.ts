import { describe, expect, it } from "vitest";

import { CITIES, nearestCity, foldCityName } from "@/lib/cities";
import { NRW_CITIES } from "@shared/cities";

function kmBetween(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const rad = (x: number) => (x * Math.PI) / 180;
  const s =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

describe("Germany-wide city list", () => {
  it("keeps every curated NRW city, exactly once", () => {
    for (const c of NRW_CITIES) {
      const hits = CITIES.filter(
        (x) => x.name.localeCompare(c.name, "de", { sensitivity: "base" }) === 0,
      );
      expect(hits.map((h) => h.id)).toContain(c.id);
      // The generated list also has Marl, Köln, … — those must be dropped.
      // A same-name town far away (Münster/Westfalen vs. Münster in Lower
      // Saxony, 200 km apart) is a different place and stays.
      for (const h of hits.filter((h) => h.id.startsWith("osm-"))) {
        expect(kmBetween(c, h)).toBeGreaterThanOrEqual(15);
      }
    }
  });

  it("reaches far beyond NRW", () => {
    for (const name of ["Berlin", "Hamburg", "München", "Dresden", "Freiburg im Breisgau"]) {
      expect(CITIES.some((c) => c.name === name)).toBe(true);
    }
    expect(CITIES.length).toBeGreaterThan(1000);
  });

  it("is sorted biggest-first with unique ids", () => {
    for (let i = 1; i < CITIES.length; i++) {
      expect(CITIES[i].population).toBeLessThanOrEqual(CITIES[i - 1].population);
    }
    expect(new Set(CITIES.map((c) => c.id)).size).toBe(CITIES.length);
  });

  it("labels a Berlin fix as Berlin, not the nearest NRW town", () => {
    const near = nearestCity(52.52, 13.405)!;
    expect(near.city.name).toBe("Berlin");
    expect(near.km).toBeLessThan(5);
  });
});

describe("foldCityName", () => {
  it("folds case and German umlauts, nothing more", () => {
    expect(foldCityName("Münster")).toBe("munster");
    expect(foldCityName("MÜNSTER")).toBe("munster");
    expect(foldCityName("Gießen")).toBe("giessen");
    expect(foldCityName("Köln")).toBe(foldCityName("KOELN".replace("OE", "Ö")));
    expect(foldCityName("Marl")).toBe("marl");
    // Different names stay different — this is not a fuzzy match.
    expect(foldCityName("Munster")).toBe(foldCityName("Münster")); // same key, distance decides
    expect(foldCityName("Bochum")).not.toBe(foldCityName("Bottrop"));
  });
});
