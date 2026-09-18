// Umm al-Qura Hijri dates, from the published month-length tables.
//
// Intl is not an option here. `Intl.DateTimeFormat` with the
// `-u-ca-islamic-umalqura` extension is the obvious implementation and the
// wrong one: on Hermes, support for calendar extensions varies by Android
// version, and an unsupported calendar falls back to Gregorian *silently*
// rather than throwing. The failure mode is a Gregorian date wearing a هـ
// suffix — wrong, and indistinguishable from right on the screen where it
// matters. Same reasoning as time.ts.
//
// The tabulated civil Islamic calendar is not an option either. Its fixed
// 30-year leap cycle drifts a day or two from what Saudi Arabia actually
// prints, so Ramadan and the two Eids land on the wrong day often enough to be
// noticed by exactly the people who care most.
//
// What is left is the real thing: the month lengths the Umm al-Qura calendar
// publishes, one bit per month, looked up rather than computed.

/** A day on the Umm al-Qura calendar. `month` is 1-12, `day` is 1-30. */
export interface HijriDate {
  year: number;
  month: number;
  day: number;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

// One 12-bit word per Hijri year: bit 11 is Muharram, bit 0 is Dhu al-Hijjah.
// A set bit means that month runs 30 days instead of 29. Transcribed from
// ICU4C's UMALQURA_MONTHLENGTH (icu4c/source/i18n/islamcal.cpp), which carries
// the Umm al-Qura tables as published by KACST.
//
// 1356-1500 AH is the officially published window; the years on either side
// are the extrapolation ICU ships alongside it, kept because degrading at
// 1882 CE is friendlier than degrading at 1937 CE.
const MONTH_LENGTHS: readonly number[] = [
  /* 1300-1309 */ 0xAAA, 0xD54, 0xEC9, 0x6D4, 0x6EA, 0x36C, 0xAAD, 0x555, 0x6A9, 0x792,
  /* 1310-1319 */ 0xBA9, 0x5D4, 0xADA, 0x55C, 0xD2D, 0x695, 0x74A, 0xB54, 0xB6A, 0x5AD,
  /* 1320-1329 */ 0x4AE, 0xA4F, 0x517, 0x68B, 0x6A5, 0xAD5, 0x2D6, 0x95B, 0x49D, 0xA4D,
  /* 1330-1339 */ 0xD26, 0xD95, 0x5AC, 0x9B6, 0x2BA, 0xA5B, 0x52B, 0xA95, 0x6CA, 0xAE9,
  /* 1340-1349 */ 0x2F4, 0x976, 0x2B6, 0x956, 0xACA, 0xBA4, 0xBD2, 0x5D9, 0x2DC, 0x96D,
  /* 1350-1359 */ 0x54D, 0xAA5, 0xB52, 0xBA5, 0x5B4, 0x9B6, 0x557, 0x297, 0x54B, 0x6A3,
  /* 1360-1369 */ 0x752, 0xB65, 0x56A, 0xAAB, 0x52B, 0xC95, 0xD4A, 0xDA5, 0x5CA, 0xAD6,
  /* 1370-1379 */ 0x957, 0x4AB, 0x94B, 0xAA5, 0xB52, 0xB6A, 0x575, 0x276, 0x8B7, 0x45B,
  /* 1380-1389 */ 0x555, 0x5A9, 0x5B4, 0x9DA, 0x4DD, 0x26E, 0x936, 0xAAA, 0xD54, 0xDB2,
  /* 1390-1399 */ 0x5D5, 0x2DA, 0x95B, 0x4AB, 0xA55, 0xB49, 0xB64, 0xB71, 0x5B4, 0xAB5,
  /* 1400-1409 */ 0xA55, 0xD25, 0xE92, 0xEC9, 0x6D4, 0xAE9, 0x96B, 0x4AB, 0xA93, 0xD49,
  /* 1410-1419 */ 0xDA4, 0xDB2, 0xAB9, 0x4BA, 0xA5B, 0x52B, 0xA95, 0xB2A, 0xB55, 0x55C,
  /* 1420-1429 */ 0x4BD, 0x23D, 0x91D, 0xA95, 0xB4A, 0xB5A, 0x56D, 0x2B6, 0x93B, 0x49B,
  /* 1430-1439 */ 0x655, 0x6A9, 0x754, 0xB6A, 0x56C, 0xAAD, 0x555, 0xB29, 0xB92, 0xBA9,
  /* 1440-1449 */ 0x5D4, 0xADA, 0x55A, 0xAAB, 0x595, 0x749, 0x764, 0xBAA, 0x5B5, 0x2B6,
  /* 1450-1459 */ 0xA56, 0xE4D, 0xB25, 0xB52, 0xB6A, 0x5AD, 0x2AE, 0x92F, 0x497, 0x64B,
  /* 1460-1469 */ 0x6A5, 0x6AC, 0xAD6, 0x55D, 0x49D, 0xA4D, 0xD16, 0xD95, 0x5AA, 0x5B5,
  /* 1470-1479 */ 0x2DA, 0x95B, 0x4AD, 0x595, 0x6CA, 0x6E4, 0xAEA, 0x4F5, 0x2B6, 0x956,
  /* 1480-1489 */ 0xAAA, 0xB54, 0xBD2, 0x5D9, 0x2EA, 0x96D, 0x4AD, 0xA95, 0xB4A, 0xBA5,
  /* 1490-1499 */ 0x5B2, 0x9B5, 0x4D6, 0xA97, 0x547, 0x693, 0x749, 0xB55, 0x56A, 0xA6B,
  /* 1500-1509 */ 0x52B, 0xA8B, 0xD46, 0xDA3, 0x5CA, 0xAD6, 0x4DB, 0x26B, 0x94B, 0xAA5,
  /* 1510-1519 */ 0xB52, 0xB69, 0x575, 0x176, 0x8B7, 0x25B, 0x52B, 0x565, 0x5B4, 0x9DA,
  /* 1520-1529 */ 0x4ED, 0x16D, 0x8B6, 0xAA6, 0xD52, 0xDA9, 0x5D4, 0xADA, 0x95B, 0x4AB,
  /* 1530-1539 */ 0x653, 0x729, 0x762, 0xBA9, 0x5B2, 0xAB5, 0x555, 0xB25, 0xD92, 0xEC9,
  /* 1540-1549 */ 0x6D2, 0xAE9, 0x56B, 0x4AB, 0xA55, 0xD29, 0xD54, 0xDAA, 0x9B5, 0x4BA,
  /* 1550-1559 */ 0xA3B, 0x49B, 0xA4D, 0xAAA, 0xAD5, 0x2DA, 0x95D, 0x45E, 0xA2E, 0xC9A,
  /* 1560-1569 */ 0xD55, 0x6B2, 0x6B9, 0x4BA, 0xA5D, 0x52D, 0xA95, 0xB52, 0xBA8, 0xBB4,
  /* 1570-1579 */ 0x5B9, 0x2DA, 0x95A, 0xB4A, 0xDA4, 0xED1, 0x6E8, 0xB6A, 0x56D, 0x535,
  /* 1580-1589 */ 0x695, 0xD4A, 0xDA8, 0xDD4, 0x6DA, 0x55B, 0x29D, 0x62B, 0xB15, 0xB4A,
  /* 1590-1599 */ 0xB95, 0x5AA, 0xAAE, 0x92E, 0xC8F, 0x527, 0x695, 0x6AA, 0xAD6, 0x55D,
  /* 1600-1600 */ 0x29D,
];

const FIRST_YEAR = 1300;

/**
 * Julian Day Number of 1 Muharram 1300 AH.
 *
 * Verified against ICU's separately stored year-start table: summing every
 * month length from this anchor reproduces all 301 of ICU's year starts
 * exactly, with no drift.
 */
const EPOCH_JDN = 2408762;

// ---------------------------------------------------------------------------
// Month starts
// ---------------------------------------------------------------------------

/**
 * JDN of the first day of every tabulated month, plus one trailing sentinel
 * for the day after the calendar ends. Built on first use — the table is
 * static, and a screen that only wants a month name shouldn't pay for it.
 */
let monthStarts: Int32Array | null = null;

function starts(): Int32Array {
  if (monthStarts) return monthStarts;
  const out = new Int32Array(MONTH_LENGTHS.length * 12 + 1);
  let jdn = EPOCH_JDN;
  let i = 0;
  for (const word of MONTH_LENGTHS) {
    for (let month = 0; month < 12; month++) {
      out[i++] = jdn;
      jdn += 29 + ((word >> (11 - month)) & 1);
    }
  }
  out[i] = jdn;
  monthStarts = out;
  return out;
}

// ---------------------------------------------------------------------------
// Gregorian <-> Julian Day Number
// ---------------------------------------------------------------------------

// Proleptic Gregorian <-> JDN. Written in the March-based form rather than the
// textbook Fliegel-Van Flandern one, because that algorithm assumes C integer
// division truncating toward zero and its `(month - 14) / 12` term goes
// negative — Math.floor silently disagrees with it and shifts dates by days.
// Every division below has a non-negative numerator, so floor is exact.

/** `month` is 1-12. */
function toJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/** Inverse of {@link toJdn}, as a Date at local midnight. */
function fromJdn(jdn: number): Date {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d2 = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d2) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d2 - 4800 + Math.floor(m / 10);
  const out = new Date(2000, month - 1, day);
  out.setFullYear(year); // or a year below 100 would be read as 19xx
  return out;
}

