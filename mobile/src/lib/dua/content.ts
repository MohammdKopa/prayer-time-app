// -------------------------------------------------------------------------
//  EVERY TEXT IN THIS FILE NEEDS HUMAN REVIEW BY A QUALIFIED PERSON BEFORE
//  RELEASE. Do not ship this screen until someone who can read the Arabic has
//  checked each item against its `source` and signed off in
//  docs/dua-content-review.md.
// -------------------------------------------------------------------------
//
// How the Arabic in this file was produced, and the rule for changing it.
//
// Not one Arabic character here was typed by hand, recalled, paraphrased or
// "cleaned up". Each `arabic` string is a byte-for-byte slice of a response
// fetched from the URL in its `verifiedAt` field - quran.com's Uthmani text
// for the Qur'an, hadeethenc.com (the Encyclopedia of Translated Prophetic
// Hadiths) for the adhkar, with one narration taken from a sunnah.com-derived
// corpus where hadeethenc carries the same wording unvowelled. The slices
// were cut by matching markers against a diacritic-stripped copy and mapping
// the indices back, so a marker that had drifted would raise rather than
// quietly return the wrong span.
//
// THE RULE: nobody edits an `arabic` string by hand. To change one, fetch it
// again from a published source and paste the fetched bytes. A single wrong
// harakah is a corrupted text, and a corrupted text is worse than a missing
// one - which is why this list is short. Texts that could not be verified
// against a reachable published source were left out, not approximated.
//
// TRANSLATIONS are a different matter and are marked as such. Where a
// published translator's wording was available it is used verbatim
// (Bubenheim & Elyas for German, Diyanet Isleri for Turkish, Saheeh
// International for English, and hadeethenc's own vetted translations for the
// adhkar). Where none was published for a given text, `needsReview` names the
// languages whose translation was written by the implementer. Those are
// renderings of meaning rather than scripture - but they are still unreviewed,
// and the screen says so.
//
// TRANSLITERATIONS were all written by the implementer from the verified
// Arabic, in a plain scheme with no diacritics so they render on every device.
// They are a pronunciation aid, never a substitute for the Arabic, and they
// are in the review list too.

import type { Locale } from "@/lib/i18n";

/** The five things a reminder can be about. Each is independently toggleable
 *  and every one of them is off until the user turns it on. */
export const OCCASIONS = [
  "morning",
  "evening",
  "sleep",
  "salawat",
  "quran",
] as const;

export type Occasion = (typeof OCCASIONS)[number];

/** Arabic is the text itself, not a translation of anything. Typing it this
 *  way means the screen cannot accidentally render a "translation" over the
 *  original. */
export type Translations = Record<Exclude<Locale, "ar">, string>;

export interface DuaItem {
  id: string;
  /** Which reminders this text belongs to; several, for texts said more than
   *  once a day. */
  occasions: readonly Occasion[];
  /** VERIFIED. Never edit by hand - see the header. */
  arabic: string;
  /** Implementer-written pronunciation aid. */
  transliteration: string;
  title: Record<Locale, string>;
  translation: Translations;
  /** Qur'anic reference, or hadith collection and number. */
  source: string;
  /** Times the narration specifies, where it specifies one. */
  repeat?: number;
  /** The URL the Arabic was fetched from, character for character. */
  verifiedAt: string;
  /** Languages whose translation was written by the implementer rather than
   *  taken from a published translator. Absent for most items. */
  needsReview?: readonly Exclude<Locale, "ar">[];
}

