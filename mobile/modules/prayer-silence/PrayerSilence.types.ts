// Shape shared by the real Android module and the iOS/web no-op in index.ts.
// Kept as plain data — no class instances cross the JS/native boundary.

export interface SilenceWindow {
  /** Epoch milliseconds the window starts at — the adhan time, not a
   *  reminder time. Silence starts here, not before it. */
  start: number;
  /** How long Do Not Disturb stays on after `start`. */
  durationMinutes: number;
}

export type AutostartState = "allowed" | "denied" | "unknown";

export interface PrayerSilenceModuleType {
  /** Whether this app currently holds Android's notification-policy
   *  (Do Not Disturb) access. False on iOS and web. */
  hasPolicyAccess(): boolean;
  /** Opens the system screen where the user grants that access. No-op where
   *  there is nothing to grant. */
  openPolicyAccessSettings(): void;
  /**
   * Whether Android will honour exact alarm times for this app. From
   * Android 14 this is off by default; without it both the adhan and the
   * silence windows are "inexact" and may land minutes late. Always true
   * below Android 12 and on iOS/web, where there is no such switch.
   */
  canScheduleExactAlarms(): boolean;
  /** Opens the "Alarms & reminders" system screen for this app. No-op where
   *  there is nothing to grant. */
  openExactAlarmSettings(): void;
  /**
   * Xiaomi's "Autostart" switch for this app. "denied" means an alarm cannot
   * restart the app once the system has killed it, so the adhan can arrive
   * hours late. "unknown" on every other phone and on iOS/web.
   */
  autostartState(): AutostartState;
  /** Opens Xiaomi's Autostart screen, or this app's settings page when that
   *  screen is not there. No-op off Android. */
  openAutostartSettings(): void;
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
