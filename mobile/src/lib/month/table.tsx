// The table itself: one heading row and thirty-one day rows.
//
// WHY A PLAIN VIEW AND NOT A FLATLIST. Windowing is the reflex answer for a
// long list and the wrong one here. A month is at most 31 rows — about one
// and a half screens — and the share feature captures the whole table at
// once, which a windowed list cannot give you because the rows off screen do
// not exist. `removeClippedSubviews` is off for the same reason: on Android it
// detaches clipped children, and a detached row draws as a blank stripe in
// the captured image.
//
// What keeps scrolling smooth instead is that rows never re-render. Every row
// is a `memo` over primitives plus one `MonthDay` object, and that object
// comes straight out of the month cache in ./model.ts — same identity for as
// long as the month and the place are the same, so a parent re-render (the
// share button spinning, say) costs nothing below it.
//
// Two stylesheets are built at module load, one for narrow screens, rather
// than composing font sizes inline: it keeps every style object referentially
// stable, which is what lets the memo hold.

import { memo } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { PRAYER_ORDER, type PrayerName } from "@shared/prayer-engine";
import { toArabicIndic } from "@/lib/time";
import { COLORS, FONTS, TEXT } from "@/theme";

import { weekdayShort } from "./calendar-names";
import type { MonthDay, MonthTable } from "./model";
import type { Locale, StringKey, Translate } from "@/lib/i18n";


const COLUMN_KEY: Record<PrayerName, StringKey> = {
  fajr: "colFajr",
  sunrise: "colSunrise",
  dhuhr: "colDhuhr",
  asr: "colAsr",
  maghrib: "colMaghrib",
  isha: "colIsha",
};

/** Stable direction styles — new objects here would defeat the row memo. */
const LTR: ViewStyle = { flexDirection: "row" };
const RTL: ViewStyle = { flexDirection: "row-reverse" };

/** `${year}-${month}-${day}`, for comparing a row against today. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const num = (s: string | number, arabic: boolean) =>
  arabic ? toArabicIndic(String(s)) : String(s);

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

interface RowProps {
  day: MonthDay;
  isToday: boolean;
  locale: Locale;
  isRTL: boolean;
  compact: boolean;
}

export const MonthRow = memo(function MonthRow({
  day,
  isToday,
  locale,
  isRTL,
  compact,
}: RowProps) {
  const styles = compact ? COMPACT : REGULAR;
  const arabic = locale === "ar";

  return (
    <View
      style={[
        styles.row,
        isRTL ? RTL : LTR,
        day.isFriday && styles.rowFriday,
        isToday && styles.rowToday,
      ]}
    >
      <View style={styles.dateCell}>
        {/* Two Texts rather than one string: the number is what the eye
            scans down the column and the weekday is context beside it, so
            they want different weights — and a single-letter Arabic weekday
            butted against an Arabic-Indic numeral needs a real gap, not a
            space glyph. */}
        <View style={[styles.dateLine, isRTL ? RTL : LTR]}>
          <Text
            numberOfLines={1}
            style={[
              styles.weekday,
              day.isFriday && styles.fridayText,
              isToday && styles.todayText,
            ]}
          >
            {weekdayShort(day.weekday, locale)}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.dayNumber,
              day.isFriday && styles.fridayText,
              isToday && styles.todayText,
            ]}
          >
            {num(day.day, arabic)}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.dateHijri}>
          {day.hijri ? num(day.hijri.day, arabic) : "—"}
        </Text>
      </View>

      {PRAYER_ORDER.map((prayer) => (
        <Text
          key={prayer}
          numberOfLines={1}
          style={[
            styles.time,
            isToday && styles.todayText,
            // Sunrise is not a prayer; it is dimmed on the clock screen too.
            // On today's row it steps down within the gold rather than out of
            // it, so the row still reads as one block.
            prayer === "sunrise" &&
              (isToday ? styles.sunriseToday : styles.sunrise),
          ]}
        >
          {num(day.times[prayer], arabic)}
        </Text>
      ))}
    </View>
  );
});

