// Tasbih counting — the state and its persistence, kept out of the screen so
// the screen is only layout and touch.
//
// The count survives an app restart. A dhikr session can run for a long time
// and losing it to a swipe-away would be worse than any storage cost, so every
// change is written back; the write is debounced because a tap can come twice a
// second and AsyncStorage on Android is a disk round trip. Nothing here throws:
// storage.ts swallows its own failures, and a count that fails to save is a
// count that starts at zero next time, not a crash mid-dhikr.

import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { loadJSON, saveJSON } from "@/lib/storage";

const STORAGE_KEY = "tasbih";
const SAVE_DELAY_MS = 400;

/** Free counting is target 0 — one shape for "no target" instead of null. */
export const FREE_TARGET = 0;

/** 33 after each prayer, 99 for a full round of the names; free for the rest. */
export const TASBIH_TARGETS = [33, 99, FREE_TARGET] as const;

export type TasbihTarget = (typeof TASBIH_TARGETS)[number];

interface Stored {
  count: number;
  target: number;
}

function isTarget(n: number): n is TasbihTarget {
  return (TASBIH_TARGETS as readonly number[]).includes(n);
}

// Haptics.
//
// The feel is the whole point: a tasbih is counted with the thumb, and the
// buzz is what tells you the tap registered without looking. On Android the
// cross-platform calls fall back to the raw Vibrator, which is a blunt buzz
// and tiring after a few hundred taps; performAndroidHapticsAsync goes through
// the system haptics engine instead — crisper, softer, and it needs no VIBRATE
// permission. iOS keeps the Taptic Engine calls.
//
// Every call is swallowed. A device with the Taptic Engine off, an emulator
// with no vibrator, Low Power Mode — none of that is a reason for a rejected
// promise to surface mid-dhikr.

function fire(run: () => Promise<void>): void {
  try {
    void run().catch(() => {});
  } catch {
    // Some platforms throw synchronously rather than rejecting.
  }
}

/** One count. Soft, because it happens hundreds of times. */
export function hapticTap(): void {
  fire(() =>
    Platform.OS === "android"
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  );
}

/** A round completed — deliberately a different shape, not just louder, so it
 *  can be told apart with the screen dark. */
export function hapticTarget(): void {
  fire(() =>
    Platform.OS === "android"
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}

/** Picking a target, or arming the reset. */
export function hapticSelect(): void {
  fire(() =>
    Platform.OS === "android"
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick)
      : Haptics.selectionAsync(),
  );
}

/** The count was cleared. */
export function hapticReset(): void {
  fire(() =>
    Platform.OS === "android"
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Toggle_Off)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  );
}

export interface TasbihSession {
  /** False until the stored session has been read, so the screen does not
   *  flash a zero over a count that is about to load. */
  ready: boolean;
  count: number;
  target: TasbihTarget;
  /** Position inside the current round, 1…target — 0 before the first tap.
   *  Landing exactly on the target reads as 33/33, not 0/33. */
  inRound: number;
  /** Rounds finished. Only meaningful once the first target is passed. */
  rounds: number;
  /** 0…1 for the round in progress; 0 when counting freely. */
  progress: number;
  /** True on the tap that completes a round, until the next tap. */
  atTarget: boolean;
  /** Returns true when this tap completed a round, so the caller can give it
   *  a different haptic. */
  increment: () => boolean;
  reset: () => void;
  chooseTarget: (t: TasbihTarget) => void;
}

export function useTasbih(): TasbihSession {
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState<TasbihTarget>(33);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Stored | null>(null);

  // The count also lives in a ref, and the ref is the authority. A thumb can
  // out-run React: two taps inside one render would both read the same stale
  // `count` from the closure and the second one would be swallowed. Losing a
  // count in a dhikr counter is the one bug this screen must not have.
  const countRef = useRef(0);
  const targetRef = useRef<TasbihTarget>(33);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadJSON<Stored>(STORAGE_KEY);
      if (cancelled) return;
      if (stored && Number.isFinite(stored.count) && stored.count >= 0) {
        countRef.current = Math.floor(stored.count);
        setCount(countRef.current);
      }
      if (stored && isTarget(stored.target)) {
        targetRef.current = stored.target;
        setTarget(stored.target);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const flush = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const next = pending.current;
    pending.current = null;
    if (next) void saveJSON(STORAGE_KEY, next);
  }, []);

  const save = useCallback(
    (next: Stored) => {
      pending.current = next;
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush],
  );

  // Leaving the screen must not drop the last few taps.
  useEffect(() => flush, [flush]);

  const increment = useCallback(() => {
    const next = countRef.current + 1;
    const at = targetRef.current;
    countRef.current = next;
    setCount(next);
    save({ count: next, target: at });
    return at !== FREE_TARGET && next % at === 0;
  }, [save]);

  const reset = useCallback(() => {
    countRef.current = 0;
    setCount(0);
    save({ count: 0, target: targetRef.current });
  }, [save]);

  const chooseTarget = useCallback(
    (t: TasbihTarget) => {
      targetRef.current = t;
      setTarget(t);
      // The count is deliberately kept: switching 33 → 99 mid-session should
      // not throw away what has already been said.
      save({ count: countRef.current, target: t });
    },
    [save],
  );

  const counting = target !== FREE_TARGET;
  const inRound = !counting || count === 0 ? 0 : ((count - 1) % target) + 1;

  return {
    ready,
    count,
    target,
    inRound,
    rounds: counting ? Math.floor(count / target) : 0,
    progress: counting && count > 0 ? inRound / target : 0,
    atTarget: counting && count > 0 && count % target === 0,
    increment,
    reset,
    chooseTarget,
  };
}
