// The palette and type scale.
//
// Shared with the web app and the mosque's plasma display so the three read as
// one thing: near-black ground, bone text, gold for what matters now.

export const COLORS = {
  /** Deep emerald, near black. The mosque's plasma display uses the same
   *  ground, so the wall, the website and the phone read as one thing. */
  bg: "#05130D",
  /** One step up, for the pane that carries the next prayer. */
  raised: "#0A2117",
  bone: "#E8E3D9",
  gold: "#D9B871",
  /** Gold at low alpha — for fills and glows that must not become text. */
  goldWash: "rgba(217,184,113,0.10)",
  goldEdge: "rgba(217,184,113,0.32)",
  line: "rgba(232,227,217,0.10)",
} as const;

// Reem Kufi for anything that is read at a glance — prayer names, times, the
// clock. It is a display face with real character, and the whole point of
// choosing it is that the app should not look like the system default.
// Noto Naskh for running text, which Kufi is too stylised to carry.
export const FONTS = {
  display: "ReemKufi_600SemiBold",
  displayRegular: "ReemKufi_400Regular",
  body: "NotoNaskhArabic_400Regular",
  bodyMedium: "NotoNaskhArabic_500Medium",
} as const;

/**
 * Dimmed text colours — all fully OPAQUE, pre-blended against the background.
 *
 * Arabic text must never be dimmed with `opacity` OR with a translucent
 * colour. Android rasterises text glyph by glyph, so wherever connected
 * letters overlap, two semi-transparent edges blend twice and a pale seam
 * appears at the join — a faint white thread running through the word. Both
 * routes hit the same compositing path.
 *
 * These are the same visual weights, computed as solid colours over #07090F, so
 * every glyph is drawn once at full alpha and there is nothing to double.
 * If the background ever changes, recompute these — they are baked to it.
 *
 * `opacity` is still fine on non-text views: rules, dots, fills, arcs.
 */
export const TEXT = {
  full: COLORS.bone,
  strong: "#B6B5AC",
  soft: "#82857D",
  faint: "#5B625B",
  gold: COLORS.gold,
  goldSoft: "#9E8A55",
} as const;
