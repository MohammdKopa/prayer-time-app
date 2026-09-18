// The image people send to their family.
//
// It is a separate card rather than a screenshot of the screen, for three
// reasons: the screen's chrome (back arrow, month stepper) means nothing in a
// photo; the table is taller than the display, so a screenshot would cut it
// in half; and a shared image has to say for itself what it is — which place,
// which month, whose timing rules — because it will be looked at weeks later
// by someone who was not holding the phone.
//
// It renders offstage and only while a capture is running (see month.tsx), so
// it costs nothing until the share button is pressed. `collapsable={false}` is
// not optional: Android's view-hierarchy optimiser drops plain Views that only
// carry layout, and `captureRef` would then be handed a node that does not
// exist natively.

import type { Ref } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { COLORS, FONTS, TEXT } from "@/theme";

import type { MonthTable } from "./model";
import { MonthRows, TableHeaderRow } from "./table";
import type { Locale, Translate } from "@/lib/i18n";

interface Props {
  ref: Ref<View>;
  onLayout: (e: LayoutChangeEvent) => void;
  table: MonthTable;
  todayKey: string | null;
  /** "September 2026", already localised and numeralised. */
  heading: string;
  /** The Hijri month or months the same page covers, or null out of range. */
  hijriHeading: string | null;
  placeName: string;
  width: number;
  locale: Locale;
  isRTL: boolean;
  compact: boolean;
  t: Translate;
}

export function ShareCard({
  ref,
  onLayout,
  table,
  todayKey,
  heading,
  hijriHeading,
  placeName,
  width,
  locale,
  isRTL,
  compact,
  t,
}: Props) {
  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={onLayout}
      style={[styles.card, { width }]}
    >
      <View style={styles.head}>
        <Text style={styles.title}>{heading}</Text>
        {hijriHeading && <Text style={styles.hijri}>{hijriHeading}</Text>}
        <Text style={styles.place}>{placeName}</Text>
      </View>

      <TableHeaderRow t={t} isRTL={isRTL} compact={compact} />
      <MonthRows
        table={table}
        todayKey={todayKey}
        locale={locale}
        isRTL={isRTL}
        compact={compact}
      />

      <Text style={styles.foot}>
        {t("mosqueTiming")} · {t("appName")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Opaque: a PNG with an alpha channel is composited onto whatever the
  // receiving chat app uses for a bubble, and bone-on-nothing is unreadable.
  card: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
  },
  head: { alignItems: "center", gap: 2, paddingBottom: 14 },
  title: { color: COLORS.bone, fontSize: 22, fontFamily: FONTS.display },
  hijri: { color: TEXT.goldSoft, fontSize: 14, fontFamily: FONTS.body },
  place: { color: TEXT.soft, fontSize: 14, fontFamily: FONTS.bodyMedium },
  foot: {
    paddingTop: 12,
    textAlign: "center",
    color: TEXT.faint,
    fontSize: 11,
    fontFamily: FONTS.body,
  },
});
