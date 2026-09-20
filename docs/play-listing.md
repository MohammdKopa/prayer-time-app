# Google Play store listing — Prayer Times

**Package:** `app.kametrix.prayer`
**Developer:** Mohamed Keba / Kametrix
**Website:** https://kametrix.com
**Privacy policy URL:** https://prayer.kametrix.com/privacy — rendered from
`docs/privacy-policy.md` by `src/app/privacy/page.tsx`. **Checked 2026-09-20: it
404s.** The route landed in commit 912e718, after the container on the VPS was
last built, so the site has to be redeployed before submitting — Play requires a
URL that resolves. See `DEPLOY.md`; it is a `git pull` and a
`docker compose up -d --build`.
**Default listing language:** Arabic (ar). German (de-DE), Turkish (tr-TR) and English (en-US) are localised listings.

Everything inside a fenced block below is the exact text to paste into Play Console.
Everything outside a fenced block is a note for us, not for Google.

---

## Verified field limits (checked 2026-09-17)

| Field | Limit | Notes |
|---|---|---|
| App name (title) | **30 characters** | Per language. No emoji, no emoticons, no repeated special characters, no ALL CAPS unless it is the brand, no "Free" / "No Ads" / price or promo words, no store-performance claims. |
| Short description | **80 characters** | Per language. Shown above the fold. |
| Full description | **4,000 characters** | Per language. Supports a small set of HTML tags (`<b>`, `<i>`, `<u>`, `<br>`); Markdown does **not** render. The copy below is written as plain text on purpose. |
| App icon | 512 × 512 px, 32-bit PNG with alpha, ≤ 1024 KB | |
| Feature graphic | 1024 × 500 px, JPEG or 24-bit PNG, no alpha | Required for every listing. |
| Phone screenshots | Minimum 2 to publish, up to 8 | Min dimension 320 px, max 3840 px, and the long side may not exceed twice the short side. |
| Screenshots for promotion eligibility | **At least 4, minimum 1080 px** | 9:16 portrait ≥ 1080 × 1920, or 16:9 landscape ≥ 1920 × 1080. Below this the app is not eligible for prominent Play recommendations. Shoot 1080 × 1920 and this is free. |

There is no caption field in Play Console. The "screenshot captions" below are the **text overlays to burn into each screenshot image**, in the language of that listing.

---

## Naming note — read before pasting

The roadmap flags that Mawaqit, Muslim Pro and Athan are existing apps to avoid. The titles below use only generic descriptive terms (مواقيت الصلاة / Gebetszeiten / Namaz Vakitleri / Prayer Times) plus the country, which is what the app is: prayer times for Germany. No competitor's brand wording, styling or logo language appears anywhere in this document.

Note that Play's metadata policy **bans "No Ads" in the app title and the developer name**. It is our strongest selling point and it has to live in the descriptions instead — which is where it is, in all four languages.

Alternates if the primary title is taken or feels too generic, all within 30 characters:

| Language | Primary | Alternate A | Alternate B |
|---|---|---|---|
| ar | مواقيت الصلاة — ألمانيا | مواقيت الصلاة \| كامتريكس | مواقيت الصلاة بدون إنترنت |
| de | Gebetszeiten Deutschland | Gebetszeiten offline | Gebetszeiten — Kametrix |
| tr | Namaz Vakitleri Almanya | Namaz Vakitleri Çevrimdışı | Namaz Vakitleri — Kametrix |
| en | Prayer Times Germany | Prayer Times Offline | Prayer Times — Kametrix |

---

## Timing-rule wording — settled 2026-09-20

The copy describes the fixed 90-minute Fajr and Isha rule accurately, and it does **not** name Sheikh Ayman or the Marl mosque. Naming a living scholar in a public store listing implies their endorsement of the app, and that is his to give, not ours to assume. He approved the app on 2026-09-20 and Mohamed's decision is to keep his name out of the listing regardless. The rule stands on its own merits. Do not add a name here in a later release without asking him first.

---

# Arabic (ar) — default listing

### App title

```
مواقيت الصلاة — ألمانيا
```

**23 characters** (limit 30)

### Short description

