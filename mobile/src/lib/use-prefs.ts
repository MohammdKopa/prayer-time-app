import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import {
  defaultPrefs,
  loadPrefs,
  prefsScope,
  type PrayerPrefs,
  type PrefsScopeSource,
} from "@/lib/prayer-prefs";

/**
 * This place's per-prayer prefs, for screens that SHOW times.
 *
 * Re-read every time the screen gains focus, so coming back from the
 * per-prayer settings screen picks the change up without a restart, and
 * whenever the place changes, because prefs belong to a masjid, not a phone.
 * Defaults stand in until the stored value arrives, so the first frame is
 * the engine's own times rather than nothing.
 *
 * `key` changes whenever the effective prefs change — put it in a memo or
 * effect dependency list to react to it without deep-comparing objects.
 */
export function usePrefs(place: PrefsScopeSource): {
  prefs: PrayerPrefs;
  key: string;
} {
  const [prefs, setPrefs] = useState<PrayerPrefs>(defaultPrefs);
  const scope = prefsScope(place);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const loaded = await loadPrefs(place);
        if (!cancelled) setPrefs(loaded);
      })();
      return () => {
        cancelled = true;
      };
      // Keyed on the storage scope: the same city by GPS and by hand shares
      // one prefs record, and coordinates jittering across town must not
      // refetch it.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scope]),
  );

  const key = useMemo(() => `${scope}:${JSON.stringify(prefs)}`, [scope, prefs]);
  return { prefs, key };
}
