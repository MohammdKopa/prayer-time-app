# Prayer Times — Android app (ROADMAP)

The native Android app. The web PWA at prayer.kametrix.com stays as-is and keeps
serving the mosque plasma display; this is a second front-end over the same engine.

---

## Decisions (locked 2026-09-17)

| | |
|---|---|
| **Package ID** | `app.kametrix.prayer` — permanent, never changeable after publish |
| **Stack** | Expo (SDK 57) / React Native, New Architecture |
| **Approach** | Native rebuild, not a TWA wrapper — chosen for real offline + native notifications |
| **Scope** | Germany-wide, Arabic-first |
| **Languages** | Arabic (primary), German, Turkish, English |
| **Money** | Free. No ads, no tracking, no analytics, no accounts. Data Safety = "no data collected" |
| **Play account** | Created 2026-09-17, identity verification pending |

### Founding principles (from 2026-05-27, still binding)

1. **Clock-first.** The primary interface is a clock, not a feed. Glanceable, calm.
2. **Multi-source consensus.** Never trust a single calculation method.
3. **No junk ads.** Zero ad-tech, ever.
4. **No bad times.** Never display a time that hasn't been validated. Say
   "unverified" rather than show something wrong.

Every feature below had to earn its place against: *does this make the clock
better, or the trust stronger?*

### Deliberately excluded

- **Quran reader** — enormous scope, and one wrong character in the text is
  unforgivable. Link out to a verified app.
- **AR qibla via camera** — gimmick, less accurate than the magnetometer.
- **Social / feed / streak-shaming** — against the calm-clock ethos.

---

## Engineering standards (set 2026-09-17)

Mohamed: *"they were valid for that app, now we have a proper app, we have to
use proper methods."* Correct. The PWA's shortcuts do not travel.

**The one exception — the engine is not rewritten.** `prayer-engine.ts` and
`methods.ts` are validated output, not legacy: `validate.mts` cross-checks them
against Aladhan to within 120s, and they carry the imam's 2026-06 ruling.
Retyping that risks a sign error in a sun-angle calculation that no test catches
and no user reports — they just pray at the wrong time. For that layer, proper
method means *test it harder*, not *type it again*.

| PWA shortcut | Native standard |
|---|---|
| 39 cities hand-typed in a `.ts` array | Offline German place dataset in SQLite, searchable. GPS is the primary input |
| `fetch-mosques.mjs` **regex-parses `cities.ts` source** | Data lives as data. Scripts read data, never source |
| Engine duplicated in the push worker | Native has no worker. One engine, local scheduling |
| `subscriptions.json` as a database | `expo-sqlite` + MMKV for settings |
| Arabic strings hardcoded inline, incl. inside `shared/format.ts` | Typed i18n, 4 locales, zero string literals in components |
| Hijri via `Intl` + `-u-ca-islamic-umalqura` | Deterministic conversion table. Hermes' `Intl` silently falls back to **Gregorian** — a "bad time" by principle #4 |
| Server push for the adhan | Local scheduled notifications. Works in airplane mode, needs no server |
| No unit tests, no CI | Vitest on `shared/`, golden-file tests vs known almanac times, gates in CI |

### Immediate consequence

`shared/format.ts` must be split before mobile touches it — locale-agnostic
math on one side, translated strings on the other. It currently returns Arabic
prose (`بعد ${h}س ${m}د`), which makes German and Turkish impossible.

---

## Fixed along the way (2026-09-17)

**Live bug on prayer.kametrix.com: the adhan fired at the wrong time.**

`scripts/push-worker.mjs` carried a duplicate of the engine and was never
updated when the app moved to `HighLatitudeRule.SeventhOfTheNight` on the
imam's ruling (2026-06). It kept `TwilightAngle`. Measured drift at Marl:

| | App showed | Push fired | Drift |
|---|---|---|---|
| Fajr, 2026-09-17 | 05:31 | 05:13 | 18 min early |
| Isha, 2026-09-17 | 21:20 | 21:30 | 10 min late |
| Fajr, midsummer | 04:11 | **03:01** | **70 min early** |
| Isha, midsummer | 22:56 | 23:58 | **62 min late** |

Every night in June, anyone with notifications on was woken 70 minutes before
Fajr. It had also silently relied on adhan's default madhab instead of setting
Shafi explicitly, and its comment claimed "Hanafi-friendly defaults" — wrong.

Fixed, and made unrepeatable: `scripts/engine-parity.mts` (`npm run parity`)
imports the worker's own `computeTimesFor` and diffs it against the real engine
across 5 German cities × 366 days × 5 prayers = 9,150 comparisons, and fails if
any differ by even one second. Currently green. The worker's entry point is now
guarded so importing it is side-effect free.

**NOT DEPLOYED.** The fix is committed to the working tree only — deploying
prayer.kametrix.com is Mohamed's call.

---

## Architecture

```
prayer-time-app/
  shared/     ← portable logic, ONE source of truth (web + mobile both import)
  src/        ← existing Next.js PWA + /display plasma view (unchanged)
  mobile/     ← new Expo app
```

**Why `shared/` matters:** if the engine forks, the website and the app will
eventually show different Maghrib times for the same city. That is the one bug
this app can never have.