/**
 * The Gregorian span the embedded table covers, inclusive, as local midnights.
 * Callers that may be handed a date outside it should check here and degrade
 * gracefully rather than let {@link toHijri} throw at them.
 */
export const HIJRI_RANGE: { minGregorian: Date; maxGregorian: Date } = {
  minGregorian: fromJdn(EPOCH_JDN),
  // Total span without building the month table: 29 days per month, plus one
  // more for every set bit.
  maxGregorian: fromJdn(
    MONTH_LENGTHS.reduce((jdn, word) => {
      let extra = 0;
      for (let bit = 0; bit < 12; bit++) extra += (word >> bit) & 1;
      return jdn + 12 * 29 + extra;
    }, EPOCH_JDN) - 1,
  ),
};

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/**
 * Convert a Gregorian date to its Umm al-Qura equivalent.
 *
 * The date is read in the device's local time zone — the calendar day the user
 * is looking at, not the UTC one, which after sunset are often different. The
 * Islamic day beginning at maghrib is deliberately not modelled: printed Umm
 * al-Qura calendars pair one Hijri date with one civil date, and so do we.
 *
 * @throws if `d` is invalid or falls outside {@link HIJRI_RANGE}.
 */
export function toHijri(d: Date): HijriDate {
  if (Number.isNaN(d.getTime())) throw new Error("toHijri: invalid Date");

  const jdn = toJdn(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const table = starts();
  const end = table[table.length - 1];

  if (jdn < EPOCH_JDN || jdn >= end) {
    throw new Error(
      `toHijri: ${d.toDateString()} is outside the Umm al-Qura table ` +
        `(${HIJRI_RANGE.minGregorian.toDateString()} to ` +
        `${HIJRI_RANGE.maxGregorian.toDateString()})`,
    );
  }

  // Binary search for the last month start that is not after jdn.
  let lo = 0;
  let hi = table.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (table[mid] <= jdn) lo = mid;
    else hi = mid - 1;
  }

  return {
    year: FIRST_YEAR + Math.floor(lo / 12),
    month: (lo % 12) + 1,
    day: jdn - table[lo] + 1,
  };
}

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

