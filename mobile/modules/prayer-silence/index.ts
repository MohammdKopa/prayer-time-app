import { Platform } from "react-native";

import type { PrayerSilenceModuleType } from "./PrayerSilence.types";

export type { SilenceWindow, PrayerSilenceModuleType } from "./PrayerSilence.types";

/**
 * Do Not Disturb has no equivalent third-party API on iOS, and none at all
 * on web. The native side of this module is Android-only (see
 * expo-module.config.json), so the native module is required lazily and
 * only on Android — importing this file must never throw anywhere else.
 * Every platform gets the same shape back, either backed by Kotlin or a
 * harmless no-op that reports "no access" and does nothing when asked to
 * schedule or cancel.
 */
function loadNativeModule(): PrayerSilenceModuleType {
  if (Platform.OS !== "android") {
    return {
      hasPolicyAccess: () => false,
      openPolicyAccessSettings: () => {},
      scheduleSilence: () => {},
      cancelSilence: () => {},
    };
  }
  // Deferred require: evaluating expo-modules-core's native binding on a
  // platform with no such module registered is itself what would throw.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { requireNativeModule } = require("expo-modules-core");
  return requireNativeModule("PrayerSilence") as PrayerSilenceModuleType;
}

const PrayerSilence: PrayerSilenceModuleType = loadNativeModule();

export default PrayerSilence;
