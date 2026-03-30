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
