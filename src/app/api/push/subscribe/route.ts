import { z } from "zod";
import { upsert } from "@/lib/push-store";

const SubscribeBody = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  city: z.object({
    id: z.string().min(1).max(64),
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
    tz: z.string().min(1).max(64),
  }),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = SubscribeBody.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { endpoint, keys, city } = parsed.data;
  const rec = await upsert({
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    cityId: city.id,
    lat: city.lat,
    lng: city.lng,
    tz: city.tz,
  });
  return Response.json({ ok: true, id: rec.id });
}
