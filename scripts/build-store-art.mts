// App Store creative assets: the product page header (21:9) and the search
// results image (3:2), shown on iOS 27 and later. Uploaded by hand in App
// Store Connect → Asset Library (reviewed separately from app versions).
//
//   npx tsx scripts/build-store-art.mts
//
// The picture is the app's own: the mihrab of the icon, and inside it a real
// mushaf page with tajweed colours, drawn by lib/quran/mushaf-html.ts from the
// Tanzil text exactly as the reader draws it. Under it one line, translated.
// Apple's rules followed: no transparency (JPEG), subject and text kept near
// the centre (the two placements crop differently), text readable on a
// phone, nothing but what the app does.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AMIRI_QURAN_TTF_BASE64 } from "../mobile/src/lib/quran/font-data.ts";
import { pageContentHtml } from "../mobile/src/lib/quran/mushaf-html.ts";
import { withChrome } from "./lib/render-chrome.mjs";
import { stripAlpha } from "./lib/png-rgb.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontB64 = (rel: string) =>
  readFileSync(path.join(root, "mobile/node_modules/@expo-google-fonts", rel)).toString("base64");
const REEM_KUFI = fontB64("reem-kufi/600SemiBold/ReemKufi_600SemiBold.ttf");

const master = readFileSync(path.join(root, "mobile/assets/brand/mihrab-star.svg"), "utf8");
const lattice = master.match(/<path d="([^"]+)" fill="none" stroke="#D9B871" stroke-opacity="0\.32"/)![1];

const C = { bg: "#05130D", text: "#E8E3D9", gold: "#D9B871", soft: "#8E9A92", line: "#17271F", inner: "#0B2418" };

const TAGLINE: Record<string, { line: string; dir: "rtl" | "ltr" }> = {
  ar: { line: "مواقيت الصلاة · المصحف بالتجويد · القبلة", dir: "rtl" },
  de: { line: "Gebetszeiten · Koran mit Tajwīd · Qibla", dir: "ltr" },
  en: { line: "Prayer times · Quran with tajweed · Qibla", dir: "ltr" },
  tr: { line: "Namaz vakitleri · Tecvidli Kur'an · Kıble", dir: "ltr" },
};

// Al-Fātiḥa with tajweed, without the running head and page number: the arch
// is the frame. Only the body of the page is used.
const fatiha = pageContentHtml(1, { tajweed: true, marked: new Set() }).match(
  /<div class="bd">[\s\S]*<\/div>(?=<div class="pn">)/,
)![0];

/** The icon's arch (1024-unit drawing, x 262–762, y 140–860) at width w. */
function archPath(w: number): string {
  const k = w / 500;
  const X = (x: number) => ((x - 262) * k).toFixed(1);
  const Y = (y: number) => ((y - 140) * k).toFixed(1);
  const R = (330 * k).toFixed(1);
  return `M${X(262)},${Y(860)} V${Y(470)} A${R},${R} 0 0 1 ${X(512)},${Y(140)} A${R},${R} 0 0 1 ${X(762)},${Y(470)} V${Y(860)} Z`;
}

interface Layout {
  width: number;
  height: number;
  archHeight: number;
  archTop: number;
  pageFont: number;
  tagFont: number;
  tagTop: number;
}

function html(l: Layout, lang: string): string {
  const aw = (l.archHeight * 500) / 720;
  // Half the icon's line: the icon's weight is for 48 px, not a banner.
  const stroke = (20 * aw) / 500;
  const d = archPath(aw);
  const t = TAGLINE[lang];
  const line = t.line
    .split(" · ")
    .map((s) => `<span>${s}</span>`)
    .join(`<i>◆</i>`);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Mushaf;src:url(data:font/ttf;base64,${AMIRI_QURAN_TTF_BASE64})}
