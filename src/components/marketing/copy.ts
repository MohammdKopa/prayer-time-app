// Every word the marketing page shows, in the four languages the app ships
// in. Arabic first, as in the app and both store listings. Claims here must
// stay true of the shipped app: offline, no ads, no account, nothing
// collected (see docs/privacy-policy.md), and the fixed 90-minute rule.

export type Lang = "ar" | "de" | "tr" | "en";

export const LANGS: readonly Lang[] = ["ar", "de", "tr", "en"];

export const LANG_NAMES: Record<Lang, string> = {
  ar: "العربية",
  de: "Deutsch",
  tr: "Türkçe",
  en: "English",
};

export type BandPrayer = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export interface Copy {
  dir: "rtl" | "ltr";
  /** The launcher name, as on the phone (mobile/locales). */
  appName: string;
  title: string;
  description: string;
  headline: string;
  sub: string;
  /** {city} is replaced with the city the band is computed for. */
  bandCaption: string;
  now: string;
  prayers: Record<BandPrayer, string>;
  getIos: string;
  getAndroid: string;
  free: string;
  promises: { title: string; body: string }[];
  screensTitle: string;
  screens: { file: "home" | "month" | "qibla" | "dua" | "mosques"; caption: string }[];
  mosqueTitle: string;
  mosqueBody: string;
  mosqueLink: string;
  mosqueAlt: string;
  ruleTitle: string;
  ruleBody: string;
  madeBy: string;
  privacy: string;
  impressum: string;
}

