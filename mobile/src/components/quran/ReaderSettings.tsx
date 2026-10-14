import { Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/lib/i18n";
import { FAMILY_COLOR, LEGEND } from "@/lib/quran/tajweed-colors";
import { COLORS, FONTS, TEXT } from "@/theme";

// The reader's settings sheet: text size and tajweed in one place, opened from
// the "Aa" button in the header. The tajweed legend is always shown while the
// colours are on, so nobody has to hunt for what a colour means.

export interface ReaderSettingsProps {
  visible: boolean;
  onClose: () => void;
  tajweed: { on: boolean; toggle: () => void };
  size: { size: number; canGrow: boolean; canShrink: boolean; step: (d: 1 | -1) => void };
}

const PREVIEW = "بِسۡمِ ٱللَّهِ";

export function ReaderSettings({ visible, onClose, tajweed, size }: ReaderSettingsProps) {
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const row = isRTL ? styles.rtl : styles.ltr;
  const align = { textAlign: isRTL ? ("right" as const) : ("left" as const) };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("quranSettingsClose")}
        />
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, align]} accessibilityRole="header">
            {t("quranSettingsTitle")}
          </Text>

          <Text style={[styles.section, align]}>{t("quranSettingsTextSize")}</Text>
          <View style={[styles.stepper, row]}>
            <StepButton
              label="A−"
              a11y={t("quranTextSmaller")}
              disabled={!size.canShrink}
              onPress={() => size.step(-1)}
              small
            />
            <View style={styles.preview}>
              <Text style={[styles.previewText, { fontSize: size.size }]} numberOfLines={1}>
                {PREVIEW}
              </Text>
            </View>
            <StepButton
              label="A+"
              a11y={t("quranTextLarger")}
              disabled={!size.canGrow}
              onPress={() => size.step(1)}
            />
          </View>

          <View style={styles.divider} />

          <View style={[styles.switchRow, row]}>
            <Text style={[styles.switchLabel, align]}>{t("tajweed")}</Text>
            <Switch
              value={tajweed.on}
              onValueChange={tajweed.toggle}
              trackColor={{ false: COLORS.line, true: COLORS.gold }}
              thumbColor={COLORS.bone}
              accessibilityRole="switch"
              accessibilityLabel={t("tajweed")}
              accessibilityState={{ checked: tajweed.on }}
            />
          </View>

          {tajweed.on && (
            <View style={styles.legend}>
              <Text style={[styles.legendTitle, align]}>{t("tajweedLegend")}</Text>
              {LEGEND.map(({ family, label }) => (
                <View key={family} style={[styles.legendRow, row]}>
                  <View style={[styles.swatch, { backgroundColor: FAMILY_COLOR[family] }]} />
                  <Text style={[styles.legendLabel, align]}>{t(label)}</Text>
                </View>
              ))}
              <Text style={[styles.note, align]}>{t("tajweedSource")}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

interface StepButtonProps {
  label: string;
  a11y: string;
  disabled: boolean;
  onPress: () => void;
  small?: boolean;
}

function StepButton({ label, a11y, disabled, onPress, small }: StepButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.stepButton, disabled && styles.stepDisabled]}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled }}
    >
      <Text style={[small ? styles.stepSmall : styles.stepLarge, disabled && styles.stepTextOff]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ltr: { flexDirection: "row" },
  rtl: { flexDirection: "row-reverse" },
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: COLORS.raised,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.goldEdge,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.goldEdge,
    marginBottom: 6,
  },
  title: { color: TEXT.full, fontSize: 18, fontFamily: FONTS.display },
  section: { color: TEXT.soft, fontSize: 13, fontFamily: FONTS.body },

  stepper: { alignItems: "center", gap: 12 },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.goldEdge,
    backgroundColor: COLORS.goldWash,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDisabled: { borderColor: COLORS.line, backgroundColor: "transparent" },
  stepSmall: { color: TEXT.gold, fontSize: 15, fontFamily: FONTS.body },
  stepLarge: { color: TEXT.gold, fontSize: 21, fontFamily: FONTS.body },
  stepTextOff: { color: TEXT.faint },
  preview: { flex: 1, height: 64, alignItems: "center", justifyContent: "center" },
  previewText: {
    color: TEXT.full,
    fontFamily: FONTS.mushaf,
    writingDirection: "rtl",
    textAlign: "center",
  },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.line },
  switchRow: { alignItems: "center", justifyContent: "space-between", minHeight: 48, gap: 12 },
  switchLabel: { flex: 1, color: TEXT.full, fontSize: 16, fontFamily: FONTS.body },

  legend: { gap: 8 },
  legendTitle: { color: TEXT.soft, fontSize: 13, fontFamily: FONTS.body },
  legendRow: { alignItems: "center", gap: 10 },
  swatch: { width: 14, height: 14, borderRadius: 4 },
  legendLabel: { flex: 1, color: TEXT.full, fontSize: 14, fontFamily: FONTS.body },
  note: { color: TEXT.soft, fontSize: 12, fontFamily: FONTS.body, marginTop: 4 },
});
