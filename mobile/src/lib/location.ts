import * as Location from "expo-location";

import type { City } from "@shared/cities";
import { CITIES, nearestCity } from "@/lib/cities";
import { loadJSON, saveJSON, loadSetting, saveSetting } from "@/lib/storage";

// Where the times are computed for.
//
// GPS is the primary input: prayer times come from coordinates, so this works
// anywhere in Germany — or anywhere at all — without a city list that has to
// keep up. The curated city list is the manual override and the offline
// fallback, not the main path.

export interface Place {
  name: string;
  latitude: number;
  longitude: number;
  /** "gps" when it came from the device, "city" when picked by hand. */
  source: "gps" | "city";
}

const PLACE_KEY = "place";
const MODE_KEY = "locationMode";

/** Marl — the mosque this app was built for. Used until something better is
 *  known, so the very first frame still shows real times. */
export const DEFAULT_PLACE: Place = {
  name: "Marl",
  latitude: 51.6564,
  longitude: 7.0907,
  source: "city",
};

/** Re-exported so callers keep importing the picker list from here. */
export { CITIES, nearestCity };

export type LocationMode = "gps" | "manual";

export async function loadSavedPlace(): Promise<Place | null> {
  const p = await loadJSON<Place>(PLACE_KEY);
  if (
    p &&
    typeof p.latitude === "number" &&
    typeof p.longitude === "number" &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude)
  ) {
    return p;
  }
  return null;
}

export async function savePlace(place: Place): Promise<void> {
  await saveJSON(PLACE_KEY, place);
}

export async function loadMode(): Promise<LocationMode> {
  return (await loadSetting(MODE_KEY)) === "manual" ? "manual" : "gps";
}

export async function saveMode(mode: LocationMode): Promise<void> {
  await saveSetting(MODE_KEY, mode);
}

export type GpsResult =
  | { ok: true; place: Place }
  | { ok: false; reason: "denied" | "unavailable" };

/**
 * Ask the device where we are.
 *
 * Deliberately uses Balanced accuracy, not Highest: prayer times change by
 * about four seconds per kilometre of longitude, so street-level precision
 * buys nothing and costs battery and a slower fix.
 */
export async function locate(): Promise<GpsResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      return { ok: false, reason: "denied" };
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const place: Place = {
      name: await describe(pos.coords.latitude, pos.coords.longitude),
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      source: "gps",
    };
    return { ok: true, place };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * A human name for a coordinate. Reverse geocoding needs the platform
 * geocoder and can fail offline, so the nearest known city is tried first and
 * a coordinate string is the last resort. The name is cosmetic — the times
 * never depend on it.
 */
async function describe(lat: number, lng: number): Promise<string> {
  const near = nearestCity(lat, lng);
  if (near && near.km < 25) return near.city.name;

  try {
    const [hit] = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    const name = hit?.city ?? hit?.subregion ?? hit?.region;
    if (name) return name;
  } catch {
    // offline, or no geocoder on this device
  }

  return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
}

export function placeFromCity(city: City): Place {
  return {
    name: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    source: "city",
  };
}
