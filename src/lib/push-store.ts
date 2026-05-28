/**
 * Atomic JSON-file store for push subscriptions.
 * Used by both the Next.js API routes and the cron worker — protected by a
 * temp-file-then-rename write so concurrent readers never see torn writes.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pushStorePath } from "./push-config";

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  cityId: string;
  lat: number;
  lng: number;
  tz: string;
  createdAt: string;
  /** Per-prayer last-fired ISO date strings (YYYY-MM-DD) used to dedupe. */
  lastFired: Record<string, string>;
  /** Count of consecutive failed delivery attempts. */
  failures: number;
}

type Store = { subs: PushSubscriptionRecord[] };

const EMPTY: Store = { subs: [] };

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function readAll(): Promise<PushSubscriptionRecord[]> {
  const file = pushStorePath();
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return Array.isArray(parsed.subs) ? parsed.subs : [];
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "ENOENT"
    ) {
      return [];
    }
    throw err;
  }
}

async function writeAll(subs: PushSubscriptionRecord[]): Promise<void> {
  const file = pushStorePath();
  await ensureDir(file);
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify({ subs } satisfies Store, null, 2));
  await fs.rename(tmp, file);
}

/** Upsert by endpoint. Returns the stored record. */
export async function upsert(
  partial: Omit<PushSubscriptionRecord, "id" | "createdAt" | "lastFired" | "failures">,
): Promise<PushSubscriptionRecord> {
  const subs = await readAll();
  const existing = subs.find((s) => s.endpoint === partial.endpoint);
  if (existing) {
    Object.assign(existing, partial);
    await writeAll(subs);
    return existing;
  }
  const rec: PushSubscriptionRecord = {
    ...partial,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    lastFired: {},
    failures: 0,
  };
  subs.push(rec);
  await writeAll(subs);
  return rec;
}

export async function removeByEndpoint(endpoint: string): Promise<boolean> {
  const subs = await readAll();
  const next = subs.filter((s) => s.endpoint !== endpoint);
  if (next.length === subs.length) return false;
  await writeAll(next);
  return true;
}

export async function removeById(id: string): Promise<boolean> {
  const subs = await readAll();
  const next = subs.filter((s) => s.id !== id);
  if (next.length === subs.length) return false;
  await writeAll(next);
  return true;
}

/** Bulk update — used by the cron worker after sending pushes. */
export async function applyUpdates(
  updates: Array<{ id: string; lastFired?: Record<string, string>; failures?: number }>,
  deletions: string[] = [],
): Promise<void> {
  if (updates.length === 0 && deletions.length === 0) return;
  const subs = await readAll();
  const deletionSet = new Set(deletions);
  const remaining = subs.filter((s) => !deletionSet.has(s.id));
  for (const u of updates) {
    const target = remaining.find((s) => s.id === u.id);
    if (!target) continue;
    if (u.lastFired) target.lastFired = { ...target.lastFired, ...u.lastFired };
    if (typeof u.failures === "number") target.failures = u.failures;
  }
  await writeAll(remaining);
}

export { EMPTY };
