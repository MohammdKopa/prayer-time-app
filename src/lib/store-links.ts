// The marketing page replaces the web clock at "/" only once BOTH apps are
// live in their stores. Until then these stay unset and the site is exactly
// what it was. Set them in the VPS .env (read at request time, no rebuild):
//
//   APP_STORE_URL=https://apps.apple.com/app/id...
//   PLAY_STORE_URL=https://play.google.com/store/apps/details?id=app.kametrix.prayer

export interface StoreLinks {
  ios: string;
  android: string;
}

export function storeLinks(): StoreLinks | null {
  const ios = process.env.APP_STORE_URL?.trim();
  const android = process.env.PLAY_STORE_URL?.trim();
  return ios && android ? { ios, android } : null;
}
