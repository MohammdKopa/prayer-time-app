import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_PLACE,
  loadMode,
  loadSavedPlace,
  locate,
  saveMode,
  savePlace,
  type LocationMode,
  type Place,
} from "@/lib/location";

export type LocateState = "idle" | "locating" | "denied" | "unavailable";

interface PlaceValue {
  place: Place;
  mode: LocationMode;
  state: LocateState;
  /** Ask the device for a fix and switch to GPS mode. */
  useGps: () => Promise<void>;
  /** Pin to a chosen place and stop following GPS. */
  usePlace: (p: Place) => Promise<void>;
  ready: boolean;
}

const PlaceContext = createContext<PlaceValue | null>(null);

export function PlaceProvider({ children }: { children: ReactNode }) {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [mode, setMode] = useState<LocationMode>("gps");
  const [state, setState] = useState<LocateState>("idle");
  const [ready, setReady] = useState(false);

  // Show the last known place immediately, then refresh it in the background.
  // A prayer clock should never open to a spinner — stale times beat none.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [saved, savedMode] = await Promise.all([
        loadSavedPlace(),
        loadMode(),
      ]);
      if (cancelled) return;
      if (saved) setPlace(saved);
      setMode(savedMode);
      setReady(true);

      if (savedMode === "gps") {
        setState("locating");
        const res = await locate();
        if (cancelled) return;
        if (res.ok) {
          setPlace(res.place);
          setState("idle");
          void savePlace(res.place);
        } else {
          setState(res.reason);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const useGps = useCallback(async () => {
    setState("locating");
    const res = await locate();
    if (res.ok) {
      setPlace(res.place);
      setMode("gps");
      setState("idle");
      await Promise.all([savePlace(res.place), saveMode("gps")]);
    } else {
      setState(res.reason);
    }
  }, []);

  const usePlace = useCallback(async (p: Place) => {
    setPlace(p);
    setMode("manual");
    setState("idle");
    await Promise.all([savePlace(p), saveMode("manual")]);
  }, []);

  const value = useMemo<PlaceValue>(
    () => ({ place, mode, state, useGps, usePlace, ready }),
    [place, mode, state, useGps, usePlace, ready],
  );

  return (
    <PlaceContext.Provider value={value}>{children}</PlaceContext.Provider>
  );
}

export function usePlaceContext(): PlaceValue {
  const ctx = useContext(PlaceContext);
  if (!ctx) throw new Error("usePlaceContext must be used inside PlaceProvider");
  return ctx;
}
