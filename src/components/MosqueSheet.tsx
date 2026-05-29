"use client";

import { useEffect, useMemo, useState } from "react";
import { type City } from "@/lib/cities";
import { mapsUrl, mosquesForCity, type Mosque } from "@/data/mosques";
import { track } from "@/lib/analytics";

export function MosqueSheet({
  open,
  onClose,
  city,
}: {
  open: boolean;
  onClose: () => void;
  city: City;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const mosques = useMemo(() => mosquesForCity(city.id), [city.id]);

  // Reset expansion whenever the sheet opens or the city changes.
  useEffect(() => {
    if (open) setExpanded(null);
  }, [open, city.id]);

  // Lock body scroll + Escape-to-close, matching CitySwitcher.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/55 sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`مساجد ${city.name}`}
        onClick={(e) => e.stopPropagation()}
        className="glass glass-strong w-full max-w-md rounded-t-3xl sm:rounded-3xl sm:m-4 max-h-[85dvh] flex flex-col"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        dir="rtl"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="ar text-base font-medium text-bone">
            🕌 مساجد {city.name}
          </div>
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

        <ul className="flex-1 overflow-y-auto px-3 pb-4" dir="rtl">
          {mosques.length === 0 && (
            <li className="ar px-4 py-10 text-center text-sm text-bone-dim">
              لا توجد مساجد مُدرجة في {city.name} بعد.
            </li>
          )}

          {mosques.map((m) => (
            <li key={m.id} className="mb-2">
              <MosqueCard
                mosque={m}
                open={expanded === m.id}
                onToggle={() =>
                  setExpanded((cur) => (cur === m.id ? null : m.id))
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MosqueCard({
  mosque,
  open,
  onToggle,
}: {
  mosque: Mosque;
  open: boolean;
  onToggle: () => void;
}) {
  const m = mosque;
  return (
    <div
      className={`rounded-2xl transition-colors ${
        open ? "bg-white/[0.07] ring-1 ring-gold/20" : "hover:bg-white/[0.05]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right"
        aria-expanded={open}
      >
        <span className="flex flex-col items-start gap-0.5 min-w-0">
          <span className="ar font-medium text-bone leading-tight">
            {m.nameAr ?? m.name}
          </span>
          {m.nameAr && (
            <span
              className="truncate max-w-full text-[11px] text-bone-dim tracking-wide"
              dir="ltr"
            >
              {m.name}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 shrink-0">
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            className={`h-2.5 w-2.5 opacity-70 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            <path
              d="M2 4l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1">
          {/* Address */}
          <div className="ar flex items-start gap-2 text-[13px] text-bone-dim">
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-soft"
            >
              <path
                d="M10 1.5a5 5 0 015 5c0 3.866-5 11-5 11s-5-7.134-5-11a5 5 0 015-5zm0 7a2 2 0 100-4 2 2 0 000 4z"
                fill="currentColor"
              />
            </svg>
            <span dir={m.address ? "ltr" : "rtl"}>
              {m.address ?? "العنوان قيد التأكيد"}
            </span>
          </div>

          {/* Phone */}
          {m.phone && (
            <a
              href={`tel:${m.phone.replace(/\s+/g, "")}`}
              className="mt-2 inline-flex items-center gap-2 text-[13px] text-gold-soft hover:text-gold transition"
              dir="ltr"
            >
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="h-3.5 w-3.5"
              >
                <path
                  d="M3 4.5C3 3.7 3.7 3 4.5 3H6c.6 0 1.1.4 1.3 1l.7 2.6c.1.5 0 1-.4 1.3l-1.2 1c.8 1.7 2.2 3.1 3.9 3.9l1-1.2c.3-.4.8-.5 1.3-.4l2.6.7c.6.2 1 .7 1 1.3V16c0 .8-.7 1.5-1.5 1.5C8.9 17.5 3 11.6 3 4.5z"
                  fill="currentColor"
                />
              </svg>
              {m.phone}
            </a>
          )}

          {/* Imam announcement / community note */}
          {m.info && (
            <div className="ar mt-3 rounded-xl bg-gold/[0.08] px-3 py-2.5 text-[13px] leading-relaxed text-bone ring-1 ring-gold/15">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] text-gold-soft">
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5">
                  <path
                    d="M4 3h12a1 1 0 011 1v9a1 1 0 01-1 1H8l-4 3v-3H4a1 1 0 01-1-1V4a1 1 0 011-1z"
                    fill="currentColor"
                  />
                </svg>
                إعلان المسجد
              </div>
              {m.info}
            </div>
          )}

          {/* Open in Maps — solid CTA (not glass, so text isn't washed out) */}
          <a
            href={mapsUrl(m)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("open-maps", { mosque: m.id, city: m.cityId })}
            className="ar mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold/15 py-2.5 text-sm font-medium text-gold-soft ring-1 ring-gold/25 transition hover:bg-gold/25 active:scale-[0.99]"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
              <path
                d="M10 1.5a5 5 0 015 5c0 3.866-5 11-5 11s-5-7.134-5-11a5 5 0 015-5zm0 7a2 2 0 100-4 2 2 0 000 4z"
                fill="currentColor"
              />
            </svg>
            افتح في الخرائط
          </a>
        </div>
      )}
    </div>
  );
}
