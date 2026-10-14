import { SURAHS } from "./meta";
import { pageInfo, pageRange, refOfIndex, PAGE_COUNT } from "./pages";
import { FAMILY_COLOR, tajweedSegments } from "./tajweed-colors";
import { AYAT } from "./text";
import { splitBasmala } from "./text-utils";

// The mushaf as one HTML document: 604 pages side by side, swiped right to
// left like a printed mushaf, each holding the āyāt of that Madani page.
//
// Why a browser engine: React Native's Text on Android lays out every
// coloured run on its own, so colouring part of an Arabic word breaks the
// joins, and a mark cannot be coloured without dragging its letter along. A
// browser shapes the whole word first and colours glyph by glyph, so a
// tanwīn, a dagger alif or a single letter takes its colour and nothing around
// it moves. Plain and tajweed pages go through the same renderer, so switching
// never reflows the page into a different layout.
//
// Optional ligatures are off: Amiri Quran draws pairs like مِن or هم as one
// glyph, and a colour on one letter of a ligature paints both. The required
// ones (لا, the name of Allah) are untouched.
//
// The document starts with every page empty except a few around the opening
// one. As the reader swipes, the page asks the app for its neighbours
// ({type:"need"}) and drops pages far behind, so the WebView never holds more
// than about nine pages of text.
//
// Text is AYAT verbatim: only HTML-escaped and wrapped in spans. The one
// layout choice, as in the old reader, is the basmala lifted above the sūrah
// it opens (`splitBasmala`, tested to re-join to the original line). Nothing
// is fetched: the font arrives as a data: URI in `fontSrc`.

export interface MushafColors {
  bg: string;
  text: string;
  gold: string;
  soft: string;
  line: string;
  wash: string;
  raised: string;
}

export interface MushafOptions {
  tajweed: boolean;
  /** Bookmarked āyāt as "s:a". */
  marked: ReadonlySet<string>;
}

export type MushafMessage =
  | { type: "page"; page: number }
  | { type: "need"; pages: number[] }
  | { type: "ayah"; surah: number; ayah: number };

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The rubʿ al-ḥizb sign stands on its own between words, so a span around it
 *  cannot touch a join; it takes the gold of the āyah numbers. */
const markHizb = (html: string) => html.replace(/۞/g, '<span class="r">۞</span>');

function ayahText(index: number, raw: string, from: number, tajweed: boolean): string {
  if (!tajweed) return markHizb(escape(raw.slice(from)));
  return tajweedSegments(index, raw, from)
    .map((seg) =>
      seg.family
        ? `<span style="color:${FAMILY_COLOR[seg.family]}">${markHizb(escape(seg.text))}</span>`
        : markHizb(escape(seg.text)),
    )
    .join("");
}

/** The inside of one page: running head, text, page number. */
export function pageContentHtml(page: number, opts: MushafOptions): string {
  const info = pageInfo(page);
  const { start, end } = pageRange(page);
  const names = info.surahs.map((s) => SURAHS[s - 1].name).join(" · ");
  let body = "";
  let open = false;
  const openPara = () => {
    if (!open) body += '<p class="t">';
    open = true;
  };
  const closePara = () => {
    if (open) body += "</p>";
    open = false;
  };

  for (let i = start; i < end; i++) {
    const { surah, ayah } = refOfIndex(i);
    const raw = AYAT[i];
    let from = 0;
    if (ayah === 1) {
      closePara();
      const split = splitBasmala(surah, 1, raw);
      from = raw.length - split.text.length;
      body += `<div class="sh"><span>سورة ${escape(SURAHS[surah - 1].name)}</span></div>`;
      if (split.basmala) body += `<div class="bs">${escape(split.basmala)}</div>`;
    }
    openPara();
    const key = `${surah}:${ayah}`;
    body +=
      `<span class="a${opts.marked.has(key) ? " m" : ""}" data-k="${key}">` +
      `${ayahText(i, raw, from, opts.tajweed)}</span>` +
      `<span class="n"> ﴿${ayah}﴾ </span>`;
  }
  closePara();

  return (
    `<div class="hd"><span>${escape(names)}</span>` +
    `<span>الجزء ${info.juz} · الحزب ${info.hizb}</span></div>` +
    `<div class="bd">${body}</div>` +
    `<div class="pn">${info.page}</div>`
  );
}

export interface MushafShellInput {
  startPage: number;
  fontSize: number;
  /** Pages filled from the start, keyed by page number. */
  prefilled: Map<number, string>;
  /** Bookmarked āyāt as "s:a", so pages filled later are marked too. */
  marked: readonly string[];
  fontSrc: string;
  colors: MushafColors;
}

