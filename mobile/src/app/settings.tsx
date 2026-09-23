import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  AppState,
  Platform,
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
  type StringKey,
} from "@/lib/i18n";
import {
  isRecordedVoice,
  loadAdhanVoice,
  saveAdhanVoice,
  voicesFor,
  voiceSeconds,
  type AdhanVoice,
} from "@/lib/adhan-voice";
import {
  EMPTY_DISPLAY_SETTINGS,
  loadDisplaySettings,
  saveDisplaySettings,
  type DisplaySettings,
} from "@/lib/display";
import { askForExactAlarms } from "@/lib/exact-alarms";
import { usePlaceContext } from "@/lib/place-context";
import {
  cancelAll,
  isEnabled,
  listScheduledAlerts,
  previewVoice,
  requestPermission,
  reschedule,
  setEnabled,
  type ScheduledAlert,
} from "@/lib/notifications";
import {
  autostartBlocked,
  canScheduleExactAlarms,
  hasPolicyAccess,
  isSilenceEnabled,
  loadSilenceMinutes,
  openAutostartSettings,
  openExactAlarmSettings,
  openPolicyAccessSettings,
  rescheduleSilenceFor,
  setSilenceEnabled,
  setSilenceMinutes,
  SILENCE_DURATIONS,
  type SilenceDuration,
} from "@/lib/silence";
import { formatClock } from "@/lib/time";
import { COLORS, FONTS, TEXT } from "@/theme";

const CITY_LIST_CAP = 40;

const VOICE_KEY: Record<AdhanVoice, StringKey> = {
  full: "voiceFull",
  short: "voiceShort",
  system: "voiceSystem",
};

/** Enough of the queue to see a whole day, and to see a duplicate. */
const ALERT_LIST_CAP = 14;

