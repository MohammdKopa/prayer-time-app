"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeDay, PRAYER_ORDER, type PrayerName } from "@/lib/prayer-engine";
import { computeConsensus } from "@/lib/consensus";
import {
  formatCountdownAr,
  formatDateAr,
  formatHijriDateAr,
  formatHMS,
  PRAYER_LABEL_AR,
  toArabicDigits,
} from "@/lib/format";
import { type City, DEFAULT_CITY, findCity, NRW_TZ } from "@/lib/cities";
import { useAzanPlayer } from "@/lib/azan";
import { useBackgroundPush } from "@/lib/push-client";
import { CitySwitcher } from "./CitySwitcher";
import { InstallBanner } from "./InstallBanner";
import { PrayerRow } from "./PrayerRow";
import { QiblaCompass } from "./QiblaCompass";

const STORAGE_KEY = "prayer-times.city";

function findNextPrayer(
  times: Record<PrayerName, Date>,
  now: Date,
): { name: PrayerName; at: Date } | null {
  for (const p of PRAYER_ORDER) {
    if (p === "sunrise") continue;
    if (times[p].getTime() > now.getTime()) {
      return { name: p, at: times[p] };
    }
  }
  return null;
}

export function ClockClient() {
  const [now, setNow] = useState<Date>(() => new Date(0));
  const [hydrated, setHydrated] = useState(false);
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [flash, setFlash] = useState(false);
  const [qiblaOpen, setQiblaOpen] = useState(false);
  const flashTimer = useRef<number | null>(null);
  const lastTickRef = useRef<Date | null>(null);
  const azan = useAzanPlayer();
  const push = useBackgroundPush();

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    const restored = saved ? findCity(saved) : undefined;
    if (restored) setCity(restored);
    setNow(new Date());
    setHydrated(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const setCityAndPersist = useCallback(
    (c: City) => {
      setCity((prev) => {
        if (prev.id !== c.id) {
          setFlash(true);
          if (flashTimer.current) window.clearTimeout(flashTimer.current);
          flashTimer.current = window.setTimeout(() => setFlash(false), 1500);
        }
        return c;
      });
      try {
        window.localStorage.setItem(STORAGE_KEY, c.id);
      } catch {
        /* ignore */
      }
      // If background notifications are on, the server needs the new city.
      void push.syncCity(c);
    },
    [push],
  );

  // Combined bell action: toggle audio mute AND (when enabling) try to set up
  // background pushes. If the user denies the OS prompt, audio still works
  // while the tab is open — degrade gracefully.
  const handleBellClick = useCallback(async () => {
    if (azan.muted) {
      await azan.toggleMute(); // unlocks + unmutes
      if (push.state !== "unsupported" && push.state !== "denied") {
        await push.enable(city);
      }
    } else {
      await azan.toggleMute(); // mutes
      if (push.state === "subscribed") {
        await push.disable();
      }
    }
  }, [azan, push, city]);

  // Listen for the SW's "play this prayer now" message that fires when the
  // user taps a background notification.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const handler = (event: MessageEvent) => {
      const data = event.data as { type?: string; prayer?: string } | null;
      if (data?.type === "play-azan" && data.prayer) {
        azan.play(data.prayer as PrayerName);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [azan]);

  const dateKey = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: NRW_TZ,
    });
    return fmt.format(now);
  }, [now]);

  const day = useMemo(
    () => computeDay(city.latitude, city.longitude, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateKey, city.id],
  );

  const consensus = useMemo(() => computeConsensus(day), [day]);

  // Tomorrow — computed once per day for the "next prayer is tomorrow's Fajr" case
  const dayTomorrow = useMemo(() => {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return computeDay(city.latitude, city.longitude, tomorrow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, city.id]);

  const next = useMemo(() => {
    const todayNext = findNextPrayer(day.primary.times, now);
    if (todayNext) return { ...todayNext, isTomorrow: false as const };
    // All today's prayers are past — surface tomorrow's Fajr
    return {
      name: "fajr" as PrayerName,
      at: dayTomorrow.primary.times.fajr,
      isTomorrow: true as const,
    };
  }, [day, dayTomorrow, now]);

  // Fire azan when 'now' crosses a prayer time (today only — fajr-tomorrow is
  // handled by the next day's mount).
  useEffect(() => {
    if (!hydrated) return;
    const prev = lastTickRef.current;
    lastTickRef.current = now;
    if (!prev) return;
    const prevMs = prev.getTime();
    const nowMs = now.getTime();
    for (const p of PRAYER_ORDER) {
      if (p === "sunrise") continue;
      const t = day.primary.times[p].getTime();
      if (t > prevMs && t <= nowMs) {
        azan.play(p);
        break;
      }
    }
  }, [now, hydrated, day, azan]);

  // Sanity-check watchdog
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `/api/sanity-check?lat=${city.latitude}&lng=${city.longitude}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as {
          timings: Record<string, string>;
          dateUsed: string;
        };
        if (cancelled) return;
        const aladhanKey: Record<PrayerName, string> = {
          fajr: "Fajr",
          sunrise: "Sunrise",
          dhuhr: "Dhuhr",
          asr: "Asr",
          maghrib: "Maghrib",
          isha: "Isha",
        };
        const issues: string[] = [];
        for (const p of PRAYER_ORDER) {
          const localT = day.primary.times[p];
          const aladhanStr = data.timings[aladhanKey[p]];
          if (!aladhanStr) continue;
          const [h, m] = aladhanStr.split(":").map(Number);
          const ref = new Date(localT);
          ref.setHours(h, m, 0, 0);
          const diffS = Math.round(
            (localT.getTime() - ref.getTime()) / 1000,
          );
          if (Math.abs(diffS) > 30) {
            issues.push(
              `${p}: local=${localT.toISOString()} aladhan=${aladhanStr} Δ=${diffS}s`,
            );
          }
        }
        if (issues.length > 0) {
          console.warn(
            `[sanity-check ${city.name}] divergence vs Aladhan MWL:`,
            issues,
          );
        } else {
          console.info(
            `[sanity-check ${city.name}] ok — local engine matches Aladhan MWL within 30s`,
          );
        }
      } catch (err) {
        console.warn("[sanity-check] fetch failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, dateKey, day, city]);

  return (
    <main
      className={`mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10 ${
        flash ? "city-flash" : ""
      }`}
      dir="rtl"
    >
      {/* ── Header ────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-3">
        <CitySwitcher current={city} onChange={setCityAndPersist} />
        <div className="flex items-center gap-2">
          <div className="ar flex flex-col items-end leading-tight" dir="rtl">
            <span className="text-xs text-bone-dim tracking-wide">
              {hydrated ? formatDateAr(now, NRW_TZ) : "—"}
            </span>
            <span className="text-[10px] text-gold/75 tracking-wide tnum">
              {hydrated ? formatHijriDateAr(now, NRW_TZ) : "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              void handleBellClick();
            }}
            disabled={push.busy}
            className="glass glass-interactive relative inline-flex h-8 w-8 items-center justify-center rounded-full text-gold-soft hover:bg-white/[0.09] transition disabled:opacity-60"
            aria-label={azan.muted ? "تفعيل صوت الأذان" : "كتم صوت الأذان"}
            title={azan.muted ? "تفعيل صوت الأذان" : "كتم صوت الأذان"}
          >
            {azan.muted ? (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
                <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
                <path d="M18 8a6 6 0 0 0-9.33-5" />
                <line x1="3" y1="3" x2="21" y2="21" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            )}
            {!azan.muted && push.state === "subscribed" && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-good ring-1 ring-[#04100c]"
                title="إشعارات الخلفية مفعّلة"
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => setQiblaOpen(true)}
            className="glass glass-interactive inline-flex h-8 w-8 items-center justify-center rounded-full text-gold-soft hover:bg-white/[0.09] transition"
            aria-label="القبلة"
            title="القبلة"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4">
              <path
                d="M10 2 L13 10 L10 18 L7 10 Z"
                fill="currentColor"
                opacity="0.92"
              />
              <circle cx="10" cy="10" r="1.4" fill="#04100c" />
            </svg>
          </button>
        </div>
      </header>

      {/* Qibla modal */}
      <QiblaCompass
        open={qiblaOpen}
        onClose={() => setQiblaOpen(false)}
        city={city}
      />

      {/* ── Hero glass card — live clock + next prayer in one ─ */}
      <section className="mt-6">
        <div className="glass glass-tint-gold rounded-[28px] px-6 pt-5 pb-7 text-center">
          {/* Live clock row */}
          <div className="flex items-baseline justify-between px-1">
            <span className="ar text-[10px] uppercase tracking-[0.3em] text-bone-dim">
              الآن
            </span>
            <span
              className="text-2xl font-light tnum tabular-nums text-bone hero-tick"
              dir="ltr"
            >
              {hydrated ? formatHMS(now, NRW_TZ) : "٠٠:٠٠:٠٠"}
            </span>
          </div>

          <div className="mt-5 divider" />

          <div className="ar mt-5 text-[11px] uppercase tracking-[0.3em] text-gold/80">
            {next.isTomorrow ? "أوّل صلاة غداً" : "الصلاة القادمة"}
          </div>

          <div
            className="ar mt-3 text-[clamp(3.75rem,18vw,5.75rem)] font-bold leading-none text-bone tracking-tight flash-target"
            dir="rtl"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}
          >
            {PRAYER_LABEL_AR[next.name]}
          </div>

          <div
            className="mt-3 text-[clamp(2.5rem,11vw,3.75rem)] font-extralight leading-none tnum text-gold-soft flash-target tracking-tight"
            dir="ltr"
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.4)" }}
          >
            {toArabicDigits(
              next.at.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: NRW_TZ,
              }),
            )}
          </div>

          <div className="ar mt-3 text-base text-bone-dim">
            {formatCountdownAr(next.at.getTime() - now.getTime())}
          </div>
        </div>
      </section>

      {/* ── Prayer chips ──────────────────────────────────── */}
      <section className="mt-4 flex flex-col gap-2.5">
        {PRAYER_ORDER.filter((p) => p !== "sunrise").map((p) => (
          <PrayerRow
            key={p}
            prayer={p}
            time={day.primary.times[p]}
            consensus={consensus[p]}
            isNext={hydrated && next?.name === p}
            isPast={hydrated && day.primary.times[p].getTime() < now.getTime()}
            timeZone={NRW_TZ}
          />
        ))}
      </section>

      {/* ── Install-to-home-screen banner ─────────────────── */}
      {hydrated && <InstallBanner />}

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="mt-6 flex flex-col items-center gap-1.5 text-center">
        <div className="ar text-[11px] text-bone-dim tracking-wide">
          {day.primary.shortLabel} · مُتحقَّق عبر{" "}
          {toArabicDigits(day.alternates.length)} طرق
        </div>
        <div className="ar text-[11px] text-bone-faint">
          بلا إعلانات · بلا أوقات خاطئة · يُحسب على هذا الجهاز
        </div>
      </footer>
    </main>
  );
}
