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
docker compose up -d --build
docker compose logs -f --tail=50    # verify "Ready in" appears
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

Idle container: ~80 MB RAM, negligible CPU. Image size on disk: ~180 MB (Node 22 alpine + .next/standalone bundle + node_modules subset).
