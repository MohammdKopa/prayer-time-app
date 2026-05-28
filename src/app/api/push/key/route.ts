import { vapidPublicKey } from "@/lib/push-config";

export const dynamic = "force-static";

export async function GET() {
  return Response.json({ publicKey: vapidPublicKey() });
}
