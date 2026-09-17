import * as Localization from "expo-localization";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { loadSetting, saveSetting } from "@/lib/storage";
import {
  LOCALES,
  RTL_LOCALES,
  TRANSLATIONS,
  type Locale,
  type StringKey,
} from "./strings";

export * from "./strings";

const STORAGE_KEY = "locale";

/** The device's language if we speak it, otherwise Arabic — this is an
 *  Arabic-first app, so Arabic is the fallback rather than English. */
function deviceLocale(): Locale {
  for (const tag of Localization.getLocales()) {
    const code = tag.languageCode?.toLowerCase();
    const match = LOCALES.find((l) => l === code);
    if (match) return match;
  }
  return "ar";
}

export type Translate = (
  key: StringKey,
  vars?: Record<string, string | number>,
) => string;

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translate;
  isRTL: boolean;
  /** False until the stored choice has been read, so nothing renders in the
   *  wrong language for a frame and then swaps. */
  ready: boolean;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadSetting(STORAGE_KEY);
      if (!cancelled) {
        const match = LOCALES.find((l) => l === stored);
        if (match) setLocaleState(match);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    void saveSetting(STORAGE_KEY, l);
  }, []);

  const t = useCallback<Translate>(
    (key, vars) => {
      let out: string = TRANSLATIONS[locale][key];
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.split(`{${k}}`).join(String(v));
        }
      }
      return out;
    },
    [locale],
  );

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t,
      isRTL: RTL_LOCALES.includes(locale),
      ready,
    }),
    [locale, setLocale, t, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
