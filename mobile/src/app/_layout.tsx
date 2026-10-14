import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { AmiriQuran_400Regular } from "@expo-google-fonts/amiri-quran";
import {
  NotoNaskhArabic_400Regular,
  NotoNaskhArabic_500Medium,
} from "@expo-google-fonts/noto-naskh-arabic";
import {
  ReemKufi_400Regular,
  ReemKufi_600SemiBold,
} from "@expo-google-fonts/reem-kufi";
import { useFonts, type FontSource } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { I18nProvider, useI18n } from "@/lib/i18n";
import { urlFromData } from "@/lib/notification-links";
import { restoreDefaultOrientation } from "@/lib/orientation";
import { PlaceProvider } from "@/lib/place-context";
import { countOpenAndMaybeAsk } from "@/lib/review-prompt-run";
import { COLORS } from "@/theme";

SplashScreen.preventAutoHideAsync();
restoreDefaultOrientation();

// On Android the six faces are compiled into the APK by the expo-font config
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
        AmiriQuran_400Regular,
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

  // Once per cold start; the effect has no deps so a re-render never recounts.
  useEffect(() => {
    void countOpenAndMaybeAsk();
  }, []);

  // A tapped notification opens its screen. The hook covers both a cold start
  // (the tap launched the app) and a tap while backgrounded. Held back until
  // the navigator exists, and each response object is handled once: the hook keeps
  // returning the last one on every re-render. Notifications scheduled before
  // `data.url` existed carry none and just open the app.
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<unknown>(null);
  useEffect(() => {
    if (!canRender || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }
    if (handled.current === response) return;
    handled.current = response;
    const url = urlFromData(response.notification.request.content.data);
    // Typed routes are generated on the next dev-server start, so the new
    // /quran-continue is not in the union yet; the url is allowlisted above.
    if (url) router.navigate(url as Href);
  }, [canRender, response, router]);

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
