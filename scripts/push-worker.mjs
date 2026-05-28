#!/usr/bin/env node
/**
 * Push worker — long-running Node process.
 *
 * Every 30s: read all push subscriptions, compute each city's prayer times
 * for today, and fire a Web Push for any prayer that's just crossed (within
 * the last 60s) and hasn't been fired yet today.
 *
 * Failure handling:
 *   - 410 Gone / 404 → delete the subscription (browser cleaned up).
 *   - Other errors → increment failures; drop after 5 consecutive failures.
 *
 * Run with:  node scripts/push-worker.mjs
 * Env:       VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT, PUSH_STORE_PATH
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Coordinates, HighLatitudeRule, PrayerTimes, CalculationMethod } from "adhan";
import webpush from "web-push";

// ── config ─────────────────────────────────────────────────────────
const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:hello@prayer.kametrix.com";
const STORE_PATH = process.env.PUSH_STORE_PATH ?? "./data/subscriptions.json";
const TICK_MS = Number(process.env.PUSH_TICK_MS ?? 30_000);
const WINDOW_MS = Number(process.env.PUSH_WINDOW_MS ?? 60_000);
const MAX_FAILURES = 5;

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error("[push-worker] VAPID_PUBLIC and VAPID_PRIVATE are required");
  process.exit(1);
}
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

// ── store helpers (mirror src/lib/push-store.ts) ───────────────────
async function readAll() {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.subs) ? parsed.subs : [];
  } catch (err) {
    if (err && err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(subs) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  const tmp = `${STORE_PATH}.tmp-${process.pid}-${Date.now()}-${randomUUID()}`;
  await fs.writeFile(tmp, JSON.stringify({ subs }, null, 2));
  await fs.rename(tmp, STORE_PATH);
}

// ── prayer-time computation (mirrors src/lib/prayer-engine.ts) ─────
// Primary method = Muslim World League with Hanafi-friendly defaults.
function computeTimesFor(lat, lng, date) {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.MuslimWorldLeague();
  params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  const pt = new PrayerTimes(coords, date, params);
  return {
    fajr: pt.fajr,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
}

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const PRAYER_AR = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

function dateKeyInTz(d, tz) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  }).format(d);
}

function payloadFor(prayer) {
  return JSON.stringify({
    prayer,
    title: `أذان ${PRAYER_AR[prayer]}`,
    body: `حان وقت صلاة ${PRAYER_AR[prayer]}`,
  });
}

// ── one tick ───────────────────────────────────────────────────────
async function tick(now = new Date()) {
  const subs = await readAll();
  if (subs.length === 0) return;

  const windowStart = now.getTime() - WINDOW_MS;
  const toDelete = new Set();
  let mutated = false;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        const times = computeTimesFor(sub.lat, sub.lng, now);
        const today = dateKeyInTz(now, sub.tz);

        for (const p of PRAYERS) {
          const t = times[p];
          if (!(t instanceof Date)) continue;
          const ms = t.getTime();
          // Crossed inside the window we care about right now.
          if (ms > windowStart && ms <= now.getTime()) {
            if (sub.lastFired?.[p] === today) continue;
            const ok = await sendPush(sub, payloadFor(p));
            if (ok) {
              sub.lastFired = { ...(sub.lastFired ?? {}), [p]: today };
              sub.failures = 0;
              mutated = true;
              console.info(
                `[push-worker] fired ${p} → ${sub.cityId} (${sub.id.slice(0, 8)})`,
              );
            }
            // Only fire one prayer per sub per tick to avoid bursts.
            break;
          }
        }
      } catch (err) {
        console.warn(`[push-worker] error processing ${sub.id}:`, err?.message);
      }
    }),
  );

  // Mark expired/failed subs for deletion.
  for (const sub of subs) {
    if (sub._expired) toDelete.add(sub.id);
    else if ((sub.failures ?? 0) >= MAX_FAILURES) toDelete.add(sub.id);
  }

  if (mutated || toDelete.size > 0) {
    const remaining = subs.filter((s) => !toDelete.has(s.id));
    await writeAll(remaining);
    if (toDelete.size > 0) {
      console.info(`[push-worker] pruned ${toDelete.size} dead subscriptions`);
    }
  }
}

async function sendPush(sub, payload) {
  const pushSub = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };
  try {
    await webpush.sendNotification(pushSub, payload, { TTL: 300 });
    return true;
  } catch (err) {
    const code = err?.statusCode;
    if (code === 410 || code === 404) {
      sub._expired = true;
      return false;
    }
    sub.failures = (sub.failures ?? 0) + 1;
    console.warn(
      `[push-worker] sendPush failed (${code ?? "?"}) for ${sub.id.slice(0, 8)}: ${err?.message}`,
    );
    return false;
  }
}

// ── main loop ──────────────────────────────────────────────────────
console.info(
  `[push-worker] started — tick=${TICK_MS}ms window=${WINDOW_MS}ms store=${STORE_PATH}`,
);

let stopping = false;
async function loop() {
  while (!stopping) {
    const started = Date.now();
    try {
      await tick();
    } catch (err) {
      console.error("[push-worker] tick failed:", err);
    }
    const dur = Date.now() - started;
    await new Promise((r) => setTimeout(r, Math.max(0, TICK_MS - dur)));
  }
}

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.info(`[push-worker] ${sig} received, shutting down`);
    stopping = true;
    setTimeout(() => process.exit(0), 200);
  });
}

loop();