const MONTH_NAMES: Record<"ar" | "de" | "tr" | "en", readonly string[]> = {
  ar: [
    "محرم",
    "صفر",
    "ربيع الأول",
    "ربيع الآخر",
    "جمادى الأولى",
    "جمادى الآخرة",
    "رجب",
    "شعبان",
    "رمضان",
    "شوال",
    "ذو القعدة",
    "ذو الحجة",
  ],
  de: [
    "Muharram",
    "Safar",
    "Rabi al-Awwal",
    "Rabi ath-Thani",
    "Dschumada al-Ula",
    "Dschumada al-Achira",
    "Radschab",
    "Schaban",
    "Ramadan",
    "Schawwal",
    "Dhul-Qada",
    "Dhul-Hiddscha",
  ],
  tr: [
    "Muharrem",
    "Safer",
    "Rebiülevvel",
    "Rebiülahir",
    "Cemaziyelevvel",
    "Cemaziyelahir",
    "Recep",
    "Şaban",
    "Ramazan",
    "Şevval",
    "Zilkade",
    "Zilhicce",
  ],
  en: [
    "Muharram",
    "Safar",
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    "Jumada al-Ula",
    "Jumada al-Akhirah",
    "Rajab",
    "Sha'ban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qa'dah",
    "Dhu al-Hijjah",
  ],
};

/**
 * Name of a Hijri month, 1-12.
 *
 * @throws if `month` is out of range — a silent "undefined" in a date header
 * is the kind of bug that ships.
 */
export function hijriMonthName(
  month: number,
  locale: "ar" | "de" | "tr" | "en",
): string {
  const name = MONTH_NAMES[locale][month - 1];
  if (!name) throw new Error(`hijriMonthName: month ${month} is not 1-12`);
  return name;
}
