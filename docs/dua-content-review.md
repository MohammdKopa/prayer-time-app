# Dua & Adhkar content — review sheet

**Status: NOT REVIEWED. Do not release the Dua & Adhkar screen until every
row below is signed off.**

Every Arabic text in `mobile/src/lib/dua/content.ts` is listed here with the
published reference it must match and the exact URL its bytes were fetched
from. The point of this file is that a qualified reviewer can check the whole
feature in one pass, without reading TypeScript.

## How the texts were produced

No Arabic was typed, recalled or reconstructed. Each text is a byte-for-byte
slice of a response from a published source:

| Source | Used for | Why |
|---|---|---|
| `api.quran.com` (Uthmani script) | all Qur'anic texts | the mushaf text, served as data rather than scraped from a page |
| `hadeethenc.com` (Encyclopedia of Translated Prophetic Hadiths) | all adhkar but one | vetted, fully vowelled, and carries the collection and number for each |
| `cdn.jsdelivr.net/.../hadith-api` (a sunnah.com-derived corpus) | one narration (`amsayna-wa-amsa-l-mulk`) | hadeethenc carries that wording unvowelled; this mirror carries it vowelled |

`sunnah.com` itself is behind a Cloudflare challenge that refuses both `curl`
and the agent's fetcher, so it could not be read directly. **A reviewer with a
browser should check each hadith row against sunnah.com by the reference in
the table** — that is the main thing this sheet is asking for.

Slices were cut by matching markers against a diacritic-stripped copy of the
source and mapping indices back to the original, so a marker that no longer
matched would raise rather than quietly return the wrong span.

## What to check, per row

1. The Arabic matches the cited reference, character for character, including
   harakat.
2. The reference itself is right (right collection, right number).
3. The text is the *recited portion* only — no isnad, no narrator's aside, no
   truncation mid-phrase.
4. The translation says what the Arabic says.
5. The transliteration is readable and does not mislead.

Rows marked **translation unreviewed** have at least one language rendered by
the implementer rather than a published translator; those need the closest
look.

## Translation provenance

