import Image from "next/image";
import type { StoreLinks } from "@/lib/store-links";
import { COPY, LANG_NAMES, LANGS, type Lang } from "./copy";
import { DayBand } from "./DayBand";

// The public face of prayer.kametrix.com once both apps are in their stores
// (see lib/store-links.ts). One quiet column; the only bold element is the
// live day band in the hero. Screenshots are the real app captures from
// docs/shots/clean, shrunk to WebP in public/marketing/<lang>/.

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d9b871]";

export function Marketing({
  lang,
  stores,
  query = "",
}: {
  lang: Lang;
  stores: StoreLinks;
  /** Extra query string kept on the language links (the dev preview flag). */
  query?: string;
}) {
  const c = COPY[lang];
  const body = lang === "ar" ? "var(--font-arabic)" : "var(--font-amiri)";

  return (
    <main
      lang={lang}
      dir={c.dir}
      className="min-h-screen w-full bg-[#04100c] text-[#f4ecd8] [background-image:radial-gradient(90%_60%_at_50%_-10%,rgba(40,120,85,0.35),transparent_70%)]"
      style={{ fontFamily: `${body}, serif` }}
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <header className="flex items-center justify-between gap-4 py-6">
          <span className="flex items-center gap-3">
            <Image src="/icons/icon-192.png" alt="" width={40} height={40} className="rounded-xl" />
            <span className="font-[family-name:var(--font-kufi)] text-lg whitespace-nowrap">{c.appName}</span>
          </span>
          <nav aria-label="Language" className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-sm">
            {LANGS.map((l) => (
              <a
                key={l}
                href={`/?lang=${l}${query}`}
                lang={l}
                aria-current={l === lang ? "page" : undefined}
                className={`${focus} rounded ${l === lang ? "text-[#d9b871]" : "text-[#f4ecd8]/70 hover:text-[#f4ecd8]"}`}
              >
                {LANG_NAMES[l]}
              </a>
            ))}
          </nav>
        </header>

        <section className="pt-10 pb-20 sm:pt-16">
          <h1 className="max-w-[16ch] font-[family-name:var(--font-kufi)] text-[clamp(2.5rem,7vw,5rem)] leading-[1.1] font-semibold">
            {c.headline}
          </h1>
          <p className="mt-6 max-w-[46ch] text-xl leading-relaxed text-[#f4ecd8]/80 sm:text-2xl">{c.sub}</p>

          <div className="mt-14">
            <DayBand copy={c} />
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <a
              href={stores.ios}
              className={`${focus} rounded-full bg-[#d9b871] px-7 py-3.5 text-lg font-semibold text-[#04100c] hover:bg-[#e8c878]`}
            >
              {c.getIos}
            </a>
            <a
              href={stores.android}
              className={`${focus} rounded-full bg-[#d9b871] px-7 py-3.5 text-lg font-semibold text-[#04100c] hover:bg-[#e8c878]`}
            >
              {c.getAndroid}
            </a>
            <span className="text-base text-[#f4ecd8]/70">{c.free}</span>
          </div>
        </section>

        <section className="grid gap-10 border-t border-[#f4ecd8]/10 py-16 sm:grid-cols-3">
          {c.promises.map((p) => (
            <div key={p.title}>
              <h2 className="font-[family-name:var(--font-kufi)] text-2xl text-[#d9b871]">{p.title}</h2>
              <p className="mt-3 text-lg leading-relaxed text-[#f4ecd8]/80">{p.body}</p>
            </div>
          ))}
        </section>
      </div>

      <section className="py-16">
        <h2 className="mx-auto max-w-5xl px-5 font-[family-name:var(--font-kufi)] text-3xl sm:px-8">
          {c.screensTitle}
        </h2>
        <ul className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-6 sm:px-8 lg:justify-[safe_center]">
          {c.screens.map((s) => (
            <li key={s.file} className="w-[62vw] max-w-[250px] shrink-0 snap-center">
              <figure className="m-0">
                <Image
                  src={`/marketing/${lang}/${s.file}.webp`}
                  alt={s.caption}
                  width={540}
                  height={1200}
                  className="h-auto w-full rounded-[2rem] border border-[#f4ecd8]/15"
                />
                <figcaption className="mt-4 text-base leading-snug text-[#f4ecd8]/80">{s.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <section className="grid items-center gap-10 border-t border-[#f4ecd8]/10 py-16 lg:grid-cols-[2fr_3fr]">
          <div>
            <h2 className="font-[family-name:var(--font-kufi)] text-3xl">{c.mosqueTitle}</h2>
            <p className="mt-4 text-lg leading-relaxed text-[#f4ecd8]/80">{c.mosqueBody}</p>
            <a
              href="/display"
              className={`${focus} mt-6 inline-block rounded-full border border-[#d9b871] px-6 py-3 text-[#d9b871] hover:bg-[#d9b871]/10`}
            >
              {c.mosqueLink}
            </a>
          </div>
          <Image
            src={`/marketing/${lang}/display.webp`}
            alt={c.mosqueAlt}
            width={1400}
            height={630}
            className="h-auto w-full rounded-2xl border border-[#f4ecd8]/15"
          />
        </section>

        <section className="border-t border-[#f4ecd8]/10 py-16">
          <h2 className="font-[family-name:var(--font-kufi)] text-3xl">{c.ruleTitle}</h2>
          <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-[#f4ecd8]/80">{c.ruleBody}</p>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f4ecd8]/10 py-10 text-base text-[#f4ecd8]/70">
          <span>{c.madeBy}</span>
          <span className="flex gap-6">
            <a href="/privacy" className={`${focus} rounded hover:text-[#f4ecd8]`}>
              {c.privacy}
            </a>
            <a href="https://kametrix.com/impressum" className={`${focus} rounded hover:text-[#f4ecd8]`}>
              {c.impressum}
            </a>
          </span>
        </footer>
      </div>
    </main>
  );
}