```
مواقيت الصلاة في ألمانيا بدون إنترنت، بلا إعلانات ولا تتبّع.
```

**60 characters** (limit 80)

### Full description

```
مواقيت صلاة تُحسب داخل هاتفك. بدون إنترنت، وبدون إعلانات، وبدون حساب.

يحسب التطبيق أوقات الصلوات الخمس اعتمادًا على موقعك الجغرافي مباشرةً على جهازك. لا خادم، ولا اتصال، ولا انتظار. يعمل في وضع الطيران، وفي القطار، وفي الطوابق السفلية التي لا تصلها الشبكة، وفي أول يوم لك في بلد جديد قبل أن تشتري شريحة.

موقعك لا يغادر هاتفك

لا نجمع أي بيانات. لا تحليلات، ولا معرّفات إعلانية، ولا مكتبات طرف ثالث تراقبك في الخلفية. إحداثياتك تُستخدم للحساب ثم تبقى مكانها. ليس عندنا خادم يستقبلها أصلًا، وليس في التطبيق شاشة تسجيل دخول.

دقة تُراجَع لا تُفترض

أوقات الصلاة حسابٌ فلكي، وطرق الحساب تختلف فيما بينها بدقائق. لذلك يقارن التطبيق أكثر من طريقة معتمدة ويوازن بينها، وتُقابَل النتيجة بجداول التقاويم المنشورة للتحقق. المبدأ بسيط: لا يُعرض وقت لم يُتحقق منه.

توقيت يناسب خطوط العرض الشمالية

في ألمانيا يقترب الشفقان في الصيف حتى يكاد الليل يختفي، وتصبح الزوايا الفلكية المعتادة غير عملية للعشاء والفجر. لذلك يعتمد التطبيق قاعدة ثابتة يعمل بها المسجد محليًا: العشاء بعد المغرب بتسعين دقيقة، والفجر قبل الشروق بتسعين دقيقة، طوال السنة. وحين يختلف الوقت المعروض عن الوقت المحسوب فلكيًا، يقول لك التطبيق ذلك بوضوح بدل أن يخفيه.

أذان محلي في وقته

تنبيهات الصلاة مجدولة على جهازك نفسه، لا تُرسل من خادم. تعمل بدون شبكة، ولا تتأخر لأن الاتصال ضعيف.

بوصلة القبلة

اتجاه القبلة محسوبًا من الشمال الحقيقي، لا الشمال المغناطيسي.

بأربع لغات

العربية أولًا وبتخطيط من اليمين إلى اليسار كما ينبغي، ومعها الألمانية والتركية والإنجليزية.

في كل أنحاء ألمانيا

حدّد موقعك عبر GPS، أو اختر مدينتك يدويًا واتركها محفوظة.

وفي التطبيق أيضًا

• جدول الشهر كاملًا، يُحفظ صورةً تُشارَك مع المصلّين
• أدعية وأذكار، ولكلٍّ منها تذكير مستقل، وجميعها مغلقة حتى تفتحها بنفسك
• سبحة
• دليل يضم أكثر من 1500 مسجد في ألمانيا
• تقويم هجري، ووضع خاص لشهر رمضان
• أداة على الشاشة الرئيسية تعرض الصلاة القادمة
• شاشة المسجد: عرضٌ للجدار فيه الساعة والمواقيت وقوس النهار

مجاني بالكامل

لا إعلانات، ولا اشتراك، ولا نسخة مدفوعة، ولا شراء داخل التطبيق. لا شيء مقفل.

من يقف خلفه

تطبيق صنعه Mohamed Keba تحت اسم Kametrix، بدأ لمسجد واحد ثم امتد. النسخة الإلكترونية متاحة على prayer.kametrix.com.

سياسة الخصوصية: https://prayer.kametrix.com/privacy
للتواصل: mohamedkeba@kametrix.com
```

### Screenshot captions (overlay text, 5 screens)

1. `الصلاة القادمة، وكم بقي عليها`
2. `الصلوات الخمس ليومك كاملة`
3. `يعمل بدون إنترنت — حتى في وضع الطيران`
4. `أذان في وقته، مجدول على جهازك`
5. `القبلة من الشمال الحقيقي`

---

