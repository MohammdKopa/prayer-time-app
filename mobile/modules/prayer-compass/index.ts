import { Platform } from "react-native";

/** One heading sample, the same shape as expo-location's on Android:
 *  degrees from true north, accuracy 0 (unreliable) … 3 (high). */
export interface CompassSample {
  trueHeading: number;
  accuracy: number;
}

export interface CompassSubscription {
  remove: () => void;
}

interface NativeCompass {
  isAvailable: () => boolean;
  start: (latitude: number, longitude: number) => void;
  stop: () => void;
  addListener: (event: "onHeading", cb: (s: CompassSample) => void) => CompassSubscription;
}

/**
 * Android's fused rotation-vector compass (see PrayerCompassModule.kt for why
 * not expo-location there). Android only: everywhere else, and on a phone with
 * no rotation-vector sensor, `available` is false and the caller keeps using
 * expo-location. Required lazily, like modules/prayer-silence, so importing
 * this file never throws on iOS or web.
 */
function load(): NativeCompass | null {
  if (Platform.OS !== "android") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireNativeModule } = require("expo-modules-core");
    return requireNativeModule("PrayerCompass") as NativeCompass;
  } catch {
    return null;
  }
}

const native = load();

export const compassAvailable: boolean = (() => {
  try {
    return native?.isAvailable() ?? false;
  } catch {
    return false;
  }
})();

/** Start the fused compass; the returned subscription stops it. */
export function watchFusedHeading(
  latitude: number,
  longitude: number,
  onSample: (s: CompassSample) => void,
): CompassSubscription {
  if (!native || !compassAvailable) return { remove: () => {} };
  const sub = native.addListener("onHeading", onSample);
  native.start(latitude, longitude);
  return {
    remove: () => {
      sub.remove();
      native.stop();
    },
  };
}