| Language | Translator (Qur'an) | Translator (adhkar) |
|---|---|---|
| German | Frank Bubenheim & Nadeem Elyas | hadeethenc.com, except where marked |
| Turkish | Diyanet İşleri | hadeethenc.com, except where marked |
| English | Saheeh International | hadeethenc.com, except where marked |

All **transliterations** were written by the implementer from the verified
Arabic, in a plain scheme with no diacritics. They are a pronunciation aid and
are unreviewed.

## Deliberately left out

These were considered and dropped rather than approximated — a short certain
list beats a long doubtful one:

- **The 33 / 33 / 33-or-34 tasbih (after prayer and before sleep; Muslim 596-597, Bukhari 5361)** —
  the narrations give the counts but, in the Arabic hadeethenc carries, only
  as verbs and counted nouns (`سبح ... ثلاثا وثلاثين`), never as the recited
  phrases `سبحان الله` / `الحمد لله` / `الله أكبر`. Building those
  phrases from other hadiths would be composing, not slicing.
- **`أصبحنا على فطرة الإسلام`, `يا حي يا قيوم برحمتك أستغيث`,
  `اللهم عافني في بدني`, `حسبي الله لا إله إلا هو` (7×)** — none of
  the four is in hadeethenc (searched all 3,574 entries) or in the six-book
  mirror at a number that could be checked. Add only from a source a reviewer can open.
- **`أمسينا وأمسى الملك لله ... رب أسألك خير ما في هذه الليلة` and the
  morning `أصبحنا وأصبح الملك لله`** (Muslim, hadeethenc 3008) —
  the morning wording exists only as the narrator's `وإذا أصبح قال ذلك أيضا`, not as text to slice.
- **`سبحان الله العظيم وبحمده`, `سبحان الله العظيم، سبحان الله وبحمده`,
  `أستغفر الله الذي لا إله إلا هو الحي القيوم`, the `اللهم رب ... فاطر`-type
  variants** — real and authentic, but with no time the narrations tie them
  to, so they have no place in a list organised by occasion.
- **`الحمد لله الذي أطعمنا وسقانا` (before sleep, Muslim)** — hadeethenc's Arabic
  is only partly vowelled and the mirror's Muslim numbering is unreliable (see below).
- **`رَضِينَا بِاللَّهِ رَبًّا` in the Abu Dawud 5072 wording** — graded *da'if* by al-Albani,
  and the widespread wording (`رَضِيتُ`) is a different narration. The
  `رَضِيتُ` form from Abu Dawud 1529, graded *sahih*, is included instead.
- **Sahih Muslim hadith numbers** — the accessible mirror numbers Muslim on a
  scheme that does not match sunnah.com's, so Muslim is only ever cited here
  alongside a collection whose numbering was confirmed.

## The texts

**After prayer (added alongside the new adhkar).** Ayat al-Kursi (Nasa'i, *al-Sunan al-Kubra* 9848 — hadeethenc 10950) and the two Mu'awwidhatayn, Al-Falaq and An-Nas (Abu Dawud / Tirmidhi, 'Uqbah ibn 'Amir — hadeethenc 65103) are narrated for after every obligatory prayer, so they now also appear in the "After prayer" section. Their Arabic did not change; only the `afterPrayer` flag was added. Al-Ikhlas is not flagged: those narrations name the Mu'awwidhatayn only.

### 1. Surah al-Fatihah

- **id** `al-fatiha`
- **Reference to check** Qur'an 1:1-7
- **Fetched from** <https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=1>
- **Shown under** quran

```
بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ مَـٰلِكِ يَوْمِ ٱلدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ
```

*Transliteration (implementer-written):* Bismillahi r-rahmani r-rahim. Al-hamdu lillahi rabbi l-'alamin. Ar-rahmani r-rahim. Maliki yawmi d-din. Iyyaka na'budu wa-iyyaka nasta'in. Ihdina s-sirata l-mustaqim. Sirata lladhina an'amta 'alayhim ghayri l-maghdubi 'alayhim wa-la d-dallin.

| | |
|---|---|
| **DE** | Im Namen Allahs, des Allerbarmers, des Barmherzigen. (Alles) Lob gehört Allah, dem Herrn der Welten, dem Allerbarmer, dem Barmherzigen, dem Herrscher am Tag des Gerichts. Dir allein dienen wir, und zu Dir allein flehen wir um Hilfe. Leite uns den geraden Weg, den Weg derjenigen, denen Du Gunst erwiesen hast, nicht derjenigen, die (Deinen) Zorn erregt haben, und nicht der Irregehenden! |
| **TR** | Rahman ve Rahim olan Allah'ın adıyla: Hamd, Alemlerin Rabbi Allah'a mahsustur. O Rahman ve Rahim'dir, Din Gününün sahibidir. Ancak Sana kulluk eder ve yalnız Senden yardım dileriz. Bizi doğru yola eriştir. Nimete erdirdiğin kimselerin yoluna; gazaba uğrayanların, ya da sapıtanların yoluna değil. |
| **EN** | In the name of Allāh, the Entirely Merciful, the Especially Merciful. [All] praise is [due] to Allāh, Lord of the worlds - The Entirely Merciful, the Especially Merciful, Sovereign of the Day of Recompense. It is You we worship and You we ask for help. Guide us to the straight path - The path of those upon whom You have bestowed favor, not of those who have earned [Your] anger or of those who are astray. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 2. Ayat al-Kursi

- **id** `ayat-al-kursi`
- **Reference to check** Qur'an 2:255
- **Fetched from** <https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=2:255>
- **Shown under** morning, evening, quran, after prayer (no reminder)

```
ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ
```

*Transliteration (implementer-written):* Allahu la ilaha illa huwa l-hayyu l-qayyum. La ta'khudhuhu sinatun wa-la nawm. Lahu ma fi s-samawati wa-ma fi l-ard. Man dha lladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa-ma khalfahum, wa-la yuhituna bi-shay'in min 'ilmihi illa bi-ma sha'. Wasi'a kursiyyuhu s-samawati wa-l-ard, wa-la ya'uduhu hifzuhuma, wa-huwa l-'aliyyu l-'azim.

| | |
|---|---|
| **DE** | Allah - es gibt keinen Gott außer Ihm, dem Lebendigen und Beständigen. Ihn überkommt weder Schlummer noch Schlaf. Ihm gehört (alles), was in den Himmeln und was auf der Erde ist. Wer ist es denn, der bei Ihm Fürsprache einlegen könnte - außer mit Seiner Erlaubnis? Er weiß, was vor ihnen und was hinter ihnen liegt, sie aber umfassen nichts von Seinem Wissen - außer, was Er will. Sein Thronschemel umfaßt die Himmel und die Erde, und ihre Behütung beschwert Ihn nicht. Er ist der Erhabene und Allgewaltige. |
| **TR** | Allah, O'ndan başka tanrı olmayan, kendisini uyuklama ve uyku tutmayan, diri, her an yaratıklarını gözetip durandır. Göklerde olan ve yerde olan ancak O'nundur. O'nun izni olmadan katında şefaat edecek kimdir? Onların işlediklerini ve işleyeceklerini bilir, dilediğinden başka ilminden hiçbir şeyi kavrayamazlar. Hükümranlığı gökleri ve yeri kaplamıştır, onların gözetilmesi O'na ağır gelmez. O yücedir, büyüktür. |
| **EN** | Allāh - there is no deity except Him, the Ever-Living, the Self-Sustaining. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursī extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 3. Surah al-Ikhlas

- **id** `al-ikhlas`
- **Reference to check** Qur'an 112:1-4
- **Fetched from** <https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=112>
- **Shown under** morning, evening, sleep
- **Note** said 3×

```
قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ
```

*Transliteration (implementer-written):* Qul huwa llahu ahad. Allahu s-samad. Lam yalid wa-lam yulad. Wa-lam yakun lahu kufuwan ahad.

| | |
|---|---|
| **DE** | Sag: Er ist Allah, Einer, Allah, der Überlegene. Er hat nicht gezeugt und ist nicht gezeugt worden, und niemand ist Ihm jemals gleich. |
| **TR** | De ki: O Allah bir tektir. Allah her şeyden müstağni ve her şey O'na muhtaçtır. O doğurmamış ve doğmamıştır. Hiçbir şey O'na denk değildir. |
| **EN** | Say, "He is Allāh, [who is] One, Allāh, the Eternal Refuge. He neither begets nor is born, Nor is there to Him any equivalent." |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 4. Surah al-Falaq

- **id** `al-falaq`
- **Reference to check** Qur'an 113:1-5
- **Fetched from** <https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=113>
- **Shown under** morning, evening, sleep, after prayer (no reminder)
- **Note** said 3×

```
قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ مِن شَرِّ مَا خَلَقَ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ
```

*Transliteration (implementer-written):* Qul a'udhu bi-rabbi l-falaq. Min sharri ma khalaq. Wa-min sharri ghasiqin idha waqab. Wa-min sharri n-naffathati fi l-'uqad. Wa-min sharri hasidin idha hasad.

| | |
|---|---|
| **DE** | Sag: Ich nehme Zuflucht beim Herrn des Tagesanbruchs vor dem Übel dessen, was Er erschaffen hat, und vor dem Übel der Dunkelheit, wenn sie zunimmt, und vor dem Übel der Knotenanbläserinnen und vor dem Übel eines (jeden) Neidenden, wenn er neidet. |
| **TR** | De ki: "Yaratıkların şerrinden, bastırdığı zaman karanlığın şerrinden, düğümlere nefes eden büyücülerin şerrinden, hased ettiği zaman hasedcilerin şerrinden, tan yerini ağartan Rabbe sığınırım." |
| **EN** | Say, "I seek refuge in the Lord of daybreak From the evil of that which He created And from the evil of darkness when it settles And from the evil of the blowers in knots And from the evil of an envier when he envies." |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 5. Surah an-Nas

- **id** `an-nas`
- **Reference to check** Qur'an 114:1-6
- **Fetched from** <https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=114>
- **Shown under** morning, evening, sleep, after prayer (no reminder)
- **Note** said 3×

```
قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ مَلِكِ ٱلنَّاسِ إِلَـٰهِ ٱلنَّاسِ مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ
```

*Transliteration (implementer-written):* Qul a'udhu bi-rabbi n-nas. Maliki n-nas. Ilahi n-nas. Min sharri l-waswasi l-khannas. Alladhi yuwaswisu fi suduri n-nas. Mina l-jinnati wa-n-nas.

| | |
|---|---|
| **DE** | Sag: Ich nehme Zuflucht beim Herrn der Menschen, dem König der Menschen, dem Gott der Menschen, vor dem Übel des Einflüsterers, des Davonschleichers, der in die Brüste der Menschen einflüstert, von den Ginn und den Menschen. |
| **TR** | De ki: "İnsanlardan ve cinlerden ve insanların gönüllerine vesvese veren o sinsi vesvesecinin şerrinden, insanların Tanrısı, insanların Hükümranı ve insanların Rabbi olan Allah'a sığınırım." |
| **EN** | Say, "I seek refuge in the Lord of mankind, The Sovereign of mankind, The God of mankind, From the evil of the retreating whisperer - Who whispers [evil] into the breasts of mankind - From among the jinn and mankind". |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 6. The last two verses of Surah al-Baqarah

- **id** `baqarah-last-two`
- **Reference to check** Qur'an 2:285-286
- **Fetched from** <https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=2:285>
- **Shown under** sleep, quran

```
ءَامَنَ ٱلرَّسُولُ بِمَآ أُنزِلَ إِلَيْهِ مِن رَّبِّهِۦ وَٱلْمُؤْمِنُونَ ۚ كُلٌّ ءَامَنَ بِٱللَّهِ وَمَلَـٰٓئِكَتِهِۦ وَكُتُبِهِۦ وَرُسُلِهِۦ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِۦ ۚ وَقَالُوا۟ سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ ٱلْمَصِيرُ لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا ٱكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَآ إِن نَّسِينَآ أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَآ إِصْرًا كَمَا حَمَلْتَهُۥ عَلَى ٱلَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِۦ ۖ وَٱعْفُ عَنَّا وَٱغْفِرْ لَنَا وَٱرْحَمْنَآ ۚ أَنتَ مَوْلَىٰنَا فَٱنصُرْنَا عَلَى ٱلْقَوْمِ ٱلْكَـٰفِرِينَ
```

*Transliteration (implementer-written):* Amana r-rasulu bi-ma unzila ilayhi min rabbihi wa-l-mu'minun. Kullun amana billahi wa-mala'ikatihi wa-kutubihi wa-rusulih. La nufarriqu bayna ahadin min rusulih. Wa-qalu sami'na wa-ata'na, ghufranaka rabbana wa-ilayka l-masir. La yukallifu llahu nafsan illa wus'aha. Laha ma kasabat wa-'alayha ma ktasabat. Rabbana la tu'akhidhna in nasina aw akhta'na. Rabbana wa-la tahmil 'alayna isran kama hamaltahu 'ala lladhina min qablina. Rabbana wa-la tuhammilna ma la taqata lana bih. Wa-'fu 'anna wa-ghfir lana wa-rhamna. Anta mawlana fa-nsurna 'ala l-qawmi l-kafirin.

| | |
|---|---|
| **DE** | Der Gesandte (Allahs) glaubt an das, was zu ihm von seinem Herrn (als Offenbarung) herabgesandt worden ist, und ebenso die Gläubigen; alle glauben an Allah, Seine Engel, Seine Bücher und Seine Gesandten - Wir machen keinen Unterschied bei jemandem von Seinen Gesandten. Und sie sagen: „Wir hören und gehorchen. (Gewähre uns) Deine Vergebung, unser Herr! Und zu Dir ist der Ausgang. — Allah erlegt keiner Seele mehr auf, als sie zu leisten vermag. Ihr kommt (nur) zu, was sie verdient hat, und angelastet wird ihr (nur), was sie verdient hat. „Unser Herr, belange uns nicht, wenn wir (etwas) vergessen oder einen Fehler begehen. Unser Herr, lege uns keine Bürde auf, wie Du sie denjenigen vor uns auferlegt hast. Unser Herr, bürde uns nichts auf, wozu wir keine Kraft haben. Verzeihe uns, vergib uns und erbarme Dich unser! Du bist unser Schutzherr. So verhilf uns zum Sieg über das ungläubige Volk! |
| **TR** | Peygamber ve inananlar, ona Rabb'inden indirilene inandı. Hepsi Allah'a, meleklerine, kitaplarına, peygamberlerine inandı. "Peygamberleri arasından hiçbirini ayırdetmeyiz, işittik, itaat ettik, Rabbimiz! Affını dileriz, dönüş Sanadır" dediler. — Allah kişiye ancak gücünün yeteceği kadar yükler; kazandığı iyilik lehine, ettiği kötülük de aleyhinedir. Rabbimiz! Eğer unutacak veya yanılacak olursak bizi sorumlu tutma. Rabbimiz bizden öncekilere yüklediğin gibi, bize de ağır yük yükleme. Rabbimiz! Bize gücümüzün yetmeyeceği şeyi taşıtma, bizi affet, bizi bağışla, bize acı. Sen Mevlamızsın, kafirlere karşı bize yardım et. |
| **EN** | The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers. All of them have believed in Allāh and His angels and His books and His messengers, [saying], "We make no distinction between any of His messengers." And they say, "We hear and we obey. [We seek] Your forgiveness, our Lord, and to You is the [final] destination." — Allāh does not charge a soul except [with that within] its capacity. It will have [the consequence of] what [good] it has gained, and it will bear [the consequence of] what [evil] it has earned. "Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our protector, so give us victory over the disbelieving people." |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 7. Sayyid al-Istighfar

- **id** `sayyid-al-istighfar`
- **Reference to check** Sahih al-Bukhari 6306
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5503>
- **Shown under** morning, evening

```
اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ
```

*Transliteration (implementer-written):* Allahumma anta rabbi, la ilaha illa anta, khalaqtani wa-ana 'abduka, wa-ana 'ala 'ahdika wa-wa'dika ma stata't. A'udhu bika min sharri ma sana't. Abu'u laka bi-ni'matika 'alayya, wa-abu'u laka bi-dhanbi fa-ghfir li, fa-innahu la yaghfiru dh-dhunuba illa anta.

| | |
|---|---|
| **DE** | O Allah, Du bist mein Herr, es gibt keinen Gott außer Dir. Du hast mich erschaffen, und ich bin Dein Diener. Ich halte an Deinem Bund und Deinem Versprechen fest, so gut ich kann. Ich suche Zuflucht bei Dir vor dem Bösen, das ich getan habe. Ich bekenne Deine Gnade mir gegenüber und ich bekenne meine Sünden. So vergib mir, denn niemand vergibt Sünden außer Dir. |
| **TR** | Allah'ım! Sen benim Rabbimsin. Senden başka ibadete layık (hak) ilah yoktur. Beni sen yarattın ve ben senin kulunum. Ezelde sana verdiğim sözümde ve vaadimde hâlâ gücüm yettiğince durmaktayım. İşlediğim kusurların şerrinden sana sığınırım. Bana lütfettiğin nimetleri itiraf ediyorum. Günahlarımı itiraf ediyorum. Beni affet, şüphe yok ki günahları senden başka affedecek yoktur. |
| **EN** | O Allah, You are my Lord. You created me, and I am Your slave. I will remain faithful to Your covenant and promise as much as possible. I seek refuge with You from the evil of what I have done. I acknowledge Your favor upon me, and I admit my sin. So, forgive me. Indeed, none can forgive sins but You. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 8. Supplication on waking

- **id** `bika-asbahna`
- **Reference to check** Sunan Abi Dawud 5068
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5490>
- **Shown under** morning

```
اللهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ
```

*Transliteration (implementer-written):* Allahumma bika asbahna, wa-bika amsayna, wa-bika nahya, wa-bika namutu, wa-ilayka n-nushur.

| | |
|---|---|
| **DE** | O Allah, durch Dich traten wir in den Morgen, durch Dich traten wir in den Abend, durch Dich leben wir, durch Dich sterben wir und zu Dir ist die Auferstehung. |
| **TR** | Allah'ım! Senin lütfunla sabaha ulaştık, senin lütfunla akşama erdik. Sen isteyince dirilir, sen isteyince ölürüz. Yeniden diriltip huzurunda toplayacak olan da Sensin. |
| **EN** | O Allah, by You we have reached the morning, and by You we have reached the evening; by You we live, and by You we die, and to You is the Resurrection. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 9. Supplication at nightfall

- **id** `amsayna-wa-amsa-l-mulk`
- **Reference to check** Sunan Abi Dawud 5071 (also in Sahih Muslim)
- **Fetched from** <https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-abudawud/5071.json>
- **Shown under** evening
- **Note** **translation unreviewed (de)**

```
أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ
```

*Transliteration (implementer-written):* Amsayna wa-amsa l-mulku lillah, wa-l-hamdu lillah, la ilaha illa llahu wahdahu la sharika lah.

| | |
|---|---|
| **DE** ⚠ | Wir sind in den Abend eingetreten, und mit uns die Herrschaft, die Allah gehört. Alles Lob gehört Allah. Es gibt keinen Gott außer Allah, Er allein, Er hat keinen Teilhaber. |
| **TR** | Biz, Allah'ın (kulu) olarak geceledik, bütün mülk de Allah'ın olarak geceledi. Hamd Allah'a mahsustur. Allah'dan başka hakkıyla ibadete layık hiçbir ilâh yoktur, yalnız O vardır; O'nun ortağı yoktur. |
| **EN** | The evening has reached, and all the dominion belongs to Allah and praise be to Allah. There is no god but Allah, alone without any partner. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 10. Supplication for protection

- **id** `bismillah-alladhi-la-yadurr`
- **Reference to check** Sunan Abi Dawud 5088
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=6093>
- **Shown under** morning, evening
- **Note** said 3×

```
بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ، فِي الْأَرْضِ، وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ
```

*Transliteration (implementer-written):* Bismillahi lladhi la yadurru ma'a smihi shay'un fi l-ardi wa-la fi s-sama', wa-huwa s-sami'u l-'alim.

| | |
|---|---|
| **DE** | Mit dem Namen Allahs, Desjenigen, mit Dessen Namen weder etwas im Himmel noch auf der Erde einen Schaden zufügen kann, und Er ist der Allhörende, der Allwissende. |
| **TR** | Yerde de gökte de O'nun ismiyle birlikte hiçbir şeyin zarar veremeyeceği Allah'ın adıyla. O, her şeyi işiten ve bilendir. |
| **EN** | In the name of Allah, with Whose name nothing in the earth or the heaven can cause harm, and He is the All-Hearing, the All-Knowing. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 11. Contentment with Allah

- **id** `raditu-billah`
- **Reference to check** Sunan Abi Dawud 1529
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=65906>
- **Shown under** morning, evening
- **Note** **translation unreviewed (de)**

```
رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ رَسُولًا
```

*Transliteration (implementer-written):* Raditu billahi rabban, wa-bi-l-islami dinan, wa-bi-Muhammadin rasulan.

| | |
|---|---|
| **DE** ⚠ | Ich bin zufrieden mit Allah als Herrn, mit dem Islam als Religion und mit Muhammad als Gesandtem. |
| **TR** | Rab olarak Allah'a, din olarak İslam'a, rasûl olarak Muhammed'e (iman edip) razı oldum. |
| **EN** | I am pleased with Allah as a Lord, with Islam as a religion, with Muhammad as a Messenger. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 12. Tahlil

- **id** `tahlil`
- **Reference to check** Sahih al-Bukhari 3293 (also 6403)
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=65905>
- **Shown under** morning, evening
- **Note** **translation unreviewed (de)**; said 100×

```
لاَ إِلَهَ إِلَّا اللَّهُ، وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ
```

*Transliteration (implementer-written):* La ilaha illa llahu wahdahu la sharika lah, lahu l-mulku wa-lahu l-hamd, wa-huwa 'ala kulli shay'in qadir.

| | |
|---|---|
| **DE** ⚠ | Es gibt keinen Gott außer Allah, Er allein, Er hat keinen Teilhaber. Ihm gehört die Herrschaft und Ihm gebührt das Lob, und Er hat Macht über alle Dinge. |
| **TR** | Allah'tan başka hak ilâh yoktur. O, tektir ve hiçbir ortağı yoktur. Mülk O'nundur ve hamt O'nadır. O'nun her şeye gücü yeter. |
| **EN** | There is no god but Allah. He is One, and He has no partner with Him; to Him belong the sovereignty and praise, and He is competent over all things. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 13. Tasbih

- **id** `tasbih`
- **Reference to check** Sahih al-Bukhari 6405
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5516>
- **Shown under** morning, evening
- **Note** said 100×

```
سُبْحَانَ اللهِ وَبِحَمْدِهِ
```

*Transliteration (implementer-written):* Subhana llahi wa-bi-hamdih.

| | |
|---|---|
| **DE** | Gepriesen sei Allah und Ihm gebührt das Lob. |
| **TR** | Allah'a hamt ederek O'nu tüm noksanlıklardan tenzih ederim. |
| **EN** | Glory be to Allah, and praise be to Him. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 14. The Ibrahimi salawat

- **id** `salawat-ibrahimiyya`
- **Reference to check** Sahih al-Bukhari 6357
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5377>
- **Shown under** salawat

```
اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ
```

*Transliteration (implementer-written):* Allahumma salli 'ala Muhammadin wa-'ala ali Muhammad, kama sallayta 'ala ali Ibrahim, innaka hamidun majid. Allahumma barik 'ala Muhammadin wa-'ala ali Muhammad, kama barakta 'ala ali Ibrahim, innaka hamidun majid.

| | |
|---|---|
| **DE** | O Allah, sende Segen auf Muhammad und auf die Familie Muhammads, so wie Du Segen auf die Familie Ibrahims gesandt hast. Wahrlich, Du bist der Preiswürdige, der Ruhmreiche. O Allah, segne Muhammad und die Familie Muhammads, so wie Du die Familie Ibrahims gesegnet hast. Wahrlich, Du bist der Preiswürdige, der Ruhmreiche. |
| **TR** | Allah'ım! İbrahim'e (ve ailesine) rahmet ettiğin gibi Muhammed'e ve ailesine de rahmet et. Şüphesiz sen övülmeye lâyık olan ve yüce olansın. Allah'ım! İbrahim'e (ve ailesine) hayır ve bereket lütfettiğin gibi Muhammed'e ve ailesine de hayır ve bereket ihsan et. Şüphesiz sen övülmeye layık olan ve yüce olansın. |
| **EN** | O Allah, bestow Your grace upon Muhammad and the family of Muhammad just as You bestowed Your grace upon the family of Abraham. Verily, You are Praiseworthy, All-Glorious. O Allah, bless Muhammad and the family of Muhammad just as You blessed the family of Abraham. Verily, You are Praiseworthy, All-Glorious. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 15. Supplication before sleep

- **id** `sleep-aslamtu`
- **Reference to check** Sahih al-Bukhari 247; Sahih Muslim 2710
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=65911>
- **Shown under** sleep
- **Note** **translation unreviewed (de, tr, en)**

```
اللَّهُمَّ أَسْلَمْتُ وَجْهِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لاَ مَلْجَأَ وَلاَ مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، اللَّهُمَّ آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ
```

*Transliteration (implementer-written):* Allahumma aslamtu wajhi ilayk, wa-fawwadtu amri ilayk, wa-alja'tu zahri ilayk, raghbatan wa-rahbatan ilayk, la malja'a wa-la manja minka illa ilayk. Allahumma amantu bi-kitabika lladhi anzalt, wa-bi-nabiyyika lladhi arsalt.

| | |
|---|---|
| **DE** ⚠ | O Allah, ich habe mein Angesicht Dir zugewandt, meine Angelegenheit Dir anvertraut und meinen Rücken an Dich gelehnt, aus Hoffnung auf Dich und aus Furcht vor Dir. Es gibt keine Zuflucht und keine Rettung vor Dir außer bei Dir. O Allah, ich glaube an Dein Buch, das Du herabgesandt hast, und an Deinen Propheten, den Du entsandt hast. |
| **TR** ⚠ | Allah'ım! Yüzümü Sana çevirdim, işimi Sana havale ettim, sırtımı Sana dayadım; Senden umarak ve Senden korkarak. Senden kaçıp sığınılacak ve kurtulunacak yer yine ancak Sensin. Allah'ım! İndirdiğin Kitab'a ve gönderdiğin Peygamber'e iman ettim. |
| **EN** ⚠ | O Allah, I have submitted my face to You, and entrusted my affair to You, and turned my back to You for refuge, out of hope in You and fear of You. There is no refuge and no escape from You except to You. O Allah, I believe in Your Book which You sent down, and in Your Prophet whom You sent. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 16. Supplication for well-being

- **id** `afiyah-dunya-akhira`
- **Reference to check** Sunan Abi Dawud 5074; Sunan an-Nasa'i 5529; Sunan Ibn Majah 3871
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5485>
- **Shown under** morning, evening
- **Note** **translation unreviewed (de)**
- **Provenance** Cut from the first two sentences of the narration; the third sentence (`اللَّهُمَّ اسْتُرْ عَوْرَتِي -أَو: عَوْرَاتِي- ...`) carries a narrator's either/or aside inside the wording and was left out rather than cut mid-sentence. German written by the implementer because hadeethenc's German for this narration is missing a clause ("ich bitte Dich um und meiner Familie"). EN/TR are hadeethenc's.

```
اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي
```

*Transliteration (implementer-written):* Allahumma inni as'aluka l-'afiyata fi d-dunya wa-l-akhirah. Allahumma inni as'aluka l-'afwa wa-l-'afiyata fi dini wa-dunyaya wa-ahli wa-mali.

| | |
|---|---|
| **DE** ⚠ | O Allah, ich bitte Dich um Wohlbefinden im Diesseits und im Jenseits. O Allah, ich bitte Dich um Verzeihung und Wohlbefinden in meiner Religion, meinem Diesseits, meiner Familie und meinem Besitz. |
| **TR** | Allah'ım! Senden dünya ve ahirette afiyet diliyorum. Allah'ım! Dinim, dünyam, ehlim ve malım hakkında senden af ve afiyet isterim. |
| **EN** | O Allah, I ask You for well-being in this world and the Hereafter. O Allah, I ask You for pardon and well-being in my religion, my worldly life, my family, and my wealth. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 17. Supplication for protection on all sides

- **id** `ihfazni-min-bayni-yadayya`
- **Reference to check** Sunan Abi Dawud 5074; Sunan an-Nasa'i 5529; Sunan Ibn Majah 3871
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5485>
- **Shown under** morning, evening
- **Note** **translation unreviewed (de)**
- **Provenance** Second half of the same narration as `afiyah-dunya-akhira` (hadeethenc 5485). DE written by the implementer (hadeethenc's German merges this with the sentence left out; see above). EN/TR are hadeethenc's.

```
اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي
```

*Transliteration (implementer-written):* Allahumma-hfazni min bayni yadayya wa-min khalfi, wa-'an yamini wa-'an shimali, wa-min fawqi, wa-a'udhu bi-'azamatika an ughtala min tahti.

| | |
|---|---|
| **DE** ⚠ | O Allah, beschütze mich vor dem, was vor mir ist, und was hinter mir ist, und was zu meiner Rechten ist, und was zu meiner Linken ist, und was über mir ist. Und ich suche Zuflucht bei Deiner Größe davor, dass ich von unten (her) getötet werde. |
| **TR** | Allah'ım! Önümden, arkamdan, sağımdan, solumdan ve üstümden (gelecek belalardan) beni koru. Altımdan gelecek ani afet ve beladan senin azametine sığınırım. |
| **EN** | O Allah, protect me from before me, from behind me, from my right, from my left, and from above me, and I seek refuge with Your greatness from being suddenly killed from beneath me. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 18. Glorification by the number of His creation

- **id** `subhanallah-adada-khalqihi`
- **Reference to check** Sahih Muslim 2726
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5508>
- **Shown under** morning
- **Note** said 3×
- **Note** **translation unreviewed (de)**
- **Provenance** Said after the Fajr prayer in the narration (Juwayriyah); the Prophet said it 3×. hadeethenc publishes no German for this entry; DE written by the implementer. EN/TR are hadeethenc's.

```
سُبْحَانَ اللهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ وَرِضَا نَفْسِهِ وَزِنَةَ عَرْشِهِ وَمِدَادَ كَلِمَاتِهِ
```

*Transliteration (implementer-written):* Subhana llahi wa-bi-hamdihi, 'adada khalqihi wa-rida nafsihi wa-zinata 'arshihi wa-midada kalimatih.

| | |
|---|---|
| **DE** ⚠ | Gepriesen sei Allah und Ihm gebührt das Lob, nach der Zahl Seiner Schöpfung, nach Seinem Wohlgefallen, nach dem Gewicht Seines Thrones und nach der Tinte Seiner Worte. |
| **TR** | Allah’ı; yarattıklarının sayısı, kendisinin hoşnutluğu, Arş’ının ağırlığı ve kelimelerinin mürekkebi miktarınca hamd ile tenzih ederim (tesbih ederim) |
| **EN** | Glory be to Allah and all praise is due to Him by the number of His creation, by His own pleasure, by the weight of His Throne, and by the ink of His words. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 19. Refuge in the perfect words of Allah

- **id** `a-udhu-bi-kalimat-allah`
- **Reference to check** Jami' at-Tirmidhi 3604
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=66086>
- **Shown under** evening
- **Note** said 3×
- **Provenance** Arabic and the 3×-in-the-evening instruction come from hadeethenc 66086 (Tirmidhi), which has no translations. The EN/DE/TR are hadeethenc's published translations of the same sentence in the *alighting* narration (Muslim, hadeethenc 5932): <https://hadeethenc.com/api/v1/hadeeths/one/?language=en&id=5932> (also `de`, `tr`). Same words; a reviewer should confirm that reuse is acceptable.

```
أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ
```

*Transliteration (implementer-written):* A'udhu bi-kalimati llahi t-tammati min sharri ma khalaq.

| | |
|---|---|
| **DE** | Ich suche Zuflucht bei den vollkommenen Worten Allahs vor dem Schlechten, das Er erschuf. |
| **TR** | Allah’ın yarattığı mahlukatın şerrinden, Allah’ın eksiksiz tam kelimelerine sığınırım. |
| **EN** | I seek refuge in the perfect words of Allah from the evil of what He has created |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 20. Refuge from the evil of oneself and of Satan

- **id** `fatir-as-samawat`
- **Reference to check** Sunan Abi Dawud 5067 (also Jami' at-Tirmidhi 3392)
- **Fetched from** <https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-abudawud/5067.json>
- **Shown under** morning, evening, sleep
- **Note** **translation unreviewed (de, en)**
- **Provenance** hadeethenc's own Arabic for this narration (id 3006) is only partly vowelled, so the Arabic is taken from the fully vowelled Abu Dawud 5067 in the sunnah.com-derived mirror (same mirror as `amsayna-wa-amsa-l-mulk`). TR is hadeethenc's (id 3006, Turkish parenthetical); EN and DE written by the implementer (hadeethenc's English adds a clause that Abu Dawud 5067 does not have; no German published). Said morning, evening and on going to bed.

```
اللَّهُمَّ فَاطِرَ السَّمَوَاتِ وَالأَرْضِ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ رَبَّ كُلِّ شَىْءٍ وَمَلِيكَهُ أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ أَنْتَ أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَشَرِّ الشَّيْطَانِ وَشِرْكِهِ
```

*Transliteration (implementer-written):* Allahumma fatira s-samawati wa-l-ard, 'alima l-ghaybi wa-sh-shahadah, rabba kulli shay'in wa-malikah. Ashhadu an la ilaha illa anta. A'udhu bika min sharri nafsi wa-sharri sh-shaytani wa-shirkih.

| | |
|---|---|
| **DE** ⚠ | O Allah, Schöpfer der Himmel und der Erde, Kenner des Verborgenen und des Offenbaren, Herr und Herrscher über alle Dinge: Ich bezeuge, dass es keinen Gott außer Dir gibt. Ich suche Zuflucht bei Dir vor dem Übel meiner Seele und vor dem Übel des Satans und seiner Beigesellung. |
| **TR** | Ey göklerin ve yerin yaratıcısı! Gizliyi ve açığı bilen! Her şeyin Rabbi ve meliki olan Allah’ım! Senden başka hakkı ile ibadet olunan hiç bir ilah olmadığına şahidlik ederim. Nefsimin şerrinden, şeytanın şerrinden ve şirkinden sana sığınırım! |
| **EN** ⚠ | O Allah, Creator of the heavens and the earth, Knower of the unseen and the seen, Lord and Sovereign of everything: I bear witness that there is no god but You. I seek refuge in You from the evil of my own soul, and from the evil of Satan and his polytheism. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 21. Seeking forgiveness

- **id** `after-prayer-istighfar`
- **Reference to check** Sahih Muslim 591
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=10947>
- **Shown under** after prayer (no reminder)
- **Note** said 3×
- **Provenance** Cut from al-Awza'i's explanation of the istighfar inside the narration (`تَقُولُ: أَسْتَغْفِرُ اللهَ، أَسْتَغْفِرُ اللهَ`); the 3× comes from `اسْتَغْفَرَ ثَلَاثًا` in the same hadith. Please confirm that this is the right text to show for the 3×.

```
أَسْتَغْفِرُ اللهَ
```

*Transliteration (implementer-written):* Astaghfiru llah.

| | |
|---|---|
| **DE** | Ich bitte Allah um Vergebung |
| **TR** | Allah'tan mağfiret dilerim |
| **EN** | I seek forgiveness from Allah |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 22. You are As-Salam

- **id** `allahumma-anta-s-salam`
- **Reference to check** Sahih Muslim 591
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=10947>
- **Shown under** after prayer (no reminder)
- **Provenance** Same hadith as `after-prayer-istighfar`.

```
اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ ذَا الْجَلَالِ وَالْإِكْرَامِ
```

*Transliteration (implementer-written):* Allahumma anta s-salam, wa-minka s-salam, tabarakta dha l-jalali wa-l-ikram.

| | |
|---|---|
| **DE** | O Allah, Du bist der Friede, und von Dir kommt der Friede. Gepriesen seist Du, o Besitzer der Majestät und der Ehre |
| **TR** | Allah'ım! Sen Selam'sın. Selamet de sendendir. Ey celâl ve ikram sahibi! Sen münezzehsin, sen yücesin. |
| **EN** | O Allah, You are As-Salām (peace, perfection), and as-salām comes from You. Blessed are You, O Possessor of Glory and Honor |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 23. Tahlil after the obligatory prayer

- **id** `la-mani-a-lima-a-tayt`
- **Reference to check** Sahih al-Bukhari 844; Sahih Muslim 593
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=65102>
- **Shown under** after prayer (no reminder)
- **Note** **translation unreviewed (tr)**
- **Provenance** Said after every obligatory prayer. hadeethenc's Turkish for this entry is a transliteration only; TR written by the implementer. EN/DE are hadeethenc's. Reference numbers are as printed in hadeethenc's `reference` field.

```
لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ
```

*Transliteration (implementer-written):* La ilaha illa llahu wahdahu la sharika lah, lahu l-mulku wa-lahu l-hamd, wa-huwa 'ala kulli shay'in qadir. Allahumma la mani'a lima a'tayt, wa-la mu'tiya lima mana't, wa-la yanfa'u dha l-jaddi minka l-jadd.

| | |
|---|---|
| **DE** | Es gibt keinen anbetungswürdigen Gott außer Allah, dem Einzigen, ohne Partner. Ihm gehört das Königreich und Ihm gebührt das Lob, und Er hat Macht über alles. O Allah, niemand kann das verhindern, was Du gibst, und niemand kann geben, was Du zurückhältst, und Reichtum nützt dem Reichen vor Dir nichts. |
| **TR** ⚠ | Allah'tan başka hak ilâh yoktur. O, tektir ve hiçbir ortağı yoktur. Mülk O'nundur ve hamt O'nadır. O'nun her şeye gücü yeter. Allah'ım! Senin verdiğini engelleyecek, engellediğini verecek yoktur. Servet sahibine serveti, Sana karşı fayda vermez. |
| **EN** | There is no god but Allah, alone, with no partner with Him. To Him belongs the dominion and to Him praise is due, and He is Able to do all things. O Allah, none can withhold what You give and none can give what You withhold, and riches cannot avail a wealthy person against You |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 24. Help in remembrance, thanks and worship

- **id** `a-inni-ala-dhikrik`
- **Reference to check** Sunan Abi Dawud 1522; Sunan an-Nasa'i 1303
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=3518>
- **Shown under** after prayer (no reminder)
- **Provenance** Said after every prayer (the Prophet's advice to Mu'adh). All three translations are hadeethenc's.

```
اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ
```

*Transliteration (implementer-written):* Allahumma a'inni 'ala dhikrika wa-shukrika wa-husni 'ibadatik.

| | |
|---|---|
| **DE** | O Allah, verhilf mir dazu, Dir zu gedenken, Dir zu danken und Dich auf beste Weise anzubeten. |
| **TR** | Allah’ım! Seni anmak, sana şükretmek ve sana güzelce kulluk etmekte bana yardım et. |
| **EN** | O Allah, help me remember You, thank You, and excellently worship You |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 25. In Your name I die and I live

- **id** `bismika-amutu-wa-ahya`
- **Reference to check** Sahih al-Bukhari 6324
- **Fetched from** <https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=65913>
- **Shown under** sleep
- **Note** **translation unreviewed (de, tr, en)**
- **Provenance** Moved here from "Deliberately left out": hadeethenc has the narration (id 65913) and the mirror's Bukhari 6324 carries the same wording, so there are now two sources. hadeethenc has no translations for it; all three written by the implementer.

```
بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا
```

*Transliteration (implementer-written):* Bismika llahumma amutu wa-ahya.

| | |
|---|---|
| **DE** ⚠ | In Deinem Namen, o Allah, sterbe ich und lebe ich. |
| **TR** ⚠ | Allah'ım! Senin adınla ölür ve dirilirim. |
| **EN** ⚠ | In Your name, O Allah, I die and I live. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 26. Supplication for protection from punishment

- **id** `qini-adhabaka`
- **Reference to check** Sunan Abi Dawud 5045
- **Fetched from** <https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-abudawud/5045.json>
- **Shown under** sleep
- **Note** said 3×
- **Note** **translation unreviewed (de, tr, en)**
- **Provenance** Taken from the mirror's Abu Dawud 5045 (Hafsah): the clean wording `يَوْمَ تَبْعَثُ عِبَادَكَ`, said three times. (The Tirmidhi/Muslim wordings carry a narrator's `أَوْ تَجْمَعُ` doubt, so they were not used.) All three translations written by the implementer.

```
اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ
```

*Transliteration (implementer-written):* Allahumma qini 'adhabaka yawma tab'athu 'ibadak.

| | |
|---|---|
| **DE** ⚠ | O Allah, bewahre mich vor Deiner Strafe an dem Tag, an dem Du Deine Diener auferweckst. |
| **TR** ⚠ | Allah'ım! Kullarını diriltip kaldıracağın gün beni azabından koru. |
| **EN** ⚠ | O Allah, protect me from Your punishment on the Day You resurrect Your servants. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

### 27. On lying down

- **id** `bismika-rabbi-wada-tu-janbi`
- **Reference to check** Sahih al-Bukhari 6320
- **Fetched from** <https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari/6320.json>
- **Shown under** sleep
- **Note** **translation unreviewed (de)**
- **Provenance** hadeethenc's Arabic (id 6034) is unvowelled, so the Arabic is taken from the fully vowelled Bukhari 6320 in the mirror. EN/TR are hadeethenc's (id 6034); DE written by the implementer. Said on lying down; the narration first says to dust the bed.

```
بِاسْمِكَ رَبِّ وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ
```

*Transliteration (implementer-written):* Bismika rabbi wada'tu janbi, wa-bika arfa'uh. In amsakta nafsi fa-rhamha, wa-in arsaltaha fa-hfazha bi-ma tahfazu bihi 'ibadaka s-salihin.

| | |
|---|---|
| **DE** ⚠ | In Deinem Namen, mein Herr, lege ich mich nieder, und durch Dich stehe ich wieder auf. Wenn Du meine Seele festhältst, so erbarme Dich ihrer, und wenn Du sie freilässt, so beschütze sie, wie Du Deine rechtschaffenen Diener beschützt. |
| **TR** | Rabbim senin adınla yatağıma yattım, yine senin isminle yatağımdan kalkarım. Eğer uykuda canımı alırsan, ona merhamet et! Şayet hayatta bırakırsan, salih kullarını koruduğun gibi, onu da kötülüklerden koru! |
| **EN** | In Your Name, O my Lord, I place my side (on the bed), and by You I will lift it. If You take my soul, then have mercy on it, and if You send it, then protect it as You protect Your righteous slaves. |

- [ ] Arabic verified against the reference
- [ ] Reference itself verified
- [ ] Translations verified
- [ ] Transliteration verified

---

## Sajda note in the Quran reader (added 2026-10-14)

**Status: NOT REVIEWED. Off in the app (`SAJDA_TIME_NOTE_REVIEWED = false` in
`mobile/src/lib/quran/sajda-time.ts`) until the sheikh answers below.**

When someone reads one of the fifteen āyāt of prostration during a time in
which voluntary prayer is avoided, the reader shows a short, gentle note under
the āyah. It reminds; it does not rule. The app cannot know whether the person
has already prayed, so a window starts when the prayer's time comes in.

Questions for Sheikh Ayman:

1. **Should the note exist at all,** given the difference of opinion on
   sajdat al-tilāwa in these times (Ḥanafī: avoided; Shāfiʿī: allowed, as it
   has a cause)? If yes, which position does the mosque follow?
2. **Which windows?** As built: from Fajr time until 15 minutes after sunrise;
   10 minutes before Dhuhr; from ʿAṣr time until Maghrib. Are 15 and 10
   minutes right, and should "after ʿAṣr" start at ʿAṣr's time or only near
   sunset (yellowing of the sun)?
3. **The wording.** Proposed:
   - AR: «هذه آية سجدة، والوقت الآن وقت كراهة للصلاة (بعد العصر). يمكنك أن تسجد بعد المغرب.»
   - The bracket changes per window: (بعد الفجر) · (وقت الشروق) · (وقت الزوال) · (بعد العصر).
   - DE / TR / EN follow once the Arabic is settled.

- [ ] Note approved (or dropped)
- [ ] Position and windows confirmed
- [ ] Wording approved

---


## Sign-off

| Reviewer | Qualification | Date | Rows accepted | Rows rejected |
|---|---|---|---|---|
|  |  |  |  |  |

Once every row is accepted, remove the banner at the top of
`mobile/src/lib/dua/content.ts` and this file's **NOT REVIEWED** status — and
nothing else. The rule that Arabic is never hand-edited stays in force after
review, not just before it.