# German (de-DE)

### App title

```
Gebetszeiten Deutschland
```

**24 characters** (limit 30)

### Short description

```
Gebetszeiten für Deutschland – offline, ohne Werbung, ohne Tracking.
```

**68 characters** (limit 80)

### Full description

```
Gebetszeiten, die auf deinem Gerät berechnet werden. Ohne Internet, ohne Werbung, ohne Konto.

Die App berechnet die fünf täglichen Gebetszeiten direkt auf dem Telefon, aus deinen Standortkoordinaten. Kein Server, keine Verbindung, kein Warten. Sie funktioniert im Flugmodus, im Zug, im Keller ohne Empfang und am ersten Tag in einem neuen Land, bevor die SIM-Karte da ist.

Dein Standort verlässt das Gerät nicht

Wir erheben keine Daten. Keine Analytics, keine Werbe-IDs, keine Drittanbieter-SDKs, die im Hintergrund mitlesen. Deine Koordinaten werden für die Berechnung genutzt und bleiben, wo sie sind. Es gibt keinen Server, der sie empfangen könnte, und keinen Login-Bildschirm.

Genauigkeit, die geprüft wird

Gebetszeiten sind Astronomie, und die anerkannten Berechnungsmethoden weichen um Minuten voneinander ab. Deshalb rechnet die App mehrere etablierte Methoden parallel und gleicht sie gegeneinander ab; das Ergebnis wird zusätzlich gegen veröffentlichte Kalenderdaten geprüft. Das Prinzip ist einfach: keine Zeit anzeigen, die nicht bestätigt ist.

Auf nördliche Breiten ausgelegt

In Deutschland gehen im Sommer Abend- und Morgendämmerung ineinander über, und die üblichen Sonnenstandswinkel werden für Ischa und Fadschr unbrauchbar. Die App folgt deshalb der festen Regel, die die Moschee vor Ort anwendet: Ischa immer 90 Minuten nach Maghrib, Fadschr immer 90 Minuten vor Sonnenaufgang, das ganze Jahr über. Weicht eine angezeigte Zeit von der rein astronomisch berechneten ab, sagt die App das ausdrücklich, statt es zu verschweigen.

Adhan-Benachrichtigungen, lokal

Die Gebetserinnerungen werden auf dem Gerät selbst geplant, nicht von einem Server gesendet. Sie kommen ohne Netz und sie kommen nicht zu spät, weil die Verbindung hakt.

Qibla-Kompass

Die Gebetsrichtung, berechnet vom geografischen Norden – nicht vom magnetischen.

Vier Sprachen

Arabisch zuerst, mit korrektem Rechts-nach-links-Layout, dazu Deutsch, Türkisch und Englisch.

Deutschlandweit

Per GPS orten oder die Stadt manuell wählen und gespeichert lassen.

Außerdem enthalten

• Eine Monatstabelle, als Bild teilbar
• Bittgebete und Adhkar, jeweils mit eigener Erinnerung, alle standardmäßig aus
• Ein Tasbih-Zähler
• Ein Verzeichnis von über 1.500 Moscheen in Deutschland
• Ein islamischer Kalender und ein Ramadan-Modus
• Ein Widget für den Startbildschirm mit dem nächsten Gebet
• Die Moschee-Anzeige: eine Wandansicht mit Uhr, Gebetszeiten und Tagesbogen

Vollständig kostenlos

Keine Werbung, kein Abo, keine Pro-Version, keine In-App-Käufe. Nichts ist gesperrt.

Wer dahintersteht

Entwickelt von Mohamed Keba unter dem Namen Kametrix. Entstanden für eine einzelne Moschee, dann größer geworden. Die Web-Version läuft auf prayer.kametrix.com.

Datenschutzerklärung: https://prayer.kametrix.com/privacy
Kontakt: mohamedkeba@kametrix.com
```

### Screenshot captions (overlay text, 5 screens)

1. `Das nächste Gebet – und wie lange noch`
2. `Alle fünf Gebetszeiten des Tages`
3. `Funktioniert offline – auch im Flugmodus`
4. `Adhan pünktlich, auf dem Gerät geplant`
5. `Qibla vom geografischen Norden`