/** The document: all 604 page slots, the opening pages filled. */
export function mushafShellHtml(p: MushafShellInput): string {
  const c = p.colors;
  let slots = "";
  for (let n = 1; n <= PAGE_COUNT; n++) {
    const html = p.prefilled.get(n);
    slots += `<section class="pg" id="p${n}" data-p="${n}"${html ? ' data-f="1"' : ""}>${html ?? ""}</section>`;
  }

  return `<!doctype html><html dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
@font-face{font-family:Mushaf;src:${p.fontSrc}}
:root{--fs:${p.fontSize}px}
html,body{margin:0;height:100%;overflow:hidden;background:${c.bg};color:${c.text};-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
#pager{display:flex;direction:rtl;height:100%;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior:contain}
#pager::-webkit-scrollbar{display:none}
.pg{flex:0 0 100%;width:100%;height:100%;box-sizing:border-box;overflow-y:auto;scroll-snap-align:start;scroll-snap-stop:always;padding:0 18px;display:flex;flex-direction:column}
.pg{scrollbar-width:none}.pg::-webkit-scrollbar{display:none}
.hd{display:flex;justify-content:space-between;gap:12px;padding:12px 2px 8px;border-bottom:1px solid ${c.line};color:${c.soft};font:13px/1.4 sans-serif}
.bd{flex:1;padding:6px 0 4px;font-family:Mushaf,serif;font-size:var(--fs);line-height:2.05;font-variant-ligatures:no-common-ligatures no-discretionary-ligatures no-historical-ligatures;font-feature-settings:"liga" 0,"dlig" 0,"hlig" 0}
.t{margin:0;text-align:justify;text-align-last:right}
.a{border-radius:6px;padding:0 2px;-webkit-box-decoration-break:clone;box-decoration-break:clone;transition:background-color .15s}
.a.m{background:${c.wash}}
.a.sel{background:${c.raised};box-shadow:0 0 0 1px ${c.gold}55}
.n,.r{color:${c.gold}}
.sh{margin:14px 0 6px;padding:6px 10px;text-align:center;color:${c.gold};font-size:calc(var(--fs) * .85);line-height:1.6;border:1px solid ${c.gold}66;border-radius:10px;box-shadow:inset 0 0 0 3px ${c.bg},inset 0 0 0 4px ${c.gold}33;background:${c.raised}}
.bs{text-align:center;margin:4px 0 2px}
.pn{text-align:center;color:${c.soft};font:13px/1 sans-serif;padding:10px 0 16px;border-top:1px solid ${c.line}}
</style></head><body>
<div id="pager">${slots}</div>
<script>
(function(){
  var post=function(m){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(m));};
  var N=${PAGE_COUNT},pager=document.getElementById("pager");
  var slot=function(n){return document.getElementById("p"+n);};
  var cur=${p.startPage},marked={},sel=null;
  ${JSON.stringify(p.marked)}.forEach(function(k){marked[k]=1;});
  var goto=function(n){var s=slot(n);if(!s)return;pager.style.scrollSnapType="none";s.scrollIntoView({block:"nearest",inline:"start"});pager.style.scrollSnapType="";};
  // Ask for the neighbours that are empty, drop the far ones.
  var settle=function(){
    var need=[];
    for(var n=cur-2;n<=cur+2;n++){if(n>=1&&n<=N&&!slot(n).dataset.f)need.push(n);}
    if(need.length)post({type:"need",pages:need});
    var filled=pager.querySelectorAll(".pg[data-f]");
    for(var i=0;i<filled.length;i++){var q=+filled[i].dataset.p;if(Math.abs(q-cur)>4){filled[i].innerHTML="";delete filled[i].dataset.f;}}
  };
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting&&e.intersectionRatio>=.6){var n=+e.target.dataset.p;if(n!==cur){cur=n;post({type:"page",page:n});settle();}}});
  },{root:pager,threshold:[.6]});
  pager.querySelectorAll(".pg").forEach(function(s){io.observe(s);});
  var mark=function(root){
    root.querySelectorAll(".a").forEach(function(a){a.classList.toggle("m",!!marked[a.dataset.k]);a.classList.toggle("sel",a.dataset.k===sel);});
  };
  pager.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest(".a");if(!a)return;
    var k=a.dataset.k.split(":");post({type:"ayah",surah:+k[0],ayah:+k[1]});
  });
  window.__fill=function(list){list.forEach(function(x){var s=slot(x[0]);if(!s)return;s.innerHTML=x[1];s.dataset.f="1";mark(s);});};
  window.__reset=function(){pager.querySelectorAll(".pg[data-f]").forEach(function(s){s.innerHTML="";delete s.dataset.f;});settle();};
  window.__goto=function(n){cur=n;goto(n);settle();};
  window.__setSize=function(px){document.documentElement.style.setProperty("--fs",px+"px");};
  window.__setMarked=function(keys){marked={};keys.forEach(function(k){marked[k]=1;});mark(pager);};
  window.__select=function(k){sel=k;mark(pager);};
  goto(cur);
  post({type:"page",page:cur});
  settle();
})();
</script></body></html>`;
}
