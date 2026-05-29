// Thin wrapper over Umami's custom-event API. No-ops when Umami isn't loaded
// (env vars unset, ad-blockers, SSR) — safe to call from anywhere.

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

/** Record a usage event, e.g. track("open-mosques", { city: "marl" }). */
export function track(event: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.umami) return;
  try {
    if (data) window.umami.track(event, data);
    else window.umami.track(event);
  } catch {
    /* analytics must never break the app */
  }
}

export {};