---

# Turkish (tr-TR)

### App title

```
Namaz Vakitleri Almanya
```

**23 characters** (limit 30)

### Short description

```
Almanya için namaz vakitleri – çevrimdışı, reklamsız, takipsiz.
```

**63 characters** (limit 80)

### Full description

```
Namaz vakitleri, telefonunuzun içinde hesaplanır. İnternetsiz, reklamsız, hesapsız.

Uygulama beş vakti doğrudan cihazınızda, konum koordinatlarınızdan hesaplar. Sunucu yok, bağlantı yok, bekleme yok. Uçak modunda, trende, çekmeyen bir bodrumda ve yeni bir ülkedeki ilk gününüzde, daha hat almadan çalışır.

Konumunuz cihazdan çıkmaz

Hiçbir veri toplamıyoruz. Analitik yok, reklam kimliği yok, arka planda sizi izleyen üçüncü taraf SDK'ları yok. Koordinatlarınız hesaplama için kullanılır ve olduğu yerde kalır. Onları alacak bir sunucumuz zaten yok, uygulamada giriş ekranı da yok.

Varsayılan değil, doğrulanmış hassasiyet

Namaz vakitleri astronomidir ve kabul görmüş hesaplama yöntemleri birbirinden dakikalarca ayrılabilir. Bu yüzden uygulama birden fazla yerleşik yöntemi birlikte çalıştırıp karşılaştırır; sonuç ayrıca yayımlanmış takvim verileriyle denetlenir. İlke basit: doğrulanmamış bir vakit gösterilmez.

Kuzey enlemleri için tasarlandı

Almanya'da yazın akşam ve sabah alacakaranlığı birbirine karışır ve alışılmış güneş açıları yatsı ile imsak için kullanışsız hale gelir. Bu nedenle uygulama, yerel caminin uyguladığı sabit kuralı esas alır: yatsı her zaman akşamdan 90 dakika sonra, imsak her zaman güneşin doğuşundan 90 dakika önce, yıl boyunca. Gösterilen bir vakit salt astronomik hesaptan farklıysa, uygulama bunu gizlemek yerine açıkça söyler.

Yerel ezan bildirimleri

Namaz hatırlatmaları sunucudan gönderilmez, cihazın kendisinde zamanlanır. Şebeke olmadan çalışır ve bağlantı yavaş diye gecikmez.

Kıble pusulası

Kıble yönü, manyetik kuzeyden değil, gerçek kuzeyden hesaplanır.

Dört dil

Önce Arapça, doğru sağdan sola yerleşimle; yanında Almanca, Türkçe ve İngilizce.

Almanya genelinde

GPS ile konumlanın veya şehrinizi elle seçip kayıtlı bırakın.

Ayrıca içinde

• Görsel olarak paylaşılabilen aylık vakit çizelgesi
• Dualar ve zikirler; her biri için ayrı, varsayılan olarak kapalı hatırlatmalar
• Tesbih sayacı
• Almanya'daki 1.500'den fazla cami için rehber
• Hicri takvim ve Ramazan modu
• Sonraki vakti gösteren ana ekran widget'ı
• Cami ekranı: saat, vakitler ve günün yayı ile duvar görünümü

Tamamen ücretsiz

Reklam yok, abonelik yok, Pro sürüm yok, uygulama içi satın alma yok. Hiçbir şey kilitli değil.

Arkasındaki kişi

Kametrix adı altında Mohamed Keba tarafından geliştirildi. Tek bir cami için başladı, sonra büyüdü. Web sürümü prayer.kametrix.com adresinde.

Gizlilik politikası: https://prayer.kametrix.com/privacy
İletişim: mohamedkeba@kametrix.com
```

### Screenshot captions (overlay text, 5 screens)

1. `Sıradaki namaz ve kalan süre`
2. `Günün beş vakti, tek ekranda`
3. `Çevrimdışı çalışır – uçak modunda bile`
4. `Ezan tam vaktinde, cihazda zamanlanmış`
5. `Kıble, gerçek kuzeyden`

---

# English (en-US)

### App title

```
Prayer Times Germany
```

**20 characters** (limit 30)

### Short description