### Port map (measured 2026-09-17)

**Moves as-is (~700 LOC).** `prayer-engine.ts`, `consensus.ts`, `methods.ts`,
`qibla.ts`, `format.ts`, `cities.ts`, mosque data. The `adhan` library is plain
JS and runs in RN. The imam's `SeventhOfTheNight` ruling travels with it.

**Rewritten for native (~1,600 LOC).** `ClockClient` (448), `QiblaCompass` (402
— `DeviceOrientation` → `expo-sensors` magnetometer, a genuine upgrade),
`SunArc` (199), `MosqueSheet` (233), `CitySwitcher` (180), and the small ones.

**Stays on the web, never ported (~1,460 LOC).** `DisplayClient` (721),
`DisplaySunArc` (317), `DisplayPhotoOverlay`, `DisplayFullscreen`,
`InstallBanner`. The mosque TV loads a URL; it does not install an APK.

### Germany-wide changes

- **GPS becomes the primary input** (`expo-location`). The 39 hand-picked NRW
  cities in `cities.ts` don't stretch to 80+ German cities over 100k. The city
  picker is demoted to manual override + offline fallback.
- **Mosques**: widen the Overpass bbox in `scripts/fetch-mosques.mjs` from NRW to
  Germany. ~318 → ~2,500–3,000. The curated Marl layer (IGMG Kuba,
  عباد الرحمن, الخضر) sits on top untouched — that is what it was built for.

---

## Release plan

Two waits stack back-to-back, and they are not the same wait:

1. **Identity verification** — days. Cannot publish during it. Can build,
   can fill the listing.
2. **Closed testing** — 12 testers × 14 continuous days before production
   unlocks (personal accounts). The clock starts when the closed track goes
   live, not when the app feels finished.

**Therefore:** build until verification lands, ship whatever exists that day to
the closed track, keep polishing while the 14 days run. Testers watch it improve;
the calendar doesn't punish the polish.

*(Verify both numbers in Console — Google moves them.)*

---

## Phases

### P0 — Foundation
- [x] Extract `shared/`, repoint the Next app's imports, verify `npm run build` green
- [ ] Scaffold `mobile/` (Expo, `app.kametrix.prayer`, New Arch)
- [ ] Wire `shared/` into Metro; engine computing times in RN
- [ ] Keystore generated **and in the password manager before first upload**

### P1 — The clock (closed-test minimum)
- [ ] Prayer times from GPS, offline, no network path at all
- [ ] City override + search, Germany-wide
- [ ] Countdown to next prayer, current-prayer state
- [ ] Sun arc, Hijri date, Arabic-Indic numerals
- [ ] Consensus confidence badge
- [ ] i18n: AR / DE / TR / EN with RTL

### P2 — Notifications (the actual product on mobile)
- [ ] Local scheduled notifications — **must survive reboot** (`BOOT_COMPLETED`)
      and Doze (exact alarms). Not server push; the app works with no network.
- [ ] Per prayer: full adhan / short beep / silent
- [ ] Pre-prayer reminders, configurable minutes
- [ ] Notification actions: mute today, snooze
- [ ] Proper audio focus handling for adhan playback

### P3 — Widget (the "finished product" signal)
- [ ] Home-screen widget: next prayer + live countdown, small + medium
- [ ] Updates on schedule without opening the app
- [ ] Native module — the most technically involved item in this roadmap

### P4 — Personalisation & trust
- [ ] **Per-prayer manual offsets (±min)** to match the local masjid's iqama.
      Saved per city. The feature that makes people switch.
- [ ] Calculation method override, madhab for Asr
- [ ] High-latitude rule (default stays the imam's seventh-of-the-night)
- [ ] Auto-silence during prayer (DND) — needs a special Android permission,
      a clear explanation screen, and an honest Data Safety entry
- [ ] Theme + language settings

### P5 — Depth
- [ ] **Monthly timetable** — scrollable month, share/export as image (people
      screenshot these and send them to family)
- [ ] **Qibla compass** — magnetometer + calibration UI
- [ ] **Mosque locator** — Germany-wide, distance-sorted, opens in Maps
- [ ] **Ramadan mode** — imsak/iftar countdown, auto-activates by Hijri date
- [ ] **Tasbih counter** — offline, haptic, dead simple
- [ ] **Adhkar** — morning/evening remembrances with counter
- [ ] **Islamic calendar** — Ramadan, Eid, Ashura, etc.
- [ ] **Prayer log** — opt-in, gentle, never guilt-inducing. Off by default.

### P6 — Store
- [ ] Listing in 4 languages, feature graphic, screenshots
- [ ] Privacy policy URL (hosted on kametrix.com)
- [ ] Data Safety: no data collected. Content rating questionnaire.
- [ ] Closed track live → 12 testers → 14 days

---

## Open items

- [ ] **Upload keystore into the password manager.** It becomes irreplaceable
      the moment the app is live on Play.
- [ ] App display name per language — "Prayer Times" is a placeholder.
- [ ] Check the chosen store name isn't taken (Mawaqit, Muslim Pro, Athan are
      all existing apps — avoid).
