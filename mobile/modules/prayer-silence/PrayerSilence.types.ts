// Shape shared by the real Android module and the iOS/web no-op in index.ts.
// Kept as plain data — no class instances cross the JS/native boundary.

export interface SilenceWindow {
  /** Epoch milliseconds the window starts at — the adhan time, not a
   *  reminder time. Silence starts here, not before it. */
  start: number;
  /** How long Do Not Disturb stays on after `start`. */
  durationMinutes: number;
}

export interface PrayerSilenceModuleType {
  /** Whether this app currently holds Android's notification-policy
   *  (Do Not Disturb) access. False on iOS and web. */
  hasPolicyAccess(): boolean;
  /** Opens the system screen where the user grants that access. No-op where
   *  there is nothing to grant. */
  openPolicyAccessSettings(): void;
  /**
   * Replaces every previously scheduled window with this list. Windows in
   * the past are the caller's responsibility to filter out; the native side
   * schedules exactly what it is given (subject to having policy access).
   */
  scheduleSilence(windows: SilenceWindow[]): void;
  /** Cancels every scheduled window and, if one is mid-silence, restores the
   *  Do Not Disturb state it overrode. */
  cancelSilence(): void;
}