```
Prayer times for Germany – offline, no ads, no tracking, no accounts.
```

**69 characters** (limit 80)

### Full description

```
Prayer times calculated inside your phone. No internet, no ads, no account.

The app works out the five daily prayer times on the device itself, from your location coordinates. No server, no connection, no waiting. It works in airplane mode, on the train, in a basement with no signal, and on your first day in a new country before the SIM card arrives.

Your location never leaves the device

We collect nothing. No analytics, no advertising IDs, no third-party SDKs reading over your shoulder. Your coordinates are used for the calculation and stay where they are. There is no server to receive them and no login screen in the app.

Accuracy that is checked, not assumed

Prayer times are astronomy, and the established calculation methods disagree with each other by minutes. So the app runs several recognised methods together and reconciles them, and the result is cross-checked against published almanac data. The principle is simple: never show a time that has not been verified.

Built for northern latitudes

In Germany the summer twilights run into each other, and the usual solar angles stop being usable for Isha and Fajr. The app therefore follows the fixed rule the local mosque applies: Isha always 90 minutes after Maghrib, Fajr always 90 minutes before sunrise, all year round. Where a displayed time differs from the purely astronomical one, the app says so plainly instead of hiding it.

Local adhan notifications

Prayer reminders are scheduled on the device, not pushed from a server. They arrive with no network, and they do not run late because a connection is slow.

Qibla compass

The direction of prayer, calculated from true north rather than magnetic north.

Four languages

Arabic first, with proper right-to-left layout, alongside German, Turkish and English.

Germany-wide

Locate by GPS, or pick your city by hand and leave it saved.

Also inside

• A full month timetable, shareable as an image
• Duas and adhkar, each with its own reminder, all off until you turn them on
• A tasbih counter
• A directory of over 1,500 mosques in Germany
• An Islamic calendar and a Ramadan mode
• A home-screen widget showing the next prayer
• The mosque display: a wall view with the clock, the times and the day's arc

Completely free

No ads, no subscription, no Pro version, no in-app purchases. Nothing is locked.

Who makes it

Built by Mohamed Keba under the name Kametrix. It started for a single mosque and grew from there. The web version runs at prayer.kametrix.com.

Privacy policy: https://prayer.kametrix.com/privacy
Contact: mohamedkeba@kametrix.com
```

### Screenshot captions (overlay text, 5 screens)

1. `The next prayer, and how long you have`
2. `All five of today's prayer times`
3. `Works offline — even in airplane mode`
4. `Adhan on time, scheduled on your device`
5. `Qibla from true north`

---

# Data Safety answers

Play Console → **Policy → App content → Data safety**. Every app on a closed, open or production track must complete this form, including apps that collect nothing. The answers below are for an app that collects and shares no user data.

### Section 1 — Data collection and security

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | *Not shown.* This question only appears if the previous answer is Yes. |
| Do you provide a way for users to request that their data is deleted? | *Not shown.* Same — only appears if data is collected. |

Answering **No** ends the data-type walkthrough. The Data types, Data usage and handling sections are skipped entirely.

### Why "No" is the correct and defensible answer

Google's own definition of *collection* is data that is **sent off the device**. Data an app accesses on the device and does not transmit is explicitly not collected, and does not have to be declared. Their published example is literally a location-permission app that uses the coordinates only for on-device functionality.

That is exactly this app:

- **Location** — read via `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION`, used only as an input to the on-device prayer-time and Qibla calculation. Never transmitted. Optional: a user who denies the permission picks a city manually and the app is fully functional.
- **Settings and chosen city** — stored in local app storage on the device. Never transmitted, removed when the app is uninstalled.
- **Notifications** — scheduled locally by the app. No push service, no device token, no server.
- **Do Not Disturb access** (`ACCESS_NOTIFICATION_POLICY`) — requested only if the user turns on "Silence during prayer" in Settings, off by default. Used only to toggle the phone's own interruption filter on-device for the chosen minutes after each adhan and then restore it. Nothing about it is read, logged or transmitted anywhere.
- **No analytics, no crash reporting, no advertising SDK, no attribution SDK, no accounts.** Nothing that would transmit diagnostics or a device identifier.

