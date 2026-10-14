import { FAMILY_COLOR, tajweedSegments } from "./tajweed-colors";

// One sūrah as a self-contained HTML page, for the tajweed view.
//
// Why a page at all: React Native's Text on Android lays out every coloured
// run on its own, so colouring part of an Arabic word breaks the joins, and a
// mark cannot be coloured without dragging its letter along. A browser engine
// shapes the whole word first and colours glyph by glyph — the way the
// Quran.com site does it — so a tanwīn, a dagger alif or a single letter takes
// its colour and nothing around it moves.
//
// Optional ligatures are off: Amiri Quran draws pairs like مِن or هم as one
// glyph, and a colour on one letter of a ligature paints both. The required
// ones (لا, the name of Allah) are untouched.
//
// The page is built from AYAT verbatim: text is only ever HTML-escaped and
// wrapped in <span>s. It loads nothing from the network (the WebView is
// given this string and the font file from the app itself), and it talks back
// to the app with three messages: the āyah at the top of the screen, a
// long-press on an āyah, and a tap on previous/next sūrah.

export interface PageAyah {
  ayah: number;
  /** Index into AYAT. */
  index: number;
  /** Characters skipped at the start (the basmala lifted into the header). */
  from: number;
  /** The full AYAT line. */
  raw: string;
}

export interface PageInput {
  surahName: string;
  subtitle: string;
  basmala: string | null;
  ayat: PageAyah[];
  fontSize: number;
  startAyah: number;
  bookmarked: number[];
  /** CSS url() source of the Amiri Quran font. */
  fontSrc: string;
  colors: { bg: string; text: string; gold: string; soft: string; line: string; wash: string };
  prev: { label: string; name: string; surah: number } | null;
  next: { label: string; name: string; surah: number } | null;
}

export type PageMessage =
  | { type: "visible"; ayah: number }
  | { type: "longpress"; ayah: number }
  | { type: "nav"; surah: number };

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The āyah's HTML: plain text and coloured spans, nothing else. */
export function ayahHtml(a: PageAyah): string {
  return tajweedSegments(a.index, a.raw, a.from)
    .map((seg) =>
      seg.family
        ? `<span style="color:${FAMILY_COLOR[seg.family]}">${escape(seg.text)}</span>`
        : escape(seg.text),
    )
    .join("");
}

export function surahPageHtml(p: PageInput): string {
  const c = p.colors;
  const marked = new Set(p.bookmarked);
  const ayat = p.ayat
    .map(
      (a) =>
        `<p class="a${marked.has(a.ayah) ? " m" : ""}" id="a${a.ayah}" data-a="${a.ayah}">` +
        `${ayahHtml(a)} <span class="n">﴿${a.ayah}﴾</span></p>`,
    )
    .join("");
  const nav = (n: PageInput["prev"]) =>
    n
      ? `<button data-s="${n.surah}"><small>${escape(n.label)}</small>${escape(n.name)}</button>`
      : `<span></span>`;

  return `<!doctype html><html dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
@font-face{font-family:Mushaf;src:${p.fontSrc}}
html,body{margin:0;background:${c.bg};color:${c.text};-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
body{font-family:Mushaf,serif;font-size:${p.fontSize}px;line-height:1.9;padding:0 18px 40px;font-variant-ligatures:no-common-ligatures no-discretionary-ligatures no-historical-ligatures;font-feature-settings:"liga" 0,"dlig" 0,"hlig" 0}
.h{text-align:center;padding:22px 0 10px}
.h .s{color:${c.gold};font-size:30px;line-height:1.6}
.h .sub{color:${c.soft};font-size:13px;font-family:sans-serif;line-height:1.4}
.h .b{margin-top:14px}
.a{margin:0;padding:10px 6px;border-bottom:1px solid ${c.line};text-align:right}
.a.m{background:${c.wash};border-radius:10px}
.n{color:${c.gold}}
.f{display:flex;flex-direction:row-reverse;gap:12px;padding-top:24px}
.f button,.f span{flex:1}
.f button{background:none;border:1px solid ${c.line};border-radius:12px;padding:12px;color:${c.text};font:15px sans-serif;display:flex;flex-direction:column;align-items:center;gap:2px}
.f small{color:${c.soft};font-size:12px}
</style></head><body>
<div class="h"><div class="s">${escape(p.surahName)}</div><div class="sub">${escape(p.subtitle)}</div>${
    p.basmala ? `<div class="b">${escape(p.basmala)}</div>` : ""
  }</div>
${ayat}
<div class="f">${nav(p.next)}${nav(p.prev)}</div>
<script>
(function(){
  var post=function(m){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(m));};
  var start=${p.startAyah};
  if(start>1){var el=document.getElementById("a"+start);if(el)el.scrollIntoView({block:"start"});}
  var last=0,t=null;
  var report=function(){
    var ps=document.querySelectorAll(".a");
    for(var i=0;i<ps.length;i++){var r=ps[i].getBoundingClientRect();
      if(r.bottom>40){var a=+ps[i].dataset.a;if(a!==last){last=a;post({type:"visible",ayah:a});}return;}}
  };
  window.addEventListener("scroll",function(){clearTimeout(t);t=setTimeout(report,250);},{passive:true});
  setTimeout(report,300);
  var lp=null,sx=0,sy=0;
  document.addEventListener("touchstart",function(e){
    var p=e.target.closest&&e.target.closest(".a");if(!p)return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;
    lp=setTimeout(function(){lp=null;post({type:"longpress",ayah:+p.dataset.a});},400);
  },{passive:true});
  var cancel=function(){if(lp){clearTimeout(lp);lp=null;}};
  document.addEventListener("touchmove",function(e){
    if(Math.abs(e.touches[0].clientX-sx)>8||Math.abs(e.touches[0].clientY-sy)>8)cancel();
  },{passive:true});
  document.addEventListener("touchend",cancel);
  document.querySelectorAll(".f button").forEach(function(b){
    b.addEventListener("click",function(){post({type:"nav",surah:+b.dataset.s});});
  });
  window.__setMarked=function(list){
    var s={};list.forEach(function(a){s[a]=1;});
    document.querySelectorAll(".a").forEach(function(p){p.classList.toggle("m",!!s[+p.dataset.a]);});
  };
  window.__setSize=function(px){document.body.style.fontSize=px+"px";};
  window.__goto=function(a){var el=document.getElementById("a"+a);if(el)el.scrollIntoView({block:"start"});};
})();
</script></body></html>`;
}
