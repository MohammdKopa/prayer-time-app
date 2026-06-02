"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { computeDay, type PrayerName } from "@/lib/prayer-engine";
import {
  formatCountdownAr,
  formatDateAr,
  formatHijriDateAr,
  formatHM,
  formatHMS,
  PRAYER_LABEL_AR,
  PRAYER_LABEL_DE,
} from "@/lib/format";
import { type City, NRW_TZ } from "@/lib/cities";
import { DisplaySunArc } from "./DisplaySunArc";

const GRID_ORDER: PrayerName[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

const STATUS_ORDER: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

// Deterministic gold-dust field (no Math.random → no hydration mismatch).
// Kept lean (8 motes) — each is its own animated compositor layer, and weak
// TV GPUs feel the count. Spread across the width so it still reads as a field.
const DUST = [
  { left: 6, size: 5, dur: 26, tw: 4.0, delay: -3 },
  { left: 22, size: 6, dur: 22, tw: 3.4, delay: -8 },
  { left: 39, size: 4, dur: 29, tw: 4.6, delay: -2 },
  { left: 47, size: 7, dur: 20, tw: 3.0, delay: -15 },
  { left: 62, size: 5, dur: 24, tw: 4.2, delay: -18 },
  { left: 78, size: 6, dur: 21, tw: 3.6, delay: -4 },
  { left: 85, size: 3, dur: 39, tw: 6.4, delay: -22 },
  { left: 96, size: 3, dur: 33, tw: 5.0, delay: -7 },
];

// A rotating "saying": Qurʾan (﴿ ﴾), authentic ḥadīth (« » + ﷺ·source), or a
// dhikr phrase (flanked by ◆). Only sahih / agreed-upon ḥadīth, each sourced.
// Mostly general remembrance — not only prayer — for variety on the wall.
type Saying = {
  text: string;
  kind: "quran" | "hadith" | "dhikr";
  source?: string;
};

const SAYINGS_NORMAL: Saying[] = [
  { kind: "dhikr", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ" },
  { kind: "quran", text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ" },
  { kind: "hadith", text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", source: "متفق عليه" },
  { kind: "dhikr", text: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ" },
  { kind: "quran", text: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ" },
  { kind: "hadith", text: "الطُّهُورُ شَطْرُ الإِيمَانِ", source: "رواه مسلم" },
  { kind: "dhikr", text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ" },
  { kind: "quran", text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا" },
  { kind: "hadith", text: "الدِّينُ النَّصِيحَةُ", source: "رواه مسلم" },
  { kind: "dhikr", text: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ" },
  { kind: "quran", text: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ" },
  {
    kind: "hadith",
    text: "الكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ",
    source: "متفق عليه",
  },
  { kind: "dhikr", text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ" },
  { kind: "quran", text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا" },
  {
    kind: "hadith",
    text: "خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ",
    source: "رواه البخاري",
  },
  { kind: "dhikr", text: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَٰهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ" },
  { kind: "quran", text: "وَأَقِمِ الصَّلَاةَ لِذِكْرِي" },
  {
    kind: "hadith",
    text: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    source: "متفق عليه",
  },
  { kind: "quran", text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ" },
  {
    kind: "hadith",
    text: "المُسْلِمُ مَنْ سَلِمَ المُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    source: "متفق عليه",
  },
];

const SAYINGS_FRIDAY: Saying[] = [
  {
    kind: "quran",
    text: "يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ وَذَرُوا الْبَيْعَ",
  },
  { kind: "hadith", text: "خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الجُمُعَةِ", source: "رواه مسلم" },
  { kind: "dhikr", text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ" },
  { kind: "hadith", text: "أَكْثِرُوا الصَّلَاةَ عَلَيَّ يَوْمَ الجُمُعَةِ", source: "رواه أبو داود" },
  { kind: "quran", text: "فَإِذَا قُضِيَتِ الصَّلَاةُ فَانتَشِرُوا فِي الْأَرْضِ وَابْتَغُوا مِن فَضْلِ اللَّهِ" },
  {
    kind: "hadith",
    text: "فِي الجُمُعَةِ سَاعَةٌ لَا يُوَافِقُهَا مُسْلِمٌ يَسْأَلُ اللَّهَ خَيْرًا إِلَّا أَعْطَاهُ",
    source: "متفق عليه",
  },
  { kind: "dhikr", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ" },
];

function findNextPrayer(
  times: Record<PrayerName, Date>,
  now: Date,
): { name: PrayerName; at: Date } | null {
  for (const p of GRID_ORDER) {
    if (p === "sunrise") continue;
    if (times[p].getTime() > now.getTime()) return { name: p, at: times[p] };
  }
  return null;
}

function Corner({ style }: { style: CSSProperties }) {
  return (
    <svg
      className="display-corner fade-in"
      style={{ animationDelay: "0.9s", ...style }}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
    >
      <path d="M6 56 Q6 6 56 6" />
      <path d="M20 56 Q20 20 56 20" />
      <path d="M6 56 L6 82" />
      <path d="M56 6 L82 6" />
      <circle cx="20" cy="20" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Full-screen "illuminated mushaf" plasma display for a mosque wall.
 * Ornamented gold frame, calligraphic clock, real-time sun-arc, prayer cards,
 * rotating āyah, Jumuʿa emphasis on Fridays. Read-only, no scroll, wake-locked.
 */
export function DisplayClient({
  city,
  title,
  jumua,
  hijriOffset = 0,
}: {
  city: City;
  title?: string;
  jumua: string;
  hijriOffset?: number;
}) {
  const [now, setNow] = useState<Date>(() => new Date(0));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setNow(new Date());
    setHydrated(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Kiosk self-heal: reload once at ~03:00 local so a weeks-long session never
  // drifts, leaks, or misses a deploy. (Plasma clock = Europe/Berlin.)
  useEffect(() => {
    const n = new Date();
    const next = new Date(n);
    next.setHours(3, 0, 0, 0);
    if (next.getTime() <= n.getTime()) next.setDate(next.getDate() + 1);
    const id = setTimeout(
      () => window.location.reload(),
      next.getTime() - n.getTime(),
    );
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    type WLNav = { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };
    let sentinel: Sentinel | null = null;
    let released = false;
    const acquire = async () => {
      try {
        const wl = (navigator as Navigator & WLNav).wakeLock;
        if (wl) sentinel = await wl.request("screen");
      } catch {
        /* unsupported — screen may dim, display still works */
      }
    };
    void acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible" && !released) void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release();
    };
  }, []);

  const dateKey = useMemo(
    () =>
      new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: NRW_TZ,
      }).format(now),
    [now],
  );

  const day = useMemo(
    () => computeDay(city.latitude, city.longitude, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateKey, city.id],
  );

  const dayTomorrow = useMemo(() => {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return computeDay(city.latitude, city.longitude, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, city.id]);

  const isFriday = useMemo(() => {
    if (!hydrated) return false;
    return (
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: NRW_TZ,
      }).format(now) === "Fri"
    );
  }, [now, hydrated]);

  // Today's Jumuʿa instant (HH:MM on the local Berlin date). Assumes the
  // plasma's clock is on Europe/Berlin — true for a German mosque.
  const jumuaAt = useMemo(() => {
    const [hh = "14", mm = "00"] = jumua.split(":");
    return new Date(
      `${dateKey}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`,
    );
  }, [dateKey, jumua]);

  // On Fridays the Dhuhr slot is the (fixed) Jumuʿa time; the astronomical
  // Dhuhr is kept separately as "when the window opens". Everything downstream
  // (countdown, arc, cards) reads `times`.
  const times = useMemo(
    () =>
      isFriday ? { ...day.primary.times, dhuhr: jumuaAt } : day.primary.times,
    [day, isFriday, jumuaAt],
  );

  const next = useMemo(() => {
    const todayNext = findNextPrayer(times, now);
    if (todayNext) return { ...todayNext, isTomorrow: false as const };
    return {
      name: "fajr" as PrayerName,
      at: dayTomorrow.primary.times.fajr,
      isTomorrow: true as const,
    };
  }, [times, dayTomorrow, now]);

  const current = useMemo(() => {
    let c: PrayerName = "isha";
    for (const p of STATUS_ORDER) {
      if (times[p].getTime() <= now.getTime()) c = p;
    }
    return c;
  }, [times, now]);

  // "It's prayer time now" — true for ~2 min after a waqt enters.
  const prayerNow = useMemo(() => {
    if (!hydrated) return null;
    const WINDOW = 120_000;
    for (const p of STATUS_ORDER) {
      const t = times[p].getTime();
      if (now.getTime() >= t && now.getTime() - t < WINDOW) return p;
    }
    return null;
  }, [times, now, hydrated]);

  // Gentle auto-dim in the dead of night to spare the panel.
  const nightDim = useMemo(() => {
    if (!hydrated) return 0;
    const h = Number(
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        hour12: false,
        timeZone: NRW_TZ,
      }).format(now),
    );
    if (h >= 0 && h < 5) return 0.45;
    if (h === 5 || h === 23) return 0.28;
    return 0;
  }, [now, hydrated]);

  // Hijri date, optionally nudged ±N days to match the local moon sighting.
  const hijriDisplay = useMemo(() => {
    if (!hydrated) return "—";
    const d = new Date(now);
    if (hijriOffset) d.setDate(d.getDate() + hijriOffset);
    return formatHijriDateAr(d, NRW_TZ);
  }, [now, hydrated, hijriOffset]);

  const sayings = isFriday ? SAYINGS_FRIDAY : SAYINGS_NORMAL;
  const sayingIndex = hydrated
    ? Math.floor(now.getTime() / 12000) % sayings.length
    : 0;
  const saying = sayings[sayingIndex];
  const isHadith = saying.kind === "hadith";
  const isDhikr = saying.kind === "dhikr";
  const openMark = isHadith ? "«" : isDhikr ? "◆" : "﴿";
  const closeMark = isHadith ? "»" : isDhikr ? "◆" : "﴾";

  const labelFor = (p: PrayerName) =>
    isFriday && p === "dhuhr" ? "الجمعة" : PRAYER_LABEL_AR[p];

  // German subtitle for the non-Arabic congregation. Jumuʿa relabels Dhuhr.
  const labelDeFor = (p: PrayerName) =>
    isFriday && p === "dhuhr" ? "Freitagsgebet" : PRAYER_LABEL_DE[p];

  return (
    <main dir="rtl" className="display-root w-full">
      {/* ── Atmosphere & ornament ──────────────────────────── */}
      <div className="display-pattern" aria-hidden="true">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="stars"
              width="74"
              height="74"
              patternUnits="userSpaceOnUse"
            >
              <g
                fill="none"
                stroke="rgba(232,200,120,0.09)"
                strokeWidth="1"
              >
                <rect x="19" y="19" width="36" height="36" />
                <rect
                  x="19"
                  y="19"
                  width="36"
                  height="36"
                  transform="rotate(45 37 37)"
                />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stars)" />
        </svg>
      </div>

      {DUST.map((d, i) => (
        <span
          key={i}
          className="dust"
          aria-hidden="true"
          style={{
            left: `${d.left}%`,
            bottom: 0,
            width: `${d.size}px`,
            height: `${d.size}px`,
            animationDuration: `${d.dur}s, ${d.tw}s`,
            animationDelay: `${d.delay}s, ${d.delay}s`,
          }}
        />
      ))}

      <div className="display-frame" aria-hidden="true" />
      <Corner style={{ top: "1.6vh", left: "1.4vw" }} />
      <Corner
        style={{ top: "1.6vh", right: "1.4vw", transform: "rotate(90deg)" }}
      />
      <Corner
        style={{
          bottom: "1.6vh",
          right: "1.4vw",
          transform: "rotate(180deg)",
        }}
      />
      <Corner
        style={{
          bottom: "1.6vh",
          left: "1.4vw",
          transform: "rotate(270deg)",
        }}
      />

      {/* ── Content ────────────────────────────────────────── */}
      <div className="display-content flex h-full flex-col px-[5vw] py-[3.8vh]">
        {/* Header */}
        <header className="reveal flex flex-col items-center text-center">
          <div
            className="flex items-center justify-center gap-[1.6vw]"
            style={{ color: "var(--leaf)" }}
          >
            <Flourish />
            <h1
              className="font-kufi leaf-text font-bold leading-none"
              style={{ fontSize: "min(6.2vh, 4.6vw)" }}
            >
              {title ?? `مسجد ${city.name}`}
            </h1>
            <Flourish mirror />
          </div>
          <div
            className="font-kufi mt-[1.4vh] flex items-center gap-[1.2vw] text-bone-dim"
            style={{ fontSize: "min(2.7vh, 2vw)" }}
          >
            <span>{hydrated ? formatDateAr(now, NRW_TZ) : "—"}</span>
            <span className="text-gold/40">◆</span>
            <span className="tnum text-gold/85">{hijriDisplay}</span>
            <span className="text-gold/40">◆</span>
            <span className="text-bone-faint">{city.name} · NRW</span>
          </div>
        </header>

        {/* Hero: clock + next prayer */}
        <section
          className="reveal grid flex-none grid-cols-[1.05fr_0.95fr] items-stretch gap-[2.2vw]"
          style={{ animationDelay: "0.15s", marginTop: "1.2vh" }}
        >
          {/* Live clock */}
          <div className="glass flex flex-col items-center justify-center rounded-[2vh] px-[2vw] py-[1.1vh]">
            <span
              className="font-kufi text-bone-faint"
              style={{ fontSize: "min(2.6vh, 1.9vw)", letterSpacing: "0.5em" }}
            >
              الآن
            </span>
            <span
              dir="ltr"
              className="font-kufi tnum text-bone"
              style={{
                fontSize: "min(10.5vh, 8vw)",
                fontWeight: 600,
                lineHeight: 1,
                textShadow: "0 0.4vh 3vh rgba(0,0,0,0.5)",
              }}
            >
              {hydrated ? formatHMS(now, NRW_TZ) : "00:00:00"}
            </span>
            <span
              className="font-kufi text-gold/80"
              style={{ fontSize: "min(2.6vh, 1.9vw)", marginTop: "1vh" }}
            >
              {hydrated ? `وقت ${PRAYER_LABEL_AR[current]}` : "—"}
            </span>
          </div>

          {/* Next prayer */}
          <div className="glass glass-tint-gold breathe-gold sheen relative flex flex-col items-center justify-center overflow-hidden rounded-[2vh] px-[2vw] py-[1.1vh]">
            <span
              className="font-kufi text-gold/85"
              style={{ fontSize: "min(2.8vh, 2.1vw)", letterSpacing: "0.18em" }}
            >
              {next.isTomorrow ? "أوّل صلاة غداً" : "الصلاة القادمة"}
            </span>
            <span
              className="font-kufi font-bold text-bone"
              style={{
                fontSize: "min(6.8vh, 5.2vw)",
                lineHeight: 1.05,
                marginTop: "0.4vh",
              }}
            >
              {labelFor(next.name)}
            </span>
            <span
              dir="ltr"
              className="text-bone-faint"
              style={{
                fontSize: "min(2.4vh, 1.8vw)",
                letterSpacing: "0.04em",
                marginTop: "0.2vh",
              }}
            >
              {labelDeFor(next.name)}
            </span>
            <span
              dir="ltr"
              className="tnum leaf-text font-bold"
              style={{ fontSize: "min(5.6vh, 4.3vw)", lineHeight: 1, marginTop: "0.4vh" }}
            >
              {hydrated ? formatHM(next.at, NRW_TZ) : "—"}
            </span>
            <span
              className="font-kufi tnum text-bone-dim"
              style={{ fontSize: "min(3vh, 2.2vw)", marginTop: "0.8vh" }}
            >
              {hydrated
                ? formatCountdownAr(next.at.getTime() - now.getTime())
                : "—"}
            </span>
          </div>
        </section>

        {/* Sun arc */}
        <section
          className="reveal flex-1"
          style={{ animationDelay: "0.3s", marginTop: "1vh", minHeight: "24vh" }}
        >
          <DisplaySunArc
            now={hydrated ? now : day.primary.times.dhuhr}
            prayerTimes={times}
            timeZone={NRW_TZ}
            nextPrayer={next.isTomorrow ? null : next.name}
          />
        </section>

        {/* Prayer cards */}
        <section
          className="reveal grid flex-none grid-cols-6"
          style={{ animationDelay: "0.45s", gap: "1vw", height: "15vh" }}
        >
          {GRID_ORDER.map((p) => {
            const t = times[p];
            const isNext = !next.isTomorrow && next.name === p;
            const isPast = hydrated && t.getTime() < now.getTime();
            const isJumua = isFriday && p === "dhuhr";
            const hot = isNext || isJumua;
            return (
              <div
                key={p}
                className={`relative flex flex-col items-center justify-center rounded-[1.4vh] ${
                  hot ? "glass glass-tint-gold" : "glass"
                } ${isPast && !hot ? "opacity-45" : ""} ${
                  isNext ? "breathe-gold" : ""
                }`}
                style={
                  isJumua && !isNext
                    ? { boxShadow: "0 0 0 0.25vh rgba(232,200,120,0.4) inset" }
                    : undefined
                }
              >
                <span
                  className={`font-kufi ${
                    hot ? "text-gold-soft" : "text-bone-dim"
                  }`}
                  style={{ fontSize: "min(3.4vh, 2.3vw)" }}
                >
                  {labelFor(p)}
                </span>
                <span
                  dir="ltr"
                  className={hot ? "text-gold/65" : "text-bone-faint"}
                  style={{
                    fontSize: "min(1.7vh, 1.25vw)",
                    letterSpacing: "0.02em",
                    marginTop: "0.1vh",
                  }}
                >
                  {labelDeFor(p)}
                </span>
                <span
                  dir="ltr"
                  className="font-kufi tnum text-bone"
                  style={{
                    fontSize: "min(5.6vh, 3.9vw)",
                    fontWeight: 600,
                    marginTop: "0.5vh",
                    lineHeight: 1,
                  }}
                >
                  {hydrated ? formatHM(t, NRW_TZ) : "—"}
                </span>
                {isJumua && (
                  <span
                    className="font-kufi tnum text-gold/60"
                    style={{ fontSize: "min(1.9vh, 1.4vw)", marginTop: "0.5vh" }}
                  >
                    يبدأ الوقت {formatHM(day.primary.times.dhuhr, NRW_TZ)}
                  </span>
                )}
              </div>
            );
          })}
        </section>

        {/* Qurʾan / ḥadīth ticker */}
        <footer
          className="reveal flex flex-none items-center justify-center"
          style={{ animationDelay: "0.6s", height: "8.5vh" }}
        >
          <div
            key={`${isFriday ? "f" : "n"}-${sayingIndex}`}
            className="ayah-fade flex flex-col items-center text-center"
          >
            <div className="flex items-center justify-center">
              <span
                className="text-gold/55"
                style={{
                  fontSize: isDhikr ? "min(1.8vh, 1.3vw)" : "min(3.6vh, 2.7vw)",
                  marginInline: "0.9vw",
                }}
                aria-hidden="true"
              >
                {openMark}
              </span>
              <span
                className={isDhikr ? "font-amiri text-gold-soft" : "font-amiri text-bone"}
                style={{ fontSize: "min(3.6vh, 2.7vw)", lineHeight: 1.5 }}
              >
                {saying.text}
              </span>
              <span
                className="text-gold/55"
                style={{
                  fontSize: isDhikr ? "min(1.8vh, 1.3vw)" : "min(3.6vh, 2.7vw)",
                  marginInline: "0.9vw",
                }}
                aria-hidden="true"
              >
                {closeMark}
              </span>
            </div>
            {isHadith && (
              <span
                className="font-kufi text-gold/55"
                style={{
                  fontSize: "min(1.9vh, 1.45vw)",
                  marginTop: "0.5vh",
                  letterSpacing: "0.08em",
                }}
              >
                ﷺ · {saying.source}
              </span>
            )}
          </div>
        </footer>
      </div>

      {/* Night-dim wash */}
      <div className="night-dim" style={{ opacity: nightDim }} aria-hidden="true" />

      {/* "It's prayer time now" takeover */}
      {prayerNow && (
        <div className="prayer-now" dir="rtl">
          <div className="flex flex-col items-center text-center">
            <span
              className="font-kufi text-gold/80"
              style={{ fontSize: "min(4vh, 3vw)", letterSpacing: "0.2em" }}
            >
              حانَ الآنَ موعِدُ
            </span>
            <span
              className="font-kufi leaf-text prayer-now-name font-bold"
              style={{
                fontSize: "min(18vh, 13vw)",
                lineHeight: 1.05,
                marginBlock: "1.5vh",
              }}
            >
              صلاةِ {labelFor(prayerNow)}
            </span>
            <span
              dir="ltr"
              className="font-kufi text-gold/70"
              style={{
                fontSize: "min(3.2vh, 2.4vw)",
                letterSpacing: "0.05em",
                marginBottom: "1.5vh",
              }}
            >
              Zeit für das {labelDeFor(prayerNow)}
            </span>
            <span
              className="font-amiri text-bone-dim"
              style={{ fontSize: "min(4.5vh, 3.4vw)" }}
            >
              حَيَّ عَلَى الصَّلَاةِ · حَيَّ عَلَى الْفَلَاحِ
            </span>
          </div>
        </div>
      )}
    </main>
  );
}

/** Small calligraphic flourish flanking the mosque name. */
function Flourish({ mirror = false }: { mirror?: boolean }) {
  return (
    <svg
      viewBox="0 0 80 24"
      aria-hidden="true"
      style={{
        width: "min(9vh, 7vw)",
        height: "auto",
        color: "var(--leaf)",
        opacity: 0.75,
        transform: mirror ? "scaleX(-1)" : undefined,
      }}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    >
      <path d="M2 12 H46 Q58 12 60 6 Q62 0 68 2 Q74 4 70 10" />
      <path d="M70 10 Q66 14 60 12" />
      <circle cx="74" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <path d="M2 16 H40" opacity="0.5" />
    </svg>
  );
}
