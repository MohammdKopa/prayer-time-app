import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { upcomingEvents } from "@/lib/calendar/events";
import { hijriMonthName } from "@/lib/hijri";
import { useI18n } from "@/lib/i18n";
import { gregorianMonthName } from "@/lib/month/calendar-names";
import { COLORS, FONTS, TEXT } from "@/theme";

// The Islamic calendar.
//
// One list, nearest date first, rather than a month grid — the month tab
// already owns "show me a wall calendar"; this screen only answers "what's
// coming up". Computed once per visit from `upcomingEvents`, which is itself
// cheap (a day-by-day scan under 400 iterations), so there is nothing here to
// memoise across renders beyond not re-running that scan on every one.

export default function CalendarScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();

  const events = useMemo(() => upcomingEvents(new Date()), []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{t("back")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("islamicCalendar")}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {events.map((item, index) => {
            const hijriDate = t("eventDateFormat", {
              day: item.hijri.day,
              month: hijriMonthName(item.hijri.month, locale),
              year: item.hijri.year,
            });
            const gregorianDate = t("eventDateFormat", {
              day: item.gregorian.getDate(),
              month: gregorianMonthName(item.gregorian.getMonth(), locale),
              year: item.gregorian.getFullYear(),
            });
            const relative =
              item.daysAway === 0
                ? t("today")
                : t("eventInDays", { days: item.daysAway });

            return (
              <View
                key={`${item.event.key}-${item.gregorian.getTime()}`}
                style={[
                  styles.row,
                  index === events.length - 1 && styles.rowLast,
                ]}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.name}>{t(item.event.key)}</Text>
                  <Text style={styles.dates}>
                    {hijriDate} {t("hijriSuffix")} · {gregorianDate}
                  </Text>
                  {item.event.observance && (
                    <Text style={styles.note}>{t("eventObservanceNote")}</Text>
                  )}
                </View>
                <Text style={styles.relative}>{relative}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  back: { color: COLORS.gold, fontSize: 16, fontFamily: FONTS.body },
  title: { color: TEXT.full, fontSize: 18, fontFamily: FONTS.display },
  spacer: { width: 44 },

  content: { padding: 20, paddingTop: 0, paddingBottom: 32 },
  card: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  rowLast: { borderBottomWidth: 0 },
  rowMain: { flex: 1, gap: 4 },
  name: { color: TEXT.full, fontSize: 16, fontFamily: FONTS.body },
  dates: {
    color: TEXT.soft,
    fontSize: 13,
    fontFamily: FONTS.body,
    fontVariant: ["tabular-nums"],
  },
  note: { color: TEXT.goldSoft, fontSize: 12, fontFamily: FONTS.body },
  relative: {
    color: COLORS.gold,
    fontSize: 13,
    fontFamily: FONTS.body,
    fontVariant: ["tabular-nums"],
    paddingTop: 2,
  },
});
