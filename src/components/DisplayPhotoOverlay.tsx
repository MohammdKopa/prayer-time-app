"use client";

import { useEffect } from "react";
import { DISPLAY_PHOTOS } from "@/lib/display-photos";

// How the rotation breathes: a photo fades up for SHOW_S, then the wall returns
// to the clock for the rest of CYCLE_S. Driven entirely off `now` (no timers,
// no Math.random) so it survives hydration and never drifts from the clock.
const CYCLE_S = 300; // one photo every 5 minutes
const SHOW_S = 22; //   held on screen for ~22s, then fades back to the clock

/**
 * Periodic full-screen photograph on the mosque wall — al-Aqṣā & the Dome of
 * the Rock (al-Quds) and the Umayyad Mosques of al-Shām, each with a duʿāʾ.
 *
 * Sits above the content but below the night-dim wash (so it dims at night)
 * and below the "prayer time now" takeover (which always wins). Kiosk-safe:
 * a single image, opacity-only cross-fade, no backdrop-filter.
 */
export function DisplayPhotoOverlay({
  now,
  hydrated,
  suppressed,
}: {
  now: Date;
  hydrated: boolean;
  /** True while the "prayer time now" takeover is up — yield to it. */
  suppressed: boolean;
}) {
  const epoch = Math.floor(now.getTime() / 1000);
  const slot = Math.floor(epoch / CYCLE_S);
  const cyclePos = epoch % CYCLE_S;
  const index =
    ((slot % DISPLAY_PHOTOS.length) + DISPLAY_PHOTOS.length) %
    DISPLAY_PHOTOS.length;
  const active = hydrated && !suppressed && cyclePos < SHOW_S;
  const photo = DISPLAY_PHOTOS[index];
  // Each time this photo comes back around, advance to its next āyah/duʿāʾ.
  const round = Math.floor(slot / DISPLAY_PHOTOS.length);
  const line = photo.texts[round % photo.texts.length];

  // Warm the next image while the current one is still up, so each fade-in
  // shows an already-decoded photo on a weak TV browser (no pop-in).
  useEffect(() => {
    if (!hydrated) return;
    const next = DISPLAY_PHOTOS[(index + 1) % DISPLAY_PHOTOS.length];
    const img = new window.Image();
    img.src = next.src;
  }, [index, hydrated]);

  if (!hydrated) return null;

  return (
    <div
      className="display-photo"
      data-active={active ? "true" : "false"}
      aria-hidden="true"
    >
      {/* keyed by slot → a fresh element each rotation, so the cross-fade
          never catches a half-swapped image on slow decoders */}
      <img
        key={slot}
        src={photo.src}
        alt=""
        className="display-photo-img"
        style={photo.focus ? { objectPosition: photo.focus } : undefined}
        decoding="async"
        loading="eager"
      />
      <div className="display-photo-scrim" />

      <div className="display-photo-caption" dir="rtl">
       <div className="display-photo-card">
        {/* The āyah / duʿāʾ is the hero — large and centred over the backdrop.
            Only an actual āyah wears the ﴿ ﴾ muṣḥaf ornament. */}
        <div
          className="font-amiri text-gold-soft"
          style={{
            fontSize: line.text.length > 80 ? "min(6vh, 4.4vw)" : "min(7.6vh, 5.6vw)",
            lineHeight: 1.7,
            textShadow: "0 0.4vh 2.6vh rgba(0,0,0,0.88)",
          }}
        >
          {line.quran && (
            <span
              className="text-gold/45"
              style={{ marginInline: "1vw", fontSize: "0.62em" }}
            >
              ﴿
            </span>
          )}
          {line.text}
          {line.quran && (
            <span
              className="text-gold/45"
              style={{ marginInline: "1vw", fontSize: "0.62em" }}
            >
              ﴾
            </span>
          )}
        </div>
        {/* Place + German subtitle, quiet beneath the duʿāʾ. */}
        <div
          className="font-kufi leaf-text font-bold"
          style={{
            fontSize: "min(3.8vh, 2.9vw)",
            lineHeight: 1.1,
            marginTop: "4.5vh",
            textShadow: "0 0.3vh 1.6vh rgba(0,0,0,0.8)",
          }}
        >
          {photo.place}
        </div>
        <div
          dir="ltr"
          className="font-kufi text-bone-dim"
          style={{
            fontSize: "min(2.1vh, 1.6vw)",
            letterSpacing: "0.06em",
            marginTop: "0.7vh",
            textShadow: "0 0.2vh 1.2vh rgba(0,0,0,0.8)",
          }}
        >
          {photo.placeDe}
        </div>
       </div>
      </div>

      {/* attribution — required for CC-BY images, kept faint in the corner.
          Omitted for own photos that carry no credit. */}
      {photo.credit && (
        <div className="display-photo-credit" dir="ltr">
          {photo.credit}
        </div>
      )}
    </div>
  );
}
