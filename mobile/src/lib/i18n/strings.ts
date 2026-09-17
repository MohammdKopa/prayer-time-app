// The four languages, in one typed table.
//
// `Strings` is derived from the Arabic entry, so adding a key there is a
// compile error in the other three until they are translated. That is the
// point: a missing German string should stop the build, not appear on a
// stranger's phone as Arabic they cannot read.

export const LOCALES = ["ar", "de", "tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Locales that lay out right-to-left. */
export const RTL_LOCALES: readonly Locale[] = ["ar"];

const ar = {
  appName: "مواقيت الصلاة",

  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",

  nextPrayer: "الصلاة القادمة",
  dayFinished: "انتهت صلوات اليوم",
  tomorrowFajr: "فجر الغد",

  mosqueTiming: "وفق توقيت المسجد",
  fajrBeforeSunrise: "أذان الفجر قبل الشروق بـ {minutes} دقيقة",
  ishaAfterMaghrib: "أذان العشاء بعد المغرب بـ {minutes} دقيقة",

  locating: "جارٍ تحديد الموقع…",
  locationDenied: "تعذّر الوصول إلى الموقع",
  locationDeniedHint: "اختر مدينتك يدويًا أو فعّل إذن الموقع",
  useMyLocation: "استخدم موقعي",
  chooseCity: "اختر المدينة",
  searchCity: "ابحث عن مدينة",
  noCityFound: "لا توجد نتائج",

  settings: "الإعدادات",
  language: "اللغة",
  notifications: "التنبيهات",
  notificationsOn: "تنبيه عند كل أذان",
  notificationsOff: "التنبيهات متوقفة",
  notificationsDenied: "لم يُسمح بالتنبيهات",
  enableNotifications: "تفعيل التنبيهات",
  adhanTitle: "حان وقت {prayer}",
  adhanBody: "{city} · {time}",

  qibla: "القبلة",
  qiblaHint: "وجّه أعلى الهاتف نحو السهم",
  qiblaNoCompass: "لا تتوفر بوصلة موثوقة على هذا الجهاز",
  qiblaCalibrate: "حرّك الهاتف على شكل ٨ لمعايرة البوصلة",
  degrees: "{value}°",
  qiblaAligned: "أنت تواجه القبلة",
  north: "ش",
  east: "شر",
  south: "ج",
  west: "غ",

  back: "رجوع",
  close: "إغلاق",
} as const;

/** Keys come from the Arabic table, values are plain strings. Adding a key to
 *  `ar` therefore breaks the build until de, tr and en are translated, while
 *  still letting each language say its own words. */
export type Strings = { [K in keyof typeof ar]: string };
export type StringKey = keyof Strings;

const de: Strings = {
  appName: "Gebetszeiten",

  fajr: "Fadschr",
  sunrise: "Sonnenaufgang",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Ischa",

  nextPrayer: "Nächstes Gebet",
  dayFinished: "Die heutigen Gebete sind vorbei",
  tomorrowFajr: "Fadschr morgen",

  mosqueTiming: "Nach Moschee-Zeit",
  fajrBeforeSunrise: "Fadschr-Adhan {minutes} Minuten vor Sonnenaufgang",
  ishaAfterMaghrib: "Ischa-Adhan {minutes} Minuten nach Maghrib",

  locating: "Standort wird ermittelt…",
  locationDenied: "Kein Zugriff auf den Standort",
  locationDeniedHint: "Wähle deine Stadt oder erlaube den Standortzugriff",
  useMyLocation: "Meinen Standort verwenden",
  chooseCity: "Stadt wählen",
  searchCity: "Stadt suchen",
  noCityFound: "Keine Treffer",

  settings: "Einstellungen",
  language: "Sprache",
  notifications: "Benachrichtigungen",
  notificationsOn: "Bei jedem Adhan benachrichtigen",
  notificationsOff: "Benachrichtigungen aus",
  notificationsDenied: "Benachrichtigungen nicht erlaubt",
  enableNotifications: "Benachrichtigungen aktivieren",
  adhanTitle: "Zeit für {prayer}",
  adhanBody: "{city} · {time}",

  qibla: "Qibla",
  qiblaHint: "Richte die Oberkante des Handys auf den Pfeil",
  qiblaNoCompass: "Kein verlässlicher Kompass auf diesem Gerät",
  qiblaCalibrate: "Bewege das Handy in einer Acht, um den Kompass zu kalibrieren",
  degrees: "{value}°",
  qiblaAligned: "Du stehst zur Qibla",
  north: "N",
  east: "O",
  south: "S",
  west: "W",

  back: "Zurück",
  close: "Schließen",
};

const tr: Strings = {
  appName: "Namaz Vakitleri",

  fajr: "İmsak",
  sunrise: "Güneş",
  dhuhr: "Öğle",
  asr: "İkindi",
  maghrib: "Akşam",
  isha: "Yatsı",

  nextPrayer: "Sonraki namaz",
  dayFinished: "Bugünün namazları bitti",
  tomorrowFajr: "Yarın imsak",

  mosqueTiming: "Cami vaktine göre",
  fajrBeforeSunrise: "İmsak ezanı güneşten {minutes} dakika önce",
  ishaAfterMaghrib: "Yatsı ezanı akşamdan {minutes} dakika sonra",

  locating: "Konum belirleniyor…",
  locationDenied: "Konuma erişilemiyor",
  locationDeniedHint: "Şehrini seç veya konum iznini aç",
  useMyLocation: "Konumumu kullan",
  chooseCity: "Şehir seç",
  searchCity: "Şehir ara",
  noCityFound: "Sonuç yok",

  settings: "Ayarlar",
  language: "Dil",
  notifications: "Bildirimler",
  notificationsOn: "Her ezanda bildir",
  notificationsOff: "Bildirimler kapalı",
  notificationsDenied: "Bildirimlere izin verilmedi",
  enableNotifications: "Bildirimleri aç",
  adhanTitle: "{prayer} vakti",
  adhanBody: "{city} · {time}",

  qibla: "Kıble",
  qiblaHint: "Telefonun üstünü oka doğru tut",
  qiblaNoCompass: "Bu cihazda güvenilir pusula yok",
  qiblaCalibrate: "Pusulayı kalibre etmek için telefonu sekiz çiz",
  degrees: "{value}°",
  qiblaAligned: "Kıbleye dönüksün",
  north: "K",
  east: "D",
  south: "G",
  west: "B",

  back: "Geri",
  close: "Kapat",
};

const en: Strings = {
  appName: "Prayer Times",

  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",

  nextPrayer: "Next prayer",
  dayFinished: "Today's prayers are over",
  tomorrowFajr: "Fajr tomorrow",

  mosqueTiming: "According to the mosque",
  fajrBeforeSunrise: "Fajr adhan {minutes} minutes before sunrise",
  ishaAfterMaghrib: "Isha adhan {minutes} minutes after Maghrib",

  locating: "Finding your location…",
  locationDenied: "No access to location",
  locationDeniedHint: "Pick your city, or allow location access",
  useMyLocation: "Use my location",
  chooseCity: "Choose city",
  searchCity: "Search for a city",
  noCityFound: "No matches",

  settings: "Settings",
  language: "Language",
  notifications: "Notifications",
  notificationsOn: "Notify at every adhan",
  notificationsOff: "Notifications off",
  notificationsDenied: "Notifications not allowed",
  enableNotifications: "Turn on notifications",
  adhanTitle: "Time for {prayer}",
  adhanBody: "{city} · {time}",

  qibla: "Qibla",
  qiblaHint: "Point the top of the phone at the arrow",
  qiblaNoCompass: "No reliable compass on this device",
  qiblaCalibrate: "Move the phone in a figure of eight to calibrate the compass",
  degrees: "{value}°",
  qiblaAligned: "You are facing the Qibla",
  north: "N",
  east: "E",
  south: "S",
  west: "W",

  back: "Back",
  close: "Close",
};

export const TRANSLATIONS: Record<Locale, Strings> = { ar, de, tr, en };

/** Native language names, each written in its own language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  ar: "العربية",
  de: "Deutsch",
  tr: "Türkçe",
  en: "English",
};