interface RowsProps {
  table: MonthTable;
  /** `dayKey` of today, or null when today is in another month. */
  todayKey: string | null;
  locale: Locale;
  isRTL: boolean;
  compact: boolean;
}

export function MonthRows({
  table,
  todayKey,
  locale,
  isRTL,
  compact,
}: RowsProps) {
  return (
    <>
      {table.days.map((day) => (
        <MonthRow
          key={day.day}
          day={day}
          isToday={todayKey !== null && dayKey(day.date) === todayKey}
          locale={locale}
          isRTL={isRTL}
          compact={compact}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Heading
// ---------------------------------------------------------------------------

interface HeaderProps {
  t: Translate;
  isRTL: boolean;
  compact: boolean;
}

export function TableHeaderRow({ t, isRTL, compact }: HeaderProps) {
  const styles = compact ? COMPACT : REGULAR;
  return (
    <View style={[styles.row, styles.headerRow, isRTL ? RTL : LTR]}>
      <View style={styles.dateCell}>
        <Text numberOfLines={1} style={styles.colDayLabel}>
          {t("colDay")}
        </Text>
        {/* The هـ marks which calendar the second number in each date cell
            belongs to, without spending a whole column on it. */}
        <Text numberOfLines={1} style={styles.colHijri}>
          {t("hijriSuffix")}
        </Text>
      </View>
      {PRAYER_ORDER.map((prayer) => (
        <Text key={prayer} numberOfLines={1} style={styles.colLabel}>
          {t(COLUMN_KEY[prayer])}
        </Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

interface Metrics {
  time: number;
  day: number;
  small: number;
  label: number;
  dateWidth: number;
}

const makeStyles = (m: Metrics) =>
  StyleSheet.create({
    row: {
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.line,
    },
    // Jumu'ah. Quiet, because it marks four or five rows out of thirty-one
    // and a loud band would compete with today.
    rowFriday: { backgroundColor: "rgba(232,227,217,0.04)" },
    rowToday: {
      backgroundColor: COLORS.goldWash,
      borderBottomColor: COLORS.goldEdge,
    },

    headerRow: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.goldEdge,
    },

    dateCell: { width: m.dateWidth, alignItems: "center" },
    dateLine: { alignItems: "baseline", gap: 5 },
    weekday: {
      color: TEXT.soft,
      fontSize: m.small + 1,
      fontFamily: FONTS.body,
    },
    dayNumber: {
      color: TEXT.strong,
      fontSize: m.day,
      fontFamily: FONTS.displayRegular,
      fontVariant: ["tabular-nums"],
    },
    dateHijri: {
      color: TEXT.faint,
      fontSize: m.small,
      fontFamily: FONTS.displayRegular,
      fontVariant: ["tabular-nums"],
    },
    fridayText: { color: TEXT.goldSoft },
    todayText: { color: COLORS.gold },

    time: {
      flex: 1,
      textAlign: "center",
      color: TEXT.strong,
      fontSize: m.time,
      fontFamily: FONTS.displayRegular,
      fontVariant: ["tabular-nums"],
    },
    sunrise: { color: TEXT.faint },
    sunriseToday: { color: TEXT.goldSoft },

    colLabel: {
      flex: 1,
      textAlign: "center",
      color: TEXT.goldSoft,
      fontSize: m.label,
      fontFamily: FONTS.body,
    },
    // Same face and colour as the other headings, but no `flex` — this one
    // sits in the fixed-width date cell, which lays out vertically.
    colDayLabel: {
      color: TEXT.goldSoft,
      fontSize: m.label,
      fontFamily: FONTS.body,
    },
    colHijri: {
      color: TEXT.faint,
      fontSize: m.small,
      fontFamily: FONTS.body,
    },
  });

const REGULAR = makeStyles({
  time: 13,
  day: 15,
  small: 10,
  label: 11,
  dateWidth: 58,
});

// Below ~350dp of width the six time columns are under 45dp each, which is
// where "05:31" starts to clip.
const COMPACT = makeStyles({
  time: 12,
  day: 14,
  small: 9,
  label: 10,
  dateWidth: 50,
});

/** Width under which the table switches to the compact metrics. */
export const COMPACT_WIDTH = 350;
