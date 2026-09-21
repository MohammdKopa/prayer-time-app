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
| **Play account** | Created 2026-09-17. **Approved 2026-09-18** — identity verified, publishing unlocked |

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

**Correction to the first version of this entry.** Production was not affected
the whole time. The drift began when the engine changed on 2026-06-02 and was
hand-fixed directly on the VPS at 02:27 on 2026-06-10 — roughly eight days, in
the worst week of the year for it. The running worker has been correct since.

The live danger was subtler and arguably worse: **that hotfix existed only as an
uncommitted edit on the server.** It was never in git. A clean redeploy, a new
VPS, or the `git pull && docker compose up -d --build` documented in DEPLOY.md
would have silently reverted it. Attempting exactly that on 2026-09-17 is how it
was found — git refused the pull because of the local modification.

The worker had also relied on adhan's default madhab instead of setting Shafi
explicitly, with a comment claiming "Hanafi-friendly defaults" — wrong.

Fixed, and made unrepeatable: `scripts/engine-parity.mts` (`npm run parity`)
imports the worker's own `computeTimesFor` and diffs it against the real engine
across 5 German cities × 366 days × 5 prayers = 9,150 comparisons, and fails if
any differ by even one second. Currently green. The worker's entry point is now
guarded so importing it is side-effect free.