export default function SettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const { place, mode, state, useGps, usePlace } = usePlaceContext();

  const [notify, setNotify] = useState(false);
  const [denied, setDenied] = useState(false);
  const [query, setQuery] = useState("");

  const [voice, setVoice] = useState<AdhanVoice>("full");
  const [display, setDisplay] = useState<DisplaySettings>(EMPTY_DISPLAY_SETTINGS);
  const [silenceOn, setSilenceOn] = useState(false);
  const [silenceMinutes, setSilenceMinutesState] = useState<SilenceDuration>(20);
  // Lazy initial state rather than an effect: hasPolicyAccess() is a plain
  // synchronous read (a no-op returning false off Android), so there is
  // nothing to synchronize it with — it belongs in the initializer, not in
  // a setState call that would trigger a second render on mount.
  const [silenceAccess, setSilenceAccess] = useState(() => hasPolicyAccess());
  // Same shape as silenceAccess: a synchronous native read, refreshed on
  // every return to the foreground because the user grants it on a system
  // screen we send them to.
  const [exactAlarms, setExactAlarms] = useState(() => canScheduleExactAlarms());
  // Xiaomi's Autostart switch, same shape again. Always false elsewhere.
  const [autostartOff, setAutostartOff] = useState(() => autostartBlocked());

  // What is actually sitting in the alarm queue. Not decoration: when the
  // phone rings twice, this is where "two entries at one time" (our bug) is
  // told apart from "one entry" (a second app, or the website's push).
  const [alerts, setAlerts] = useState<ScheduledAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  function refreshAlerts() {
    listScheduledAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }

  useEffect(() => {
    void isEnabled().then(setNotify);
    void loadAdhanVoice(Platform.OS).then(setVoice);
    void loadDisplaySettings().then(setDisplay);
    void isSilenceEnabled().then(setSilenceOn);
    void loadSilenceMinutes().then(setSilenceMinutesState);
    refreshAlerts();
  }, []);

  // Access can be granted or revoked in system settings while this screen is
  // in the background — re-check whenever the app comes back, rather than
  // trusting a value that may already be stale.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        setSilenceAccess(hasPolicyAccess());
        setExactAlarms(canScheduleExactAlarms());
        setAutostartOff(autostartBlocked());
        refreshAlerts();
      }
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
      setExactAlarms(canScheduleExactAlarms());
      setAutostartOff(autostartBlocked());
      // The second permission, the one Android never asks for itself.
      askForExactAlarms(t);
      await reschedule(place, t);
    } else {
      await setEnabled(false);
      setNotify(false);
      await cancelAll();
    }
    refreshAlerts();
  }

  function editDisplay(patch: Partial<DisplaySettings>) {
    // Typing here counts as setup: the display will not ask again.
    const next = { ...display, ...patch, configured: true };
    setDisplay(next);
    void saveDisplaySettings(next);
  }

  async function chooseVoice(next: AdhanVoice) {
    await saveAdhanVoice(next);
    setVoice(next);
    // Already-scheduled adhans sit on the old voice's channel — move them.
    if (notify) {
      await reschedule(place, t);
      refreshAlerts();
    }
  }

  /** "Tue 19/9 19:42" without Intl, which Hermes only half-implements. */
  function alertWhen(at: Date | null): string {
    if (!at) return "—";
    return `${at.getDate()}/${at.getMonth() + 1} ${formatClock(at)}`;
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

  // CITIES is Germany-wide (1,100+ towns, biggest first). Rendering them all
  // would make this screen crawl, so the list is capped: the biggest cities
  // before any search, the best matches once the user types.
  const q = query.trim().toLowerCase();
  const filtered = (
    q ? CITIES.filter((c) => c.name.toLowerCase().includes(q)) : CITIES
  ).slice(0, CITY_LIST_CAP);

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

          {notify && !exactAlarms && (
            <View style={[styles.explainCard, styles.explainInCard]}>
              <Text style={styles.explainTitle}>{t("exactAlarmTitle")}</Text>
              <Text style={styles.explainBody}>{t("exactAlarmBody")}</Text>
              <Pressable
                style={styles.explainButton}
                onPress={() => openExactAlarmSettings()}
              >
                <Text style={styles.explainButtonText}>
                  {t("exactAlarmGrant")}
                </Text>
              </Pressable>
            </View>
          )}

          {notify && exactAlarms && autostartOff && (
            <View style={[styles.explainCard, styles.explainInCard]}>
              <Text style={styles.explainTitle}>{t("autostartTitle")}</Text>
              <Text style={styles.explainBody}>{t("autostartBody")}</Text>
              <Pressable
                style={styles.explainButton}
                onPress={() => openAutostartSettings()}
              >
                <Text style={styles.explainButtonText}>
                  {t("autostartGrant")}
                </Text>
              </Pressable>
            </View>
          )}

          {notify && (
            <View style={styles.queue}>
              <Pressable
                style={styles.queueHeader}
                onPress={() => {
                  refreshAlerts();
                  setShowAlerts((v) => !v);
                }}
              >
                <Text style={styles.label}>
                  {alerts.length === 0
                    ? t("scheduledNone")
                    : t("scheduledAlerts", { count: String(alerts.length) })}
                </Text>
                {alerts.length > 0 && (
                  <Text style={styles.queueToggle}>
                    {showAlerts ? t("scheduledHide") : t("scheduledShow")}
                  </Text>
                )}
              </Pressable>
              {showAlerts &&
                alerts.slice(0, ALERT_LIST_CAP).map((a) => (
                  <View key={a.id} style={styles.queueRow}>
                    <Text style={styles.queueTitle} numberOfLines={1}>
                      {a.title}
                    </Text>
                    <Text style={styles.queueWhen}>{alertWhen(a.at)}</Text>
                  </View>
                ))}
              {showAlerts && alerts.length > ALERT_LIST_CAP && (
                <Text style={styles.queueWhen}>
                  {`+${alerts.length - ALERT_LIST_CAP}`}
                </Text>
              )}
            </View>
          )}
        </View>

        <Text style={styles.section}>{t("adhanVoiceSection")}</Text>
        <View style={styles.card}>
          {voicesFor(Platform.OS).map((v) => {
            const active = v === voice;
            return (
              <Pressable
                key={v}
                style={styles.option}
                onPress={() => void chooseVoice(v)}
              >
                <View style={styles.voiceText}>
                  <Text style={[styles.optionText, active && styles.selected]}>
                    {t(VOICE_KEY[v])}
                  </Text>
                  <Text style={styles.voiceMeta}>
                    {isRecordedVoice(v)
                      ? t("voiceSeconds", { seconds: voiceSeconds(v, Platform.OS) })
                      : t("voiceSystemHint")}
                  </Text>
                </View>
                {active && <Text style={styles.check}>&#10003;</Text>}
              </Pressable>
            );
          })}
          <Pressable
            style={styles.explainButton}
            onPress={() => void previewVoice(voice, t)}
          >
            <Text style={styles.explainButtonText}>{t("voicePreview")}</Text>
          </Pressable>
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
                        {t("silenceMinutesOption", { minutes })}
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

        <Text style={styles.section}>{t("mosqueDisplay")}</Text>
        <View style={styles.card}>
          <View style={styles.displayBody}>
            <Text style={styles.hint}>{t("displayHint")}</Text>
            <Text style={styles.label}>{t("displayMosqueName")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("displayMosqueNamePlaceholder")}
              placeholderTextColor="rgba(232,227,217,0.35)"
              value={display.mosqueName}
              onChangeText={(v) => editDisplay({ mosqueName: v })}
            />
            <Text style={styles.label}>{t("displayJumua")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("displayJumuaPlaceholder")}
              placeholderTextColor="rgba(232,227,217,0.35)"
              value={display.jumua}
              onChangeText={(v) => editDisplay({ jumua: v })}
              keyboardType="numbers-and-punctuation"
            />
            <Pressable
              style={styles.explainButton}
              onPress={() => router.push("/display")}
            >
              <Text style={styles.explainButtonText}>{t("displayOpen")}</Text>
            </Pressable>
          </View>
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
  displayBody: { padding: 16, gap: 10 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: TEXT.full,
    fontFamily: FONTS.body,
    fontSize: 15,
  },
  voiceText: { flex: 1, gap: 2 },
  voiceMeta: { color: TEXT.soft, fontSize: 12, fontFamily: FONTS.body },
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
  /** The same card sitting inside a bordered list card. */
  explainInCard: { marginHorizontal: 12, marginBottom: 12 },
  queue: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 6,
  },
  queueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
  },
  queueToggle: { color: COLORS.gold, fontFamily: FONTS.body, fontSize: 13 },
  queueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  queueTitle: {
    color: TEXT.strong,
    fontFamily: FONTS.body,
    fontSize: 13,
    flexShrink: 1,
  },
  queueWhen: {
    color: TEXT.soft,
    fontFamily: FONTS.body,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
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
