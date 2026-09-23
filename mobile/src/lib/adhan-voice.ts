// Which sound the "adhan" notification style plays.
//
// One global choice, not per prayer: a household picks a muezzin, not five.
// The per-prayer style in prayer-prefs.ts still decides WHETHER a prayer
// gets the adhan, a beep, silence or nothing; this decides which adhan —
// or, for someone who would rather not have one, the phone's own sound.
//
// Android 8+ fixes a channel's sound at creation, so every voice (and the
// beep and silent styles) is its own channel. Switching voice therefore
// means scheduling onto a different channel, which is why the channel id
// carries the voice — see channelFor().
//
// The recordings live in mobile/assets/sounds/ and are registered with the
// expo-notifications config plugin in app.json, which copies them into
// android/app/src/main/res/raw at prebuild. Licences: assets/sounds/LICENSES.md.
//
// iOS is different on two counts: it cannot play Ogg in a notification, and
// it plays at most 30 seconds of one (a longer file falls back to the
// default ding). So iOS gets a single cut, IOS_ADHAN_SOUND, and the picker
// there offers one recording instead of two. The OS is passed in rather than
// read from react-native, so this file stays testable under node.

import type { NotificationStyle } from "@/lib/prayer-prefs";
import { loadSetting, saveSetting } from "@/lib/storage";

/** The bundled recordings. */
export const RECORDED_VOICES = ["full", "short"] as const;
export type RecordedVoice = (typeof RECORDED_VOICES)[number];

/** Everything the picker offers: the recordings, then the phone's own
 *  notification sound for people who want to be told, not called. */
export const ADHAN_VOICES = [...RECORDED_VOICES, "system"] as const;
export type AdhanVoice = (typeof ADHAN_VOICES)[number];

export const DEFAULT_ADHAN_VOICE: AdhanVoice = "full";

const VOICE_KEY = "adhanVoice";

/** Android raw resource file for each recording. Base filename only — the
 *  resource name is the part before the dot, so keep these [a-z0-9_]. */
export const VOICE_FILES: Record<RecordedVoice, string> = {
  full: "adhan_full.ogg",
  short: "adhan_short.ogg",
};

/** Roughly how long each recording plays, for the picker's hint. */
export const VOICE_SECONDS: Record<RecordedVoice, number> = {
  full: 153,
  short: 32,
};

/** The only recording iOS plays: the first 29 s of the full adhan, faded
 *  out, IMA4 in a .caf. Named without the adhan_ prefix so Android's
 *  resource shrinker drops the copy the config plugin puts in res/raw. */
export const IOS_ADHAN_SOUND = "ios_adhan.caf";
export const IOS_ADHAN_SECONDS = 29;

/** What the picker offers on this OS. On iOS "full" would play the same
 *  29-second cut as "short", so it is not offered. */
export function voicesFor(os: string): readonly AdhanVoice[] {
  return os === "ios" ? ADHAN_VOICES.filter((v) => v !== "full") : ADHAN_VOICES;
}

/** A stored voice the picker on this OS does not offer maps to the one that
 *  plays the same thing, so the picker always shows a selection. */
export function voiceForOs(voice: AdhanVoice, os: string): AdhanVoice {
  return os === "ios" && voice === "full" ? "short" : voice;
}

/** Seconds a recorded voice plays on this OS, for the picker's hint. */
export function voiceSeconds(voice: RecordedVoice, os: string): number {
  return os === "ios" ? IOS_ADHAN_SECONDS : VOICE_SECONDS[voice];
}

/** The content sound for this OS. channelFor names the Android raw file;
 *  on iOS every recording is the one cut, and booleans pass through. */
export function soundForOs(sound: string | boolean, os: string): string | boolean {
  return os === "ios" && typeof sound === "string" ? IOS_ADHAN_SOUND : sound;
}

export function isAdhanVoice(v: unknown): v is AdhanVoice {
  return typeof v === "string" && (ADHAN_VOICES as readonly string[]).includes(v);
}

export function isRecordedVoice(v: AdhanVoice): v is RecordedVoice {
  return (RECORDED_VOICES as readonly string[]).includes(v);
}

/** A stored value from a build that shipped a voice since removed (the 1885
 *  Makkah cylinder) fails isAdhanVoice and falls back to the default here —
 *  no migration step, the old value just stops matching. */
export async function loadAdhanVoice(os: string): Promise<AdhanVoice> {
  const v = await loadSetting(VOICE_KEY);
  return voiceForOs(isAdhanVoice(v) ? v : DEFAULT_ADHAN_VOICE, os);
}

export async function saveAdhanVoice(voice: AdhanVoice): Promise<void> {
  await saveSetting(VOICE_KEY, voice);
}

/** Every channel the adhan scheduler may post to. Ids are stable — renaming
 *  one orphans notifications already scheduled on the old id. */
export const CHANNEL_BEEP = "adhan-beep";
export const CHANNEL_SILENT = "adhan-silent";

export function voiceChannel(voice: RecordedVoice): string {
  return `adhan-${voice}`;
}

/**
 * Channels earlier builds created that nothing posts to any more. Deleted
 * whenever the channels are set up, so the phone's notification settings do
 * not keep listing a dead "Adhan" entry the user can toggle to no effect.
 *
 * - "adhan": the single pre-voices channel.
 * - "adhan-makkah1885": the 1885 Makkah wax-cylinder voice, removed.
 */
export const RETIRED_CHANNELS: readonly string[] = ["adhan", "adhan-makkah1885"];

/**
 * The channel a notification of this style should be posted on, and the
 * sound to name in its content (Android < 8 reads the content, 8+ reads the
 * channel — we set both so either path plays the same thing).
 *
 * The "system" voice is the beep channel by another name: Android's default
 * notification sound, whatever the user set it to. One channel, not two,
 * so the phone's settings do not list the same sound twice.
 */
export function channelFor(
  style: Exclude<NotificationStyle, "off">,
  voice: AdhanVoice,
): { channelId: string; sound: string | boolean } {
  switch (style) {
    case "adhan":
      return isRecordedVoice(voice)
        ? { channelId: voiceChannel(voice), sound: VOICE_FILES[voice] }
        : { channelId: CHANNEL_BEEP, sound: true };
    case "beep":
      return { channelId: CHANNEL_BEEP, sound: true };
    case "silent":
      return { channelId: CHANNEL_SILENT, sound: false };
  }
}
