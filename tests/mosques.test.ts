import { describe, expect, it } from "vitest";

import { nearestMosques } from "@/lib/mosques";
import { CURATED_MOSQUES, OSM_OVERRIDES } from "@shared/mosques-curated";
import { MOSQUES, mosquesForCity } from "@shared/mosques";

// Marl centre — the app's default place.
const MARL = { lat: 51.6564, lng: 7.0907 };

describe("mobile nearest-mosque lookup", () => {
  it("includes the curated Marl mosques OSM is missing", () => {
    const ids = nearestMosques(MARL.lat, MARL.lng, 25).map((m) => m.id);
    for (const c of CURATED_MOSQUES.filter((m) => m.cityId === "marl")) {
      expect(ids).toContain(c.id);
    }
  });

  it("applies OSM overrides: renames and hides", () => {
    const list = nearestMosques(MARL.lat, MARL.lng, 25);
    const hidden = Object.entries(OSM_OVERRIDES)
      .filter(([, o]) => o.hidden)
      .map(([id]) => id);
    for (const id of hidden) {
      expect(list.find((m) => m.id === id)).toBeUndefined();
    }
    const ditib = list.find((m) => m.id === "osm-way-250110022");
    expect(ditib?.name).toBe("DITIB Yunus Emre Camii (Brassert)");
    expect(ditib?.nameAr).toBe("جامع يونس إمره – ديتيب (براسرت)");
  });

  it("is sorted nearest-first with a finite distance", () => {
    const list = nearestMosques(MARL.lat, MARL.lng, 25);
    expect(list.length).toBe(25);
    for (let i = 1; i < list.length; i++) {
      expect(list[i].distanceMeters).toBeGreaterThanOrEqual(
        list[i - 1].distanceMeters,
      );
    }
    // Curated Marl mosques are within a few km of the town centre.
    for (const c of CURATED_MOSQUES.filter((m) => m.cityId === "marl")) {
      const hit = list.find((m) => m.id === c.id)!;
      expect(hit.distanceMeters).toBeLessThan(6000);
    }
  });

  it("has no duplicate ids after merging", () => {
    const list = nearestMosques(MARL.lat, MARL.lng, 5000);
    expect(new Set(list.map((m) => m.id)).size).toBe(list.length);
  });

  it("includes the bundled Overture layer without doubling any pin", () => {
    const list = nearestMosques(MARL.lat, MARL.lng, 5000);
    expect(list.filter((m) => m.id.startsWith("overture-")).length).toBeGreaterThan(300);
    // No two entries within 30 m near Marl — OSM, curated and Overture
    // must have been deduped against each other.
    const near = list.filter((m) => m.distanceMeters < 10_000);
    for (let i = 0; i < near.length; i++) {
      for (let j = i + 1; j < near.length; j++) {
        const a = near[i];
        const b = near[j];
        const dLat = (a.lat - b.lat) * 111_000;
        const dLng = (a.lng - b.lng) * 111_000 * Math.cos((a.lat * Math.PI) / 180);
        expect(Math.hypot(dLat, dLng), `${a.id} vs ${b.id}`).toBeGreaterThan(30);
      }
    }
  });

  it("ships only Germany, named, confident Overture entries", () => {
    const overture = require("../mobile/src/lib/mosques/overture.json") as {
      id: string;
      name: string | null;
      lat: number;
      lng: number;
      city: string | null;
    }[];
    for (const m of overture) {
      expect(m.id).toMatch(/^overture-/);
      expect(m.name).toBeTruthy();
      expect(m.lat).toBeGreaterThan(47.2);
      expect(m.lat).toBeLessThan(55.1);
      expect(m.lng).toBeGreaterThan(5.8);
      expect(m.lng).toBeLessThan(15.1);
    }
  });
});

describe("website mosque list", () => {
  it("merges the same curated layer", () => {
    const marl = mosquesForCity("marl");
    const ids = marl.map((m) => m.id);
    expect(ids).toContain("marl-ibad-al-rahman");
    expect(ids).not.toContain("osm-way-336507003");
    const ibad = marl.find((m) => m.id === "marl-ibad-al-rahman")!;
    expect(ibad.address).toBe("Heyerhoffstr. 152A, 45770 Marl");
    expect(ibad.latitude).toBeCloseTo(51.6689, 3);
  });

  it("has no duplicate ids", () => {
    expect(new Set(MOSQUES.map((m) => m.id)).size).toBe(MOSQUES.length);
  });
});
