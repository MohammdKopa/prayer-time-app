import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import {
  NotoNaskhArabic_400Regular,
  NotoNaskhArabic_500Medium,
} from "@expo-google-fonts/noto-naskh-arabic";
import {
  ReemKufi_400Regular,
  ReemKufi_600SemiBold,
} from "@expo-google-fonts/reem-kufi";
import { useFonts, type FontSource } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

import { I18nProvider, useI18n } from "@/lib/i18n";
import { restoreDefaultOrientation } from "@/lib/orientation";
import { PlaceProvider } from "@/lib/place-context";
import { COLORS } from "@/theme";

SplashScreen.preventAutoHideAsync();
restoreDefaultOrientation();

// On Android the five faces are compiled into the APK by the expo-font config
// plugin (see app.json) under these same family names, so they are usable
// before any JS runs and the splash never waits on them. iOS has no such
// entry yet and still loads them here; an empty map resolves at once.
const RUNTIME_FONTS: Record<string, FontSource> =
  Platform.OS === "android"
    ? {}
    : {
        ReemKufi_400Regular,
        ReemKufi_600SemiBold,
        NotoNaskhArabic_400Regular,
        NotoNaskhArabic_500Medium,
        Amiri_400Regular,
      };

function Navigator() {
  const { ready } = useI18n();
  const [fontsLoaded, fontError] = useFonts(RUNTIME_FONTS);

  // A font failure must not leave the user staring at a splash screen forever.
  // Falling back to the system face is ugly; showing nothing is broken.
  const canRender = ready && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (canRender) SplashScreen.hideAsync();
  }, [canRender]);

  if (!canRender) return null;

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
          Clock-first: one screen. Everything else is a pushed route, so
          nothing competes with the times for the first thing you see.
        */}
        <Navigator />
      </PlaceProvider>
    </I18nProvider>
  );
}
