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
  feats?: string[];
  toolProficiencies?: string[];
  entries?: unknown[];
  edition?: string;
  startingEquipment?: unknown[];
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

interface RawCopy {
  name: string;
  source: string;
  _mod?: unknown;
}

interface RawBackground {
  name: string;
  source: string;
  skillProficiencies?: RawSkillProfEntry[];
  _copy?: RawCopy;
  feats?: Array<Record<string, unknown>>;
  toolProficiencies?: Array<Record<string, unknown>>;
  entries?: unknown[];
  edition?: string;
  startingEquipment?: unknown[];
}

interface RawBackgroundFile {
  background: RawBackground[];
}

// ---------------------------------------------------------------------------
// Preferred sources (keep PHB/XPHB versions, skip others with same name)
// ---------------------------------------------------------------------------

const PREFERRED_SOURCES = new Set(["PHB", "XPHB"]);

// ---------------------------------------------------------------------------
// Parse feats from raw feats array
// ---------------------------------------------------------------------------

function parseFeats(rawFeats?: Array<Record<string, unknown>>): string[] | undefined {
  if (!rawFeats || rawFeats.length === 0) return undefined;

  const feats: string[] = [];
  for (const featObj of rawFeats) {
    for (const key of Object.keys(featObj)) {
      // Keys look like "aberrant dragonmark|efa" — extract before the pipe
      const name = key.split("|")[0]!;
      // Capitalize each word
      const capitalized = name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      feats.push(capitalized);
    }
  }
  return feats.length > 0 ? feats : undefined;
}

// ---------------------------------------------------------------------------
// Parse tool proficiencies from raw array
// ---------------------------------------------------------------------------

function parseToolProficiencies(rawTools?: Array<Record<string, unknown>>): string[] | undefined {
  if (!rawTools || rawTools.length === 0) return undefined;

  const tools: string[] = [];
  for (const toolObj of rawTools) {
    for (const [key, value] of Object.entries(toolObj)) {
      if (key === "choose" || key === "any") continue;
      if (value === true) {
        // Capitalize each word
        const capitalized = key
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        tools.push(capitalized);
      }
    }
  }
  return tools.length > 0 ? tools : undefined;
}

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
    feats: parseFeats(raw.feats),
    toolProficiencies: parseToolProficiencies(raw.toolProficiencies),
    entries: raw.entries,
    edition: raw.edition,
    startingEquipment: raw.startingEquipment,
  };
}

// ---------------------------------------------------------------------------
// Resolve _copy references so child backgrounds inherit skillProficiencies
// ---------------------------------------------------------------------------

function resolveCopySkills(backgrounds: RawBackground[]): void {
  // Build a lookup of all raw backgrounds by "name|source"
  const lookup = new Map<string, RawBackground>();
  for (const bg of backgrounds) {
    const key = `${bg.name}|${bg.source}`;
    lookup.set(key, bg);
  }

  // Recursively resolve skillProficiencies through _copy chains
  const resolving = new Set<string>(); // cycle guard

  function resolve(bg: RawBackground): RawSkillProfEntry[] | undefined {
    if (bg.skillProficiencies) return bg.skillProficiencies;
    if (!bg._copy) return undefined;

    const key = `${bg.name}|${bg.source}`;
    if (resolving.has(key)) return undefined; // prevent infinite loops
    resolving.add(key);

    const parentKey = `${bg._copy.name}|${bg._copy.source}`;
    const parent = lookup.get(parentKey);
    if (parent) {
      const inherited = resolve(parent);
      if (inherited) {
        bg.skillProficiencies = inherited;
      }
    }

    resolving.delete(key);
    return bg.skillProficiencies;
  }

  for (const bg of backgrounds) {
    if (bg._copy && !bg.skillProficiencies) {
      resolve(bg);
    }
  }
}

function buildBackgrounds(): Background[] {
  const file = backgroundsData as RawBackgroundFile;

  // Resolve _copy references before parsing
  resolveCopySkills(file.background);

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

export const BACKGROUND_SOURCES: string[] = [
  ...new Set(BACKGROUNDS.map((b) => b.source)),
].sort();