**DEPLOYED 2026-09-17.** Commits 6bf9d04 / 5af37ed / eefd5e3 pushed to master,
pulled on the VPS, containers rebuilt. The server's June hand-edit was backed up
to `/root/push-worker.hotfix-2026-06-10.mjs.bak` before being replaced by the
committed version. Verified inside the running container: midsummer Marl fajr
04:11 / isha 22:56, matching the app exactly.

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
- **Mosques**: three bundled layers, no network. OpenStreetMap Germany-wide
  (1,587 — that is OSM's real coverage, not the 2,500–3,000 hoped for) +
  Overture Maps places (449 more, mostly Facebook-page mosques OSM never got)
  + the curated layer in `shared/mosques-curated.ts`, now shared with the
  website. ≈2,040 total. See "Done 2026-09-19" for what was tried and rejected.
- **Cities**: `mobile/src/lib/cities/germany.json` — every German city/town of
  10,000+ from OSM (1,130), merged under the curated NRW list. The picker
  shows the biggest 40 until you type.

---

## Release plan

Two waits stack back-to-back, and they are not the same wait:

1. **Identity verification** — days. Cannot publish during it. Can build,
   can fill the listing.
2. ~~**Closed testing** — 12 testers × 14 continuous days before production
   unlocks.~~ **Does not apply.** That rule is for *personal* developer
   accounts; this is an **organization account** (confirmed 2026-09-20), which
   publishes straight to production. First review still takes days.

**Therefore:** build until verification lands, then upload. Internal testing is
worth one pass first — it is instant, takes the same AAB, and installing from
Play is the only honest check that the release build works on a real phone.
Promote the same build to production once it does.

*(Verify in Console — Google moves these rules.)*

---

## Sprint to v1.0 — updated 2026-09-19, 04:40

Goal: an app worth putting in front of 12 testers. Ordered so that stopping
after ANY phase still leaves something shippable — the closed-test clock
(12 testers × 14 continuous days) starts the day we upload, so uploading early
and polishing during those 14 days beats holding back for a perfect build.

### Done 2026-09-17

Engine and platform:
- [x] Engine shared with the website (`shared/`), adhan pinned to one exact version
- [x] Sheikh Ayman's ruling implemented as **fixed** offsets: Isha = Maghrib + 90,
      Fajr = sunrise − 90. Deployed to prayer.kametrix.com.
- [x] Three drifts caught by `npm run parity` before shipping; the Aladhan
      watchdog and the browser-side watchdog both repaired
- [x] Expo app on `app.kametrix.prayer`, running on Mohamed's phone

The app:
- [x] GPS location, Germany-wide, manual city override
- [x] Four languages, AR/DE/TR/EN, Arabic as fallback
- [x] Local adhan notifications, offline, 7-day horizon, own id prefix
- [x] Qibla compass — true north, compass rose, smoothed, short-path rotation
- [x] Hijri date (deterministic Umm al-Qura, 1300–1600 AH, no `Intl`)
- [x] Tasbih counter
- [x] Monthly timetable, shareable as an image
- [x] Dua & adhkar library + five independent reminders, all off by default
- [x] Per-prayer offsets, notification style, pre-prayer reminders
- [x] Real tabs (not a Stack), labelled: Times · Month · Adhkar · Qibla · More
- [x] App icon, splash, adaptive + monochrome
- [x] Deep emerald palette, living sky that tracks the day's own prayer times
- [x] Reem Kufi / Noto Naskh typography

Store:
- [x] Listing in 4 languages, within Play's character limits
- [x] Privacy policy in 4 languages, with the postal address
- [x] Five contradicting permissions stripped from the manifest

### Done 2026-09-18

Roadmap items E and F, built in parallel by seven agents on disjoint files
and integrated afterwards:

- [x] **Ramadan mode** — auto-activates from the Hijri month. Day number,
      imsak (= the shown Fajr, no extra minutes) and iftar (= Maghrib), and a
      countdown to whichever is next, on the Times screen.
- [x] **Islamic calendar** — eleven annual dates, next twelve months, with an
      "observed by some" note on Mawlid, Nisf Sha'ban and 27 Ramadan. Forward
      scan over `toHijri`, no inverse conversion. Eid al-Fitr 1448 → 9 Mar
      2027, Eid al-Adha 1448 → 16 May 2027, both checked.
- [x] **Mosque locator** — Germany-wide from Overpass (1,587 mosques; two
      mirrors agree, that is OSM's real coverage today). Nearest 25, opens
      in the maps app. `npm run mosques:germany` regenerates; reads no source.
- [x] **Auto-silence during prayer** — Kotlin Expo module, off by default,
      10/15/20/30 min, explanation card before asking for DND access, boot
      receiver. Data Safety note added to the listing.
- [x] **Home-screen widget** — Kotlin App Widget, next prayer + time +
      countdown, per-minute alarm, boot re-arm, tap opens the app. JS hands
      it a pre-translated schedule; Kotlin only substitutes digits.
- [x] **Privacy policy hosted** at `/privacy` on the website, four languages,
      built from `docs/privacy-policy.md` at build time. Item C — deploy it.
- [x] **Launcher name per language** (short: مواقيت الصلاة / Gebetszeiten /
      Namaz Vakitleri / Prayer Times) via `expo.locales` + `mobile/locales/`.
      In SDK 57 that field writes Android `values-b+xx/strings.xml` too, so
      the key must be `app_name` — an iOS key there fails Android lint. The
      long "… Deutschland" titles stay in the store listing only.
- [x] **Vitest suite** — 91 tests: engine goldens checked against Aladhan
      (worst case exactly 120 s), Hijri anchors against a second source,
      prefs, time, qibla (Marl → Kaaba is 127.6°, not the 130–135° guessed).
      `npm run gates` now runs tests first. GitHub Actions workflow added.

**Integration bug found and closed.** The per-prayer offsets, notification
styles and reminders were saved by the settings screen and previewed there —
and honoured nowhere else. The Times screen, the month table, the adhan
notifications, the silence windows and the widget all read raw engine times.
`lib/schedule.ts` is now the single path from a place to this phone's times,
and every consumer goes through it. Reminders now actually fire, "silent"
actually silences, "off" actually drops the prayer, and leaving the
per-prayer settings screen reschedules once.

Also closed, found by the new tests: `planAlerts` let a reminder for an
uncomputable (Invalid Date) prayer through, which would have thrown inside
`scheduleNotificationAsync` above 66°N.

### Done 2026-09-19 (with the tail of 09-18)

Play Console approved 2026-09-18. Then a long session on "why isn't my
mosque there" and "make the wall display universal":

- [x] **Mosque locator, fixed.** The mobile locator read raw OSM and so
      missed Ibad Al-Rahman, IGMG Kuba and El Khodr in Marl, showed "DITB",
      and listed the Alevi centre. The website's OVERRIDES/CURATED layer
      moved to `shared/mosques-curated.ts` (now with coordinates) and both
      apps consume it. Tests in `tests/mosques.test.ts`.
- [x] **Overture Maps layer** — `scripts/fetch-mosques-overture.py`
      (Python + DuckDB, ~20 min against the public bucket, `--save-raw` /
      `--from-raw` to re-shape instantly). Category `mosque`, Germany,
      confidence ≥ 0.5, deduped against OSM at 150 m and against itself at
      40 m → 449 new mosques, 80 KB. CDLA-Permissive 2.0: made to be bundled.
- [x] **Germany-wide city picker** — `scripts/fetch-cities-germany.mjs`.
      Someone in Berlin who denies GPS is no longer stuck on Marl. A
      same-name town far away (Münster/Westfalen vs Munster/Lower Saxony) is
      a different place and stays; four such pairs remain without a state
      label.
- [x] **Real adhan, two voices** — `mobile/assets/sounds/` (CC0 "Beautiful
      adhan" and a 32 s cut of it), normalised to −16 LUFS. One Android
      channel per voice plus beep and silent (`lib/adhan-voice.ts`); retired
      channels (the old single "adhan", the 1885 voice's) are deleted at
      channel setup. Settings has the picker and a "Play sample" that
      fires a real notification — through a channel-only trigger, so it is
      immediate; the earlier 1 s alarm trigger landed ~2 s late on Android
      14+ without the exact-alarm permission. The 1885 Makkah wax cylinder
      was dropped on 2026-09-19 (a curiosity, not a wake-up call).
      Licences and rejects in `assets/sounds/LICENSES.md` — the Sabah
      Fakhri file on Commons is tagged PD but is a 1985 YouTube rip; not used.
- [x] **Cold start** (2026-09-19, reported 6–7 s; **measured 18–20 s** on
      the Redmi Note 13 Pro, splash to first frame, three runs). Root cause,
      from `top -H`: the JS thread and ART's HeapTaskDaemon both pegged for
      18 s before the first render. `lib/cities/index.ts` merged 1,130
      towns against the 39 curated ones with
      `localeCompare(…, "de", { sensitivity: "base" })` at module load —
      ~44,000 calls, each a JNI trip into Java's Collator on Hermes. Now
      `foldCityName()` once per name, distance checked first. Three further
      things trimmed on the way: (1) `reschedule()` ran on every open —
      twice, saved place then GPS fix — and each run is ~100 cancels + ~35
      schedules, every one a broadcast into expo-notifications that rewrites
      SharedPreferences. Now fingerprinted (`lib/adhan-schedule.ts`), **in
      memory only**: within one process, same place/prefs/voice/language/day
      and the store still full ⇒ one listing and done; every cold start
      rebuilds. A persisted fingerprint was tried and caught on the device:
      `am force-stop` (and Xiaomi's battery killer) wipes the app's alarms
      but not expo-notifications' store, so "33 scheduled" was true and
      AlarmManager held zero. Runs are serialised and the home screen delays
      the first by 1.5 s so the frame paints. (2) Fonts: the five faces are
      compiled in by the `expo-font` config plugin, so `useFonts` no longer
      gates the splash on Android. (3) R8 minify via `expo-build-properties`
      — the release APK carried 47 MB of dex across five files; now 17 MB in
      three. **Resource shrinking stays OFF**: it deleted both adhan `.ogg`
      files, because expo-notifications resolves the sound by name at
      runtime and nothing references `R.raw.*` statically. Needs
      `npx expo prebuild --clean`. Measure with
      `adb shell am start -W app.kametrix.prayer/.MainActivity`.
- [x] **Exact alarms** — from Android 14 `SCHEDULE_EXACT_ALARM` is denied
      by default, so expo-notifications and the silence module both fall
      back to inexact alarms the OS may delay by minutes. Settings now shows
      a card with a button to the "Alarms & reminders" screen when it is
      off (`PrayerSilence.canScheduleExactAlarms`). Android never asks for
      this one itself, so the app does: an explain-then-open dialog the
      moment notifications (or a dua reminder) are switched on, and a
      tappable banner under the countdown on the clock screen for as long
      as the adhan is on and the permission is not (`lib/exact-alarms.ts`,
      `components/ExactAlarmBanner.tsx`). Verified on the device by
      revoking with `appops set --uid … SCHEDULE_EXACT_ALARM ignore` —
      without `--uid` the set is silently ignored. `USE_EXACT_ALARM` would
      make it automatic but Play reserves it for alarm/calendar apps —
      decide before store submission.
- [x] **"Scheduled alerts" list in Settings** — the queue expo-notifications
      actually holds, soonest first. A second ring with one entry per time
      here is not this app's alarm: check the website's push subscription
      (`public/sw.js` posts "أذان" for the Marl mosque) or a second
      install.
- [x] **Universal mosque display** — the website's illuminated-muṣḥaf wall
      ported to the phone: `mobile/src/app/display.tsx` +
      `components/display/`. Landscape, keep-awake, status AND navigation
      bar hidden, nebula/vignette/star lattice/frame/corners/gold dust,
      live clock + next prayer, wall sun arc with crescent, six glass cards,
      rotating āyah/ḥadīth/dhikr with the right marks, night-dim, two-minute
      prayer-now takeover, anti-burn-in drift, and the three photos with
      their duʿāʾ every five minutes (1920 px copies in `assets/photos/`).
      **First open asks for the mosque name and the Jumuʿa time** — it
      differs per mosque — and stores both on the device only. Fridays:
      Dhuhr becomes Jumuʿa with a gold ring and "window opens HH:MM".
      Tap → Settings / Exit; D-pad OK and Back handled for a TV remote.
      Amiri font added for the āyāt.
- [x] **Credits screen** (More → المصادر والحقوق): OpenStreetMap ODbL
      attribution (required), Overture, adhan recordings with Commons links,
      adhan-js, Google Fonts OFL, and the three photos.
- [x] **Double-city notification bug** — after moving from Marl to another
      city the phone rang for both, each at its own local time — and, back
      in Marl, every prayer rang twice. **Root cause found on the device
      2026-09-19** (`dumpsys activity intents`): 23 scheduled notifications
      with UUID identifiers sitting next to ours, same times, through 09-23.
      Builds up to 49c6698 scheduled with no identifier (expo-notifications
      mints a UUID) and cleared with `cancelAllScheduledNotificationsAsync`;
      c7c1d4a switched to prefix-only cancel to spare the dua reminders, so
      the last UUID set the old build made was never cancelled again.
      `cancelOwn` now also cancels any UUID-shaped identifier
      (`isOrphanIdentifier`). Not the website's push: no browser on the
      phone has a site channel for prayer.kametrix.com.
- [x] Tests 117, mobile + web `tsc` clean. Local debug-signed APKs in
      `mobile/build-out/` (gitignored); latest `prayer-20260919-1558.apk` (R8, two sounds, embedded fonts; 104 MB universal, 17 MB dex vs 47).

**Tried and removed — do not re-add without permission.**
- *Mawaqit runtime lookup* (would have broken the "no network" policy and
  Data Safety) and *Mawaqit build-time sweep* (890 mosques, 425 new). Their
  help centre: "Our API is currently private and not publicly available";
  a full extraction of their German entries is a substantial extraction
  under the EU/German database right (§87a UrhG). Stripped 2026-09-19. The
  three curated Marl pins are single facts and stay. **Ask
  support@mawaqit.net** — same community, non-profit; if they say yes the
  script is in git history.
- *Google Places one-time pull* — never attempted: Maps Platform terms
  forbid bulk export and any cache beyond 30 days. Live-only, which the
  privacy policy rules out.

**Found, not decided — needs the sheikh.** Ibad Al-Rahman publishes its
own times on Mawaqit. Fitting its full-year calendar: Fajr 14.5°, Isha 14°,
plain twilight angles, no high-latitude clamp, Maghrib +3 min (mean error
0.16 min). That is **not** the fixed 90-minute rule the engine implements:
mid-June the mosque says Fajr 03:26 / Isha 23:34, the app 03:43 / 23:21.
Today they agree within two minutes. Whichever the adhan actually follows
is one sentence from Sheikh Ayman; the engine change is small either way.

### Done 2026-09-22 — the late Maghrib

- [x] **Maghrib arrived 2.5 hours late, together with Isha** (Mohamed's
      Xiaomi 23078PND5G "corot", HyperOS 3.0, Play build, 2026-09-21). Read off the device
      with adb: all five alarms of the day were delivered, Asr (16:43) on
      time and the last one delivered while idle; Maghrib and Isha both
      went out at about 21:57. Exact alarms were allowed; Xiaomi's
      **Autostart** (MIUI app-op 10008) was **off**, and the system had
      been killing the process for memory. Logs from the Maghrib minute
      itself had already rotated, so the mechanism is inferred, not seen.
- [x] **Adhan armed with `setAlarmClock`**, the one alarm type neither Doze
      nor OEM battery managers defer. expo-notifications has no option for
      it, so it is a patch-package patch
      (`mobile/patches/expo-notifications+57.0.19.patch`, applied by
      `postinstall`). SDK 57 links expo-notifications as a **prebuilt
      AAR** that ignores its own sources, so `mobile/package.json` sets
      `expo.autolinking.android.buildFromSource: ["expo-notifications"]`;
      without it the patch compiles into nothing (the first build did
      exactly that). Re-check the patch on every expo-notifications
      upgrade. Cost: the status-bar alarm icon, and "next alarm" shows the
      next adhan.
- [x] **Autostart prompt on Xiaomi**: `PrayerSilence.autostartState()`
      reads op 10008 by reflection; the clock-screen banner and a Settings
      card send the user to the Security app's Autostart list (app settings
      as a fallback). Silent on every other phone.
- [x] **Widget tick no longer runs without a widget.** `refreshAll` armed
      the per-minute alarm on every adhan reschedule even with no instance
      placed (71 ticks on a phone with no widget). It now cancels instead,
      and the tick is a non-wakeup `RTC` alarm: it used to wake the phone
      1,440 times a day and share the adhan's allow-while-idle budget.
- [x] **Native module sources were not in git.** `mobile/.gitignore`'s bare
      `android/` also matched `modules/*/android/`, so the widget and
      auto-silence Kotlin existed only on this drive. Anchored to
      `/android/`; module build output ignored separately.
- [ ] Ship as versionCode 2 through Play, then confirm on the Redmi:
      `adb shell dumpsys alarm` should list the next adhan under
      "Next alarm clock" for app.kametrix.prayer, the status bar should
      show the alarm icon, and Maghrib should arrive on its own.

### Still to do, in order

**A — content review. BLOCKS RELEASE.**
`docs/dua-content-review.md` needs a qualified human. 15 items, each with its
source. Three have German translations the implementer wrote; the sleep dua has
all three. The screen already says "not yet reviewed" for those. Four items were
deliberately left out rather than approximated and are listed for a reviewer to
restore deliberately. **No religious text ships unreviewed.**

**B — screenshots + store assets.** 4 at 1080×1920 minimum; below that Play
quietly excludes the app from its recommendation surfaces. Needs the phone.

**C — deploy the website** so prayer.kametrix.com/privacy is reachable. The
page exists; the URL does not until the VPS pulls.

**D — production AAB via EAS → closed track.** The only item with a date
attached. Starts the 14-day clock.

**E — commit today's work in three chunks** once the phone test is clean:
mosque layers + cities; adhan voices; mosque display + credits + notification
fix. Nothing from 09-18/19 is committed yet.

**F — confirm the photo rights.** `assets/photos/CREDITS.md` still says
"provided by Mohamed — confirm before publishing" for all three. Play does not
ask, but it acts on complaints. Yours to confirm.

**On-device checks** (compiled clean, not yet exercised on a phone):
- Widget: place it and watch it tick; DND: grant access, confirm quiet at the
  next adhan and back after the chosen minutes; reboot, confirm both survive.
- Adhan voices: Play sample × 3. Decide whether the CC0 recording is good
  enough; the fallback is "Azan.ogg" on Commons (CC BY-SA, needs a credit).
- Display: landscape lock and back to portrait on exit; no bars; setup card
  once; photo fades in within five minutes; Amiri renders the āyāt; the
  crescent mask draws; Back closes setup → menu → exits.
- Move cities (or pick Berlin manually) and confirm only one set of adhans.
- Mosques: Ibad Al-Rahman and El Khodr near the top, once each; "DITIB Yunus
  Emre" not "DITB"; the IGMG once.

### Carried over, not forgotten

- Upload keystore: EAS holds it server-side, so unlike Tellro there is nothing
  local to lose. The local APKs are debug-signed and can never go to Play.
- `shared/format.ts` still returns Arabic prose and still uses `Intl` for
  Hijri; the mobile app avoids it entirely. The **website** still uses it.
- The web app and plasma display do not show the "mosque timing" note.
  Declined 2026-09-17 — not an oversight.
- `npm run validate` is red on Asr: Aladhan is 3 min later than the engine
  for Marl. An independent NOAA computation lands within a minute of the
  engine, so the engine is right and the 120 s tolerance is what to loosen
  (Asr only). Pre-dates 2026-09-18.
- Android TV proper (leanback launcher, banner, react-native-tvos) is not
  done. Sideloading on a TV box works; remote OK/Back are handled.
- Expo typed routes only regenerate via `expo start` — after adding a route,
  start it briefly on a spare port and kill it, or `tsc` will not know the href.
- Writing JS regex source through a Python/bash heredoc turned a word
  boundary escape into a literal backspace once. Patch files with the editor
  tools, not heredocs.
- `expo prebuild` overwrites the launcher icons. Sources in
  `mobile/assets/images/` are correct, so a successful prebuild regenerates the
  same thing. Prebuild deletes all of `android/` and fails with `EBUSY` if any
  process holds a handle inside it — including a shell whose cwd is in there.


## Phases

### P0 — Foundation
- [x] Extract `shared/`, repoint the Next app's imports, verify `npm run build` green
- [x] Scaffold `mobile/` (Expo SDK 57.0.23 / RN 0.86.3, `app.kametrix.prayer`)
- [x] Wire `shared/` into Metro; engine bundles into the Android build
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
- [x] **Per-prayer manual offsets (±min)** to match the local masjid's iqama.
      Saved per city. The feature that makes people switch.
- [ ] Calculation method override, madhab for Asr
- [ ] High-latitude rule (default stays the imam's seventh-of-the-night)
- [x] Auto-silence during prayer (DND) — needs a special Android permission,
      a clear explanation screen, and an honest Data Safety entry
- [x] Language settings (theme: not planned — one dark palette is the design)
- [x] Adhan voice picker (three recordings, per-voice channels)

### P5 — Depth
- [ ] **Monthly timetable** — scrollable month, share/export as image (people
      screenshot these and send them to family)
- [x] **Qibla compass** — magnetometer + calibration UI
- [x] **Mosque locator** — Germany-wide, distance-sorted, opens in Maps
      (OSM + Overture + curated, ≈2,040)
- [x] **Ramadan mode** — imsak/iftar countdown, auto-activates by Hijri date
- [x] **Tasbih counter** — offline, haptic, dead simple
- [x] **Adhkar** — morning/evening remembrances with counter (content review pending — item A)
- [x] **Islamic calendar** — Ramadan, Eid, Ashura, etc.
- [x] **Mosque display** — the wall, on any phone or tablet; per-mosque name
      and Jumuʿa time set on first open
- [ ] **Prayer log** — opt-in, gentle, never guilt-inducing. Off by default.

### P6 — Store
- [ ] Listing in 4 languages, feature graphic, screenshots
- [ ] Privacy policy URL (hosted on kametrix.com) — page built, VPS not pulled (item C)
- [ ] Data Safety: no data collected. Content rating questionnaire.
      Still true: every data layer is bundled at build time, no runtime fetch.
- [x] Sources & credits screen in-app (ODbL attribution is a licence requirement)
- [ ] Closed track live → 12 testers → 14 days

---

### Notes from the scaffold (2026-09-17)

- **`newArchEnabled` and `android.edgeToEdgeEnabled` no longer exist** in SDK
  57 — `expo-doctor` rejects them. New Architecture is the default now.
- **adhan is pinned to an exact version** (4.4.6) in all three package.json
  files. It arrived as `^4.4.6` in mobile against `^4.4.3` on web; the two
  compute identically today (10,980 comparisons, zero differences) but a caret
  range on the library that decides prayer times would let a silent patch bump
  fork the engine through its own dependency.
- **Metro needs `disableHierarchicalLookup`**, or a module reached through
  `../shared` can resolve a second copy of React from the repo root and fail
  with an invalid-hook-call that names nothing useful.
- The template's demo tree (components, constants, hooks, global.css) was
  deleted rather than left to rot. `src/` is three files.
- Verified by exporting a real Android bundle: 2.7MB of Hermes bytecode with
  the engine in it. Arabic strings sit in Hermes' UTF-16 string table.

## Known engine limitation — high latitude (found 2026-09-17)

`shared/prayer-engine.ts` has no solution for Fajr, sunrise, Maghrib and Isha
during the midnight-sun weeks, and returns an **Invalid Date**. Measured over a
full year at longitude 10E:

| | invalid-date days | out-of-order days |
|---|---|---|
| Marl 51.7N / Hamburg 53.6N / Flensburg 54.8N | 0 | 0 |
| Oslo 60.0N | 0 | 0 |
| Tromso 69.6N | 116 | 19 |
| Longyearbyen 78.2N | 240 | 13 |

**Germany is entirely unaffected** — zero occurrences anywhere up to 60N. Not a
launch blocker for a Germany-targeted app. But the app follows GPS, so a
traveller reaches it, and an Invalid Date passed to
`scheduleNotificationAsync` throws, which would abort the whole rescheduling
pass and silence the prayers that *are* computable.

The mobile app is now guarded rather than fixed: `formatClock` renders `—`,
the next/current scan skips uncomputable prayers, and the notification loop
skips them. **The website has the same exposure and is not guarded.**

Separately, above 60N the engine sometimes emits times that are *valid but out
of order* (66N, 9 Dec 2026 puts Dhuhr and Asr both at 11:33). Straightening
that is a fiqh question as much as a coding one and belongs in the engine,
where the website would get it too. Deliberately not papered over in the app:
showing a user a corrected order the engine never produced would make the
phone disagree with the website.

---

## Open items

- [x] Surface the adjusted times in the phone app — done, shows "وفق توقيت
      المسجد" with each rule whenever a shown time differs from the calculated
      one.
- ~~Surface the adjusted times on the web app and plasma display.~~
      **Declined by Mohamed, 2026-09-17.** Raised because with fixed offsets
      the shown Fajr and Isha differ from the calculated ones nearly every
      day; he decided the note is not needed there. The phone app keeps it.
      Not an oversight — do not re-raise.

- [ ] **Upload keystore into the password manager.** It becomes irreplaceable
      the moment the app is live on Play.
- [ ] **Ask Sheikh Ayman which times the adhan follows** — the fixed 90-minute
      rule, or the 14.5°/14° calendar the mosque publishes on Mawaqit. See
      "Found, not decided" above. Up to 33 min apart in June.
- [ ] **Email support@mawaqit.net** for permission to list their German
      mosques (with attribution and a link per mosque). Script in git history.
- [ ] **Add the missing mosques to OpenStreetMap** — Ibad Al-Rahman, IGMG
      Kuba, El Khodr for a start. The next `npm run mosques:germany` picks
      them up, the curated layer shrinks, and every other app benefits.
- [ ] "Mosque missing?" report link in the locator → curated file. Skipped
      2026-09-18; still the cheapest coverage multiplier.
- [ ] Loosen the validate gate's Asr tolerance (engine is right, Aladhan is +3 min).
- [x] App display name per language — done 2026-09-18 via `expo.locales`.
- [ ] Check the chosen store name isn't taken (Mawaqit, Muslim Pro, Athan are
      all existing apps — avoid).
