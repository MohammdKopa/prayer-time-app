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
import { pathToFileURL } from "node:url";
import { Coordinates, HighLatitudeRule, PrayerTimes, CalculationMethod, Madhab } from "adhan";
import webpush from "web-push";

// ── config ─────────────────────────────────────────────────────────
const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:hello@prayer.kametrix.com";
const STORE_PATH = process.env.PUSH_STORE_PATH ?? "./data/subscriptions.json";
const TICK_MS = Number(process.env.PUSH_TICK_MS ?? 30_000);
const WINDOW_MS = Number(process.env.PUSH_WINDOW_MS ?? 60_000);
const MAX_FAILURES = 5;

// Called from the entry point below, not at import time — importing this file
// must stay side-effect free so scripts/engine-parity.mts can test against it.
// Production behaviour is unchanged: still fails fast before the first tick.
function configurePush() {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.error("[push-worker] VAPID_PUBLIC and VAPID_PRIVATE are required");
    process.exit(1);
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

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

// ── prayer-time computation ────────────────────────────────────────
// MUST MIRROR shared/prayer-engine.ts + shared/methods.ts (PRIMARY_METHOD).
// This worker runs in its own container with its own package.json, so it
// cannot import the TypeScript engine — the duplication is deliberate, and
// scripts/validate.mts has a guard that fails the build if these drift apart.
//
// Do not change these three lines without changing the engine, or the adhan
// will fire at a different time than the app displays. That already happened
// once: the engine moved to SeventhOfTheNight on the imam's ruling (2026-06)
// and this file kept TwilightAngle, which fired the midsummer Fajr push at
// 03:01 while the app showed 04:11 — 70 minutes early.
//
// Primary method = Muslim World League, Shafi madhab (shared/methods.ts: MWL).
//
// ISHA_MIN_GAP: the imam's ruling (2026-09) is that there must be at least 90
// minutes between Maghrib and Isha. A floor, not a fixed offset — Isha is never
// moved earlier, only held back. Must equal
// ISHA_MIN_GAP_AFTER_MAGHRIB_MIN in shared/prayer-engine.ts.
const ISHA_MIN_GAP_MIN = 90;

// FAJR_MIN_GAP: the other half of the same ruling — the Fajr adhan is at least
// 90 minutes before sunrise. Also a floor: Fajr is never moved later, only
// earlier. Must equal FAJR_MIN_GAP_BEFORE_SUNRISE_MIN in
// shared/prayer-engine.ts.
const FAJR_MIN_GAP_MIN = 90;

function computeTimesFor(lat, lng, date) {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = Madhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  const pt = new PrayerTimes(coords, date, params);
  const ishaFloor = new Date(pt.maghrib.getTime() + ISHA_MIN_GAP_MIN * 60_000);
  const isha = pt.isha.getTime() < ishaFloor.getTime() ? ishaFloor : pt.isha;
  const fajrFloor = new Date(pt.sunrise.getTime() - FAJR_MIN_GAP_MIN * 60_000);
  const fajr = pt.fajr.getTime() > fajrFloor.getTime() ? fajrFloor : pt.fajr;
  return {
    fajr,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha,
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

// Only run the loop when executed directly (`node scripts/push-worker.mjs`).
// Importing this file must stay side-effect free so scripts/engine-parity.mts
// can test computeTimesFor against the real engine.
const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  configurePush();
  console.info(
    `[push-worker] started — tick=${TICK_MS}ms window=${WINDOW_MS}ms store=${STORE_PATH}`,
  );
  loop();
}

export { computeTimesFor };
