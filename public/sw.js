/* eslint-disable no-restricted-globals */
// Service worker — handles prayer-time push notifications.
// Kept intentionally minimal: this app doesn't need offline caching beyond
// what Next.js + the browser already do.

const VERSION = "v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Payload shape: { prayer: "fajr"|"dhuhr"|..., title: string, body: string }
self.addEventListener("push", (event) => {
  let payload = { prayer: "", title: "أذان", body: "حان وقت الصلاة" };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      // ignore — use defaults
    }
  }

  const options = {
    body: payload.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: `prayer-${payload.prayer || "any"}`,
    renotify: true,
    vibrate: [400, 200, 400, 200, 800],
    data: { prayer: payload.prayer, ts: Date.now() },
    // On Chromium-Android, this hints at the system notification sound URL.
    // Many platforms ignore it — the full azan plays when the user taps the
    // notification and the app focuses (see notificationclick below).
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const prayer = event.notification.data?.prayer;
  const url = prayer
    ? `/?azan=${encodeURIComponent(prayer)}`
    : "/";

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of all) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          await client.focus();
          // Tell the open page to start playback if not already.
          client.postMessage({ type: "play-azan", prayer });
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});

// Drop the registration cleanly if the server pushes an empty "expire" message.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      // We let the page re-subscribe on next visit rather than do it here —
      // simpler and avoids holding the VAPID key in the SW.
    })(),
  );
});

console.info(`[sw ${VERSION}] ready`);
