import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Modal, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { useI18n } from "@/lib/i18n";
import type { AyahRef } from "@/lib/quran/meta";
import { surahTitle } from "@/lib/quran/names";
import { ayahShareText } from "@/lib/quran/share-text";
import { surahMeta } from "@/lib/quran/text-utils";
import { COLORS, FONTS, TEXT } from "@/theme";

export interface AyahActionsProps {
  /** The āyah that was tapped; null keeps the sheet closed. */
  ayah: AyahRef | null;
  bookmarked: boolean;
  /** The parent toggles and shows its own toast. */
  onToggleBookmark: () => void;
  onClose: () => void;
}

const COPIED_MS = 700;

type IconName = "bookmark" | "copy" | "share";

// 24-unit line drawings at the tab icons' stroke width.
function ActionIcon({ name, filled }: { name: IconName; filled?: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {name === "bookmark" && (
        <Path
          d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"
          stroke={COLORS.gold}
          strokeWidth={1.7}
          strokeLinejoin="round"
          fill={filled ? COLORS.gold : "none"}
        />
      )}
      {name === "copy" && (
        <>
          <Path
            d="M9 9h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"
            stroke={COLORS.gold}
            strokeWidth={1.7}
            strokeLinejoin="round"
          />
          <Path
            d="M16 6V5a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h1"
            stroke={COLORS.gold}
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {name === "share" && (
        <Path
          d="M12 15V4M8 7.5L12 4l4 3.5M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7"
          stroke={COLORS.gold}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

export function AyahActions({ ayah, bookmarked, onToggleBookmark, onClose }: AyahActionsProps) {
  const { t, locale, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  // Show "Copied" for a moment, then close.
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => {
      setCopied(false);
      onClose();
    }, COPIED_MS);
    return () => clearTimeout(id);
  }, [copied, onClose]);

  const direction = isRTL ? "row-reverse" : "row";
  const align = isRTL ? "right" : "left";

  const title = ayah ? `${surahTitle(surahMeta(ayah.surah), locale)} ${ayah.surah}:${ayah.ayah}` : "";

  const bookmark = () => {
    onToggleBookmark();
    onClose();
  };

  const copy = async () => {
    if (!ayah) return;
    try {
      await Clipboard.setStringAsync(ayahShareText(ayah));
    } catch {
      onClose();
      return;
    }
    setCopied(true);
  };

  const share = async () => {
    if (!ayah) return;
    try {
      await Share.share({ message: ayahShareText(ayah) });
    } catch {
      // A share sheet that fails to open is not worth a message; just close.
    }
    onClose();
  };

  const rows: { key: string; icon: IconName; filled?: boolean; label: string; onPress: () => void }[] = [
    {
      key: "bookmark",
      icon: "bookmark",
      filled: bookmarked,
      label: t(bookmarked ? "quranActionUnbookmark" : "quranActionBookmark"),
      onPress: bookmark,
    },
    {
      key: "copy",
      icon: "copy",
      label: copied ? t("quranActionCopied") : t("quranActionCopy"),
      onPress: () => void copy(),
    },
    { key: "share", icon: "share", label: t("quranActionShare"), onPress: () => void share() },
  ];

  return (
    <Modal transparent animationType="slide" visible={ayah !== null} onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessible={false} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { textAlign: align }]} accessibilityRole="header">
            {title}
          </Text>
          {rows.map((row) => (
            <Pressable
              key={row.key}
              style={({ pressed }) => [styles.row, { flexDirection: direction }, pressed && styles.pressed]}
              onPress={row.onPress}
              disabled={copied}
              accessibilityRole="button"
              accessibilityLabel={row.label}
            >
              <ActionIcon name={row.icon} filled={row.filled} />
              <Text style={[styles.label, { textAlign: align }]}>{row.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.goldEdge,
    marginBottom: 14,
  },
  title: {
    color: TEXT.gold,
    fontSize: 18,
    fontFamily: FONTS.display,
    paddingBottom: 10,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  row: { alignItems: "center", gap: 16, minHeight: 52, paddingHorizontal: 4, borderRadius: 12 },
  pressed: { backgroundColor: COLORS.goldWash },
  label: { flex: 1, color: TEXT.full, fontSize: 16, fontFamily: FONTS.bodyMedium },
});
