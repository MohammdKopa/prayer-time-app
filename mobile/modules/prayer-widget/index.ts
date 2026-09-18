// Android-only local module: the home-screen widget's native bridge.
//
// `expo-module.config.json` declares platforms: ["android"] only, so on
// iOS and web this native module is never registered. requireOptionalNativeModule
// returns null in that case rather than throwing, which is what makes every
// import of this file safe on every platform without a separate iOS/web stub.

import { requireOptionalNativeModule } from "expo-modules-core";

export interface PrayerWidgetNativeModule {
  /** Persist the schedule JSON (see lib/widget.ts for the shape) and
   *  re-render every placed widget instance immediately. */
  setSchedule(json: string): void;
  /** Re-render every placed widget instance from whatever schedule is
   *  already stored, without changing it. */
  refresh(): void;
}

export default requireOptionalNativeModule<PrayerWidgetNativeModule>(
  "PrayerWidget",
);
