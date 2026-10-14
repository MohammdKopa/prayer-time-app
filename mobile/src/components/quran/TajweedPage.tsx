import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import {
  surahPageHtml,
  type PageAyah,
  type PageInput,
  type PageMessage,
} from "@/lib/quran/tajweed-html";
import { COLORS, TEXT } from "@/theme";

// The tajweed view of one sūrah, drawn by the system browser engine (see
// lib/quran/tajweed-html.ts for why). Offline: the page is a string built in
// the app, and the font is the Amiri Quran file the app already ships — on
// Android the expo-font config plugin puts it in assets/fonts/.

// TODO(iOS): the font is embedded in the APK's assets on Android only. Before
// the iOS build ships tajweed, point fontSrc at the bundled file there.
const FONT_SRC =
  Platform.OS === "android"
    ? "url('file:///android_asset/fonts/AmiriQuran_400Regular.ttf')"
    : "local('Amiri Quran'), local('AmiriQuran-Regular')";

interface Props {
  surahName: string;
  subtitle: string;
  basmala: string | null;
  ayat: PageAyah[];
  fontSize: number;
  startAyah: number;
  bookmarked: number[];
  prev: PageInput["prev"];
  next: PageInput["next"];
  onVisibleAyah: (ayah: number) => void;
  onLongPressAyah: (ayah: number) => void;
  onNavigate: (surah: number) => void;
}

export function TajweedPage(props: Props) {
  const ref = useRef<WebView>(null);
  const { surahName, subtitle, basmala, ayat, prev, next } = props;

  // Size, bookmarks and the opening āyah only seed the page; later changes go
  // in through injectJavaScript so the sūrah is not rebuilt and the reader
  // keeps their place.
  const [seed] = useState(() => ({
    fontSize: props.fontSize,
    startAyah: props.startAyah,
    bookmarked: props.bookmarked,
  }));

  const html = useMemo(
    () =>
      surahPageHtml({
        surahName,
        subtitle,
        basmala,
        ayat,
        prev,
        next,
        fontSize: seed.fontSize,
        startAyah: seed.startAyah,
        bookmarked: seed.bookmarked,
        fontSrc: FONT_SRC,
        colors: {
          bg: COLORS.bg,
          text: TEXT.full,
          gold: TEXT.gold,
          soft: TEXT.soft,
          line: "#17271F",
          wash: "#1A2A1C",
        },
      }),
    [surahName, subtitle, basmala, ayat, prev, next, seed],
  );

  useEffect(() => {
    ref.current?.injectJavaScript(`window.__setSize&&window.__setSize(${props.fontSize});true;`);
  }, [props.fontSize]);

  const markedKey = props.bookmarked.join(",");
  useEffect(() => {
    ref.current?.injectJavaScript(
      `window.__setMarked&&window.__setMarked([${markedKey}]);true;`,
    );
  }, [markedKey]);

  const { onVisibleAyah, onLongPressAyah, onNavigate } = props;
  const onMessage = (e: WebViewMessageEvent) => {
    let msg: PageMessage;
    try {
      msg = JSON.parse(e.nativeEvent.data) as PageMessage;
    } catch {
      return;
    }
    if (msg.type === "visible") onVisibleAyah(msg.ayah);
    else if (msg.type === "longpress") onLongPressAyah(msg.ayah);
    else if (msg.type === "nav") onNavigate(msg.surah);
  };

  return (
    <WebView
      ref={ref}
      style={styles.web}
      originWhitelist={["about:blank", "file://*"]}
      source={{ html, baseUrl: Platform.OS === "android" ? "file:///android_asset/" : undefined }}
      allowFileAccess
      // The page needs nothing from the network; refuse any navigation.
      onShouldStartLoadWithRequest={(r) => r.url === "about:blank" || r.url.startsWith("file:")}
      onMessage={onMessage}
      javaScriptEnabled
      domStorageEnabled={false}
      cacheEnabled={false}
      overScrollMode="never"
      showsVerticalScrollIndicator
      textZoom={100}
      setSupportMultipleWindows={false}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: COLORS.bg },
});
