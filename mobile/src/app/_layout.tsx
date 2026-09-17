import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Nothing to load yet. Once fonts and stored settings exist, this waits
    // on them so the first frame is never a flash of the wrong thing.
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      {/*
        Clock-first: one screen, no tab bar. The app opens to the times and
        nothing else. Settings, qibla and the rest arrive as pushed routes,
        not as competition for the first screen.
      */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#07090F" },
        }}
      />
    </>
  );
}
