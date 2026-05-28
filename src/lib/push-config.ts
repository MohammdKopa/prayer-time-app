/** VAPID + push-store config — loaded from process.env on the server. */

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required env var ${name}. See .env.local.example for setup.`,
    );
  }
  return v;
}

export function vapidConfig(): {
  publicKey: string;
  privateKey: string;
  subject: string;
} {
  return {
    publicKey: required("VAPID_PUBLIC"),
    privateKey: required("VAPID_PRIVATE"),
    subject: process.env.VAPID_SUBJECT ?? "mailto:hello@prayer.kametrix.com",
  };
}

export function pushStorePath(): string {
  return process.env.PUSH_STORE_PATH ?? "./data/subscriptions.json";
}

/** Public key exposed to the browser — safe to send to clients. */
export function vapidPublicKey(): string {
  return required("VAPID_PUBLIC");
}