export const COPY: Record<Lang, Copy> = {
  ar: {
    dir: "rtl",
    appName: "مواقيت الصلاة",
    title: "مواقيت الصلاة — تطبيق بلا إنترنت وبلا إعلانات",
    description:
      "مواقيت الصلاة تُحسب داخل هاتفك: بلا إنترنت، بلا إعلانات، بلا حساب. أذان في وقته، وقبلة، وجدول الشهر، ومساجد ألمانيا.",
    headline: "مواقيت الصلاة، تُحسب في هاتفك",
    sub: "بلا إنترنت، بلا إعلانات، بلا حساب. الأذان يصل في وقته، حتى في وضع الطيران.",
    bandCaption:
      "مواقيت اليوم في {city}، حُسبت الآن في هذه الصفحة. التطبيق يفعل الشيء نفسه في هاتفك.",
    now: "الآن",
    prayers: {
      fajr: "الفجر",
      sunrise: "الشروق",
      dhuhr: "الظهر",
      asr: "العصر",
      maghrib: "المغرب",
      isha: "العشاء",
    },
    getIos: "حمّله للآيفون",
    getAndroid: "حمّله للأندرويد",
    free: "مجاني بالكامل. لا شيء مقفل.",
    promises: [
      {
        title: "يعمل بلا إنترنت",
        body: "تُحسب المواقيت على الجهاز من موقعك. لا خادم ولا اتصال، في القبو أو على متن الطائرة.",
      },
      {
        title: "بلا إعلانات وبلا حساب",
        body: "لا تسجيل، ولا مشتريات، ولا نسخة مدفوعة.",
      },
      {
        title: "موقعك يبقى عندك",
        body: "لا نجمع أي بيانات. لا تحليلات، ولا تتبّع، ولا أطراف ثالثة.",
      },
    ],
    screensTitle: "من داخل التطبيق",
    screens: [
      { file: "home", caption: "الصلاة القادمة وكم بقي عليها" },
      { file: "month", caption: "الشهر كاملاً بالتاريخين الهجري والميلادي" },
      { file: "qibla", caption: "القبلة من الشمال الحقيقي" },
      { file: "dua", caption: "أذكار، مع تذكيرات إن شئت" },
      { file: "mosques", caption: "أكثر من ١٥٠٠ مسجد في ألمانيا" },
    ],
    mosqueTitle: "لمسجدك",
    mosqueBody:
      "شاشة جدارية بالساعة ومواقيت اليوم ووقت الجمعة، لأي شاشة أو تلفاز في المصلّى. تُفتح في المتصفح، بلا تثبيت.",
    mosqueLink: "افتح شاشة المسجد",
    mosqueAlt: "شاشة المسجد: الساعة ومواقيت اليوم على شاشة عريضة",
    ruleTitle: "التوقيت الذي يعتمده مسجدك",
    ruleBody:
      "في ألمانيا تقصر ليالي الصيف فلا تصلح زوايا الشفق المعتادة. لذلك يتبع التطبيق القاعدة الثابتة التي يعتمدها المسجد المحلي: العشاء بعد المغرب بتسعين دقيقة، والفجر قبل الشروق بتسعين دقيقة، طوال العام. وحين يختلف الوقت عن الحساب الفلكي، يقول التطبيق ذلك بوضوح.",
    madeBy: "صنعه كامتريكس في مارل.",
    privacy: "سياسة الخصوصية",
    impressum: "بيانات الناشر",
  },
  de: {
    dir: "ltr",
    appName: "Gebetszeiten",
    title: "Gebetszeiten — die App ohne Internet und ohne Werbung",
    description:
      "Gebetszeiten, direkt auf dem Handy berechnet: ohne Internet, ohne Werbung, ohne Konto. Adhan pünktlich, Qibla, Monatstabelle und Moscheen in ganz Deutschland.",
    headline: "Gebetszeiten, berechnet auf deinem Handy",
    sub: "Ohne Internet, ohne Werbung, ohne Konto. Der Adhan kommt pünktlich, auch im Flugmodus.",
    bandCaption:
      "Heute in {city}, gerade eben in dieser Seite berechnet. Die App macht dasselbe auf deinem Handy.",
    now: "Jetzt",
    prayers: {
      fajr: "Fajr",
      sunrise: "Sonnenaufgang",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha",
    },
    getIos: "Für iPhone laden",
    getAndroid: "Für Android laden",
    free: "Kostenlos. Nichts gesperrt.",
    promises: [
      {
        title: "Funktioniert offline",
        body: "Die Zeiten werden auf dem Gerät aus deinem Standort berechnet. Kein Server, keine Verbindung, im Keller wie im Flugzeug.",
      },
      {
        title: "Keine Werbung, kein Konto",
        body: "Nichts anzumelden, nichts zu kaufen, nichts freizuschalten.",
      },
      {
        title: "Dein Standort bleibt bei dir",
        body: "Wir sammeln nichts. Keine Analyse, kein Tracking, keine Dritten.",
      },
    ],
    screensTitle: "Aus der App",
    screens: [
      { file: "home", caption: "Das nächste Gebet und wie viel Zeit bleibt" },
      { file: "month", caption: "Der ganze Monat, hidschri und gregorianisch" },
      { file: "qibla", caption: "Qibla nach geografischem Norden" },
      { file: "dua", caption: "Adhkar, mit Erinnerungen, wenn du willst" },
      { file: "mosques", caption: "Über 1.500 Moscheen in Deutschland" },
    ],
    mosqueTitle: "Für deine Moschee",
    mosqueBody:
      "Eine Wandanzeige mit Uhr, den Zeiten des Tages und der Jumu'a-Zeit, für jeden Bildschirm oder Fernseher im Gebetsraum. Läuft im Browser, ohne Installation.",
    mosqueLink: "Moschee-Anzeige öffnen",
    mosqueAlt: "Die Moschee-Anzeige: Uhr und Gebetszeiten des Tages auf einem Breitbild",
    ruleTitle: "Die Zeiten deiner Moschee",
    ruleBody:
      "Im deutschen Sommer sind die Nächte zu kurz für die üblichen Dämmerungswinkel. Die App folgt deshalb der festen Regel der Moschee vor Ort: Isha 90 Minuten nach Maghrib, Fajr 90 Minuten vor Sonnenaufgang, das ganze Jahr. Wo das von der astronomischen Zeit abweicht, sagt die App es offen.",
    madeBy: "Gemacht von Kametrix in Marl.",
    privacy: "Datenschutz",
    impressum: "Impressum",
  },
  tr: {
    dir: "ltr",
    appName: "Namaz Vakitleri",
    title: "Namaz Vakitleri — internetsiz ve reklamsız uygulama",
    description:
      "Namaz vakitleri telefonunda hesaplanır: internet yok, reklam yok, hesap yok. Zamanında ezan, kıble, aylık çizelge ve Almanya'daki camiler.",
    headline: "Namaz vakitleri, telefonunda hesaplanır",
    sub: "İnternet yok, reklam yok, hesap yok. Ezan zamanında gelir, uçak modunda bile.",
    bandCaption:
      "{city} için bugünün vakitleri, az önce bu sayfada hesaplandı. Uygulama aynısını telefonunda yapar.",
    now: "Şimdi",
    prayers: {
      fajr: "İmsak",
      sunrise: "Güneş",
      dhuhr: "Öğle",
      asr: "İkindi",
      maghrib: "Akşam",
      isha: "Yatsı",
    },
    getIos: "iPhone için indir",
    getAndroid: "Android için indir",
    free: "Tamamen ücretsiz. Kilitli hiçbir şey yok.",
    promises: [
      {
        title: "Çevrimdışı çalışır",
        body: "Vakitler konumundan cihazda hesaplanır. Sunucu yok, bağlantı gerekmez; bodrumda da, uçakta da.",
      },
      {
        title: "Reklam yok, hesap yok",
        body: "Kayıt yok, satın alma yok, açılacak bir şey yok.",
      },
      {
        title: "Konumun sende kalır",
        body: "Hiçbir veri toplamıyoruz. Analiz yok, takip yok, üçüncü taraf yok.",
      },
    ],
    screensTitle: "Uygulamanın içinden",
    screens: [
      { file: "home", caption: "Sonraki vakit ve ne kadar kaldığı" },
      { file: "month", caption: "Bütün ay, hicri ve miladi" },
      { file: "qibla", caption: "Coğrafi kuzeye göre kıble" },
      { file: "dua", caption: "Zikirler, istersen hatırlatmalarla" },
      { file: "mosques", caption: "Almanya'da 1.500'den fazla cami" },
    ],
    mosqueTitle: "Camin için",
    mosqueBody:
      "Saat, günün vakitleri ve cuma vakti ile bir duvar ekranı; mescitteki her ekran ya da televizyon için. Tarayıcıda açılır, kurulum gerekmez.",
    mosqueLink: "Cami ekranını aç",
    mosqueAlt: "Cami ekranı: geniş ekranda saat ve günün vakitleri",
    ruleTitle: "Caminin kullandığı vakitler",
    ruleBody:
      "Almanya'da yaz geceleri, alışılmış şafak açıları için fazla kısadır. Bu yüzden uygulama yerel caminin uyguladığı sabit kuralı izler: yatsı akşamdan 90 dakika sonra, imsak güneşin doğuşundan 90 dakika önce, bütün yıl. Astronomik vakitten farklı olduğunda uygulama bunu açıkça söyler.",
    madeBy: "Kametrix tarafından Marl'da yapıldı.",
    privacy: "Gizlilik",
    impressum: "Künye",
  },
  en: {
    dir: "ltr",
    appName: "Prayer Times",
    title: "Prayer Times — the app with no internet and no ads",
    description:
      "Prayer times calculated on your phone: no internet, no ads, no account. Adhan on time, Qibla, the month timetable and mosques across Germany.",
    headline: "Prayer times, calculated on your phone",
    sub: "No internet, no ads, no account. The adhan arrives on time, even in airplane mode.",
    bandCaption:
      "Today in {city}, calculated in this page just now. The app does the same on your phone.",
    now: "Now",
    prayers: {
      fajr: "Fajr",
      sunrise: "Sunrise",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha",
    },
    getIos: "Get it for iPhone",
    getAndroid: "Get it for Android",
    free: "Free. Nothing locked.",
    promises: [
      {
        title: "Works offline",
        body: "The times are calculated on the device from your location. No server, no connection, in a basement or on a plane.",
      },
      {
        title: "No ads, no account",
        body: "Nothing to sign up for, nothing to buy, nothing to unlock.",
      },
      {
        title: "Your location stays with you",
        body: "We collect nothing. No analytics, no tracking, no third parties.",
      },
    ],
    screensTitle: "Inside the app",
    screens: [
      { file: "home", caption: "The next prayer, and how long you have" },
      { file: "month", caption: "The whole month, Hijri and Gregorian" },
      { file: "qibla", caption: "Qibla from true north" },
      { file: "dua", caption: "Adhkar, with reminders if you want them" },
      { file: "mosques", caption: "Over 1,500 mosques across Germany" },
    ],
    mosqueTitle: "For your mosque",
    mosqueBody:
      "A wall display with the clock, the day's times and the Jumu'a time, for any screen or TV in the prayer hall. It runs in a browser, nothing to install.",
    mosqueLink: "Open the mosque display",
    mosqueAlt: "The mosque display: the clock and the day's prayer times on a wide screen",
    ruleTitle: "The timing your mosque uses",
    ruleBody:
      "In a German summer the nights are too short for the usual twilight angles. So the app follows the fixed rule the local mosque applies: Isha 90 minutes after Maghrib, Fajr 90 minutes before sunrise, all year. Where that differs from the astronomical time, the app says so.",
    madeBy: "Made by Kametrix in Marl.",
    privacy: "Privacy",
    impressum: "Impressum",
  },
};

/** The page language: an explicit ?lang= wins, then the browser's
 *  Accept-Language, then Arabic. */
export function pickLang(param: string | undefined, acceptLanguage: string | null): Lang {
  if (param && (LANGS as readonly string[]).includes(param)) return param as Lang;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if ((LANGS as readonly string[]).includes(code)) return code as Lang;
  }
  return "ar";
}
