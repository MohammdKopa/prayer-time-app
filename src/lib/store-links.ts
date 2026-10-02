// The marketing page replaces the web clock at "/" only once BOTH apps are
// live in their stores. Both went live 2026-10-02; docker-compose.yml sets
// the live links as defaults. Read at request time, so overriding them in the
// VPS .env (an empty value turns the web clock back on) needs no rebuild:
//
//   APP_STORE_URL=https://apps.apple.com/app/id6815314217
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