**Before submitting, hold this against the real build.** The form is a legal declaration and it is checked against the APK. Confirm the release AAB ships no Firebase, no Google Analytics, no Crashlytics, no ad SDK and no attribution SDK, and that nothing in the app makes a network request. If any of those is ever added — including crash reporting — this form has to change in the same release.

### Section 2 — Data types

Skipped. No categories selected. Nothing to declare under Location, Personal info, Financial info, Health and fitness, Messages, Photos and videos, Audio files, Files and docs, Calendar, Contacts, App activity, Web browsing, App info and performance, or Device or other IDs.

### Section 3 — Security practices (optional badges)

| Badge | Answer |
|---|---|
| Independent security review (MASA / OWASP MASVS, via a Google Authorized Lab) | **No.** It is a paid third-party audit. Not worth it for v1. |
| Committed to follow the Play Families Policy | **No** — the app is not targeted at children. Keep this consistent with the Target audience declaration. |
| UPI payment accreditation | **No** — not applicable, India-specific. |

### Section 4 — Store listing preview

The public Data safety card will read: **"No data collected"** and **"No data shared with third parties."** Confirm it says that before submitting.

### Related App content items that must match

| Item | Answer |
|---|---|
| Privacy policy URL | https://prayer.kametrix.com/privacy — required for every app, including ones that collect nothing. It must be live and publicly reachable before you submit, or the review fails on that alone. |
| Ads — does your app contain ads? | **No** |
| App access — is any part restricted by login? | **No, all functionality is available without special access** |
| Government apps | **No** |
| Financial features | **None of these** |
| Health apps | **No** |
| News app | **No** |
| Target audience and content | Age groups **18 and over** (or 13+, see the note below). Not designed for children. Do not opt into the Families programme. |
| Advertising ID permission (`com.google.android.gms.permission.AD_ID`) | Must **not** be in the merged manifest. Expo / RN dependencies can pull it in transitively — check the merged manifest of the release AAB, and if it appears, remove it with `tools:node="remove"`. Declaring the permission while answering "no data collected" is a direct contradiction and a common rejection. |

---

# Content rating notes

Play Console → **Policy → App content → Content rating**. The questionnaire is IARC's: one submission generates ESRB, PEGI, USK (this matters — Germany is the target market), ClassInd, GRAC and ACB ratings at once. Unrated apps are not allowed on Play.

**Email address for the certificate:** mohamedkeba@kametrix.com. The IARC certificate is issued to this address; use an address that will still exist in five years.

### Category

**Reference, News, or Educational** — the app is a religious reference utility. It is not a game; do not answer the games questionnaire. Play store category: **Lifestyle** (where prayer-time apps sit) — or **Books & Reference**. Lifestyle is the conventional home for this kind of app.

### How to describe the app in the questionnaire

A religious reference utility that displays the five daily Islamic prayer times, calculated on the device from the user's location, with local notifications at prayer times and a compass showing the direction of prayer. It contains no narrative, no characters and no imagery beyond its own interface and typography.

### Expected answers

| Question area | Answer |
|---|---|
| Violence — realistic, cartoon, or otherwise | **No** |
| Sexuality, nudity, suggestive content | **No** |
| Profanity, crude humour | **No** |
| Controlled substances — drugs, alcohol, tobacco | **No** |
| Gambling, simulated gambling, real-money contests | **No** |
| Horror, fear, disturbing content | **No** |
| Discrimination or hateful content | **No** |
| Miscellaneous — bodily functions, crude references | **No** |
| Does the app allow users to interact or exchange content with each other? | **No.** There is no chat, no comments, no profiles, no feed. |
| Does the app allow users to share user-generated content? | **No.** Nothing is uploaded; there is nowhere to upload it to. |
| Does the app share the user's current physical location with other users? | **No.** Location is read on the device and never transmitted anywhere, to Google, to us, or to another user. Answer No — do not confuse "uses location" with "shares location". |
| Does the app allow users to purchase digital goods? | **No** |
| Does the app contain ads? | **No** |
| Does the app provide an unrestricted internet browser or search? | **No** |
| Is the app's primary purpose to provide news or commentary? | **No** |
| Does the app contain or reference religious content? | **Yes, if asked.** It is a prayer-time app; the content is devotional reference material, not commentary, and it is the app's entire purpose. This does not raise the rating. |

