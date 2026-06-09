"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { City } from "@/lib/cities";
import { bearingLabelAr, qiblaBearing } from "@/lib/qibla";

// iOS-specific permission API for DeviceOrientationEvent
type DeviceOrientationEventConstructorIOS = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

// Compass heading — degrees clockwise from north that the TOP of the device
// points — derived from an orientation event's alpha and corrected for the
// screen's own rotation. Returns null when alpha isn't usable.
function headingFromAlpha(e: DeviceOrientationEvent): number | null {
  if (typeof e.alpha !== "number" || Number.isNaN(e.alpha)) return null;
  const screenAngle =
    typeof screen !== "undefined" &&
    screen.orientation &&
    typeof screen.orientation.angle === "number"
      ? screen.orientation.angle
      : 0;
  const heading = 360 - e.alpha + screenAngle;
  return ((heading % 360) + 360) % 360;
}

export function QiblaCompass({
  open,
  onClose,
  city,
}: {
  open: boolean;
  onClose: () => void;
  city: City;
}) {
  const [heading, setHeading] = useState<number | null>(null);
  const [isTrueNorth, setIsTrueNorth] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionState, setPermissionState] =
    useState<"unknown" | "granted" | "denied" | "unsupported">("unknown");

  const qibla = qiblaBearing(city.latitude, city.longitude);

  // Attach the compass. We trust two sources that are referenced to TRUE north:
  // iOS's `webkitCompassHeading`, and Android Chrome's `deviceorientationabsolute`.
  // A plain `deviceorientation` `alpha` on Android is relative to wherever the
  // page loaded and drifts freely — that was the "inaccurate" compass. We keep
  // it only as a last resort and flag it as not true-north so the UI doesn't
  // rotate the arrow by it.
  const detachRef = useRef<(() => void) | null>(null);

  const attach = useCallback(() => {
    detachRef.current?.();
    let gotAbsolute = false;

    const onAbsolute = (e: DeviceOrientationEvent) => {
      const h = headingFromAlpha(e);
      if (h === null) return;
      gotAbsolute = true;
      setHeading(h);
      setIsTrueNorth(true);
    };

    const onRelative = (e: DeviceOrientationEvent) => {
      const ios = e as DeviceOrientationEvent & {
        webkitCompassHeading?: number;
        webkitCompassAccuracy?: number;
      };
      if (
        typeof ios.webkitCompassHeading === "number" &&
        !Number.isNaN(ios.webkitCompassHeading)
      ) {
        // iOS — already degrees clockwise from true north.
        setHeading(ios.webkitCompassHeading);
        setIsTrueNorth(true);
        if (typeof ios.webkitCompassAccuracy === "number") {
          setAccuracy(ios.webkitCompassAccuracy);
        }
        return;
      }
      if (gotAbsolute) return; // the absolute listener has the better reading
      const h = headingFromAlpha(e);
      if (h !== null) {
        setHeading(h);
        setIsTrueNorth(e.absolute === true);
      }
    };

    // `deviceorientationabsolute` isn't in the DOM lib's typed event map.
    const absListener = onAbsolute as EventListener;
    window.addEventListener("deviceorientationabsolute", absListener, true);
    window.addEventListener("deviceorientation", onRelative, true);
    detachRef.current = () => {
      window.removeEventListener("deviceorientationabsolute", absListener, true);
      window.removeEventListener("deviceorientation", onRelative, true);
      detachRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      detachRef.current?.();
      setHeading(null);
      setIsTrueNorth(false);
      setAccuracy(null);
      return;
    }

    const supported =
      typeof window !== "undefined" && "DeviceOrientationEvent" in window;
    if (!supported) {
      setPermissionState("unsupported");
      return;
    }

    const Ctor = DeviceOrientationEvent as DeviceOrientationEventConstructorIOS;
    const needsRequest = typeof Ctor.requestPermission === "function";
    if (needsRequest) {
      // iOS: defer attaching until the user grants permission via the button.
      return;
    }

    setPermissionState("granted");
    attach();
    return () => detachRef.current?.();
  }, [open, attach]);

  const requestIosPermission = async () => {
    const Ctor = DeviceOrientationEvent as DeviceOrientationEventConstructorIOS;
    if (typeof Ctor.requestPermission !== "function") return;
    try {
      const result = await Ctor.requestPermission();
      if (result === "granted") {
        setPermissionState("granted");
        attach();
      } else {
        setPermissionState("denied");
      }
    } catch {
      setPermissionState("denied");
    }
  };

  // Only let the dial + arrow track the device when the heading is true-north.
  // Otherwise we keep the dial fixed (N up) and point the arrow at the exact
  // bearing — an honest "hold the top of the phone North" map, never a drifting
  // one. The numeric bearing below is always exact regardless.
  const liveCompass = heading !== null && isTrueNorth;
  const arrowRotation = liveCompass ? qibla - heading : qibla;
  const dialRotation = liveCompass ? -heading : 0;

  // iOS reports compass accuracy in degrees (negative = uncalibrated); prompt
  // the figure-8 calibration when it's poor.
  const needsCalibration =
    liveCompass && accuracy !== null && (accuracy < 0 || accuracy > 20);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/55 sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="القبلة"
        onClick={(e) => e.stopPropagation()}
        className="glass glass-strong w-full max-w-md rounded-t-3xl sm:rounded-3xl sm:m-4 max-h-[90dvh] overflow-y-auto flex flex-col"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        dir="rtl"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="ar text-base font-medium text-bone">القبلة</div>
          <button
            type="button"
            onClick={onClose}
            className="text-bone-dim hover:text-bone -ml-1 p-1"
            aria-label="إغلاق"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>

        <div className="ar text-center text-xs text-bone-dim px-6">
          من {city.name} إلى الكعبة المشرّفة
        </div>

        <div className="relative mx-auto my-6 h-64 w-64">
          {/* Dial — rotates with compass so N stays at actual North */}
          <div
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{ transform: `rotate(${dialRotation}deg)` }}
          >
            <svg viewBox="0 0 200 200" className="h-full w-full">
              {/* Outer ring */}
              <circle
                cx="100"
                cy="100"
                r="92"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
              />
              {/* Tick marks every 30° */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const isCardinal = i % 3 === 0;
                const inner = isCardinal ? 78 : 84;
                const outer = 92;
                const x1 = 100 + inner * Math.sin(angle);
                const y1 = 100 - inner * Math.cos(angle);
                const x2 = 100 + outer * Math.sin(angle);
                const y2 = 100 - outer * Math.cos(angle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={
                      isCardinal
                        ? "rgba(244,236,216,0.65)"
                        : "rgba(244,236,216,0.25)"
                    }
                    strokeWidth={isCardinal ? 1.4 : 1}
                  />
                );
              })}
              {/* Cardinal labels */}
              <text
                x="100"
                y="20"
                textAnchor="middle"
                fill="rgba(244,236,216,0.85)"
                fontSize="12"
                fontWeight="600"
              >
                N
              </text>
              <text
                x="184"
                y="105"
                textAnchor="middle"
                fill="rgba(244,236,216,0.55)"
                fontSize="11"
              >
                E
              </text>
              <text
                x="100"
                y="190"
                textAnchor="middle"
                fill="rgba(244,236,216,0.55)"
                fontSize="11"
              >
                S
              </text>
              <text
                x="16"
                y="105"
                textAnchor="middle"
                fill="rgba(244,236,216,0.55)"
                fontSize="11"
              >
                W
              </text>
            </svg>
          </div>

          {/* Arrow + Kaaba glyph — rotates to point at Mecca */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${arrowRotation}deg)` }}
          >
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <defs>
                <linearGradient id="arrowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f3dca0" />
                  <stop offset="100%" stopColor="#d4a64a" />
                </linearGradient>
              </defs>
              {/* Center pivot */}
              <circle
                cx="100"
                cy="100"
                r="6"
                fill="rgba(244,236,216,0.85)"
              />
              {/* Tail */}
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="148"
                stroke="rgba(244,236,216,0.35)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Arrow head pointing up to Mecca */}
              <path
                d="M 100 22 L 86 60 L 100 50 L 114 60 Z"
                fill="url(#arrowGrad)"
                style={{
                  filter:
                    "drop-shadow(0 0 12px rgba(232,200,120,0.6))",
                }}
              />
              {/* Kaaba glyph at arrowhead */}
              <rect
                x="92"
                y="6"
                width="16"
                height="16"
                rx="2"
                fill="#0a0a0a"
                stroke="#e8c878"
                strokeWidth="1.5"
              />
              <line
                x1="92"
                y1="13"
                x2="108"
                y2="13"
                stroke="#e8c878"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>

        {/* Numeric bearing + label */}
        <div className="text-center px-6">
          <div className="ar text-2xl font-medium text-gold-soft" dir="rtl">
            {bearingLabelAr(qibla)}
          </div>
          <div className="text-sm text-bone-dim mt-1 tnum" dir="ltr">
            {qibla.toFixed(1)}° من الشمال
          </div>
        </div>

        {/* Status — honest about what the compass can and can't promise */}
        <div className="px-6 mt-5 pb-5">
          {permissionState === "unsupported" && (
            <p className="ar text-[11px] text-bone-dim text-center leading-relaxed">
              البوصلة غير متاحة على هذا الجهاز. وجِّه أعلى الهاتف نحو الشمال،
              فيُشير السهم إلى القبلة بالزاوية أعلاه.
            </p>
          )}
          {permissionState === "denied" && (
            <p className="ar text-[11px] text-bone-dim text-center leading-relaxed">
              لم يُسمح بالوصول إلى البوصلة. وجِّه أعلى الهاتف نحو الشمال،
              فيُشير السهم إلى القبلة بالزاوية أعلاه.
            </p>
          )}
          {permissionState === "unknown" && (
            <button
              type="button"
              onClick={requestIosPermission}
              className="glass glass-interactive w-full rounded-2xl px-4 py-3 ar text-bone hover:bg-white/[0.09] transition"
            >
              فعّل البوصلة لتوجيه السهم تلقائياً
            </button>
          )}
          {permissionState === "granted" && heading === null && (
            <p className="ar text-[11px] text-bone-dim text-center">
              حرّك الهاتف قليلاً لتفعيل البوصلة…
            </p>
          )}
          {permissionState === "granted" &&
            heading !== null &&
            !isTrueNorth && (
              <p className="ar text-[11px] text-bone-dim text-center leading-relaxed">
                بوصلة هذا المتصفح غير دقيقة. وجِّه أعلى الهاتف نحو الشمال،
                فيُشير السهم إلى القبلة بالزاوية أعلاه.
              </p>
            )}
          {liveCompass && needsCalibration && (
            <p className="ar text-[11px] text-gold-soft text-center leading-relaxed">
              ✦ لمعايرة البوصلة، حرّك الهاتف في الهواء على شكل الرقم ٨.
            </p>
          )}
          {liveCompass && !needsCalibration && (
            <p className="ar text-[11px] text-bone-dim text-center leading-relaxed">
              ✦ البوصلة مفعّلة. أدِر هاتفك حتى يتّجه السهم إلى الأعلى — عندئذٍ
              يكون أعلى الهاتف نحو القبلة.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
