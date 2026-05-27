# Prayer Times

A prayer clock with multi-source consensus. No ads, no bad times.

The clock displays prayer times computed **locally on the device** using Meeus-based astronomy (via [`adhan-js`](https://github.com/batoulapps/adhan-js)). Each time is cross-checked against 6 other calculation methods — when they disagree by more than 2 minutes, the UI shows a confidence badge so the user knows the time is contested rather than authoritative.

## Status

**MVP — single screen, hardcoded to Marl, NRW (51.6564, 7.0907).**

Built 2026-05-27. Differentiator validated:
- Local engine agrees with Aladhan MWL within 60s for all 5 prayers (see `scripts/validate.mts`).
- 7 calculation methods displayed simultaneously (MWL, ISNA, Egyptian, Umm al-Qura, Diyanet, MoonsightingCommittee, MWL+Hanafi Asr).

## Run locally

```bash
npm install
npm run dev     # → http://localhost:3000
```

## Validate the engine

```bash
npx tsx scripts/validate.mts
```

Computes today's prayers for Marl via the local engine and diffs each one against Aladhan MWL. Exits non-zero if any prayer drifts > 120s.

## Deploy

```bash
bash scripts/bundle.sh
```

See [DEPLOY.md](DEPLOY.md) for VPS setup (systemd + nginx).

## What's NOT in the MVP

Parked for v2 (see `.claude/plans/lets-make-an-mvp-sequential-bird.md`):
- Location picker / GPS / multi-city
- Method picker UI (currently hardcoded to MWL with TwilightAngle high-lat rule)
- Qibla compass, Hijri overlay, Adhan audio
- localStorage settings
- Tier 3 sources (masjid iqama feeds, moon-sighting committees)
- Real service worker for cold-offline
- Native iOS/Android wrap

## Architecture

```
Browser (PWA, installable)
└── ClockClient.tsx ('use client')
    ├── computeDay(MARL.lat, MARL.lng) ──→ adhan-js × 7 methods
    ├── computeConsensus(day)            ──→ spread + confidence
    └── fetch('/api/sanity-check')       ──→ Aladhan watchdog
                                              (console.warn if Δ>30s vs primary)
```

The clock displays `MWL` (Muslim World League, TwilightAngle high-lat rule). All other methods exist only to populate the confidence badge.

## File map

```
src/
├── app/
│   ├── layout.tsx               viewport, manifest, fonts
│   ├── page.tsx                 mounts <ClockClient location={MARL} />
│   ├── globals.css              Tailwind 4 + ink/gold theme
│   └── api/sanity-check/route.ts  Aladhan proxy (1h cache)
├── components/
│   ├── ClockClient.tsx          ticking clock, countdown, watchdog
│   ├── PrayerRow.tsx            row with confidence pill
│   └── ConfidenceBadge.tsx      coloured pill (high/medium/low)
└── lib/
    ├── prayer-engine.ts         computeDay() — wraps adhan-js
    ├── methods.ts               7 calculation methods registry
    ├── consensus.ts             computeConsensus() — spread + rating
    ├── format.ts                time/countdown formatters, AR labels
    └── location.ts              MARL hardcoded location
```
