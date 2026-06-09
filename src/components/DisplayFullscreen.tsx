"use client";

import { useCallback, useEffect, useState } from "react";

// Old TV/stick browsers (Fire TV Silk, the "pixel3" HDMI launcher's Chrome)
// may only expose the webkit-prefixed Fullscreen API.
type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
};

function currentFsElement(): Element | null {
  const d = document as FsDocument;
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function fullscreenSupported(): boolean {
  const el = document.documentElement as FsElement;
  return (
    typeof el.requestFullscreen === "function" ||
    typeof el.webkitRequestFullscreen === "function"
  );
}

/**
 * Tap-to-fullscreen for the mosque wall.
 *
 * On an HDMI Android stick the page opens inside Chrome with the address bar
 * and system bars eating the screen, and `/display` never scrolls so Chrome
 * never hides them. The Fullscreen API clears all of it — but only from a user
 * gesture, so we can't do it on load. We show a clear prompt AND treat a tap
 * (or remote "OK" key) anywhere as the gesture, so one click from across the
 * room makes it truly full-screen.
 *
 * Renders nothing when already full-screen, launched as an installed PWA, or on
 * a browser with no Fullscreen API to offer.
 */
export function DisplayFullscreen() {
  const [supported, setSupported] = useState(false);
  const [standalone, setStandalone] = useState(false);
  // Assume full-screen until the effect proves otherwise — avoids a flash of
  // the prompt during hydration.
  const [isFs, setIsFs] = useState(true);

  const enter = useCallback(async () => {
    const el = document.documentElement as FsElement;
    try {
      if (typeof el.requestFullscreen === "function") {
        await el.requestFullscreen();
      } else if (typeof el.webkitRequestFullscreen === "function") {
        await el.webkitRequestFullscreen();
      }
    } catch {
      /* gesture rejected / denied — the prompt stays up for another tap */
    }
  }, []);

  useEffect(() => {
    setSupported(fullscreenSupported());
    const sa =
      window.matchMedia?.(
        "(display-mode: standalone), (display-mode: fullscreen)",
      )?.matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(Boolean(sa));

    const sync = () => setIsFs(currentFsElement() !== null);
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const showPrompt = supported && !standalone && !isFs;

  // Treat any tap or remote "OK"/Enter anywhere as the gesture, so the user
  // doesn't have to land precisely on the pill with an air-mouse or remote.
  useEffect(() => {
    if (!showPrompt) return;
    const onGesture = () => void enter();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") void enter();
    };
    window.addEventListener("pointerup", onGesture, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("pointerup", onGesture, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [showPrompt, enter]);

  if (!showPrompt) return null;

  return (
    <button
      type="button"
      onClick={() => void enter()}
      className="display-fs-prompt font-kufi"
      dir="rtl"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>اضغط لملء الشاشة</span>
    </button>
  );
}
