import { useRouter } from "expo-router";
import { useEffect } from "react";

import { loadLastRead } from "@/lib/quran/reading-state";

/**
 * Landing route for the Quran reminder: resolves where the reader stopped and
 * replaces itself with it, so Back never returns to this blank screen. With no
 * saved position it opens the Quran tab instead.
 */
export default function QuranContinue() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void loadLastRead().then((ref) => {
      if (cancelled) return;
      if (ref) {
        router.replace({
          pathname: "/quran/[surah]",
          params: { surah: String(ref.surah), ayah: String(ref.ayah) },
        });
      } else {
        router.replace("/quran");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
