// The display photos with their bundled images attached. Kept apart from
// lib/display.ts because `require()` of a JPEG only works under Metro — the
// pure module stays loadable under node for the tests.

import { DISPLAY_PHOTO_META, type DisplayPhotoMeta } from "@/lib/display";

export interface DisplayPhoto extends DisplayPhotoMeta {
  /** Metro asset id. */
  source: number;
}

const SOURCES: Record<DisplayPhotoMeta["file"], number> = {
  "aqsa.jpg": require("../../assets/photos/aqsa.jpg"),
  "makkah.jpg": require("../../assets/photos/makkah.jpg"),
  "umayyad-damascus.jpg": require("../../assets/photos/umayyad-damascus.jpg"),
};

export const DISPLAY_PHOTOS: DisplayPhoto[] = DISPLAY_PHOTO_META.map((m) => ({
  ...m,
  source: SOURCES[m.file],
}));
