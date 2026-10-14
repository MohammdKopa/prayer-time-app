import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import type { AyahRef } from "@/lib/quran/meta";
import { AMIRI_QURAN_TTF_BASE64 } from "@/lib/quran/font-data";
import {
  mushafShellHtml,
  pageContentHtml,
  type MushafMessage,
} from "@/lib/quran/mushaf-html";
import { PAGE_COUNT } from "@/lib/quran/pages";
import { COLORS, TEXT } from "@/theme";

// The mushaf, page by page (see lib/quran/mushaf-html.ts). The WebView holds
// every page slot; this component fills the ones it asks for and passes
// everything else in through injectJavaScript, so the document is built once
// and the reader never loses their page.

const FONT_SRC = `url(data:font/ttf;base64,${AMIRI_QURAN_TTF_BASE64}) format("truetype")`;

const PAGE_COLORS = {
  bg: COLORS.bg,
  text: TEXT.full,
  gold: TEXT.gold,
  soft: TEXT.soft,
  line: "#17271F",
  wash: "#1A2A1C",
  raised: COLORS.raised,
};

interface Props {
  /** The page to show; changing it turns to that page. */
  page: number;
  tajweed: boolean;
  fontSize: number;
  /** Bookmarked āyāt as "s:a". */
  marked: string[];
  /** The āyah whose action sheet is open, highlighted on the page. */
  selected: AyahRef | null;
  onPage: (page: number) => void;
  onAyah: (ref: AyahRef) => void;
}

export function MushafPager(props: Props) {
  const ref = useRef<WebView>(null);
  const { tajweed, marked, onPage, onAyah } = props;
  const markedSet = new Set(marked);

  // Built once: later changes go in through injectJavaScript.
  const [html] = useState(() => {
    const prefilled = new Map<number, string>();
    const opts = { tajweed: props.tajweed, marked: new Set(props.marked) };
    for (let n = props.page - 2; n <= props.page + 2; n++) {
      if (n >= 1 && n <= PAGE_COUNT) prefilled.set(n, pageContentHtml(n, opts));
    }
    return mushafShellHtml({
      startPage: props.page,
      fontSize: props.fontSize,
      prefilled,
      marked: props.marked,
      fontSrc: FONT_SRC,
      colors: PAGE_COLORS,
    });
  });

  const inject = (js: string) => ref.current?.injectJavaScript(`${js};true;`);

  // The page the document is on, so a prop change to the same page (the
  // reader reporting back) does not turn it again.
  const shown = useRef(props.page);
  useEffect(() => {
    if (props.page !== shown.current) {
      shown.current = props.page;
      inject(`window.__goto&&window.__goto(${props.page})`);
    }
  }, [props.page]);

  // Whether the document has loaded (anything injected before is dropped),
  // and whether its pages are drawn with tajweed colours.
  const loaded = useRef(false);
  const drawnTajweed = useRef(props.tajweed);
  useEffect(() => {
    if (!loaded.current || drawnTajweed.current === tajweed) return;
    drawnTajweed.current = tajweed;
    inject("window.__reset&&window.__reset()");
  }, [tajweed]);

  useEffect(() => {
    inject(`window.__setSize&&window.__setSize(${props.fontSize})`);
  }, [props.fontSize]);

  const markedKey = marked.join(",");
  useEffect(() => {
    inject(`window.__setMarked&&window.__setMarked(${JSON.stringify(markedKey ? markedKey.split(",") : [])})`);
  }, [markedKey]);

  const selectedKey = props.selected ? `${props.selected.surah}:${props.selected.ayah}` : null;
  useEffect(() => {
    inject(`window.__select&&window.__select(${JSON.stringify(selectedKey)})`);
  }, [selectedKey]);

  // The reader's settings and bookmarks load from storage a moment after the
  // document is built, often before it has loaded. Once it has, bring it up
  // to date with what is current now; without this a saved "tajweed on"
  // showed plain text until it was toggled off and on.
  const onLoadEnd = () => {
    loaded.current = true;
    inject(`window.__setSize&&window.__setSize(${props.fontSize})`);
    inject(`window.__setMarked&&window.__setMarked(${JSON.stringify(marked)})`);
    if (drawnTajweed.current !== tajweed) {
      drawnTajweed.current = tajweed;
      inject("window.__reset&&window.__reset()");
    }
  };

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: MushafMessage;
    try {
      msg = JSON.parse(e.nativeEvent.data) as MushafMessage;
    } catch {
      return;
    }
    if (msg.type === "page") {
      shown.current = msg.page;
      onPage(msg.page);
    } else if (msg.type === "ayah") {
      onAyah({ surah: msg.surah, ayah: msg.ayah });
    } else if (msg.type === "need") {
      const opts = { tajweed, marked: markedSet };
      const pages = msg.pages
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= PAGE_COUNT)
        .map((n) => [n, pageContentHtml(n, opts)]);
      if (pages.length) inject(`window.__fill(${JSON.stringify(pages)})`);
    }
  };

  return (
    <WebView
      ref={ref}
      style={styles.web}
      originWhitelist={["about:blank"]}
      source={{ html }}
      // The page needs nothing from the network or the disk; refuse any
      // navigation away from it.
      onShouldStartLoadWithRequest={(r) => r.url === "about:blank"}
      onMessage={onMessage}
      onLoadEnd={onLoadEnd}
      javaScriptEnabled
      domStorageEnabled={false}
      cacheEnabled={false}
      overScrollMode="never"
      bounces={false}
      textZoom={100}
      setSupportMultipleWindows={false}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: COLORS.bg },
});
