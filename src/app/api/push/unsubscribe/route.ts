import { z } from "zod";
import { removeByEndpoint } from "@/lib/push-store";

const UnsubscribeBody = z.object({
  endpoint: z.string().url(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = UnsubscribeBody.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const removed = await removeByEndpoint(parsed.data.endpoint);
  return Response.json({ ok: true, removed });
}
