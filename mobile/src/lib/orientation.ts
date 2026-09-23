import * as Device from "expo-device";
import * as ScreenOrientation from "expo-screen-orientation";

// Phones are portrait-only. The lock lives here rather than in the manifest:
// Android 16 ignores manifest orientation on large screens and Play flags it,
// so tablets and unfolded foldables rotate freely.
export const IS_PHONE = Device.deviceType === Device.DeviceType.PHONE;

/** The app's resting orientation: portrait on phones, free elsewhere. */
export function restoreDefaultOrientation(): void {
  const p = IS_PHONE
    ? ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
    : ScreenOrientation.unlockAsync();
  void p.catch(() => {});
}
