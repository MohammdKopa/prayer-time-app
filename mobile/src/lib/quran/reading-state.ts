import { useCallback, useEffect, useState } from "react";

import { loadJSON, saveJSON } from "@/lib/storage";

import { SURAHS, type AyahRef } from "./meta";
import { PAGE_COUNT } from "./pages";

// What the reader remembers: where you stopped, your bookmarks, your text
// size. On this device only, like every other setting — no account, nothing
// leaves the phone.

const LAST_READ = "quran.lastRead";
const BOOKMARKS = "quran.bookmarks";
const TEXT_SIZE = "quran.textSize";

export const TEXT_SIZES = [22, 26, 30, 34, 40] as const;
const DEFAULT_SIZE_INDEX = 1;

/** A stored reference is only trusted if it still points at a real āyah. */
function valid(ref: unknown): ref is AyahRef {
  if (!ref || typeof ref !== "object") return false;
  const { surah, ayah } = ref as AyahRef;
  const meta = SURAHS[surah - 1];
  return !!meta && Number.isInteger(ayah) && ayah >= 1 && ayah <= meta.ayahs;
}

export async function loadLastRead(): Promise<AyahRef | null> {
  const ref = await loadJSON<AyahRef>(LAST_READ);
  return valid(ref) ? ref : null;
}

export function saveLastRead(ref: AyahRef): Promise<void> {
  return saveJSON(LAST_READ, ref);
}

export const refKey = (r: AyahRef) => `${r.surah}:${r.ayah}`;

/** Bookmarks, newest first, persisted on every change. */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<AyahRef[]>([]);

  const reload = useCallback(() => {
    loadJSON<AyahRef[]>(BOOKMARKS).then((list) => {
      setBookmarks(Array.isArray(list) ? list.filter(valid) : []);
    });
  }, []);

  useEffect(reload, [reload]);

  /** Adds or removes; returns true when it added. */
  const toggle = useCallback(
    (ref: AyahRef): boolean => {
      const exists = bookmarks.some((b) => refKey(b) === refKey(ref));
      const next = exists
        ? bookmarks.filter((b) => refKey(b) !== refKey(ref))
        : [ref, ...bookmarks];
      setBookmarks(next);
      saveJSON(BOOKMARKS, next);
      return !exists;
    },
    [bookmarks],
  );

  return { bookmarks, toggle, reload };
}

const PAGE_BOOKMARKS = "quran.pageBookmarks";

const validPage = (p: unknown): p is number =>
  typeof p === "number" && Number.isInteger(p) && p >= 1 && p <= PAGE_COUNT;

/** Page bookmarks (the ribbon in the reader), newest first. Kept apart from
 *  āyah bookmarks: a ribbon marks where a page is, not a particular āyah. */
export function usePageBookmarks() {
  const [pages, setPages] = useState<number[]>([]);

  const reload = useCallback(() => {
    loadJSON<number[]>(PAGE_BOOKMARKS).then((list) => {
      setPages(Array.isArray(list) ? list.filter(validPage) : []);
    });
  }, []);

  useEffect(reload, [reload]);

  /** Adds or removes; returns true when it added. */
  const toggle = useCallback(
    (page: number): boolean => {
      const exists = pages.includes(page);
      const next = exists ? pages.filter((p) => p !== page) : [page, ...pages];
      setPages(next);
      saveJSON(PAGE_BOOKMARKS, next);
      return !exists;
    },
    [pages],
  );

  return { pages, toggle, reload };
}

/** Text size as an index into TEXT_SIZES, so it can only take sane values. */
export function useTextSize() {
  const [index, setIndex] = useState(DEFAULT_SIZE_INDEX);

  useEffect(() => {
    loadJSON<number>(TEXT_SIZE).then((i) => {
      if (typeof i === "number" && i >= 0 && i < TEXT_SIZES.length) setIndex(i);
    });
  }, []);

  const step = useCallback((delta: 1 | -1) => {
    setIndex((i) => {
      const next = Math.min(TEXT_SIZES.length - 1, Math.max(0, i + delta));
      saveJSON(TEXT_SIZE, next);
      return next;
    });
  }, []);

  return {
    size: TEXT_SIZES[index],
    canShrink: index > 0,
    canGrow: index < TEXT_SIZES.length - 1,
    step,
  };
}

const TAJWEED_ON = "quran.tajweed";

/** Tajweed colouring on or off, remembered. Off until switched on: the plain
 *  mushaf is the default reading, the colours are a tool you reach for. */
export function useTajweedSetting() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    loadJSON<boolean>(TAJWEED_ON).then((v) => {
      if (typeof v === "boolean") setOn(v);
    });
  }, []);

  const toggle = useCallback(() => {
    setOn((v) => {
      saveJSON(TAJWEED_ON, !v);
      return !v;
    });
  }, []);

  return { on, toggle };
}
