import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useI18n } from "@/lib/i18n";
import {
  AFTER_PRAYER,
  AFTER_PRAYER_STAGES,
  FREE_TARGET,
  TASBIH_TARGETS,
  hapticReset,
  hapticSelect,
  hapticTap,
  hapticTarget,
  useTasbih,
  type TasbihTarget,
} from "@/lib/tasbih";
import { COLORS, FONTS } from "@/theme";

// Tasbih.
//
// The counter IS the screen: the whole body is the tap target, so counting is
// done with the thumb wherever it happens to rest, eyes closed if you like.
// A small button in the middle of a dark screen would mean aiming, and aiming
// is attention spent on the phone instead of on the dhikr.
//
// Everything that is not counting — picking a target, resetting — lives in a
// strip at the bottom, outside the tap area, so those taps can never be
// mistaken for a count.
//
// "After prayer" is the guided set, 33 · 33 · 34: the phrase to say sits above
// the count and changes by itself, with the round-complete buzz at each change,
// so it can be followed eyes closed. The Adhkar tab opens it directly
// (/tasbih?mode=afterPrayer).
//
// Reset asks twice. A session can be hundreds long; one stray thumb must not
// be able to end it. The confirmation is inline and expires on its own rather
// than a modal, which would interrupt more than it protects.

const CIRCLE = 260;
const CONFIRM_TIMEOUT_MS = 4000;

