import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  AppState,
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
import {
  hasPolicyAccess,
  isSilenceEnabled,
  loadSilenceMinutes,
  openPolicyAccessSettings,
  rescheduleSilenceFor,
  setSilenceEnabled,
  setSilenceMinutes,
  SILENCE_DURATIONS,
  type SilenceDuration,
} from "@/lib/silence";
import { toArabicIndic } from "@/lib/time";
import { COLORS, FONTS, TEXT } from "@/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const { place, mode, state, useGps, usePlace } = usePlaceContext();

  const [notify, setNotify] = useState(false);
  const [denied, setDenied] = useState(false);
  const [query, setQuery] = useState("");

  const [silenceOn, setSilenceOn] = useState(false);
  const [silenceMinutes, setSilenceMinutesState] = useState<SilenceDuration>(20);
  // Lazy initial state rather than an effect: hasPolicyAccess() is a plain
  // synchronous read (a no-op returning false off Android), so there is
  // nothing to synchronize it with — it belongs in the initializer, not in
  // a setState call that would trigger a second render on mount.
  const [silenceAccess, setSilenceAccess] = useState(() => hasPolicyAccess());

  const num = (s: string) => (locale === "ar" ? toArabicIndic(s) : s);

  useEffect(() => {
    void isEnabled().then(setNotify);
    void isSilenceEnabled().then(setSilenceOn);
    void loadSilenceMinutes().then(setSilenceMinutesState);
  }, []);

  // Access can be granted or revoked in system settings while this screen is
  // in the background — re-check whenever the app comes back, rather than
  // trusting a value that may already be stale.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") setSilenceAccess(hasPolicyAccess());
    });
    return () => sub.remove();
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

  async function toggleSilence(on: boolean) {
    await setSilenceEnabled(on);
    setSilenceOn(on);
    if (on) setSilenceAccess(hasPolicyAccess());
    await rescheduleSilenceFor(place);
  }

  async function chooseSilenceMinutes(minutes: SilenceDuration) {
    await setSilenceMinutes(minutes);
    setSilenceMinutesState(minutes);
    await rescheduleSilenceFor(place);
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

        <Text style={styles.section}>{t("silenceSection")}</Text>
        <View style={styles.card}>
          <View style={styles.option}>
            <Text style={styles.optionText}>
              {silenceOn ? t("silenceOn") : t("silenceOff")}
            </Text>
            <Switch
              value={silenceOn}
              onValueChange={(on) => void toggleSilence(on)}
              trackColor={{ true: COLORS.gold, false: "#333" }}
              thumbColor={COLORS.bone}
            />
          </View>

          {silenceOn && (
            <View style={styles.silenceBody}>
              <Text style={styles.label}>{t("silenceDurationLabel")}</Text>
              <View style={styles.chips}>
                {SILENCE_DURATIONS.map((minutes) => {
                  const active = silenceMinutes === minutes;
                  return (
                    <Pressable
                      key={minutes}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => void chooseSilenceMinutes(minutes)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {num(t("silenceMinutesOption", { minutes }))}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {!silenceAccess && (
                <View style={styles.explainCard}>
                  <Text style={styles.explainTitle}>
                    {t("silenceExplainTitle")}
                  </Text>
                  <Text style={styles.explainBody}>
                    {t("silenceExplainBody")}
                  </Text>
                  <Pressable
                    style={styles.explainButton}
                    onPress={() => openPolicyAccessSettings()}
                  >
                    <Text style={styles.explainButtonText}>
                      {t("silenceGrantAccess")}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
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
  silenceBody: {
    paddingHorizontal: 15,
    paddingBottom: 14,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 12,
  },
  label: {
    color: TEXT.soft,
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: "center",
  },
  chipActive: {
    borderColor: COLORS.goldEdge,
    backgroundColor: COLORS.goldWash,
  },
  chipText: { color: TEXT.soft, fontFamily: FONTS.body, fontSize: 13 },
  chipTextActive: { color: COLORS.gold },
  explainCard: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    borderRadius: 10,
    padding: 12,
    gap: 6,
    backgroundColor: COLORS.goldWash,
  },
  explainTitle: {
    color: COLORS.bone,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
  },
  explainBody: {
    color: TEXT.strong,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
  },
  explainButton: {
    marginTop: 4,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    borderRadius: 10,
  },
  explainButtonText: {
    color: COLORS.gold,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
  },
});
