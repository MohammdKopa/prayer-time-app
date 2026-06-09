"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PrayerName } from "./prayer-engine";

const MUTE_KEY = "prayer-times.azan-muted";

// One azan for every prayer, including Fajr (both keys point at the same file).
const AUDIO_PATHS = {
  fajr: "/audio/azan.mp3",
  default: "/audio/azan.mp3",
} as const;

function pickPath(p: PrayerName): string {
  return p === "fajr" ? AUDIO_PATHS.fajr : AUDIO_PATHS.default;
}

export interface AzanPlayer {
  /** True if the user has muted azan. */
  muted: boolean;
  /** True once the browser audio context is unlocked (a user gesture occurred). */
  unlocked: boolean;
  /** Toggle muted state. First tap also unlocks the audio context. */
  toggleMute: () => Promise<void>;
  /** Play the azan for the given prayer (no-op if muted or not unlocked). */
  play: (p: PrayerName) => void;
  /** Stop any playback. */
  stop: () => void;
}

export function useAzanPlayer(): AzanPlayer {
  // Default to muted on first visit; restore preference once hydrated.
  const [muted, setMuted] = useState<boolean>(true);
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MUTE_KEY);
      if (saved === "false") setMuted(false);
    } catch {
      /* ignore */
    }
    const a = new Audio();
    a.preload = "auto";
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = "";
      audioRef.current = null;
    };
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (unlocked) return true;
    const a = audioRef.current;
    if (!a) return false;
    // Silent priming play to satisfy browser autoplay policy.
    const prevSrc = a.src;
    a.src = AUDIO_PATHS.default;
    a.muted = true;
    try {
      await a.play();
      a.pause();
      a.currentTime = 0;
      a.muted = false;
      if (prevSrc) a.src = prevSrc;
      setUnlocked(true);
      return true;
    } catch {
      return false;
    }
  }, [unlocked]);

  const persistMuted = useCallback((v: boolean) => {
    setMuted(v);
    try {
      window.localStorage.setItem(MUTE_KEY, String(v));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleMute = useCallback(async () => {
    if (!unlocked) {
      const ok = await unlock();
      if (ok) persistMuted(false);
      return;
    }
    persistMuted(!muted);
  }, [unlocked, muted, unlock, persistMuted]);

  // If the user previously enabled azan but the tab was reopened, transparently
  // unlock on the very next pointer event so playback works without a bell tap.
  useEffect(() => {
    if (unlocked || muted) return;
    const handler = () => {
      void unlock();
    };
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, [unlocked, muted, unlock]);

  const play = useCallback(
    (p: PrayerName) => {
      if (muted || !unlocked) return;
      const a = audioRef.current;
      if (!a) return;
      a.pause();
      a.src = pickPath(p);
      a.currentTime = 0;
      void a.play().catch(() => {
        /* swallow — likely tab in background; nothing actionable */
      });
    },
    [muted, unlocked],
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  return { muted, unlocked, toggleMute, play, stop };
}
