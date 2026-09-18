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

- **`بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا` (Sahih al-Bukhari 6324)** — the bedtime dhikr. Found
  in the sunnah.com-derived mirror only; hadeethenc has no entry for it, so
  the Arabic would have rested on a single unconfirmed source. Add it once a
  reviewer can confirm it against sunnah.com.
- **`أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ`** — verified Arabic available, but hadeethenc
  publishes no German, Turkish or English translation for that entry, which
  would have meant three implementer-written translations for one item.
- **`رَضِينَا بِاللَّهِ رَبًّا` in the Abu Dawud 5072 wording** — graded *da'if* by al-Albani,
  and the widespread wording (`رَضِيتُ`) is a different narration. The
  `رَضِيتُ` form from Abu Dawud 1529, graded *sahih*, is included instead.
- **Sahih Muslim hadith numbers** — the accessible mirror numbers Muslim on a
  scheme that does not match sunnah.com's, so Muslim is only ever cited here
  alongside a collection whose numbering was confirmed.

## The texts

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
- **Shown under** morning, evening, quran

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
- **Shown under** morning, evening, sleep
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
- **Shown under** morning, evening, sleep
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


## Sign-off

| Reviewer | Qualification | Date | Rows accepted | Rows rejected |
|---|---|---|---|---|
|  |  |  |  |  |

Once every row is accepted, remove the banner at the top of
`mobile/src/lib/dua/content.ts` and this file's **NOT REVIEWED** status — and
nothing else. The rule that Arabic is never hand-edited stays in force after
review, not just before it.
