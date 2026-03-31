// ---------------------------------------------------------------------------
// DnD Tool — Design tokens & shared style constants
// ---------------------------------------------------------------------------

// Gold palette
export const GOLD = "#c9a84c";
export const GOLD_GLOW = "rgba(201,168,76,0.5)";
export const GOLD_MUTED = "#a89060";
export const GOLD_DARK = "#8b6914";
export const GOLD_BRIGHT = "#e8d5a3";
export const GOLD_FADED = "#d4b896";

// Text
export const TEXT_DIM = "rgba(232,213,163,0.6)";

// Backgrounds
export const DARK_NAVY_1 = "#0d0d1a";
export const DARK_NAVY_2 = "#1a1a2e";
export const DARK_NAVY_3 = "#16213e";
export const CARD_BG = "rgba(15,8,3,0.88)";
export const INPUT_BG = "rgba(30,15,5,0.9)";

// Status colors
export const DANGER_RED = "#e74c3c";
export const SUCCESS_GREEN_BORDER = "#4a7c2a";
export const ERROR_RED_BORDER = "#8b2a1e";

// Font
export const SERIF = "'Georgia', 'Times New Roman', serif";

// ---------------------------------------------------------------------------
// Theme palettes (dark = original D&D theme, light = parchment/scroll theme)
// ---------------------------------------------------------------------------

export interface ThemePalette {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgGradient: string;
  cardBg: string;
  cardBgLight: string;
  inputBg: string;
  textPrimary: string;
  textSecondary: string;
  textDim: string;
  gold: string;
  goldGlow: string;
  goldDark: string;
  goldBright: string;
  goldFaded: string;
  goldMuted: string;
  borderColor: string;
  borderAccent: string;
  navBg: string;
  overlayBg: string;
}

export const darkPalette: ThemePalette = {
  bgPrimary: DARK_NAVY_1,
  bgSecondary: DARK_NAVY_2,
  bgTertiary: DARK_NAVY_3,
  bgGradient: `linear-gradient(135deg, ${DARK_NAVY_1} 0%, ${DARK_NAVY_2} 50%, ${DARK_NAVY_3} 100%)`,
  cardBg: "rgba(0,0,0,0.6)",
  cardBgLight: "rgba(0,0,0,0.4)",
  inputBg: INPUT_BG,
  textPrimary: GOLD_BRIGHT,
  textSecondary: GOLD_MUTED,
  textDim: TEXT_DIM,
  gold: GOLD,
  goldGlow: GOLD_GLOW,
  goldDark: GOLD_DARK,
  goldBright: GOLD_BRIGHT,
  goldFaded: GOLD_FADED,
  goldMuted: GOLD_MUTED,
  borderColor: "rgba(201,168,76,0.3)",
  borderAccent: "rgba(201,168,76,0.5)",
  navBg: "rgba(0,0,0,0.7)",
  overlayBg: "linear-gradient(135deg, rgba(13,13,26,0.97) 0%, rgba(26,26,46,0.97) 50%, rgba(22,33,62,0.97) 100%)",
};

export const lightPalette: ThemePalette = {
  bgPrimary: "#f5f0e8",
  bgSecondary: "#ede4d4",
  bgTertiary: "#e8dcc8",
  bgGradient: "linear-gradient(135deg, #f5f0e8 0%, #ede4d4 50%, #e8dcc8 100%)",
  cardBg: "rgba(255,248,235,0.95)",
  cardBgLight: "rgba(255,248,235,0.8)",
  inputBg: "rgba(255,248,235,0.9)",
  textPrimary: "#2c1810",
  textSecondary: "#5c4033",
  textDim: "rgba(44,24,16,0.5)",
  gold: "#8b6914",
  goldGlow: "rgba(139,105,20,0.3)",
  goldDark: "#6b5010",
  goldBright: "#2c1810",
  goldFaded: "#5c4033",
  goldMuted: "#7a6040",
  borderColor: "rgba(139,105,20,0.3)",
  borderAccent: "rgba(139,105,20,0.5)",
  navBg: "rgba(237,228,212,0.95)",
  overlayBg: "linear-gradient(135deg, rgba(245,240,232,0.98) 0%, rgba(237,228,212,0.98) 50%, rgba(232,220,200,0.98) 100%)",
};

// ---------------------------------------------------------------------------
// Common reusable style objects
// ---------------------------------------------------------------------------

export const baseTextStyle: React.CSSProperties = {
  color: GOLD_BRIGHT,
  fontFamily: SERIF,
  fontSize: "14px",
  lineHeight: "1.6",
};

export const headingStyle: React.CSSProperties = {
  color: GOLD,
  fontFamily: SERIF,
  fontWeight: "bold",
  letterSpacing: "2px",
  textTransform: "uppercase",
};

export const cardStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.6)",
  border: `2px solid ${GOLD}`,
  borderRadius: "12px",
  boxShadow: `0 0 20px ${GOLD_GLOW}`,
};

export const inputStyle: React.CSSProperties = {
  background: INPUT_BG,
  border: `1px solid rgba(201,168,76,0.4)`,
  borderRadius: "6px",
  color: GOLD_BRIGHT,
  fontFamily: SERIF,
  fontSize: "14px",
  padding: "10px 14px",
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
};