export const DUAS: readonly DuaItem[] = [
  {
    id: "al-fatiha",
    occasions: ["quran"],
    arabic:
      "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ مَـٰلِكِ يَوْمِ ٱلدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ",
    transliteration:
      "Bismillahi r-rahmani r-rahim. Al-hamdu lillahi rabbi l-'alamin. Ar-rahmani r-rahim. Maliki yawmi d-din. Iyyaka na'budu wa-iyyaka nasta'in. Ihdina s-sirata l-mustaqim. Sirata lladhina an'amta 'alayhim ghayri l-maghdubi 'alayhim wa-la d-dallin.",
    title: {
      ar: "سورة الفاتحة",
      de: "Sure Al-Fātiha",
      tr: "Fâtiha sûresi",
      en: "Surah al-Fatihah",
    },
    translation: {
      de:
        "Im Namen Allahs, des Allerbarmers, des Barmherzigen. (Alles) Lob gehört Allah, dem Herrn der Welten, dem Allerbarmer, dem Barmherzigen, dem Herrscher am Tag des Gerichts. Dir allein dienen wir, und zu Dir allein flehen wir um Hilfe. Leite uns den geraden Weg, den Weg derjenigen, denen Du Gunst erwiesen hast, nicht derjenigen, die (Deinen) Zorn erregt haben, und nicht der Irregehenden!",
      tr:
        "Rahman ve Rahim olan Allah'ın adıyla: Hamd, Alemlerin Rabbi Allah'a mahsustur. O Rahman ve Rahim'dir, Din Gününün sahibidir. Ancak Sana kulluk eder ve yalnız Senden yardım dileriz. Bizi doğru yola eriştir. Nimete erdirdiğin kimselerin yoluna; gazaba uğrayanların, ya da sapıtanların yoluna değil.",
      en:
        "In the name of Allāh, the Entirely Merciful, the Especially Merciful. [All] praise is [due] to Allāh, Lord of the worlds - The Entirely Merciful, the Especially Merciful, Sovereign of the Day of Recompense. It is You we worship and You we ask for help. Guide us to the straight path - The path of those upon whom You have bestowed favor, not of those who have earned [Your] anger or of those who are astray.",
    },
    source: "Qur'an 1:1-7",
    verifiedAt:
      "https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=1",
  },
  {
    id: "ayat-al-kursi",
    occasions: ["morning", "evening", "quran"],
    arabic:
      "ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ",
    transliteration:
      "Allahu la ilaha illa huwa l-hayyu l-qayyum. La ta'khudhuhu sinatun wa-la nawm. Lahu ma fi s-samawati wa-ma fi l-ard. Man dha lladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa-ma khalfahum, wa-la yuhituna bi-shay'in min 'ilmihi illa bi-ma sha'. Wasi'a kursiyyuhu s-samawati wa-l-ard, wa-la ya'uduhu hifzuhuma, wa-huwa l-'aliyyu l-'azim.",
    title: {
      ar: "آية الكرسي",
      de: "Der Thronvers (Āyat al-Kursī)",
      tr: "Âyetü'l-Kürsî",
      en: "Ayat al-Kursi",
    },
    translation: {
      de:
        "Allah - es gibt keinen Gott außer Ihm, dem Lebendigen und Beständigen. Ihn überkommt weder Schlummer noch Schlaf. Ihm gehört (alles), was in den Himmeln und was auf der Erde ist. Wer ist es denn, der bei Ihm Fürsprache einlegen könnte - außer mit Seiner Erlaubnis? Er weiß, was vor ihnen und was hinter ihnen liegt, sie aber umfassen nichts von Seinem Wissen - außer, was Er will. Sein Thronschemel umfaßt die Himmel und die Erde, und ihre Behütung beschwert Ihn nicht. Er ist der Erhabene und Allgewaltige.",
      tr:
        "Allah, O'ndan başka tanrı olmayan, kendisini uyuklama ve uyku tutmayan, diri, her an yaratıklarını gözetip durandır. Göklerde olan ve yerde olan ancak O'nundur. O'nun izni olmadan katında şefaat edecek kimdir? Onların işlediklerini ve işleyeceklerini bilir, dilediğinden başka ilminden hiçbir şeyi kavrayamazlar. Hükümranlığı gökleri ve yeri kaplamıştır, onların gözetilmesi O'na ağır gelmez. O yücedir, büyüktür.",
      en:
        "Allāh - there is no deity except Him, the Ever-Living, the Self-Sustaining. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursī extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.",
    },
    source: "Qur'an 2:255",
    verifiedAt:
      "https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=2:255",
  },
  {
    id: "al-ikhlas",
    occasions: ["morning", "evening", "sleep"],
    arabic:
      "قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ",
    transliteration:
      "Qul huwa llahu ahad. Allahu s-samad. Lam yalid wa-lam yulad. Wa-lam yakun lahu kufuwan ahad.",
    title: {
      ar: "سورة الإخلاص",
      de: "Sure Al-Ichlās",
      tr: "İhlâs sûresi",
      en: "Surah al-Ikhlas",
    },
    translation: {
      de:
        "Sag: Er ist Allah, Einer, Allah, der Überlegene. Er hat nicht gezeugt und ist nicht gezeugt worden, und niemand ist Ihm jemals gleich.",
      tr:
        "De ki: O Allah bir tektir. Allah her şeyden müstağni ve her şey O'na muhtaçtır. O doğurmamış ve doğmamıştır. Hiçbir şey O'na denk değildir.",
      en:
        "Say, \"He is Allāh, [who is] One, Allāh, the Eternal Refuge. He neither begets nor is born, Nor is there to Him any equivalent.\"",
    },
    source: "Qur'an 112:1-4",
    repeat: 3,
    verifiedAt:
      "https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=112",
  },
  {
    id: "al-falaq",
    occasions: ["morning", "evening", "sleep"],
    arabic:
      "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ مِن شَرِّ مَا خَلَقَ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    transliteration:
      "Qul a'udhu bi-rabbi l-falaq. Min sharri ma khalaq. Wa-min sharri ghasiqin idha waqab. Wa-min sharri n-naffathati fi l-'uqad. Wa-min sharri hasidin idha hasad.",
    title: {
      ar: "سورة الفلق",
      de: "Sure Al-Falaq",
      tr: "Felak sûresi",
      en: "Surah al-Falaq",
    },
    translation: {
      de:
        "Sag: Ich nehme Zuflucht beim Herrn des Tagesanbruchs vor dem Übel dessen, was Er erschaffen hat, und vor dem Übel der Dunkelheit, wenn sie zunimmt, und vor dem Übel der Knotenanbläserinnen und vor dem Übel eines (jeden) Neidenden, wenn er neidet.",
      tr:
        "De ki: \"Yaratıkların şerrinden, bastırdığı zaman karanlığın şerrinden, düğümlere nefes eden büyücülerin şerrinden, hased ettiği zaman hasedcilerin şerrinden, tan yerini ağartan Rabbe sığınırım.\"",
      en:
        "Say, \"I seek refuge in the Lord of daybreak From the evil of that which He created And from the evil of darkness when it settles And from the evil of the blowers in knots And from the evil of an envier when he envies.\"",
    },
    source: "Qur'an 113:1-5",
    repeat: 3,
    verifiedAt:
      "https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=113",
  },
  {
    id: "an-nas",
    occasions: ["morning", "evening", "sleep"],
    arabic:
      "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ مَلِكِ ٱلنَّاسِ إِلَـٰهِ ٱلنَّاسِ مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ",
    transliteration:
      "Qul a'udhu bi-rabbi n-nas. Maliki n-nas. Ilahi n-nas. Min sharri l-waswasi l-khannas. Alladhi yuwaswisu fi suduri n-nas. Mina l-jinnati wa-n-nas.",
    title: {
      ar: "سورة الناس",
      de: "Sure An-Nās",
      tr: "Nâs sûresi",
      en: "Surah an-Nas",
    },
    translation: {
      de:
        "Sag: Ich nehme Zuflucht beim Herrn der Menschen, dem König der Menschen, dem Gott der Menschen, vor dem Übel des Einflüsterers, des Davonschleichers, der in die Brüste der Menschen einflüstert, von den Ginn und den Menschen.",
      tr:
        "De ki: \"İnsanlardan ve cinlerden ve insanların gönüllerine vesvese veren o sinsi vesvesecinin şerrinden, insanların Tanrısı, insanların Hükümranı ve insanların Rabbi olan Allah'a sığınırım.\"",
      en:
        "Say, \"I seek refuge in the Lord of mankind, The Sovereign of mankind, The God of mankind, From the evil of the retreating whisperer - Who whispers [evil] into the breasts of mankind - From among the jinn and mankind\".",
    },
    source: "Qur'an 114:1-6",
    repeat: 3,
    verifiedAt:
      "https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=114",
  },
  {
    id: "baqarah-last-two",
    occasions: ["sleep", "quran"],
    arabic:
      "ءَامَنَ ٱلرَّسُولُ بِمَآ أُنزِلَ إِلَيْهِ مِن رَّبِّهِۦ وَٱلْمُؤْمِنُونَ ۚ كُلٌّ ءَامَنَ بِٱللَّهِ وَمَلَـٰٓئِكَتِهِۦ وَكُتُبِهِۦ وَرُسُلِهِۦ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِۦ ۚ وَقَالُوا۟ سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ ٱلْمَصِيرُ لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا ٱكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَآ إِن نَّسِينَآ أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَآ إِصْرًا كَمَا حَمَلْتَهُۥ عَلَى ٱلَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِۦ ۖ وَٱعْفُ عَنَّا وَٱغْفِرْ لَنَا وَٱرْحَمْنَآ ۚ أَنتَ مَوْلَىٰنَا فَٱنصُرْنَا عَلَى ٱلْقَوْمِ ٱلْكَـٰفِرِينَ",
    transliteration:
      "Amana r-rasulu bi-ma unzila ilayhi min rabbihi wa-l-mu'minun. Kullun amana billahi wa-mala'ikatihi wa-kutubihi wa-rusulih. La nufarriqu bayna ahadin min rusulih. Wa-qalu sami'na wa-ata'na, ghufranaka rabbana wa-ilayka l-masir. La yukallifu llahu nafsan illa wus'aha. Laha ma kasabat wa-'alayha ma ktasabat. Rabbana la tu'akhidhna in nasina aw akhta'na. Rabbana wa-la tahmil 'alayna isran kama hamaltahu 'ala lladhina min qablina. Rabbana wa-la tuhammilna ma la taqata lana bih. Wa-'fu 'anna wa-ghfir lana wa-rhamna. Anta mawlana fa-nsurna 'ala l-qawmi l-kafirin.",
    title: {
      ar: "خواتيم سورة البقرة",
      de: "Die letzten beiden Verse der Sure Al-Baqara",
      tr: "Bakara sûresinin son iki âyeti",
      en: "The last two verses of Surah al-Baqarah",
    },
    translation: {
      de:
        "Der Gesandte (Allahs) glaubt an das, was zu ihm von seinem Herrn (als Offenbarung) herabgesandt worden ist, und ebenso die Gläubigen; alle glauben an Allah, Seine Engel, Seine Bücher und Seine Gesandten - Wir machen keinen Unterschied bei jemandem von Seinen Gesandten. Und sie sagen: „Wir hören und gehorchen. (Gewähre uns) Deine Vergebung, unser Herr! Und zu Dir ist der Ausgang. — Allah erlegt keiner Seele mehr auf, als sie zu leisten vermag. Ihr kommt (nur) zu, was sie verdient hat, und angelastet wird ihr (nur), was sie verdient hat. „Unser Herr, belange uns nicht, wenn wir (etwas) vergessen oder einen Fehler begehen. Unser Herr, lege uns keine Bürde auf, wie Du sie denjenigen vor uns auferlegt hast. Unser Herr, bürde uns nichts auf, wozu wir keine Kraft haben. Verzeihe uns, vergib uns und erbarme Dich unser! Du bist unser Schutzherr. So verhilf uns zum Sieg über das ungläubige Volk!",
      tr:
        "Peygamber ve inananlar, ona Rabb'inden indirilene inandı. Hepsi Allah'a, meleklerine, kitaplarına, peygamberlerine inandı. \"Peygamberleri arasından hiçbirini ayırdetmeyiz, işittik, itaat ettik, Rabbimiz! Affını dileriz, dönüş Sanadır\" dediler. — Allah kişiye ancak gücünün yeteceği kadar yükler; kazandığı iyilik lehine, ettiği kötülük de aleyhinedir. Rabbimiz! Eğer unutacak veya yanılacak olursak bizi sorumlu tutma. Rabbimiz bizden öncekilere yüklediğin gibi, bize de ağır yük yükleme. Rabbimiz! Bize gücümüzün yetmeyeceği şeyi taşıtma, bizi affet, bizi bağışla, bize acı. Sen Mevlamızsın, kafirlere karşı bize yardım et.",
      en:
        "The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers. All of them have believed in Allāh and His angels and His books and His messengers, [saying], \"We make no distinction between any of His messengers.\" And they say, \"We hear and we obey. [We seek] Your forgiveness, our Lord, and to You is the [final] destination.\" — Allāh does not charge a soul except [with that within] its capacity. It will have [the consequence of] what [good] it has gained, and it will bear [the consequence of] what [evil] it has earned. \"Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our protector, so give us victory over the disbelieving people.\"",
    },
    source: "Qur'an 2:285-286",
    verifiedAt:
      "https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=2:285",
  },
  {
    id: "sayyid-al-istighfar",
    occasions: ["morning", "evening"],
    arabic:
      "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration:
      "Allahumma anta rabbi, la ilaha illa anta, khalaqtani wa-ana 'abduka, wa-ana 'ala 'ahdika wa-wa'dika ma stata't. A'udhu bika min sharri ma sana't. Abu'u laka bi-ni'matika 'alayya, wa-abu'u laka bi-dhanbi fa-ghfir li, fa-innahu la yaghfiru dh-dhunuba illa anta.",
    title: {
      ar: "سيد الاستغفار",
      de: "Sayyid al-Istighfār",
      tr: "Seyyidü'l-istiğfâr",
      en: "Sayyid al-Istighfar",
    },
    translation: {
      de:
        "O Allah, Du bist mein Herr, es gibt keinen Gott außer Dir. Du hast mich erschaffen, und ich bin Dein Diener. Ich halte an Deinem Bund und Deinem Versprechen fest, so gut ich kann. Ich suche Zuflucht bei Dir vor dem Bösen, das ich getan habe. Ich bekenne Deine Gnade mir gegenüber und ich bekenne meine Sünden. So vergib mir, denn niemand vergibt Sünden außer Dir.",
      tr:
        "Allah'ım! Sen benim Rabbimsin. Senden başka ibadete layık (hak) ilah yoktur. Beni sen yarattın ve ben senin kulunum. Ezelde sana verdiğim sözümde ve vaadimde hâlâ gücüm yettiğince durmaktayım. İşlediğim kusurların şerrinden sana sığınırım. Bana lütfettiğin nimetleri itiraf ediyorum. Günahlarımı itiraf ediyorum. Beni affet, şüphe yok ki günahları senden başka affedecek yoktur.",
      en:
        "O Allah, You are my Lord. You created me, and I am Your slave. I will remain faithful to Your covenant and promise as much as possible. I seek refuge with You from the evil of what I have done. I acknowledge Your favor upon me, and I admit my sin. So, forgive me. Indeed, none can forgive sins but You.",
    },
    source: "Sahih al-Bukhari 6306",
    verifiedAt:
      "https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5503",
  },
  {
    id: "bika-asbahna",
    occasions: ["morning"],
    arabic:
      "اللهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
    transliteration:
      "Allahumma bika asbahna, wa-bika amsayna, wa-bika nahya, wa-bika namutu, wa-ilayka n-nushur.",
    title: {
      ar: "اللهم بك أصبحنا",
      de: "Bittgebet am Morgen",
      tr: "Sabah duası",
      en: "Supplication on waking",
    },
    translation: {
      de:
        "O Allah, durch Dich traten wir in den Morgen, durch Dich traten wir in den Abend, durch Dich leben wir, durch Dich sterben wir und zu Dir ist die Auferstehung.",
      tr:
        "Allah'ım! Senin lütfunla sabaha ulaştık, senin lütfunla akşama erdik. Sen isteyince dirilir, sen isteyince ölürüz. Yeniden diriltip huzurunda toplayacak olan da Sensin.",
      en:
        "O Allah, by You we have reached the morning, and by You we have reached the evening; by You we live, and by You we die, and to You is the Resurrection.",
    },
    source: "Sunan Abi Dawud 5068",
    verifiedAt:
      "https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5490",
  },
  {
    id: "amsayna-wa-amsa-l-mulk",
    occasions: ["evening"],
    arabic:
      "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ",
    transliteration:
      "Amsayna wa-amsa l-mulku lillah, wa-l-hamdu lillah, la ilaha illa llahu wahdahu la sharika lah.",
    title: {
      ar: "أمسينا وأمسى الملك لله",
      de: "Bittgebet am Abend",
      tr: "Akşam duası",
      en: "Supplication at nightfall",
    },
    translation: {
      de:
        "Wir sind in den Abend eingetreten, und mit uns die Herrschaft, die Allah gehört. Alles Lob gehört Allah. Es gibt keinen Gott außer Allah, Er allein, Er hat keinen Teilhaber.",
      tr:
        "Biz, Allah'ın (kulu) olarak geceledik, bütün mülk de Allah'ın olarak geceledi. Hamd Allah'a mahsustur. Allah'dan başka hakkıyla ibadete layık hiçbir ilâh yoktur, yalnız O vardır; O'nun ortağı yoktur.",
      en:
        "The evening has reached, and all the dominion belongs to Allah and praise be to Allah. There is no god but Allah, alone without any partner.",
    },
    source: "Sunan Abi Dawud 5071 (also in Sahih Muslim)",
    verifiedAt:
      "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-abudawud/5071.json",
    needsReview: ["de"],
  },
  {
    id: "bismillah-alladhi-la-yadurr",
    occasions: ["morning", "evening"],
    arabic:
      "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ، فِي الْأَرْضِ، وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration:
      "Bismillahi lladhi la yadurru ma'a smihi shay'un fi l-ardi wa-la fi s-sama', wa-huwa s-sami'u l-'alim.",
    title: {
      ar: "بسم الله الذي لا يضر مع اسمه شيء",
      de: "Bittgebet um Schutz",
      tr: "Korunma duası",
      en: "Supplication for protection",
    },
    translation: {
      de:
        "Mit dem Namen Allahs, Desjenigen, mit Dessen Namen weder etwas im Himmel noch auf der Erde einen Schaden zufügen kann, und Er ist der Allhörende, der Allwissende.",
      tr:
        "Yerde de gökte de O'nun ismiyle birlikte hiçbir şeyin zarar veremeyeceği Allah'ın adıyla. O, her şeyi işiten ve bilendir.",
      en:
        "In the name of Allah, with Whose name nothing in the earth or the heaven can cause harm, and He is the All-Hearing, the All-Knowing.",
    },
    source: "Sunan Abi Dawud 5088",
    repeat: 3,
    verifiedAt:
      "https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=6093",
  },
  {
    id: "raditu-billah",
    occasions: ["morning", "evening"],
    arabic:
      "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ رَسُولًا",
    transliteration:
      "Raditu billahi rabban, wa-bi-l-islami dinan, wa-bi-Muhammadin rasulan.",
    title: {
      ar: "رضيت بالله ربا",
      de: "Zufriedenheit mit Allah",
      tr: "Rıza duası",
      en: "Contentment with Allah",
    },
    translation: {
      de:
        "Ich bin zufrieden mit Allah als Herrn, mit dem Islam als Religion und mit Muhammad als Gesandtem.",
      tr:
        "Rab olarak Allah'a, din olarak İslam'a, rasûl olarak Muhammed'e (iman edip) razı oldum.",
      en:
        "I am pleased with Allah as a Lord, with Islam as a religion, with Muhammad as a Messenger.",
    },
    source: "Sunan Abi Dawud 1529",
    verifiedAt:
      "https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=65906",
    needsReview: ["de"],
  },
  {
    id: "tahlil",
    occasions: ["morning", "evening"],
    arabic:
      "لاَ إِلَهَ إِلَّا اللَّهُ، وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration:
      "La ilaha illa llahu wahdahu la sharika lah, lahu l-mulku wa-lahu l-hamd, wa-huwa 'ala kulli shay'in qadir.",
    title: {
      ar: "التهليل",
      de: "Das Tahlīl",
      tr: "Tehlîl",
      en: "Tahlil",
    },
    translation: {
      de:
        "Es gibt keinen Gott außer Allah, Er allein, Er hat keinen Teilhaber. Ihm gehört die Herrschaft und Ihm gebührt das Lob, und Er hat Macht über alle Dinge.",
      tr:
        "Allah'tan başka hak ilâh yoktur. O, tektir ve hiçbir ortağı yoktur. Mülk O'nundur ve hamt O'nadır. O'nun her şeye gücü yeter.",
      en:
        "There is no god but Allah. He is One, and He has no partner with Him; to Him belong the sovereignty and praise, and He is competent over all things.",
    },
    source: "Sahih al-Bukhari 3293 (also 6403)",
    repeat: 100,
    verifiedAt:
      "https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=65905",
    needsReview: ["de"],
  },
  {
    id: "tasbih",
    occasions: ["morning", "evening"],
    arabic:
      "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
    transliteration:
      "Subhana llahi wa-bi-hamdih.",
    title: {
      ar: "التسبيح",
      de: "Das Tasbīh",
      tr: "Tesbih",
      en: "Tasbih",
    },
    translation: {
      de:
        "Gepriesen sei Allah und Ihm gebührt das Lob.",
      tr:
        "Allah'a hamt ederek O'nu tüm noksanlıklardan tenzih ederim.",
      en:
        "Glory be to Allah, and praise be to Him.",
    },
    source: "Sahih al-Bukhari 6405",
    repeat: 100,
    verifiedAt:
      "https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5516",
  },
  {
    id: "salawat-ibrahimiyya",
    occasions: ["salawat"],
    arabic:
      "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ",
    transliteration:
      "Allahumma salli 'ala Muhammadin wa-'ala ali Muhammad, kama sallayta 'ala ali Ibrahim, innaka hamidun majid. Allahumma barik 'ala Muhammadin wa-'ala ali Muhammad, kama barakta 'ala ali Ibrahim, innaka hamidun majid.",
    title: {
      ar: "الصلاة الإبراهيمية",
      de: "Der ibrāhīmische Segensgruß",
      tr: "Salli ve Bârik duaları",
      en: "The Ibrahimi salawat",
    },
    translation: {
      de:
        "O Allah, sende Segen auf Muhammad und auf die Familie Muhammads, so wie Du Segen auf die Familie Ibrahims gesandt hast. Wahrlich, Du bist der Preiswürdige, der Ruhmreiche. O Allah, segne Muhammad und die Familie Muhammads, so wie Du die Familie Ibrahims gesegnet hast. Wahrlich, Du bist der Preiswürdige, der Ruhmreiche.",
      tr:
        "Allah'ım! İbrahim'e (ve ailesine) rahmet ettiğin gibi Muhammed'e ve ailesine de rahmet et. Şüphesiz sen övülmeye lâyık olan ve yüce olansın. Allah'ım! İbrahim'e (ve ailesine) hayır ve bereket lütfettiğin gibi Muhammed'e ve ailesine de hayır ve bereket ihsan et. Şüphesiz sen övülmeye layık olan ve yüce olansın.",
      en:
        "O Allah, bestow Your grace upon Muhammad and the family of Muhammad just as You bestowed Your grace upon the family of Abraham. Verily, You are Praiseworthy, All-Glorious. O Allah, bless Muhammad and the family of Muhammad just as You blessed the family of Abraham. Verily, You are Praiseworthy, All-Glorious.",
    },
    source: "Sahih al-Bukhari 6357",
    verifiedAt:
      "https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5377",
  },
  {
    id: "sleep-aslamtu",
    occasions: ["sleep"],
    arabic:
      "اللَّهُمَّ أَسْلَمْتُ وَجْهِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لاَ مَلْجَأَ وَلاَ مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، اللَّهُمَّ آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ",
    transliteration:
      "Allahumma aslamtu wajhi ilayk, wa-fawwadtu amri ilayk, wa-alja'tu zahri ilayk, raghbatan wa-rahbatan ilayk, la malja'a wa-la manja minka illa ilayk. Allahumma amantu bi-kitabika lladhi anzalt, wa-bi-nabiyyika lladhi arsalt.",
    title: {
      ar: "دعاء النوم",
      de: "Bittgebet vor dem Schlafen",
      tr: "Uyumadan önceki dua",
      en: "Supplication before sleep",
    },
    translation: {
      de:
        "O Allah, ich habe mein Angesicht Dir zugewandt, meine Angelegenheit Dir anvertraut und meinen Rücken an Dich gelehnt, aus Hoffnung auf Dich und aus Furcht vor Dir. Es gibt keine Zuflucht und keine Rettung vor Dir außer bei Dir. O Allah, ich glaube an Dein Buch, das Du herabgesandt hast, und an Deinen Propheten, den Du entsandt hast.",
      tr:
        "Allah'ım! Yüzümü Sana çevirdim, işimi Sana havale ettim, sırtımı Sana dayadım; Senden umarak ve Senden korkarak. Senden kaçıp sığınılacak ve kurtulunacak yer yine ancak Sensin. Allah'ım! İndirdiğin Kitab'a ve gönderdiğin Peygamber'e iman ettim.",
      en:
        "O Allah, I have submitted my face to You, and entrusted my affair to You, and turned my back to You for refuge, out of hope in You and fear of You. There is no refuge and no escape from You except to You. O Allah, I believe in Your Book which You sent down, and in Your Prophet whom You sent.",
    },
    source: "Sahih al-Bukhari 247; Sahih Muslim 2710",
    verifiedAt:
      "https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=65911",
    needsReview: ["de", "tr", "en"],
  },
];

export function duasFor(occasion: Occasion): DuaItem[] {
  return DUAS.filter((d) => d.occasions.includes(occasion));
}

export function duaById(id: string): DuaItem | undefined {
  return DUAS.find((d) => d.id === id);
}

/** True while any text still carries an unreviewed translation, so the screen
 *  can say so rather than presenting everything as settled. */
export const HAS_UNREVIEWED_TRANSLATIONS = DUAS.some(
  (d) => (d.needsReview?.length ?? 0) > 0,
);
