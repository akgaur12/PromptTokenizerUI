/**
 * Deterministic pastel palette for token blocks, à la the OpenAI tokenizer.
 *
 * Colors are assigned by token index (cycling through the palette) so the
 * coloring is stable across re-renders. We expose both a light and dark
 * variant tuned for legible foreground text.
 */

const PASTELS = [
  { bg: "#bae6fd", fg: "#0c4a6e", darkBg: "#0c4a6e", darkFg: "#bae6fd" }, // sky
  { bg: "#bbf7d0", fg: "#14532d", darkBg: "#14532d", darkFg: "#bbf7d0" }, // green
  { bg: "#fde68a", fg: "#713f12", darkBg: "#713f12", darkFg: "#fde68a" }, // amber
  { bg: "#fbcfe8", fg: "#831843", darkBg: "#831843", darkFg: "#fbcfe8" }, // pink
  { bg: "#ddd6fe", fg: "#4c1d95", darkBg: "#4c1d95", darkFg: "#ddd6fe" }, // violet
  { bg: "#fecaca", fg: "#7f1d1d", darkBg: "#7f1d1d", darkFg: "#fecaca" }, // red
  { bg: "#a5f3fc", fg: "#164e63", darkBg: "#164e63", darkFg: "#a5f3fc" }, // cyan
  { bg: "#fed7aa", fg: "#7c2d12", darkBg: "#7c2d12", darkFg: "#fed7aa" }, // orange
  { bg: "#d9f99d", fg: "#365314", darkBg: "#365314", darkFg: "#d9f99d" }, // lime
  { bg: "#c7d2fe", fg: "#312e81", darkBg: "#312e81", darkFg: "#c7d2fe" }, // indigo
];

export interface TokenColor {
  bg: string;
  fg: string;
  darkBg: string;
  darkFg: string;
}

export function getTokenColor(index: number): TokenColor {
  return PASTELS[index % PASTELS.length];
}
