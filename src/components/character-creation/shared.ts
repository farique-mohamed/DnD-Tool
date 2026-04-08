// ---------------------------------------------------------------------------
// Shared constants, types, and styles for character-creation components
// ---------------------------------------------------------------------------

// Unique race names sorted alphabetically — used by the character creation race dropdown.
// Dynamically derived from RACES so new races are automatically included.
import { RACES } from "@/lib/raceData";
export const CHARACTER_RACES: string[] = Array.from(
  new Set(RACES.map((r) => r.name)),
).sort();

export const ALIGNMENTS = [
  "Lawful Good", "Neutral Good", "Chaotic Good",
  "Lawful Neutral", "True Neutral", "Chaotic Neutral",
  "Lawful Evil", "Neutral Evil", "Chaotic Evil",
];

export const ABILITY_NAMES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
export type AbilityName = typeof ABILITY_NAMES[number];

export interface FormState {
  name: string;
  rulesSource: "PHB" | "XPHB";
  characterClass: string;
  race: string;
  alignment: string;
  background: string;
  backstory: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  maxHp: number;
  armorClass: number;
  speed: number;
  languages: string[];
}

export const ALL_SKILLS = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics",
  "Deception", "History", "Insight", "Intimidation",
  "Investigation", "Medicine", "Nature", "Perception",
  "Performance", "Persuasion", "Religion", "Sleight of Hand",
  "Stealth", "Survival",
];

// ---------------------------------------------------------------------------
// Shared inline styles
// ---------------------------------------------------------------------------

export const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#b8934a",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "8px",
  fontFamily: "'EB Garamond', 'Georgia', serif",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "rgba(30,15,5,0.9)",
  border: "1px solid rgba(201,168,76,0.4)",
  borderRadius: "6px",
  color: "#e8d5a3",
  fontSize: "14px",
  fontFamily: "'EB Garamond', 'Georgia', serif",
  outline: "none",
  boxSizing: "border-box",
};

export const sectionTitleStyle: React.CSSProperties = {
  color: "#c9a84c",
  fontSize: "13px",
  fontWeight: "bold",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  marginBottom: "16px",
  paddingBottom: "8px",
  borderBottom: "1px solid rgba(201,168,76,0.2)",
};

export const chipBaseStyle: React.CSSProperties = {
  borderRadius: "20px",
  padding: "4px 12px",
  fontSize: "11px",
  fontFamily: "'EB Garamond', 'Georgia', serif",
  cursor: "pointer",
  border: "1px solid",
  transition: "all 0.15s ease",
  userSelect: "none",
};

export const bonusBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(201,168,76,0.25)",
  border: "1px solid rgba(201,168,76,0.5)",
  borderRadius: "10px",
  padding: "1px 7px",
  fontSize: "10px",
  fontWeight: "bold",
  color: "#c9a84c",
  fontFamily: "'EB Garamond', 'Georgia', serif",
  lineHeight: "16px",
};
