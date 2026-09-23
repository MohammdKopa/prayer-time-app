import type { Metadata } from "next";
import { headers } from "next/headers";
import { ClockClient } from "@/components/ClockClient";
import { COPY, pickLang } from "@/components/marketing/copy";
import { Marketing } from "@/components/marketing/Marketing";
import { storeLinks } from "@/lib/store-links";

// "/" is the web clock until both apps are live, then the marketing page.
// The switch is APP_STORE_URL + PLAY_STORE_URL (lib/store-links.ts). In
// development, ?preview=marketing shows the page before that; production
// ignores the flag, so the page cannot leak early.

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function resolve(searchParams: SearchParams) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const preview = process.env.NODE_ENV !== "production" && one(sp.preview) === "marketing";
  const stores = storeLinks() ?? (preview ? { ios: "#", android: "#" } : null);
  const lang = pickLang(one(sp.lang), (await headers()).get("accept-language"));
  return { stores, lang, query: preview ? "&preview=marketing" : "" };
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { stores, lang } = await resolve(searchParams);
  if (!stores) return {};
  return { title: COPY[lang].title, description: COPY[lang].description };
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { stores, lang, query } = await resolve(searchParams);
  if (!stores) return <ClockClient />;
  return <Marketing lang={lang} stores={stores} query={query} />;
}
