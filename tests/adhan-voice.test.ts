import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ADHAN_VOICES,
  CHANNEL_BEEP,
  CHANNEL_SILENT,
  channelFor,
  isAdhanVoice,
  isRecordedVoice,
  RECORDED_VOICES,
  RETIRED_CHANNELS,
  VOICE_FILES,
  voiceChannel,
} from "@/lib/adhan-voice";

const SOUNDS_DIR = join(__dirname, "..", "mobile", "assets", "sounds");
const APP_JSON = join(__dirname, "..", "mobile", "app.json");

async function registeredSounds(): Promise<string[]> {
  const appJson = (await import(APP_JSON, { with: { type: "json" } })).default as {
    expo: { plugins: unknown[] };
  };
  const plugin = appJson.expo.plugins.find(
    (p) => Array.isArray(p) && p[0] === "expo-notifications",
  ) as [string, { sounds?: string[] }] | undefined;
  return plugin?.[1]?.sounds ?? [];
}

describe("adhan voices", () => {
  it("every recording is bundled and registered with the config plugin", async () => {
    const registered = await registeredSounds();
    for (const voice of RECORDED_VOICES) {
      const file = VOICE_FILES[voice];
      expect(file).toMatch(/^[a-z0-9_]+\.ogg$/); // Android raw resource name rules
      expect(existsSync(join(SOUNDS_DIR, file))).toBe(true);
      expect(registered).toContain(`./assets/sounds/${file}`);
    }
  });

  it("the removed 1885 recording is gone everywhere", async () => {
    const registered = await registeredSounds();
    expect(existsSync(join(SOUNDS_DIR, "adhan_makkah_1885.ogg"))).toBe(false);
    expect(registered.some((s) => s.includes("1885"))).toBe(false);
    expect(isAdhanVoice("makkah1885")).toBe(false);
    // Its channel is retired, so the phone's settings stop listing it.
    expect(RETIRED_CHANNELS).toContain("adhan-makkah1885");
  });

  it("offers the phone's own sound as a voice", () => {
    expect(ADHAN_VOICES).toContain("system");
    expect(isRecordedVoice("system")).toBe(false);
    // No channel of its own: it rides the beep channel, which already plays
    // Android's default notification sound.
    expect(channelFor("adhan", "system")).toEqual({
      channelId: CHANNEL_BEEP,
      sound: true,
    });
  });

  it("routes each style to its own channel", () => {
    const ids = new Set<string>();
    for (const voice of RECORDED_VOICES) {
      const r = channelFor("adhan", voice);
      expect(r.channelId).toBe(voiceChannel(voice));
      expect(r.sound).toBe(VOICE_FILES[voice]);
      ids.add(r.channelId);
    }
    expect(channelFor("beep", "full")).toEqual({ channelId: CHANNEL_BEEP, sound: true });
    expect(channelFor("silent", "full")).toEqual({ channelId: CHANNEL_SILENT, sound: false });
    ids.add(CHANNEL_BEEP);
    ids.add(CHANNEL_SILENT);
    expect(ids.size).toBe(RECORDED_VOICES.length + 2);
    // A reminder never plays the adhan, whatever the voice.
    expect(channelFor("beep", "system").channelId).toBe(CHANNEL_BEEP);
  });

  it("no live channel is also a retired one", () => {
    const live = [...RECORDED_VOICES.map(voiceChannel), CHANNEL_BEEP, CHANNEL_SILENT];
    for (const id of live) expect(RETIRED_CHANNELS).not.toContain(id);
  });

  it("rejects unknown stored values", () => {
    expect(isAdhanVoice("full")).toBe(true);
    expect(isAdhanVoice("system")).toBe(true);
    expect(isAdhanVoice("mp3")).toBe(false);
    expect(isAdhanVoice(null)).toBe(false);
  });
});
