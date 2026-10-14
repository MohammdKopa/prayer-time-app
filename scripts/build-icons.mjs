// App icon generator.
//
//   node scripts/build-icons.mjs
//
// One master drawing, mobile/assets/brand/mihrab-star.svg (logo #4 of the
// October 2026 poll, "Mihrab + star"), rendered into every icon the app, the
// stores and the website use. Edit the master, run this, commit the PNGs.
//
// The master has four parts, found by their attributes, not by position:
//   - the background: a radial gradient over the whole square
//   - the lattice: the girih pattern clipped to the arch (gold at 32%)
//   - the arch: its gold outline
//   - the star: an eight-point star, stroked twice and filled
// Variants recombine them:
//   full     the drawing as it is: iOS, the Play listing, the web app icons
//   mark     arch + lattice + star on transparent, scaled into the adaptive
//            icon's safe circle: Android foreground, the splash
//   mono     the mark in one colour (lattice faint): Android themed icons
//   small    arch + star, no lattice, heavier lines: anything under ~64 px,
//            where the lattice turns to grey noise (favicon, notification)
//
// Rendering goes through headless Chrome (the same engine as the WebView), so
// the output matches what a browser draws (scripts/lib/render-chrome.mjs).

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { withChrome } from "./lib/render-chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const master = readFileSync(path.join(root, "mobile/assets/brand/mihrab-star.svg"), "utf8");

// ---------------------------------------------------------------- parts --
const defs = master.match(/<defs>[\s\S]*?<\/defs>/)[0];
const archD = master.match(/<clipPath id="b"><path d="([^"]+)"/)[1];
const lattice = master.match(/<path d="[^"]+" fill="none" stroke="#D9B871" stroke-opacity="0\.32"[^>]*\/>/)[0];
// The motif is two stars: an outer eight-point star drawn as a double line
// (gold stroke with a dark hairline inside), and a smaller solid star in it.
const starPaths = [...master.matchAll(/<path d="([^"]{100,400})"([^>]*)\/>/g)].map((m) => m[1]);
const outerStarD = starPaths[0];
const innerStarD = starPaths[3];
if (starPaths.length !== 4 || starPaths[1] !== outerStarD || starPaths[2] !== outerStarD) {
  throw new Error("unexpected star structure in the master");
}
const GOLD = "#D9B871";
const ARCH_FILL = "#0B2418";

// The arch with its 40-unit stroke spans x 242–782, y 120–880.
const ARCH_CENTER = { x: 512, y: 500 };
const ARCH_HALF_DIAGONAL = Math.hypot(782 - 512, 880 - 500); // its far corners

/** Scale the drawing about the arch's centre and set it in the middle. */
const place = (scale) =>
  `translate(512 512) scale(${scale}) translate(${-ARCH_CENTER.x} ${-ARCH_CENTER.y})`;

