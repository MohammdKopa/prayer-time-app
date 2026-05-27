"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NRW_CITIES, type City } from "@/lib/cities";
import { toArabicDigits } from "@/lib/format";

export function CitySwitcher({
  current,
  onChange,
}: {
  current: City;
  onChange: (city: City) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      document.documentElement.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.documentElement.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const rest = NRW_CITIES.filter((c) => c.id !== current.id).sort((a, b) =>
        a.name.localeCompare(b.name, "de"),
      );
      return [current, ...rest];
    }
    return NRW_CITIES.filter((c) => c.name.toLowerCase().includes(q)).sort(
      (a, b) => b.population - a.population,
    );
  }, [query, current]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass glass-interactive inline-flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 text-bone hover:bg-white/[0.09] transition"
        aria-label={`تغيير المدينة، الحالية ${current.name}`}
        dir="ltr"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 text-gold-soft">
          <path
            d="M10 1.5a5 5 0 015 5c0 3.866-5 11-5 11s-5-7.134-5-11a5 5 0 015-5zm0 7a2 2 0 100-4 2 2 0 000 4z"
            fill="currentColor"
          />
        </svg>
        <span className="text-sm font-medium tracking-wide">{current.name}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true" className="h-2.5 w-2.5 opacity-60">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-md sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="اختر مدينة"
            onClick={(e) => e.stopPropagation()}
            className="glass glass-strong w-full max-w-md rounded-t-3xl sm:rounded-3xl sm:m-4 max-h-[85vh] flex flex-col"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            dir="rtl"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="ar text-base font-medium text-bone">
                اختر مدينة
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-bone-dim hover:text-bone -ml-1 p-1"
                aria-label="إغلاق"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </button>
            </div>

            <div className="px-5 pb-3">
              <input
                ref={inputRef}
                type="text"
                inputMode="search"
                placeholder="بحث…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ar w-full rounded-2xl bg-black/30 px-4 py-3 text-base text-bone placeholder:text-bone-dim/60 outline-none ring-1 ring-white/10 focus:ring-gold/40 focus:ring-2 transition"
                dir="rtl"
              />
            </div>

            <ul className="flex-1 overflow-y-auto px-2 pb-2" dir="ltr">
              {filtered.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-bone-dim ar" dir="rtl">
                  لا توجد مدينة تطابق &ldquo;{query}&rdquo;
                </li>
              )}
              {filtered.map((city) => {
                const isCurrent = city.id === current.id;
                return (
                  <li key={city.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(city);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                        isCurrent
                          ? "bg-white/10 text-gold-soft ring-1 ring-gold/30"
                          : "text-bone hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className="font-medium tracking-wide">
                        {city.name}
                      </span>
                      <span className="ar text-[11px] text-bone-dim tnum">
                        {toArabicDigits(Math.round(city.population / 1000))} ألف
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
