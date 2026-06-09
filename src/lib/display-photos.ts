// Full-screen photo rotation for the mosque wall display (/display).
//
// Real, licensed photographs of al-Masjid al-Aqṣā & the Dome of the Rock
// (al-Quds), al-Masjid al-Ḥarām (Makkah), and the Umayyad Mosque of Damascus
// (al-Shām) — a quiet reminder on the wall to hold these places, and their
// people, in duʿāʾ.
//
// Every image is public-domain or Creative Commons; per-file authors and
// licences live in /public/photos/CREDITS.md. Keep that file in sync when this
// set changes — the CC-BY images require attribution.

/**
 * One line of text shown over a photo. `quran: true` marks an actual Qurʾanic
 * āyah — only those get the ﴿ ﴾ ornament; a duʿāʾ or ḥadīth phrase renders
 * plain (it would be wrong to wrap non-Qurʾan in the muṣḥaf brackets).
 */
export type PhotoText = {
  text: string;
  quran?: boolean;
};

export type DisplayPhoto = {
  src: string;
  /** Arabic place name — shown quietly beneath the text. */
  place: string;
  /** German subtitle, for the non-Arabic congregation. */
  placeDe: string;
  /**
   * Āyāt / duʿāʾ tied to the place. They rotate: each time the photo comes
   * back around, the next one is shown — so the wall doesn't repeat.
   */
  texts: PhotoText[];
  /** Photographer + licence, shown small in the corner. Omit for own photos. */
  credit?: string;
  /**
   * CSS object-position for the full-bleed crop. The display is 16:9 and uses
   * object-fit: cover, so tall/wide shots get cropped — set this to keep the
   * subject in frame (e.g. "center 62%" biases a tall shot downward). Defaults
   * to "center". Less critical now the text is centred over a dimmed backdrop,
   * but still worth setting so the subject isn't awkwardly cropped.
   */
  focus?: string;
};

// Photos Mohamed picks himself live in /public/photos. Keep this list in step
// with what's actually on disk — a src that 404s just fades in blank.
export const DISPLAY_PHOTOS: DisplayPhoto[] = [
  {
    src: "/photos/aqsa.jpg",
    place: "قُبَّةُ الصَّخْرَة · القُدس",
    placeDe: "Felsendom · Jerusalem",
    texts: [
      {
        quran: true,
        text: "سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى الَّذِي بَارَكْنَا حَوْلَهُ",
      },
      { text: "اللّٰهُمَّ ارْزُقْنَا الصَّلَاةَ فِي رِحَابِ الْأَقْصَىٰ" },
      { text: "اللّٰهُمَّ احْفَظِ الْمَسْجِدَ الْأَقْصَىٰ وَأَهْلَهُ" },
      {
        quran: true,
        text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      },
    ],
  },
  {
    src: "/photos/makkah.jpg",
    place: "اَلْمَسْجِدُ الْحَرَام · مَكَّة",
    placeDe: "Die heilige Moschee · Mekka",
    // Tall shot (2560×2100): bias the crop down so the Kaʿba shows behind the text.
    focus: "center 62%",
    texts: [
      { text: "اللّٰهُمَّ ارْزُقْنَا حَجَّ بَيْتِكَ الْحَرَام" },
      {
        quran: true,
        text: "إِنَّ أَوَّلَ بَيْتٍ وُضِعَ لِلنَّاسِ لَلَّذِي بِبَكَّةَ مُبَارَكًا",
      },
      {
        quran: true,
        text: "رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
      },
      { text: "لَبَّيْكَ اللّٰهُمَّ لَبَّيْكَ ۖ لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ" },
    ],
  },
  {
    src: "/photos/umayyad-damascus.jpg",
    place: "اَلْجَامِعُ الْأُمَوِيّ · دِمَشْق",
    placeDe: "Umayyaden-Moschee · Damaskus",
    texts: [
      { text: "اللّٰهُمَّ احْفَظْ بِلَادَ الشَّام وَأَهْلَهَا" },
      // Prophetic duʿāʾ for al-Shām (al-Bukhārī).
      { text: "اللّٰهُمَّ بَارِكْ لَنَا فِي شَامِنَا" },
      { text: "اللّٰهُمَّ اجْعَلِ الشَّامَ دَارَ أَمْنٍ وَإِيمَان" },
      // The "blessed land" — classically understood to include al-Shām.
      {
        quran: true,
        text: "وَنَجَّيْنَاهُ وَلُوطًا إِلَى الْأَرْضِ الَّتِي بَارَكْنَا فِيهَا لِلْعَالَمِينَ",
      },
    ],
  },
];