const svg = (body, extraDefs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${defs.replace(
    "</defs>",
    `${extraDefs}</defs>`,
  )}${body}</svg>`;

const background = `<rect width="1024" height="1024" fill="url(#bg)"/>`;
const clip = `<clipPath id="b"><path d="${archD}"/></clipPath>`;

function markBody({ color = GOLD, archFill = ARCH_FILL, latticeOpacity = 0.32, mono = false } = {}) {
  const lat = lattice
    .replace(`stroke="${GOLD}"`, `stroke="${color}"`)
    .replace('stroke-opacity="0.32"', `stroke-opacity="${latticeOpacity}"`);
  // The lattice stops at the outer star: filled over in colour, masked out
  // in the one-colour version (which has no fill colour to cover it with).
  return (
    `<g clip-path="url(#b)">` +
    (archFill ? `<path d="${archD}" fill="${archFill}"/>` : "") +
    (mono ? `<g mask="url(#star-hole)">${lat}</g>` : lat) +
    (mono ? "" : `<path d="${outerStarD}" fill="${archFill}"/>`) +
    `</g>` +
    `<path d="${archD}" fill="none" stroke="${color}" stroke-width="40"/>` +
    `<path d="${outerStarD}" fill="none" stroke="${color}" stroke-width="26" stroke-linejoin="miter" stroke-miterlimit="12"/>` +
    (mono ? "" : `<path d="${outerStarD}" fill="none" stroke="#06170F" stroke-width="8" stroke-linejoin="miter" stroke-miterlimit="12"/>`) +
    `<path d="${innerStarD}" fill="${color}"/>`
  );
}

/** Under ~48 px: no lattice, heavier arch, the two stars as one solid star. */
function smallBody({ color = GOLD, archFill = ARCH_FILL } = {}) {
  return (
    (archFill ? `<path d="${archD}" fill="${archFill}"/>` : "") +
    `<path d="${archD}" fill="none" stroke="${color}" stroke-width="64"/>` +
    `<path d="${outerStarD}" fill="${color}" stroke="${color}" stroke-width="18" stroke-linejoin="miter" stroke-miterlimit="12"/>`
  );
}

const starHole = `<mask id="star-hole"><rect width="1024" height="1024" fill="#fff"/><path d="${outerStarD}" fill="#000" stroke="#000" stroke-width="40"/></mask>`;

// Adaptive icons are masked to anything from a circle to a squircle; only a
// circle of 66/108 of the canvas is sure to show. Fit the arch's corners in it.
const SAFE_SCALE = (0.66 / 2 / 1.08) * 1024 / ARCH_HALF_DIAGONAL * 0.98;
// A maskable web icon's safe zone is a circle of 80% of the canvas.
const MASKABLE_SCALE = Math.min(1, (0.8 / 2) * 1024 / ARCH_HALF_DIAGONAL * 0.98);

const variants = {
  full: master,
  composite: svg(`${background}<g transform="${place(MASKABLE_SCALE)}">${markBody()}</g>`, clip),
  background: svg(background),
  mark: svg(`<g transform="${place(SAFE_SCALE)}">${markBody()}</g>`, clip),
  splash: svg(`<g transform="${place(0.92)}">${markBody()}</g>`, clip),
  mono: svg(
    `<g transform="${place(SAFE_SCALE)}">${markBody({ color: "#FFFFFF", archFill: null, latticeOpacity: 0.35, mono: true })}</g>`,
    clip + starHole,
  ),
  smallColour: svg(`${background}<g transform="${place(1.05)}">${smallBody()}</g>`),
  circle: svg(
    `<clipPath id="c"><circle cx="512" cy="512" r="${(72 / 108 / 2) * 1024}"/></clipPath><g clip-path="url(#c)">${background}<g transform="${place(SAFE_SCALE)}">${markBody()}</g></g>`,
    clip,
  ),
  smallWhite: svg(`<g transform="${place(1.12)}">${smallBody({ color: "#FFFFFF", archFill: null })}</g>`),
};

// --------------------------------------------------------------- outputs --
const OUT = [
  // Expo app.json
  ["mobile/assets/images/icon.png", "full", 1024],
  ["mobile/assets/images/android-icon-foreground.png", "mark", 1024],
  ["mobile/assets/images/android-icon-background.png", "background", 1024],
  ["mobile/assets/images/android-icon-monochrome.png", "mono", 1024],
  ["mobile/assets/images/splash-icon.png", "splash", 1024],
  ["mobile/assets/images/favicon.png", "smallColour", 96],
  ["mobile/assets/images/notification-icon.png", "smallWhite", 96],
  // Store listings (uploaded by hand)
  ["mobile/assets/brand/store/play-icon-512.png", "full", 512],
  ["mobile/assets/brand/store/app-store-1024.png", "full", 1024],
  // Website (Next.js app icons + PWA manifest, maskable)
  ["src/app/icon.png", "smallColour", 64],
  ["src/app/apple-icon.png", "full", 180],
  ["public/icons/icon-192.png", "composite", 192],
  ["public/icons/icon-512.png", "composite", 512],
  // Review previews (not used by the app): the small cut down the size
  // ladder, and the adaptive icon under the harshest (circular) mask.
  ["mobile/assets/brand/preview/small-16.png", "smallColour", 16],
  ["mobile/assets/brand/preview/small-24.png", "smallColour", 24],
  ["mobile/assets/brand/preview/small-32.png", "smallColour", 32],
  ["mobile/assets/brand/preview/full-48.png", "full", 48],
  ["mobile/assets/brand/preview/adaptive-circle.png", "circle", 432],
];

// ----------------------------------------------------------------- render --
await withChrome(async (render) => {
  for (const [file, variant, size] of OUT) {
    const src = `data:image/svg+xml;base64,${Buffer.from(variants[variant]).toString("base64")}`;
    const html = `<html><body style="margin:0;background:transparent"><img src="${src}" width="${size}" height="${size}" style="display:block"></body></html>`;
    await render(html, size, size, path.join(root, file));
    console.log(`${file}  ${variant}  ${size}px`);
  }
});
