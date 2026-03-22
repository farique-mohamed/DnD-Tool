// ---------------------------------------------------------------------------
// Raw JSON import
// ---------------------------------------------------------------------------
import backgroundsData from "../../data/backgrounds.json";

// ---------------------------------------------------------------------------
// Background interface
// ---------------------------------------------------------------------------

export interface Background {
  name: string;
  source: string;
  skillProficiencies: string[];
  skillChoices?: { from: string[]; count: number };
}

// ---------------------------------------------------------------------------
// All 18 standard D&D 5e skills (capitalized display names)
// ---------------------------------------------------------------------------

const ALL_SKILLS = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics",
  "Deception", "History", "Insight", "Intimidation",
  "Investigation", "Medicine", "Nature", "Perception",
  "Performance", "Persuasion", "Religion", "Sleight of Hand",
  "Stealth", "Survival",
];

// ---------------------------------------------------------------------------
// Skill key → display name mapping
// ---------------------------------------------------------------------------

function capitalizeSkill(key: string): string {
  // Handle multi-word skill keys like "animal handling", "sleight of hand"
  return key
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Raw shape (minimal — only fields we read)
// ---------------------------------------------------------------------------

interface RawSkillProfEntry {
  [key: string]: unknown;
  choose?: {
    from?: string[];
    count?: number;
  };
  any?: number;
}

interface RawBackground {
  name: string;
  source: string;
  skillProficiencies?: RawSkillProfEntry[];
}

interface RawBackgroundFile {
  background: RawBackground[];
}

// ---------------------------------------------------------------------------
// Preferred sources (keep PHB/XPHB versions, skip others with same name)
// ---------------------------------------------------------------------------

const PREFERRED_SOURCES = new Set(["PHB", "XPHB"]);

// ---------------------------------------------------------------------------
// Parse a single background entry
// ---------------------------------------------------------------------------

function parseBackground(raw: RawBackground): Background {
  const fixedSkills: string[] = [];
  let skillChoices: { from: string[]; count: number } | undefined;

  if (raw.skillProficiencies && raw.skillProficiencies.length > 0) {
    const entry = raw.skillProficiencies[0]!;

    // Check for "any" pattern (e.g. { any: 2 })
    if (typeof entry.any === "number") {
      skillChoices = { from: ALL_SKILLS, count: entry.any };
    } else {
      // Extract fixed skills (keys with value true)
      for (const [key, value] of Object.entries(entry)) {
        if (key === "choose") continue;
        if (value === true) {
          fixedSkills.push(capitalizeSkill(key));
        }
      }

      // Extract choose skills
      if (entry.choose) {
        const choose = entry.choose;
        const from = Array.isArray(choose.from)
          ? choose.from.map(capitalizeSkill)
          : [];
        const count = typeof choose.count === "number" ? choose.count : 1;
        if (from.length > 0) {
          skillChoices = { from, count };
        }
      }
    }
  }

  return {
    name: raw.name,
    source: raw.source,
    skillProficiencies: fixedSkills,
    skillChoices: skillChoices,
  };
}

// ---------------------------------------------------------------------------
// Build de-duplicated background list
// ---------------------------------------------------------------------------

function buildBackgrounds(): Background[] {
  const file = backgroundsData as RawBackgroundFile;
  const byName = new Map<string, Background>();

  for (const raw of file.background) {
    const existing = byName.get(raw.name);

    if (!existing) {
      byName.set(raw.name, parseBackground(raw));
    } else if (PREFERRED_SOURCES.has(raw.source) && !PREFERRED_SOURCES.has(existing.source)) {
      // Replace with PHB/XPHB version
      byName.set(raw.name, parseBackground(raw));
    }
    // Otherwise keep existing (first PHB/XPHB entry wins)
  }

  const result = Array.from(byName.values());
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const BACKGROUNDS: Background[] = buildBackgrounds();

export const BACKGROUND_NAMES: string[] = BACKGROUNDS.map((b) => b.name);
