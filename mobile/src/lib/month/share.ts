// Capture a view as a PNG and hand it to the system share sheet.
//
// NATIVE MODULE. react-native-view-shot is not a JS-only library: this needs a
// new dev/release build, `npx expo run:android` or an EAS build. Expo Go will
// throw "NativeModules.RNViewShot is undefined" at the first capture.
//
// WHY NOT `snapshotContentContainer`. The obvious way to capture a table
// taller than the screen is to hand `captureRef` the ScrollView with
// `snapshotContentContainer: true`. It is also the flakiest: it has a history
// of measuring the wrong height on Android and it is unsupported on Windows.
// What is solid is the plain case — `captureRef` allocates a bitmap of the
// view's own measured size and calls `view.draw()` on it. A view's measured
// height has nothing to do with whether a parent clips it, so a full-height
// card rendered offstage captures completely. The caller renders such a card;
// this function only takes its ref.
//
// The temporary file is NOT released after sharing. On Android `shareAsync`
// resolves as soon as the intent is dispatched, and the receiving app may
// still be reading the file — deleting it there is a race that shows up as an
// empty message in WhatsApp. It lands in the app's cache directory, which the
// OS reclaims.

import * as Sharing from "expo-sharing";
import type { RefObject } from "react";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";

export type ShareResult = "shared" | "unavailable" | "failed";

export interface ShareViewOptions {
  /** Android only; becomes the name the receiving app sees. No extension. */
  fileName: string;
  /** Android and web only; the title of the chooser. */
  dialogTitle: string;
}

export async function shareView(
  view: RefObject<View | null>,
  { fileName, dialogTitle }: ShareViewOptions,
): Promise<ShareResult> {
  try {
    if (!(await Sharing.isAvailableAsync())) return "unavailable";

    const uri = await captureRef(view, {
      format: "png",
      // Lossless anyway; kept explicit so a later switch to jpg is a one-word
      // change rather than a silent quality drop.
      quality: 1,
      result: "tmpfile",
      fileName,
    });

    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      UTI: "public.png",
      dialogTitle,
    });
    return "shared";
  } catch {
    return "failed";
  }
}
