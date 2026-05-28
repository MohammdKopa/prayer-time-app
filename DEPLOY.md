# Deploy — Docker on VPS (`217.154.144.122`)

The app runs as a single Docker container behind your existing nginx. Internal port 3000, mapped to localhost:3100 on the host so nginx can reverse-proxy to it without exposing the container publicly.

## Path A — Git pull + build on the VPS (recommended)

Once the repo is public on GitHub, this is the cleanest flow.

### 1. First-time setup (do once)

```bash
ssh root@217.154.144.122
cd /opt
git clone https://github.com/<your-user>/prayer-time-app.git
cd prayer-time-app

# Generate VAPID keys for Web Push (one time only — keep these secret)
docker run --rm node:22-alpine sh -c \
  'npm install -g web-push --silent && web-push generate-vapid-keys --json'

# Paste the output into a .env file alongside docker-compose.yml:
cat > .env <<'EOF'
VAPID_PUBLIC=<paste publicKey>
VAPID_PRIVATE=<paste privateKey>
VAPID_SUBJECT=mailto:you@kametrix.com
EOF
chmod 600 .env

mkdir -p data            # subscriptions.json lives here, mounted into both containers

docker compose up -d --build
docker compose logs -f --tail=50    # verify both "prayer-times" and "prayer-times-worker" are healthy
```

### 2. Each subsequent update

```bash
ssh root@217.154.144.122 'cd /opt/prayer-time-app && git pull && docker compose up -d --build'
```

That's it.

## Path B — Local build + ship image (no git on VPS needed)

If you'd rather not put git on the VPS, build the image locally and ship it as a tarball.

### Local

```bash
# Build the image locally
docker build -t prayer-times:latest .

# Save as a tarball
docker save prayer-times:latest | gzip > dist/prayer-times-image.tar.gz
```

### VPS

```bash
scp dist/prayer-times-image.tar.gz root@217.154.144.122:/opt/prayer-time-app/
ssh root@217.154.144.122
cd /opt/prayer-time-app
docker load < prayer-times-image.tar.gz
docker compose up -d
```

## nginx reverse proxy (one-time, on the VPS)

Pick a hostname — e.g. `prayer.kametrix.com`. Add it to your aaPanel sites or drop in a file directly:

`/etc/nginx/sites-available/prayer-time-app`:

```nginx
server {
    listen 80;
    server_name prayer.kametrix.com;

    # TLS handled by certbot / aaPanel SSL — copy the SSL block from one of
    # your existing site configs.

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/prayer-time-app /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

DNS: add an A record for the subdomain → VPS IP.

## Verify

```bash
curl -I https://prayer.kametrix.com/
curl 'https://prayer.kametrix.com/api/sanity-check?lat=51.6564&lng=7.0907' | jq
```

On phone in Marl: install to home screen, confirm prayer times match the local mosque within ~2 min.

## Operations

| Command | Effect |
|---|---|
| `docker compose ps` | container status |
| `docker compose logs -f` | tail logs |
| `docker compose restart` | restart without rebuild |
| `docker compose up -d --build` | rebuild + restart (after `git pull`) |
| `docker compose down` | stop + remove container |
| `docker compose pull` | not applicable (we build locally) |

## Rollback

```bash
cd /opt/prayer-time-app
git log --oneline -5             # find the previous good commit
git checkout <sha>
docker compose up -d --build
```

## Resource usage

Idle container: ~80 MB RAM, negligible CPU. Worker container adds ~40 MB. Image size on disk: ~220 MB (Node 22 alpine + .next/standalone bundle + worker node_modules).

## Push notifications — how it actually works

```
prayer.kametrix.com ─┬─ prayer-times (Next.js)   ──→ /api/push/{subscribe,unsubscribe,key}
                     │
                     ├─ prayer-times-worker      ──→ ticks every 30s, reads /app/data/subscriptions.json,
                     │                              fires Web Push when "now" crosses a prayer time
                     │
                     └─ ./data/subscriptions.json (shared bind mount, persisted on host)
```

When a user taps the bell in the UI:
1. Browser asks for notification permission.
2. If granted, the page subscribes to push and POSTs `{endpoint, keys, city}` to `/api/push/subscribe`.
3. The worker picks up the new sub on its next tick and starts firing pushes at each prayer time for that user's city.
4. The notification's `notificationclick` handler focuses the app window, which then plays the full azan audio.

### Rotating VAPID keys

If a private key leaks: generate new keys, update `.env`, `docker compose up -d`. All existing subscriptions will fail (410 Gone) and the worker will auto-prune them. Users re-subscribe on next visit.

### Troubleshooting pushes

```bash
docker compose logs -f push-worker        # see ticks + fires
cat data/subscriptions.json | jq '.subs | length'   # how many devices subscribed
```

If notifications never arrive:
- Check the browser has granted notification permission (Settings → site permissions).
- iOS users *must* install the app to the home screen first — Safari blocks Web Push otherwise.
- Some corporate / school networks block FCM endpoints. There's nothing the app can do about that.
