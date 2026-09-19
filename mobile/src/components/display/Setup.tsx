import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { parseClock, type DisplaySettings } from "@/lib/display";
import { useI18n } from "@/lib/i18n";
import { COLORS, FONTS, TEXT } from "@/theme";

// The step every mosque goes through the first time the display opens:
// what to call the mosque, and when Jumuʿa is held here — because that is
// the one time the engine cannot know. Also reachable later from the
// display's tap menu and from Settings. Saved on the device only.

export function DisplaySetup({
  initial,
  placeName,
  onDone,
  onCancel,
}: {
  initial: DisplaySettings;
  placeName: string;
  onDone: (s: DisplaySettings) => void;
  /** Present only when re-opened from a configured display. */
  onCancel?: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(initial.mosqueName);
  const [jumua, setJumua] = useState(initial.jumua);
  const jumuaBad = jumua.trim() !== "" && parseClock(jumua) === null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>{t("displaySetupTitle")}</Text>
          <Text style={styles.body}>{t("displaySetupBody")}</Text>

          <Text style={styles.label}>{t("displayMosqueName")}</Text>
          <TextInput
            style={styles.input}
            placeholder={`${t("mosqueUnnamed")} ${placeName}`}
            placeholderTextColor="rgba(232,227,217,0.35)"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={styles.label}>{t("displayJumua")}</Text>
          <TextInput
            style={[styles.input, jumuaBad && styles.inputBad]}
            placeholder={t("displayJumuaPlaceholder")}
            placeholderTextColor="rgba(232,227,217,0.35)"
            value={jumua}
            onChangeText={setJumua}
            keyboardType="numbers-and-punctuation"
          />

          <View style={styles.actions}>
            {onCancel && (
              <Pressable style={styles.secondary} onPress={onCancel}>
                <Text style={styles.secondaryText}>{t("back")}</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.primary, jumuaBad && styles.disabled]}
              disabled={jumuaBad}
              onPress={() =>
                onDone({
                  mosqueName: name.trim(),
                  jumua: parseClock(jumua) ? jumua.trim() : "",
                  configured: true,
                })
              }
            >
              <Text style={styles.primaryText}>{t("displayStart")}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const FILL = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };

const styles = StyleSheet.create({
  root: { ...FILL, backgroundColor: "rgba(3,12,9,0.94)" },
  scroll: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: "100%",
    maxWidth: 560,
    gap: 10,
    padding: 24,
    borderRadius: 18,
    backgroundColor: COLORS.raised,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
  },
  title: { color: COLORS.gold, fontSize: 22, fontFamily: FONTS.display },
  body: { color: TEXT.strong, fontSize: 14, fontFamily: FONTS.body, lineHeight: 22, marginBottom: 6 },
  label: { color: TEXT.soft, fontSize: 13, fontFamily: FONTS.body, marginTop: 4 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: TEXT.full,
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  inputBad: { borderColor: "#b0554f" },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  primary: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.gold,
  },
  primaryText: { color: COLORS.bg, fontSize: 16, fontFamily: FONTS.bodyMedium },
  secondary: {
    minHeight: 48,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
  },
  secondaryText: { color: COLORS.gold, fontSize: 16, fontFamily: FONTS.body },
  disabled: { opacity: 0.4 },
});
