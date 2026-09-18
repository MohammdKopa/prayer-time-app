import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CITIES, placeFromCity } from "@/lib/location";
import {
  LOCALE_NAMES,
  LOCALES,
  useI18n,
  type Locale,
} from "@/lib/i18n";
import { usePlaceContext } from "@/lib/place-context";
import {
  cancelAll,
  isEnabled,
  requestPermission,
  reschedule,
  setEnabled,
} from "@/lib/notifications";
import { COLORS, FONTS, TEXT } from "@/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const { place, mode, state, useGps, usePlace } = usePlaceContext();

  const [notify, setNotify] = useState(false);
  const [denied, setDenied] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void isEnabled().then(setNotify);
  }, []);

  async function toggleNotifications(on: boolean) {
    if (on) {
      const perm = await requestPermission();
      if (perm === "denied") {
        setDenied(true);
        setNotify(false);
        return;
      }
      setDenied(false);
      await setEnabled(true);
      setNotify(true);
      await reschedule(place, t);
    } else {
      await setEnabled(false);
      setNotify(false);
      await cancelAll();
    }
  }

  const filtered = query.trim()
    ? CITIES.filter((c) =>
        c.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : CITIES;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>{t("back")}</Text>
          </Pressable>
          <Text style={styles.title}>{t("settings")}</Text>
          <View style={styles.spacer} />
        </View>

        <Text style={styles.section}>{t("language")}</Text>
        <View style={styles.card}>
          {LOCALES.map((l: Locale) => (
            <Pressable
              key={l}
              style={styles.option}
              onPress={() => setLocale(l)}
            >
              <Text
                style={[styles.optionText, l === locale && styles.selected]}
              >
                {LOCALE_NAMES[l]}
              </Text>
              {l === locale && <Text style={styles.check}>&#10003;</Text>}
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>{t("notifications")}</Text>
        <View style={styles.card}>
          <View style={styles.option}>
            <Text style={styles.optionText}>
              {notify ? t("notificationsOn") : t("notificationsOff")}
            </Text>
            <Switch
              value={notify}
              onValueChange={toggleNotifications}
              trackColor={{ true: COLORS.gold, false: "#333" }}
              thumbColor={COLORS.bone}
            />
          </View>
          {denied && (
            <Text style={styles.hint}>{t("notificationsDenied")}</Text>
          )}
        </View>

        <Text style={styles.section}>{t("chooseCity")}</Text>
        <View style={styles.card}>
          <Pressable style={styles.option} onPress={() => void useGps()}>
            <Text
              style={[styles.optionText, mode === "gps" && styles.selected]}
            >
              {state === "locating" ? t("locating") : t("useMyLocation")}
            </Text>
            {mode === "gps" && <Text style={styles.check}>&#10003;</Text>}
          </Pressable>
          {(state === "denied" || state === "unavailable") && (
            <Text style={styles.hint}>{t("locationDeniedHint")}</Text>
          )}
        </View>

        <TextInput
          style={styles.search}
          placeholder={t("searchCity")}
          placeholderTextColor="rgba(232,227,217,0.35)"
          value={query}
          onChangeText={setQuery}
        />

        <View style={styles.card}>
          {filtered.length === 0 && (
            <Text style={styles.hint}>{t("noCityFound")}</Text>
          )}
          {filtered.map((c) => {
            const active = mode === "manual" && c.name === place.name;
            return (
              <Pressable
                key={c.id}
                style={styles.option}
                onPress={() => void usePlace(placeFromCity(c))}
              >
                <Text style={[styles.optionText, active && styles.selected]}>
                  {c.name}
                </Text>
                {active && <Text style={styles.check}>&#10003;</Text>}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 10, paddingBottom: 48 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  back: { color: COLORS.gold, fontSize: 16, fontFamily: FONTS.body },
  title: { color: COLORS.bone, fontSize: 18, fontFamily: FONTS.display },
  spacer: { width: 44 },
  section: {
    color: TEXT.soft,
        fontSize: 13,
    marginTop: 14,
    marginBottom: 2,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 15,
    minHeight: 48,
  },
  optionText: {
    color: COLORS.bone,
    fontSize: 16,
    flexShrink: 1,
    fontFamily: FONTS.body,
  },
  selected: { color: COLORS.gold },
  check: { color: COLORS.gold, fontSize: 16 },
  hint: {
    color: TEXT.soft,
    fontFamily: FONTS.body,
        fontSize: 13,
    paddingHorizontal: 15,
    paddingBottom: 12,
    lineHeight: 19,
  },
  search: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: COLORS.bone,
    fontSize: 16,
  },
});