export default function TasbihScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { t, locale } = useI18n();
  const {
    ready,
    count,
    target,
    inRound,
    rounds,
    progress,
    atTarget,
    increment,
    reset,
    chooseTarget,
    afterPrayer,
  } = useTasbih();

  // Opened from the after-prayer section: switch to the guided set once the
  // stored session has loaded (switching resets it to the first phrase).
  const modeApplied = useRef(false);
  useEffect(() => {
    if (!ready || modeApplied.current) return;
    modeApplied.current = true;
    if (mode === "afterPrayer" && target !== AFTER_PRAYER) chooseTarget(AFTER_PRAYER);
  }, [ready, mode, target, chooseTarget]);

  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(
    () => () => {
      if (confirmTimer.current !== null) clearTimeout(confirmTimer.current);
    },
    [],
  );

  const cancelConfirm = useCallback(() => {
    if (confirmTimer.current !== null) {
      clearTimeout(confirmTimer.current);
      confirmTimer.current = null;
    }
    setConfirming(false);
  }, []);

  const onTap = useCallback(() => {
    if (!ready) return;
    // A tap on the count is also an answer of "no" to a pending reset.
    cancelConfirm();

    const reached = increment();
    // Every tap is felt; the end of a round is felt differently, so the round
    // can be counted without looking at the screen at all.
    if (reached) hapticTarget();
    else hapticTap();

    pulse.setValue(0);
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [ready, cancelConfirm, increment, pulse]);

  const onReset = useCallback(() => {
    if (confirming) {
      cancelConfirm();
      reset();
      hapticReset();
      return;
    }
    setConfirming(true);
    hapticSelect();
    confirmTimer.current = setTimeout(() => {
      confirmTimer.current = null;
      setConfirming(false);
    }, CONFIRM_TIMEOUT_MS);
  }, [confirming, cancelConfirm, reset]);

  const onChooseTarget = useCallback(
    (next: TasbihTarget) => {
      cancelConfirm();
      if (next === target) return;
      chooseTarget(next);
      hapticSelect();
    },
    [cancelConfirm, chooseTarget, target],
  );
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const counting = target !== FREE_TARGET;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("back")}
        >
          <Text style={styles.back}>{t("back")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("tasbih")}</Text>
        <View style={styles.spacer} />
      </View>

      <Pressable
        style={styles.body}
        onPress={onTap}
        accessibilityRole="button"
        accessibilityLabel={t("tasbihHint")}
        accessibilityValue={{ text: String(count) }}
      >
        <View style={[styles.column, !ready && styles.hidden]}>
          {afterPrayer && (
            <View style={styles.phraseBlock}>
              {/* Keyed by stage: changing the text in place, Android kept the
                  previous phrase's line metrics and drew اللهُ أَكْبَرُ sunk
                  and clipped. A fresh Text per phrase measures itself. */}
              <Text key={afterPrayer.stage} style={styles.phrase}>
                {AFTER_PRAYER_STAGES[afterPrayer.stage].arabic}
              </Text>
              <View style={styles.stages}>
                {AFTER_PRAYER_STAGES.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.stageDot, i <= afterPrayer.stage && styles.stageDotOn]}
                  />
                ))}
              </View>
            </View>
          )}
          <Animated.View
            style={[
              styles.circle,
              atTarget && styles.circleAtTarget,
              { transform: [{ scale }] },
            ]}
          >
            <Text style={styles.count}>{String(count)}</Text>
          </Animated.View>

          {counting && (
            <>
              <View style={styles.track}>
                <View
                  style={[styles.fill, { width: `${progress * 100}%` }]}
                />
              </View>
              <Text style={styles.progress}>
                {t("tasbihProgress", {
                  count: inRound,
                  target: afterPrayer ? afterPrayer.stageCount : target,
                })}
              </Text>
            </>
          )}

          {counting && !afterPrayer && rounds > 0 && (
            <Text style={styles.rounds}>
              {t("tasbihRounds", { rounds })}
            </Text>
          )}

          <Text style={[styles.hint, atTarget && styles.hintAtTarget]}>
            {afterPrayer?.done
              ? t("tasbihAfterPrayerDone")
              : atTarget && !afterPrayer
                ? t("tasbihComplete")
                : t("tasbihHint")}
          </Text>
        </View>
      </Pressable>

      <View style={styles.controls}>
        <View style={styles.targets}>
          {TASBIH_TARGETS.map((value) => {
            const active = value === target;
            return (
              <Pressable
                key={value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onChooseTarget(value)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {value === FREE_TARGET
                    ? t("tasbihFree")
                    : value === AFTER_PRAYER
                      ? t("tasbihAfterPrayer")
                      : String(value)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.reset} onPress={onReset} accessibilityRole="button">
          <Text
            style={[styles.resetText, confirming && styles.resetTextConfirming]}
          >
            {confirming
              ? t("tasbihResetConfirm")
              : t("tasbihReset")}
          </Text>
        </Pressable>
      </View>
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
  back: { color: COLORS.gold, fontSize: 16 },
  title: { color: COLORS.bone, fontSize: 18 },
  spacer: { width: 44 },

  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  column: { alignItems: "center", gap: 18 },
  hidden: { opacity: 0 },

  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
  },
  circleAtTarget: { borderColor: COLORS.gold },
  // Opaque gold, never dimmed: dimmed Arabic on Android shows seams at joins.
  phraseBlock: { alignItems: "center", gap: 10 },
  phrase: {
    color: COLORS.gold,
    fontSize: 34,
    lineHeight: 64,
    paddingHorizontal: 12,
    fontFamily: FONTS.quran,
    textAlign: "center",
  },
  stages: { flexDirection: "row", gap: 8 },
  stageDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.line },
  stageDotOn: { backgroundColor: COLORS.gold },
  count: {
    color: COLORS.bone,
    fontSize: 88,
    fontVariant: ["tabular-nums"],
  },

  track: {
    width: CIRCLE * 0.7,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.line,
    overflow: "hidden",
  },
  fill: { height: 2, borderRadius: 1, backgroundColor: COLORS.gold },
  progress: {
    color: COLORS.bone,
    opacity: 0.45,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    marginTop: -8,
  },
  rounds: {
    color: COLORS.bone,
    opacity: 0.35,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    marginTop: -10,
  },
  hint: {
    color: COLORS.bone,
    opacity: 0.35,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  hintAtTarget: { color: COLORS.gold, opacity: 0.9 },

  controls: { padding: 20, gap: 14, alignItems: "center" },
  // Four chips on one row in every language ("Nach dem Gebet", "Namazdan
  // sonra" are the long ones); wrapping stays as the fallback for huge text.
  targets: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  chip: {
    minWidth: 56,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: "center",
  },
  chipActive: { borderColor: COLORS.gold },
  chipText: {
    color: COLORS.bone,
    opacity: 0.55,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  chipTextActive: { color: COLORS.gold, opacity: 1 },

  reset: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
    justifyContent: "center",
  },
  resetText: { color: COLORS.bone, opacity: 0.4, fontSize: 15 },
  resetTextConfirming: { color: COLORS.gold, opacity: 1 },
});
