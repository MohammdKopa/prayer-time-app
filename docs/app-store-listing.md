# App Store listing: Prayer Times (iOS)

Paste-ready text for App Store Connect. Everything inside a fenced block is the exact text to paste; everything outside is a note for us.
Generated from `docs/play-listing.md`: same descriptions, minus the home-screen widget (Android only).

## App-wide fields (App Information / version page)

| Field | Value |
|---|---|
| Version | `1.0.2` (must match the uploaded build) |
| Copyright | `2026 Mohamed Keba` |
| Support URL | `https://kametrix.com/impressum` (has contact details; a dedicated prayer.kametrix.com/support page would be nicer later) |
| Marketing URL (optional) | `https://prayer.kametrix.com` |
| Privacy Policy URL | `https://prayer.kametrix.com/privacy` (live, checked 2026-09-23) |
| Primary category | Lifestyle |
| Secondary category | Reference |
| Price | Free |
| Age rating | Answer *None* / *No* to every question → **4+** |
| App Privacy | **Data Not Collected**. Location is used only on the device and never sent anywhere; no analytics, no ads, no third-party SDKs. Same basis as the Play Data safety answers. |
| Content rights | *Yes, it contains third-party content, and I have the rights*: CC0 adhan recordings and mosque photos (Wikimedia Commons), mosque data from OpenStreetMap (ODbL, credited in the app's Credits screen). |
| Encryption | Already answered in the build (`ITSAppUsesNonExemptEncryption = false`). |
| Sign-in required | No. |

### App Review Information

Contact: Mohamed Keba, mohamedkeba@kametrix.com, plus a phone number. No demo account needed. Notes for the reviewer:

```
No account or login. The app works fully offline.
On first launch it asks for location to calculate prayer times; if you decline, pick any city in Settings and everything works the same.
To hear the adhan notification: Settings > Adhan voice > Play sample.
All prayer times are calculated on the device. The app makes no network requests; the mosque directory is bundled, and "open in maps" hands off to a maps app.
```

### Name note

"Prayer Times" is taken. The names below are the descriptive alternates already listed in `docs/play-listing.md`. If App Store Connect rejects one as taken, the fallback is the brand form: `Kametrix Prayer Times` / `مواقيت الصلاة - كامتريكس` / `Gebetszeiten - Kametrix` / `Namaz Vakitleri - Kametrix`.

Keywords are measured in bytes (limit 100); Arabic letters count double. Words already in the name or subtitle are left out of keywords, since Apple indexes those anyway.

---

# Arabic (العربية)

### Name

```
مواقيت الصلاة بدون إنترنت
```

**25 characters** (limit 30)

### Subtitle

```
أذان وقبلة وأذكار
```

**17 characters** (limit 30)

### Promotional text

```
مواقيت الصلاة تُحسب داخل هاتفك: بلا إنترنت، بلا إعلانات، بلا حساب. أذان في وقته، وبوصلة قبلة، وجدول الشهر، وأكثر من ١٥٠٠ مسجد في ألمانيا.
```

**137 characters** (limit 170)

### Keywords

```
قبلة,صلاة,إسلام,قرآن,دعاء,مسجد,رمضان,تسبيح,salah,namaz,adhan
```

**95 bytes** (limit 100)

### Description

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
• شاشة المسجد: عرضٌ للجدار فيه الساعة والمواقيت وقوس النهار

مجاني بالكامل

لا إعلانات، ولا اشتراك، ولا نسخة مدفوعة، ولا شراء داخل التطبيق. لا شيء مقفل.

من يقف خلفه

تطبيق صنعه Mohamed Keba تحت اسم Kametrix، بدأ لمسجد واحد ثم امتد. النسخة الإلكترونية متاحة على prayer.kametrix.com.

سياسة الخصوصية: https://prayer.kametrix.com/privacy
للتواصل: mohamedkeba@kametrix.com
```

**2099 characters** (limit 4000)

---

# English (U.S.)

### Name

```
Prayer Times Offline
```

**20 characters** (limit 30)

### Subtitle

```
Adhan, Qibla and Adhkar
```

**23 characters** (limit 30)

### Promotional text

```
Prayer times calculated on your iPhone: no internet, no ads, no account. Adhan on time, a Qibla compass, the month timetable and over 1,500 mosques in Germany.
```

**159 characters** (limit 170)

### Keywords

```
salah,namaz,azan,athan,muslim,islam,quran,dua,mosque,ramadan,hijri,tasbih,fajr,isha,germany
```

**91 bytes** (limit 100)

### Description

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
• The mosque display: a wall view with the clock, the times and the day's arc

Completely free

No ads, no subscription, no Pro version, no in-app purchases. Nothing is locked.

Who makes it

Built by Mohamed Keba under the name Kametrix. It started for a single mosque and grew from there. The web version runs at prayer.kametrix.com.

Privacy policy: https://prayer.kametrix.com/privacy
Contact: mohamedkeba@kametrix.com
```

**2535 characters** (limit 4000)

---

# German

### Name

```
Gebetszeiten offline
```

**20 characters** (limit 30)

### Subtitle

```
Adhan, Qibla und Adhkar
```

**23 characters** (limit 30)

### Promotional text

```
Gebetszeiten, direkt auf dem iPhone berechnet: ohne Internet, ohne Werbung, ohne Konto. Adhan pünktlich, Qibla-Kompass, Monatstabelle und über 1.500 Moscheen.
```

**158 characters** (limit 170)

### Keywords

```
namaz,salah,azan,muslim,islam,moschee,koran,dua,ramadan,tasbih,fajr,ezan,gebet,kalender,hidschri
```

**96 bytes** (limit 100)

### Description

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
• Die Moschee-Anzeige: eine Wandansicht mit Uhr, Gebetszeiten und Tagesbogen

Vollständig kostenlos

Keine Werbung, kein Abo, keine Pro-Version, keine In-App-Käufe. Nichts ist gesperrt.

Wer dahintersteht

Entwickelt von Mohamed Keba unter dem Namen Kametrix. Entstanden für eine einzelne Moschee, dann größer geworden. Die Web-Version läuft auf prayer.kametrix.com.

Datenschutzerklärung: https://prayer.kametrix.com/privacy
Kontakt: mohamedkeba@kametrix.com
```

**2774 characters** (limit 4000)

---

# Turkish (Türkçe)

### Name

```
Namaz Vakitleri Çevrimdışı
```

**26 characters** (limit 30)

### Subtitle

```
Ezan, Kıble ve Zikirler
```

**23 characters** (limit 30)

### Promotional text

```
Namaz vakitleri iPhone'unda hesaplanır: internet yok, reklam yok, hesap yok. Zamanında ezan, kıble pusulası, aylık çizelge ve Almanya'da 1.500'den fazla cami.
```

**158 characters** (limit 170)

### Keywords

```
salah,muslim,islam,cami,kuran,dua,ramazan,imsakiye,tesbih,hicri,takvim,almanya,vakit,sabah,akşam
```

**97 bytes** (limit 100)

### Description

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
• Cami ekranı: saat, vakitler ve günün yayı ile duvar görünümü

Tamamen ücretsiz

Reklam yok, abonelik yok, Pro sürüm yok, uygulama içi satın alma yok. Hiçbir şey kilitli değil.

Arkasındaki kişi

Kametrix adı altında Mohamed Keba tarafından geliştirildi. Tek bir cami için başladı, sonra büyüdü. Web sürümü prayer.kametrix.com adresinde.

Gizlilik politikası: https://prayer.kametrix.com/privacy
İletişim: mohamedkeba@kametrix.com
```

**2457 characters** (limit 4000)