### Expected outcome

Everyone / PEGI 3 / USK 0 — the lowest rating band in every region. If the questionnaire returns anything higher, an answer was misread; go back through it rather than accepting the rating, because a wrong rating is itself a policy violation.

Content ratings must be kept accurate. If a later release adds anything interactive — the prayer log, a shared timetable, anything that transmits or displays user content — retake the questionnaire in that release.

---

# Release 1.0.0 — Play Console runbook

Added 2026-09-20, the day Sheikh Ayman approved the app.

## Before anything else

**1. Naming the sheikh — decided: no.** He approved the app; his name stays out
of the listing. Approving something is not the same as endorsing it to every
stranger who scrolls past, and the 90-minute rule is described on its own merits
throughout. Do not add it later without asking him first.

**2. Which track?** The 12-testers-for-14-days rule applies to *personal*
developer accounts. This is an **organization account**, so production is open
from the first upload. Still go through **Internal testing** once: the track is
instant, takes the same AAB, and installing it from Play is the only honest proof
that the signed release build works on a real phone. Promote that same build to
production afterwards — no rebuild, no second review queue.

## Version

`mobile/app.json` carries `version` and `android.versionCode`. Every upload needs a
`versionCode` strictly higher than the last one Play accepted; the string `version`
is what people see. 1.0.0 / 1 for the first upload.

## Build and upload

The build runs on EAS, not on this machine. `mobile/android/` is gitignored, so
EAS regenerates it in the cloud from `app.json` — which is why the version lives
there and nowhere else. The signing keystore is the one EAS generated for the
first preview build on 2026-09-17 and holds for the account; Play then adds its
own app-signing key on top of it at the first upload, so a lost upload key is
recoverable. Do not sign locally: the checked-out `android/` template signs
release builds with the **debug** key, and Play rejects debug-signed uploads.

```bash
cd mobile
npx eas-cli@latest build --platform android --profile production   # .aab
npx eas-cli@latest submit --platform android --latest              # or upload by hand
```

The `preview` profile builds an installable APK instead — that is what went to the
sheikh, and it is not what Play wants.

`eas submit` needs a Google service-account JSON the first time (Play Console →
Setup → API access). Uploading the `.aab` by hand in Console is fine for a first
release and skips that setup entirely.

## Play Console, in order

1. **All apps → Create app.** Name, default language **Arabic**, type *App*, and
   *Free*. The name here is not the store title; the title is per-language and
   comes from this document.
2. **Dashboard → set up your app**, and work the checklist Console gives you:
   app access (no login exists — say so), ads (**no ads**), content rating,
   target audience, data safety, privacy policy URL, and the government-apps and
   financial-features declarations (all *no*).
3. **Store presence → Main store listing.** Paste the Arabic title, short and
   full description, then upload the screenshots and feature graphic from
   `docs/shots/store/ar/`. Add de-DE, tr-TR and en-US under *Manage translations*
   and repeat with their folders.
4. **Test and release → Testing → Internal testing → Create new release.**
   Upload the `.aab`, paste the release notes, roll out. Add yourself as a tester,
   open the opt-in link, install from Play, and check the mosque display: the
   prayer names under the arc must read الفجر, not ا ل ف ج ر.
5. **Promote to production** from that same release — no rebuild — then fill the
   countries list and roll out at 100%.

First review takes days. The listing can be edited while it waits.

## What's new (release notes)

Limit **500 characters per language**. Plain text; no HTML, no Markdown.

### Arabic (ar)

```
أول إصدار.

مواقيت الصلوات الخمس محسوبة داخل الهاتف: بلا إنترنت، وبلا إعلانات، وبلا حساب. أذان في وقته يُجدول على الجهاز، وبوصلة قبلة، وجدول الشهر كاملًا، وأدعية وأذكار، وسبحة، ودليل مساجد ألمانيا، وتقويم هجري، وشاشة للمسجد تُعرض على الجدار. بالعربية والألمانية والتركية والإنجليزية.
```

### German (de-DE)

