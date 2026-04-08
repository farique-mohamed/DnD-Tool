// ---------------------------------------------------------------------------
// Monster Manual – shared theme constants
// ---------------------------------------------------------------------------

export const GOLD = "#c9a84c";
export const GOLD_MUTED = "#a89060";
export const GOLD_BRIGHT = "#e8d5a3";
export const GOLD_DIM = "rgba(201,168,76,0.15)";
export const GOLD_BORDER = "rgba(201,168,76,0.25)";
export const TEXT_DIM = "rgba(232,213,163,0.6)";
export const SERIF = "'EB Garamond', 'Georgia', serif";

export const LABEL: React.CSSProperties = {
  color: GOLD,
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "1.2px",
  fontFamily: SERIF,
  margin: 0,
  marginBottom: "4px",
};

export const BODY: React.CSSProperties = {
  color: GOLD_BRIGHT,
  fontSize: "13px",
  fontFamily: SERIF,
  margin: 0,
  lineHeight: "1.5",
};

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

export const CR_OPTIONS = [
  "All",
  "0",
  "1/8",
  "1/4",
  "1/2",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
];

const CR_COLOR: Record<string, string> = {
  "0": "#6aaa6a",
  "1/8": "#6aaa6a",
  "1/4": "#82b04a",
  "1/2": "#a8b040",
  "1": "#c9a84c",
  "2": "#c9a84c",
  "3": "#c99040",
  "4": "#c97832",
  "5": "#c96028",
  "6": "#c94820",
  "7": "#c83018",
  "8": "#c82010",
  "9": "#c01010",
  "10": "#b80808",
};

export function getCrColor(cr: string): string {
  return CR_COLOR[cr] ?? (parseFloat(cr) > 10 ? "#900000" : "#c9a84c");
}

export const PAGE_SIZE = 80;
