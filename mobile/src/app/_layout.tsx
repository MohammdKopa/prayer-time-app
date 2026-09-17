import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { I18nProvider, useI18n } from "@/lib/i18n";
import { PlaceProvider } from "@/lib/place-context";
import { COLORS } from "@/theme";

SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { ready } = useI18n();

  useEffect(() => {
    // Hold the splash until the stored language is known, so the first frame
    // is never the wrong language followed by a swap.
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
        animation: "fade",
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <PlaceProvider>
        <StatusBar style="light" />
        {/*
          Clock-first: one screen. Settings is a pushed route, not a tab
          competing with the times for the first thing you see.
        */}
        <Navigator />
      </PlaceProvider>
    </I18nProvider>
  );
}
