import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useI18n, type Strings } from "@/lib/i18n";
import { COLORS, FONTS, TEXT } from "@/theme";

// Sources and credits — everything the app shows that it did not make.
//
// Two of these are obligations, not courtesies: OpenStreetMap data is ODbL
// and must carry "© OpenStreetMap contributors", and Google Fonts are OFL.
// The rest is the honest record. Keep this in step with
// assets/photos/CREDITS.md and assets/sounds/LICENSES.md.

interface Credit {
  title: string;
  detail: string;
  url?: string;
}

interface Section {
  key: keyof Strings;
  items: Credit[];
}

const SECTIONS: Section[] = [
  {
    key: "creditsPhotos",
    items: [
      {
        title: "قُبَّةُ الصَّخْرَة · القُدس — Dome of the Rock, Jerusalem",
        detail: "Photo provided by the app's author.",
      },
      {
        title: "اَلْمَسْجِدُ الْحَرَام · مَكَّة — al-Masjid al-Ḥarām, Makkah",
        detail: "Photo provided by the app's author; upscaled with Real-ESRGAN.",
      },
      {
        title: "اَلْجَامِعُ الْأُمَوِيّ · دِمَشْق — Umayyad Mosque, Damascus",
        detail: "Photo provided by the app's author; upscaled with Real-ESRGAN.",
      },
    ],
  },
  {
    key: "creditsAudio",
    items: [
      {
        title: "Full adhan / short adhan",
        detail: "“Beautiful adhan” by Adam-synagda, Wikimedia Commons, 2022. CC0 1.0 (public domain dedication). Trimmed and loudness-normalised.",
        url: "https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg",
      },
    ],
  },
  {
    key: "creditsData",
    items: [
      {
        title: "© OpenStreetMap contributors",
        detail: "Mosque locations and the city list. Open Database License (ODbL) 1.0.",
        url: "https://www.openstreetmap.org/copyright",
      },
      {
        title: "© Overture Maps Foundation",
        detail: "Additional mosque locations from the Overture Maps places dataset (Meta, Microsoft, Foursquare, TomTom). CDLA-Permissive 2.0.",
        url: "https://overturemaps.org",
      },
      {
        title: "adhan-js",
        detail: "Prayer time calculation library. MIT License.",
        url: "https://github.com/batoulapps/adhan-js",
      },
    ],
  },
  {
    key: "creditsFonts",
    items: [
      {
        title: "Reem Kufi, Noto Naskh Arabic, Amiri",
        detail: "Google Fonts. SIL Open Font License 1.1.",
        url: "https://fonts.google.com",
      },
    ],
  },
];

export default function CreditsScreen() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{t("back")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("credits")}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>{t("creditsIntro")}</Text>

        {SECTIONS.map((section) => (
          <View key={section.key}>
            <Text style={styles.section}>{t(section.key)}</Text>
            <View style={styles.card}>
              {section.items.map((item, i) => (
                <Pressable
                  key={item.title}
                  style={[styles.row, i > 0 && styles.rowBorder]}
                  disabled={!item.url}
                  onPress={() => item.url && Linking.openURL(item.url).catch(() => {})}
                >
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDetail}>{item.detail}</Text>
                  {item.url && <Text style={styles.itemUrl}>{item.url}</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  back: { color: COLORS.gold, fontSize: 16, fontFamily: FONTS.body },
  title: { color: TEXT.full, fontSize: 18, fontFamily: FONTS.display },
  spacer: { width: 44 },

  content: { padding: 20, paddingTop: 0, paddingBottom: 40, gap: 6 },
  intro: { color: TEXT.soft, fontSize: 14, fontFamily: FONTS.body, lineHeight: 22, marginBottom: 8 },
  section: {
    color: TEXT.strong,
    fontSize: 13,
    fontFamily: FONTS.body,
    marginTop: 14,
    marginBottom: 6,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    overflow: "hidden",
  },
  row: { padding: 14, gap: 3 },
  rowBorder: { borderTopWidth: 1, borderTopColor: COLORS.line },
  itemTitle: { color: TEXT.full, fontSize: 15, fontFamily: FONTS.bodyMedium },
  itemDetail: { color: TEXT.soft, fontSize: 13, fontFamily: FONTS.body, lineHeight: 20 },
  itemUrl: { color: TEXT.goldSoft, fontSize: 12, fontFamily: FONTS.body },
});
