"use client";

import { useCallback, useEffect, useState } from "react";
import { type City, NRW_TZ } from "./cities";

const SW_PATH = "/sw.js";

export type BackgroundState =
  | "unsupported"
  | "denied"
  | "default"
  | "subscribed";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  // Use a non-shared ArrayBuffer explicitly — PushManager.subscribe expects
  // BufferSource (which excludes SharedArrayBuffer-backed views).
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) return existing;
  try {
    return await navigator.serviceWorker.register(SW_PATH);
  } catch (err) {
    console.warn("[push] SW register failed:", err);
    return null;
  }
}

async function fetchVapidKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/push/key");
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey: string };
    return data.publicKey;
  } catch {
    return null;
  }
}

export interface BackgroundPush {
  state: BackgroundState;
  /** True while a permission/subscribe round-trip is in flight. */
  busy: boolean;
  /** Subscribe this device for background prayer notifications. */
  enable: (city: City) => Promise<boolean>;
  /** Unsubscribe + tell the server. */
  disable: () => Promise<void>;
  /** Update the stored city for the existing subscription. */
  syncCity: (city: City) => Promise<void>;
}

function deriveState(): BackgroundState {
  if (typeof window === "undefined") return "default";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  const perm = Notification.permission;
  if (perm === "denied") return "denied";
  return perm === "granted" ? "subscribed" : "default";
}

export function useBackgroundPush(): BackgroundPush {
  const [state, setState] = useState<BackgroundState>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setState(deriveState());
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    let cancelled = false;
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      if (cancelled || !reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (cancelled) return;
      setState(
        sub && Notification.permission === "granted"
          ? "subscribed"
          : Notification.permission === "denied"
            ? "denied"
            : "default",
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async (city: City): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return false;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "default");
        return false;
      }
      const reg = await registerSW();
      if (!reg) return false;
      const key = await fetchVapidKey();
      if (!key) return false;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      }
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: json.keys,
          city: {
            id: city.id,
            lat: city.latitude,
            lng: city.longitude,
            tz: NRW_TZ,
          },
        }),
      });
      if (!res.ok) return false;
      setState("subscribed");
      return true;
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async (): Promise<void> => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => undefined);
        await sub.unsubscribe();
      }
      setState(Notification.permission === "denied" ? "denied" : "default");
    } finally {
      setBusy(false);
    }
  }, []);

  const syncCity = useCallback(async (city: City): Promise<void> => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
    const sub = await reg?.pushManager.getSubscription();
    if (!sub || Notification.permission !== "granted") return;
    const json = sub.toJSON();
    if (!json.keys) return;
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: json.keys,
        city: {
          id: city.id,
          lat: city.latitude,
          lng: city.longitude,
          tz: NRW_TZ,
        },
      }),
    }).catch(() => undefined);
  }, []);

  return { state, busy, enable, disable, syncCity };
}
