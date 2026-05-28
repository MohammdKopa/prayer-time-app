"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "prayer-times.install-dismissed-at";
// Show again after this many days if user previously dismissed.
const REPROMPT_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "hidden" | "android" | "ios";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari quirk
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isiOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isiOS = /iPad|iPhone|iPod/.test(ua);
  if (!isiOS) return false;
  // Exclude in-app browsers (FBAN, Instagram, etc.) that can't add to home.
  return !/FBAN|FBAV|Instagram|Line\//.test(ua);
}

function wasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < REPROMPT_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallBanner() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (wasRecentlyDismissed()) return;

    // Android / Chromium path — wait for the platform's signal.
    const beforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);

    // iOS path — no native event, just detect Safari and show instructions
    // after a short delay so it doesn't fight with the first paint.
    let iosTimer: number | undefined;
    if (isiOSSafari()) {
      iosTimer = window.setTimeout(() => setMode("ios"), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setMode("hidden");
  }, []);

  const installAndroid = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setMode("hidden");
      } else {
        dismiss();
      }
    } catch {
      dismiss();
    }
  }, [deferred, dismiss]);

  if (mode === "hidden") return null;

  return (
    <div
      className="glass rounded-2xl px-4 py-3 mt-4 flex items-start gap-3"
      dir="rtl"
      role="region"
      aria-label="إضافة التطبيق للشاشة الرئيسية"
    >
      <div className="flex-1 ar text-[12.5px] leading-relaxed text-bone">
        {mode === "android" ? (
          <>
            <div className="font-semibold text-gold-soft">
              ثبّت التطبيق ليعمل الأذان في الخلفية
            </div>
            <div className="mt-1 text-bone-dim">
              يعمل بدون فتح المتصفح ويرسل تنبيه عند كل صلاة.
            </div>
          </>
        ) : (
          <>
            <div className="font-semibold text-gold-soft">
              للاستخدام مع الإشعارات في الخلفية
            </div>
            <div className="mt-1 text-bone-dim">
              اضغط على{" "}
              <span aria-label="مشاركة" className="inline-block align-middle">
                <svg
                  viewBox="0 0 24 24"
                  className="inline h-4 w-4 -mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16V4" />
                  <path d="M7 9l5-5 5 5" />
                  <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
                </svg>
              </span>{" "}
              ثم اختر «إضافة إلى الشاشة الرئيسية».
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        {mode === "android" && (
          <button
            type="button"
            onClick={() => void installAndroid()}
            className="glass glass-interactive rounded-full px-3 py-1.5 text-xs text-gold-soft ar"
          >
            تثبيت
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full px-3 py-1 text-[11px] text-bone-faint hover:text-bone-dim ar"
        >
          لاحقاً
        </button>
      </div>
    </div>
  );
}
