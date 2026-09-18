import { Tabs } from "expo-router";

import { TabBar } from "@/components/TabBar";
import { COLORS } from "@/theme";

// Real tabs, not pushed pages.
//
// These were Stack routes before, which meant every destination was somewhere
// you went *into* and had to come back *out* of — with a back button and a
// growing history. Tabs are five places you switch between, each keeping its
// own state. Leaving the month view and returning should not reset it to
// today, and nothing here should ever stack on top of itself.

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="month" />
      <Tabs.Screen name="dua" />
      <Tabs.Screen name="qibla" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