@font-face{font-family:Kufi;src:url(data:font/ttf;base64,${REEM_KUFI})}
html,body{margin:0;width:${l.width}px;height:${l.height}px;overflow:hidden}
body{position:relative;background:radial-gradient(ellipse at 50% 42%,#123323 0%,#0A2016 38%,#04100B 78%)}
.lat{position:absolute;inset:0;width:100%;height:100%;opacity:.13}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 30%,#04100Bcc 85%)}
.arch{position:absolute;left:${(l.width - aw) / 2}px;top:${l.archTop}px;width:${aw}px;height:${l.archHeight}px;filter:drop-shadow(0 ${aw * 0.03}px ${aw * 0.08}px #000a)}
.page{position:absolute;inset:0;clip-path:path('${d}');background:radial-gradient(ellipse at 50% 30%,#0F2C1F,${C.inner} 70%);box-sizing:border-box;padding:${aw * 0.3}px ${aw * 0.09}px ${aw * 0.07}px;direction:rtl;color:${C.text};display:flex;flex-direction:column;justify-content:center}
.bd{font-family:Mushaf,serif;font-size:${l.pageFont}px;line-height:2.05;font-variant-ligatures:no-common-ligatures no-discretionary-ligatures no-historical-ligatures;font-feature-settings:"liga" 0,"dlig" 0,"hlig" 0}
.t{margin:0;text-align:justify;text-align-last:center}
.n,.r{color:${C.gold}}
.n b{font-weight:normal;white-space:nowrap}
.sh{margin:0 0 ${l.pageFont * 0.3}px;padding:${l.pageFont * 0.12}px;text-align:center;color:${C.gold};font-size:${l.pageFont * 0.82}px;line-height:1.6;border:${Math.max(2, l.pageFont / 22)}px solid ${C.gold}88;border-radius:${l.pageFont * 0.35}px;background:#0A2117}
.frame{position:absolute;inset:0;overflow:visible}
.tag{position:absolute;left:0;right:0;top:${l.tagTop}px;text-align:center;direction:${t.dir};font-family:Kufi,sans-serif;font-size:${l.tagFont}px;color:${C.text};letter-spacing:.01em}
.tag i{font-style:normal;color:${C.gold};font-size:.5em;margin:0 .9em;vertical-align:.22em}
</style></head><body>
<svg class="lat" viewBox="-600 -700 2300 2300" preserveAspectRatio="xMidYMid slice"><path d="${lattice}" fill="none" stroke="${C.gold}" stroke-width="7"/></svg>
<div class="vig"></div>
<div class="arch">
  <div class="page">${fatiha}</div>
  <svg class="frame" viewBox="0 0 ${aw} ${l.archHeight}"><path d="${d}" fill="none" stroke="${C.gold}" stroke-width="${stroke}"/></svg>
</div>
<div class="tag">${line}</div>
</body></html>`;
}

const HEADER: Layout = { width: 3840, height: 1646, archHeight: 1190, archTop: 90, pageFont: 54, tagFont: 84, tagTop: 1372 };
// Both placements from one file: Apple's 16:9 option, PNG only.
const UNIVERSAL: Layout = { width: 5244, height: 2950, archHeight: 2170, archTop: 170, pageFont: 98, tagFont: 136, tagTop: 2520 };
const SEARCH: Layout = { width: 3840, height: 2560, archHeight: 1880, archTop: 150, pageFont: 86, tagFont: 118, tagTop: 2196 };

const outDir = path.join(root, "mobile/assets/brand/store");
await withChrome(async (render) => {
  for (const lang of Object.keys(TAGLINE)) {
    for (const [name, l, format] of [
      ["header", HEADER, "jpeg"],
      ["search", SEARCH, "jpeg"],
      ["universal", UNIVERSAL, "png"],
    ] as const) {
      const file = path.join(outDir, `${name}-${lang}.${format === "png" ? "png" : "jpg"}`);
      await render(html(l, lang), l.width, l.height, file, { format, settleMs: 900 });
      // Apple refuses any alpha channel, even a fully opaque one: PNGs from
      // Chrome carry one, so it is stripped (JPEG has none to begin with).
      if (format === "png") await stripAlpha(file);
      console.log(`${path.relative(root, file)}  ${l.width}×${l.height}`);
    }
  }
});
