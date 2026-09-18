import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n, type Strings } from "@/lib/i18n";
import { COLORS, FONTS, TEXT } from "@/theme";

// A labelled bar, not a row of bare glyphs.
//
// The first version put ☼ and ◎ in the header with no words, and the only way
// to learn what they did was to tap them. An icon is a reminder of a thing you
// already know, never an explanation of a thing you do not. Every destination
// carries its name in the user's own language.

const META: Record<string, { glyph: string; key: keyof Strings }> = {
  index: { glyph: "◔", key: "times" },
  month: { glyph: "▦", key: "navMonth" },
  dua: { glyph: "❈", key: "navDua" },
  qibla: { glyph: "☉", key: "qibla" },
  more: { glyph: "☰", key: "navMore" },
};

// Derived from the Tabs component itself rather than imported from
// @react-navigation/bottom-tabs — expo-router ships its own descriptor types
// and the two do not structurally match.
type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

export function TabBar({ state, navigation }: TabBarProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {state.routes.map((route, index) => {
        const meta = META[route.name];
        if (!meta) return null;
        const focused = state.index === index;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={t(meta.key)}
            style={styles.item}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              // Tapping the tab you are already on should do nothing, not push
              // a second copy of it.
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          >
            <Text style={[styles.glyph, focused && styles.active]}>
              {meta.glyph}
            </Text>
            <Text
              style={[styles.label, focused && styles.active]}
              numberOfLines={1}
            >
              {t(meta.key)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.raised,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    // 48dp is the smallest target a thumb hits reliably; a nav bar is the
    // worst place to be stingy with it.
    minHeight: 48,
  },
  glyph: { color: TEXT.soft, fontSize: 19 },
  label: { color: TEXT.soft, fontSize: 11, fontFamily: FONTS.body },
  active: { color: COLORS.gold },
});