```
Erste Veröffentlichung.

Die fünf Gebetszeiten werden im Telefon selbst berechnet: ohne Internet, ohne Werbung, ohne Konto. Dazu Adhan-Benachrichtigungen, die auf dem Gerät geplant werden, ein Qibla-Kompass, die Monatstabelle, Bittgebete und Adhkar, ein Tasbih-Zähler, ein Moscheeverzeichnis für Deutschland, ein islamischer Kalender und die Moschee-Wandanzeige. Auf Arabisch, Deutsch, Türkisch und Englisch.
```

### Turkish (tr-TR)

```
İlk sürüm.

Beş vakit namaz saati telefonun içinde hesaplanır: internet yok, reklam yok, hesap yok. Ayrıca cihazda planlanan ezan bildirimleri, kıble pusulası, aylık vakit çizelgesi, dualar ve zikirler, tesbih sayacı, Almanya için cami rehberi, hicri takvim ve cami duvar ekranı. Arapça, Almanca, Türkçe ve İngilizce.
```

### English (en-US)

```
First release.

The five daily prayer times, calculated inside your phone: no internet, no ads, no account. With adhan notifications scheduled on the device, a qibla compass, the month timetable, duas and adhkar, a tasbih counter, a directory of mosques in Germany, an Islamic calendar, and the mosque wall display. In Arabic, German, Turkish and English.
```

## Graphics — where every file is

| Play field | File | Checked 2026-09-20 |
|---|---|---|
| App icon | `docs/shots/store/play-icon-512.png` | 512 × 512, 32-bit with alpha, 39 KB |
| Feature graphic | `docs/shots/store/<lang>/*_00_Feature_Graphic.png` | 1024 × 500, no alpha |
| Phone screenshots | `docs/shots/store/<lang>/01…08_*.png` | 1080 × 1920 each — above the 1080 px floor for promotion eligibility |

The icon is `mobile/assets/images/icon.png` (1024 × 1024, the sun arc) resized to
the 512 Play wants. Regenerate it with sharp if the app icon ever changes; do not
hand Play the 1024 and let it resize.

## Screenshots

The finished sets are in `docs/shots/store/<lang>/` — 8 phone screens plus the
feature graphic, per language, with their captions already burned into the images.
Play Console has no caption field, so nothing else needs typing; the caption lists
earlier in this document were the plan for a five-screen set and the shipped eight
supersede them. Upload in filename order.

## Checklist

- [ ] Ask the sheikh about being named; apply the answer to all four descriptions
- [ ] `version` 1.0.0 and `versionCode` 1 in `mobile/app.json`
- [ ] Production AAB built and the install checked on a real device
- [ ] Prayer names on the mosque display render joined on that device — this was the
      one bug he reported, and only a device can prove it fixed
- [ ] Listing pasted per language: title, short description, full description
- [ ] Screenshots and feature graphic uploaded per language
- [ ] Privacy policy live at the URL in the header before submitting
- [ ] Data safety form answered against the real build — no network, no SDKs
- [ ] Content rating questionnaire completed
- [ ] Release notes pasted per language
- [ ] Internal testing release installed from Play and opened on a real phone
- [ ] Promoted to production, countries selected, rolled out

---

## Sources checked, 2026-09-17

- [Best practices for your store listing — Play Console Help](https://support.google.com/googleplay/android-developer/answer/13393723?hl=en) — 30 / 80 / 4,000 character limits
- [Metadata — Play Console Help](https://support.google.com/googleplay/android-developer/answer/9898842?hl=en) — title restrictions, the "Free" / "No Ads" ban
- [Graphic assets, screenshots & video — Play Console Help](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en) — icon, feature graphic, screenshot specs
- [Provide information for Google Play's Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en) — form structure
- [Understand Google Play's Data safety section — Google Play Help](https://support.google.com/googleplay/answer/11416267) — the on-device / ephemeral processing definition of "collection"
- [Content Ratings — Play Console Help](https://support.google.com/googleplay/android-developer/answer/9898843?hl=en) — IARC questionnaire
- [Apps & Games content ratings on Google Play](https://support.google.com/googleplay/answer/6209544?hl=en) — regional rating bodies
