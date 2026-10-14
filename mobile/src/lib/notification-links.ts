import type { Occasion } from "@/lib/dua/content";

// Where a tapped notification goes.
//
// The url travels in the notification's `data`, which is just JSON on the
// device. Anything that reaches the router goes through `urlFromData` first,
// so a malformed or foreign payload (or one from an older build) opens the app
// normally instead of navigating somewhere unplanned.

export const ADHAN_URL = "/";
export const ADHKAR_URL = "/dua";
/** Resolves the saved reading position, then opens the reader (or the tab). */
export const QURAN_CONTINUE_URL = "/quran-continue";

export type NotificationUrl =
  | typeof ADHAN_URL
  | typeof ADHKAR_URL
  | typeof QURAN_CONTINUE_URL;

const ALLOWED_URLS: readonly NotificationUrl[] = [
  ADHAN_URL,
  ADHKAR_URL,
  QURAN_CONTINUE_URL,
];

/** The screen a reminder for this occasion should open. */
export function urlForOccasion(occasion: Occasion): NotificationUrl {
  return occasion === "quran" ? QURAN_CONTINUE_URL : ADHKAR_URL;
}

/** The url from a notification's `data`, or null if absent or not allowed. */
export function urlFromData(data: unknown): NotificationUrl | null {
  if (typeof data !== "object" || data === null) return null;
  const url = (data as { url?: unknown }).url;
  return ALLOWED_URLS.find((allowed) => allowed === url) ?? null;
}
