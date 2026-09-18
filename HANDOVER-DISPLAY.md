# Mosque Display — Handover & WhatsApp Draft

> Local note (not committed to the repo). The wall display lives at
> **https://prayer.kametrix.com/display** and defaults to
> *Masjid ʿIbād al-Raḥmān, Marl*, Jumuʿa **14:00**.

---

## 📱 WhatsApp draft — Arabic (primary)

> السلام عليكم ورحمة الله وبركاته 🌙
>
> الحمد لله، جهّزتُ شاشة المسجد وهي تعمل الآن — تعرض أوقات الصلاة على التلفاز مباشرة، بتصميم على هيئة مصحف مُذهّب: ساعة كبيرة، وقوسٌ للشمس يتحرّك مع مرور اليوم، وآياتٌ وأحاديثُ صحيحة تتبدّل. تعمل وحدها على مدار الساعة وتُحدّث الأوقات تلقائيًا كل يوم.
>
> • **الفجر والعشاء:** ضبطتُهما على فتوى فضيلة الإمام "بالأيسر على المسلمين" في ليالي الصيف الطويلة — أي أبكر وقتٍ للعشاء وآخر وقتٍ للفجر (تقديرٌ بسُبع الليل).
> • **الجمعة:** الوقت مضبوط على الساعة ٢:٠٠ ظهرًا؛ إن رغبتم بتغييره أخبروني وأضبطه فورًا.
> • بقية الأوقات محسوبة محليًا ومُراجَعة بعدّة طرق.
>
> وللمتابعة على الهاتف أيضًا: https://prayer.kametrix.com
>
> أيّ ملاحظة على الخط أو الألوان أو الترتيب، أنا جاهز للتعديل. تقبّل الله منّا ومنكم 🤲

---

## 📱 WhatsApp draft — German (if the recipient prefers it)

> Salam aleikum 🌙
>
> Alhamdulillah, ich habe das Moschee-Display eingerichtet — es läuft jetzt. Es zeigt die Gebetszeiten direkt auf dem Fernseher: große Uhr, ein Sonnenbogen, der dem Tag folgt, und wechselnde Verse & authentische Hadithe. Es läuft rund um die Uhr von selbst und aktualisiert die Zeiten täglich automatisch.
>
> • **Fajr & Ischa:** nach der Fatwa des Imams („das Leichtere für die Muslime") in den langen Sommernächten eingestellt — also früheste Ischa- und späteste Fajr-Zeit (Berechnung nach einem Siebtel der Nacht).
> • **Jumuʿa:** aktuell auf 14:00 Uhr. Möchtet ihr sie ändern, sagt mir die Uhrzeit und ich stelle sie sofort um.
> • Die übrigen Zeiten werden lokal berechnet und mehrfach gegengeprüft.
>
> Zum Mitverfolgen auch auf dem Handy: https://prayer.kametrix.com
>
> Bei Anmerkungen zu Schrift, Farben oder Anordnung passe ich es gerne an. 🤲

---

## 🛠️ Adjusting it later (no code changes needed)

You're setting up the plasma yourself — the display URL is
`prayer.kametrix.com/display`. It hides the cursor, holds a screen wake-lock,
auto-dims at night, drifts a few px against burn-in, and self-reloads ~03:00.

**First time on the TV / HDMI stick:** open the URL in the browser, then **tap
anywhere once** (or press OK on the remote) — a *"اضغط لملء الشاشة"* prompt
appears and one tap clears the address bar and the system bars for true
full-screen. (Browsers only allow full-screen from a tap, so it can't be
automatic.) The full-screen photo rotation of al-Quds & al-Shām fades in every
few minutes between the clock.

Tweak it live through the link:

| Want to… | Add to the URL | Example |
|---|---|---|
| Change Jumuʿa time | `?jumua=HH:MM` | `/display?jumua=13:30` |
| Nudge the Hijri date ±N days | `?hijri=±N` (−2…2) | `/display?hijri=-1` |
| Override the header text | `?title=…` | `/display?title=مسجد%20النور` |
| Pick another NRW city | `?city=<id>` | `/display?city=koeln` |

Combine them with `&`: `…/display?jumua=13:45&hijri=1`

---

## 📋 Changelog — everything since yesterday

### 1. Mosque wall display (`/display`) — new feature
A full-screen "illuminated mushaf" plasma view for the mosque TV:
- Ornate gold frame with arabesque corners, calligraphic Reem Kufi / Amiri
  type, a grand live clock, and a **real-time sun arc** (sun by day, crescent
  moon + star field at night) tracing the day.
- The five prayers marked on the arc; the next one glows. Prayer cards below,
  the next/Jumuʿa one highlighted; past prayers dimmed.
- Rotating **Qurʾan / authentic-ḥadīth / dhikr** ticker — all sourced, sahih
  or agreed-upon only. A separate Friday set on Jumuʿa days.
- **Jumuʿa-aware:** on Fridays the Dhuhr slot becomes the fixed congregation
  time (`?jumua=HH:MM`, default 14:00), relabelled الجمعة with the zawāl
  subtitle, and the countdown targets Jumuʿa.
- "It's prayer time now" full-screen takeover for ~2 min as each waqt enters.
- Kiosk polish: night auto-dim, burn-in pixel-drift, cursor/selection off,
  screen wake-lock, ~03:00 self-reload, `?hijri=±N` for local moon sighting.

### 2. Fajr & Isha — eased high-latitude ruling
Changed how **Fajr and Isha** are computed in the long NRW summer (when the sun
never dips far enough below the horizon for the normal twilight angles). Switched
from `TwilightAngle` to **Seventh-of-the-Night** (taqdīr bi-subʿ al-layl): Isha
capped at sunset + ⅐ of the night, Fajr at sunrise − ⅐ of the night. This is the
imam's "use whatever is easier for the Muslims" ruling — it gives the **earliest
Isha and the latest Fajr** of the available rules. The Aladhan sanity-check was
synced to match (`latitudeAdjustmentMethod=2`).

### 3. Fire TV fixes (today) — performance + the missing arc
After testing on the actual Fire TV:
- **Sun arc was invisible.** It was the only `flex-1` element while the root
  used `h-[100dvh]`; Fire TV's old Silk browser doesn't support the `dvh` unit,
  so the height collapsed and the arc rendered at 0 px. Fixed with a universal
  `100vh` fallback before `100dvh`.
- **Lag.** Dropped `backdrop-filter` blur on the display's glass panels (8
  panels blurring animated layers behind them = the GPU recomputing every blur
  each frame) in favour of a frosted solid fill — scoped to `/display` only, so
  the phone app keeps its real liquid-glass look. Also replaced the animated
  Gaussian-blur glow on the sun/dot/moon with cheap static halos.

> The phone PWA is unchanged throughout.

**Commits:** `e2d28ad` (display + engine rule) · `2bae108` (Fire TV fixes) —
both pushed to `master`.
