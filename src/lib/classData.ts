import artificerClass from "../../data/class/class-artificer.json";
import barbarianClass from "../../data/class/class-barbarian.json";
import bardClass from "../../data/class/class-bard.json";
import clericClass from "../../data/class/class-cleric.json";
import druidClass from "../../data/class/class-druid.json";
import fighterClass from "../../data/class/class-fighter.json";
import monkClass from "../../data/class/class-monk.json";
import mysticClass from "../../data/class/class-mystic.json";
import paladinClass from "../../data/class/class-paladin.json";
import rangerClass from "../../data/class/class-ranger.json";
import rogueClass from "../../data/class/class-rogue.json";
import sidekickClass from "../../data/class/class-sidekick.json";
import sorcererClass from "../../data/class/class-sorcerer.json";
import warlockClass from "../../data/class/class-warlock.json";
import wizardClass from "../../data/class/class-wizard.json";

import artificerFluff from "../../data/class/fluff-class-artificer.json";
import barbarianFluff from "../../data/class/fluff-class-barbarian.json";
import bardFluff from "../../data/class/fluff-class-bard.json";
import clericFluff from "../../data/class/fluff-class-cleric.json";
import druidFluff from "../../data/class/fluff-class-druid.json";
import fighterFluff from "../../data/class/fluff-class-fighter.json";
import monkFluff from "../../data/class/fluff-class-monk.json";
import mysticFluff from "../../data/class/fluff-class-mystic.json";
import paladinFluff from "../../data/class/fluff-class-paladin.json";
import rangerFluff from "../../data/class/fluff-class-ranger.json";
import rogueFluff from "../../data/class/fluff-class-rogue.json";
import sidekickFluff from "../../data/class/fluff-class-sidekick.json";
import sorcererFluff from "../../data/class/fluff-class-sorcerer.json";
import warlockFluff from "../../data/class/fluff-class-warlock.json";
import wizardFluff from "../../data/class/fluff-class-wizard.json";

export interface SkillChoices {
  count: number;
  from: string[];
}

export interface LevelFeature {
  level: number;
  featureName: string;
  isSubclassFeature: boolean;
}

export interface SubclassInfo {
  name: string;
  shortName: string;
  source: string;
  features: LevelFeature[];
}

export interface FeatureEntry {
  type: "text" | "list" | "section" | "inset" | "table";
  text?: string; // for "text" type
  items?: string[]; // for "list" type
  name?: string; // for "section" / "inset"
  children?: FeatureEntry[]; // for "section" / "inset"
  caption?: string; // for "table"
  colLabels?: string[]; // for "table"
  rows?: string[][]; // for "table"
}

export interface FeatureDescription {
  name: string;
  level: number;
  entries: FeatureEntry[];
  isSubclassFeature: boolean;
  subclassName?: string; // only set for subclass features
}

export interface ClassInfo {
  name: string;
  source: string;
  hitDie: string;
  savingThrows: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  skillChoices: SkillChoices;
  description: string;
  levelFeatures: LevelFeature[];
  subclassTitle: string;
  subclasses: SubclassInfo[];
  featureDescriptions: FeatureDescription[];
}

const ABILITY_NAMES: Record<string, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type RawClassFeatureEntry =
  | string
  | { classFeature: string; gainSubclassFeature?: boolean };

type RawClassEntry = {
  name: string;
  source: string;
  hd?: { number: number; faces: number };
  proficiency?: string[];
  startingProficiencies?: {
    armor?: unknown[];
    weapons?: unknown[];
    skills?: unknown[];
  };
  classFeatures?: RawClassFeatureEntry[];
  subclassTitle?: string;
};

type RawFluffEntry = {
  name: string;
  entries?: Array<{
    type: string;
    name: string;
    entries?: unknown[];
  }>;
};

type RawSubclassEntry = {
  name: string;
  shortName?: string;
  source: string;
  className: string;
  subclassFeatures?: string[];
};

type RawClassFile = {
  class: RawClassEntry[];
  subclass?: RawSubclassEntry[];
  classFeature?: Array<{
    name: string;
    level: number;
    entries?: unknown[];
    source?: string;
    classSource?: string;
  }>;
  subclassFeature?: Array<{
    name: string;
    level: number;
    subclassShortName?: string;
    entries?: unknown[];
    source?: string;
    classSource?: string;
  }>;
};
type RawFluffFile = { classFluff: RawFluffEntry[] };

// ---------------------------------------------------------------------------
// Tag stripping
// ---------------------------------------------------------------------------

/**
 * Strips all {@tag ...} template tags from a string.
 * Rules:
 *   {@item name|source|display}  -> display (or name)
 *   {@i text}                    -> text
 *   {@b text}                    -> text
 *   {@dice expr|...|label}       -> label (or expr)
 *   {@filter display|...}        -> display
 *   {@spell name|...}            -> name
 *   {@condition name|...}        -> name
 *   {@classFeature name|...}     -> name
 *   {@variantrule name|...}      -> name
 *   anything else                -> first argument before |
 */
export function stripTags(text: string): string {
  // Run in a loop to handle nested tags like {@i text {@variantrule ...}}
  let result = text;
  let prev: string;
  do {
    prev = result;
    result = result.replace(
      /\{@(\w+)\s([^}]*)\}/g,
      (_match, tag: string, body: string) => {
        const parts = body.split("|");
        switch (tag) {
          case "i":
          case "italic":
            return body;
          case "b":
          case "bold":
            return body;
          case "item":
            // {@item name|source|display} — use display (index 2) or name (index 0)
            return (parts[2] ?? parts[0] ?? body).trim();
          case "dice":
          case "damage":
          case "hit":
          case "d20":
            // Use label (last part) if available, else first (the expression)
            return (
              parts[parts.length - 1] !== parts[0]
                ? parts[parts.length - 1]
                : (parts[0] ?? body)
            ).trim();
          case "filter":
            // {@filter display|...} — first part is display label
            return (parts[0] ?? body).trim();
          default:
            // Many tags follow name|source|display convention — prefer display (index 2), else name (index 0)
            return (parts[2] ?? parts[0] ?? body).trim();
        }
      },
    );
  } while (result !== prev);
  return result;
}

// ---------------------------------------------------------------------------
// Entry parsing
// ---------------------------------------------------------------------------

/**
 * Converts a raw mixed-content entries array to a typed FeatureEntry[].
 */
export function parseEntries(rawEntries: unknown[]): FeatureEntry[] {
  const result: FeatureEntry[] = [];

  for (const raw of rawEntries) {
    if (typeof raw === "string") {
      const cleaned = stripTags(raw);
      if (cleaned.trim()) {
        result.push({ type: "text", text: cleaned });
      }
    } else if (typeof raw === "object" && raw !== null) {
      const obj = raw as Record<string, unknown>;
      const type = typeof obj.type === "string" ? obj.type : null;

      if (type === "list") {
        const rawItems = Array.isArray(obj.items) ? obj.items : [];
        const items: string[] = [];
        for (const item of rawItems) {
          if (typeof item === "string") {
            items.push(stripTags(item));
          } else if (typeof item === "object" && item !== null) {
            const itemObj = item as Record<string, unknown>;
            // Some items have an "entry" or "name" field
            if (typeof itemObj.entry === "string") {
              items.push(stripTags(itemObj.entry));
            } else if (typeof itemObj.name === "string") {
              const namePart = stripTags(itemObj.name);
              const entryPart =
                typeof itemObj.entries === "object" &&
                Array.isArray(itemObj.entries)
                  ? parseEntries(itemObj.entries as unknown[])
                      .map((e) => e.text ?? "")
                      .join(" ")
                  : "";
              items.push(entryPart ? `${namePart}: ${entryPart}` : namePart);
            }
          }
        }
        if (items.length > 0) {
          result.push({ type: "list", items });
        }
      } else if (type === "entries") {
        const name =
          typeof obj.name === "string" ? stripTags(obj.name) : undefined;
        const children = Array.isArray(obj.entries)
          ? parseEntries(obj.entries as unknown[])
          : [];
        if (children.length > 0) {
          result.push({ type: "section", name, children });
        }
      } else if (type === "inset" || type === "insetReadaloud") {
        const name =
          typeof obj.name === "string" ? stripTags(obj.name) : undefined;
        const children = Array.isArray(obj.entries)
          ? parseEntries(obj.entries as unknown[])
          : [];
        if (children.length > 0) {
          result.push({ type: "inset", name, children });
        }
      } else if (type === "table") {
        const caption =
          typeof obj.caption === "string" ? stripTags(obj.caption) : undefined;
        const colLabels = Array.isArray(obj.colLabels)
          ? (obj.colLabels as string[]).map((l) => stripTags(String(l)))
          : [];
        const rows: string[][] = [];
        if (Array.isArray(obj.rows)) {
          for (const row of obj.rows as unknown[][]) {
            if (Array.isArray(row)) {
              rows.push(row.map((cell) => stripTags(String(cell))));
            }
          }
        }
        if (colLabels.length > 0 || rows.length > 0) {
          result.push({ type: "table", caption, colLabels, rows });
        }
      } else if (type === "statblock") {
        // Render statblock references as an inset note
        const sbName = typeof obj.name === "string" ? obj.name : "";
        if (sbName) {
          result.push({
            type: "inset",
            name: sbName,
            children: [
              {
                type: "text",
                text: `See the ${sbName} statblock for details.`,
              },
            ],
          });
        }
      } else if (
        type === "refClassFeature" ||
        type === "refSubclassFeature" ||
        type === "options" ||
        type === "abilityDc" ||
        type === "abilityAttackMod" ||
        type === "bonus" ||
        type === "bonusSpeed"
      ) {
        // Skip reference/structural types — they're resolved elsewhere
      } else if (type === "section") {
        // Top-level section — recurse
        const children = Array.isArray(obj.entries)
          ? parseEntries(obj.entries as unknown[])
          : [];
        const name =
          typeof obj.name === "string" ? stripTags(obj.name) : undefined;
        if (children.length > 0) {
          result.push({ type: "section", name, children });
        }
      }
      // Any other unknown types: skip
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Proficiency/armor/weapon/skill extraction (unchanged)
// ---------------------------------------------------------------------------

function extractArmorProficiencies(armor: unknown[] | undefined): string[] {
  if (!armor) return [];
  return armor
    .map((a) => {
      if (typeof a === "string") {
        if (a.toLowerCase().includes("shield")) return "shields";
        return capitalize(a);
      }
      if (typeof a === "object" && a !== null) {
        const obj = a as Record<string, unknown>;
        if (typeof obj.proficiency === "string") {
          return capitalize(obj.proficiency);
        }
        if (typeof obj.full === "string") {
          return "Shields";
        }
      }
      return null;
    })
    .filter((a): a is string => a !== null);
}

function extractWeaponProficiencies(weapons: unknown[] | undefined): string[] {
  if (!weapons) return [];
  return weapons
    .map((w) => {
      if (typeof w === "string") {
        if (w === "simple" || w === "martial")
          return capitalize(w) + " weapons";
        const tagMatch = /\{@item [^|]+\|[^|]*\|([^}]+)\}/.exec(w);
        if (tagMatch) return capitalize(tagMatch[1]);
        const nameMatch = /\{@item ([^|]+)/.exec(w);
        if (nameMatch) return capitalize(nameMatch[1]);
        return capitalize(w);
      }
      if (typeof w === "object" && w !== null) {
        const obj = w as Record<string, unknown>;
        if (typeof obj.proficiency === "string" && obj.optional === true) {
          return capitalize(obj.proficiency) + " (optional)";
        }
        if (typeof obj.proficiency === "string") {
          return capitalize(obj.proficiency);
        }
      }
      return null;
    })
    .filter((w): w is string => w !== null);
}

function extractSkillChoices(skills: unknown[] | undefined): SkillChoices {
  if (!skills || skills.length === 0) {
    return { count: 0, from: [] };
  }
  const entry = skills[0];
  if (typeof entry === "object" && entry !== null) {
    const obj = entry as Record<string, unknown>;
    if (obj.choose && typeof obj.choose === "object") {
      const choose = obj.choose as Record<string, unknown>;
      const count = typeof choose.count === "number" ? choose.count : 0;
      const from = Array.isArray(choose.from)
        ? (choose.from as string[]).map(capitalize)
        : [];
      return { count, from };
    }
    if (typeof obj.any === "number") {
      return { count: obj.any, from: ["Any skill"] };
    }
  }
  return { count: 0, from: [] };
}

function extractDescription(fluffFile: RawFluffFile): string {
  const fluff = fluffFile.classFluff[0];
  if (!fluff?.entries) return "";
  const section = fluff.entries[0];
  if (!section?.entries) return "";
  const firstString = section.entries.find((e) => typeof e === "string");
  return typeof firstString === "string" ? firstString : "";
}

// ---------------------------------------------------------------------------
// Class feature string parsing (unchanged)
// ---------------------------------------------------------------------------

function parseClassFeatureString(
  raw: string,
): { featureName: string; level: number } | null {
  const parts = raw.split("|");
  const featureName = parts[0] ?? "";
  const levelStr = parts[3] ?? "";
  const level = parseInt(levelStr, 10);
  if (!featureName || isNaN(level)) return null;
  return { featureName, level };
}

function parseSubclassFeatureString(
  raw: string,
): { featureName: string; level: number } | null {
  const parts = raw.split("|");
  const featureName = parts[0] ?? "";
  const levelStr = parts[5] ?? "";
  const level = parseInt(levelStr, 10);
  if (!featureName || isNaN(level)) return null;
  return { featureName, level };
}

function extractLevelFeatures(
  classFeatures: RawClassFeatureEntry[] | undefined,
): LevelFeature[] {
  if (!classFeatures) return [];

  const features: LevelFeature[] = [];

  for (const entry of classFeatures) {
    if (typeof entry === "string") {
      const parsed = parseClassFeatureString(entry);
      if (parsed) {
        features.push({
          level: parsed.level,
          featureName: parsed.featureName,
          isSubclassFeature: false,
        });
      }
    } else if (typeof entry === "object" && entry !== null) {
      const raw = entry.classFeature;
      const parsed = parseClassFeatureString(raw);
      if (parsed) {
        features.push({
          level: parsed.level,
          featureName: parsed.featureName,
          isSubclassFeature: entry.gainSubclassFeature === true,
        });
      }
    }
  }

  return features;
}

function extractSubclasses(
  subclassEntries: RawSubclassEntry[] | undefined,
  subclassFeatureEntries?: RawClassFile["subclassFeature"],
  classSource?: string,
): SubclassInfo[] {
  if (!subclassEntries) return [];

  const seen = new Set<string>();
  const result: SubclassInfo[] = [];

  for (const entry of subclassEntries) {
    if (!entry.subclassFeatures) continue;
    if (seen.has(entry.name)) continue;
    // If filtering by source, only include subclasses whose source matches
    // PHB subclasses go with PHB, XPHB subclasses go with XPHB,
    // supplemental sources (XGE, TCE, SCAG, etc.) go with both versions
    if (classSource && !featureMatchesSource(entry.source, classSource))
      continue;
    seen.add(entry.name);

    const features: LevelFeature[] = [];
    const featureNameLevelKeys = new Set<string>();

    // Add features listed in the subclass's subclassFeatures strings
    for (const featureStr of entry.subclassFeatures) {
      const parsed = parseSubclassFeatureString(featureStr);
      if (parsed) {
        features.push({
          level: parsed.level,
          featureName: parsed.featureName,
          isSubclassFeature: true,
        });
        featureNameLevelKeys.add(`${parsed.featureName}|${parsed.level}`);
      }
    }

    // Also include child sub-features from the raw subclassFeature array
    // that belong to this subclass but aren't in the top-level list
    // (e.g. "Psychic Teleportation" is a child of "Soul Blades" for Soulknife)
    const shortName = entry.shortName ?? entry.name;
    if (subclassFeatureEntries) {
      for (const feat of subclassFeatureEntries) {
        if (feat.subclassShortName !== shortName) continue;
        const key = `${feat.name}|${feat.level}`;
        if (featureNameLevelKeys.has(key)) continue;
        featureNameLevelKeys.add(key);
        features.push({
          level: feat.level,
          featureName: feat.name,
          isSubclassFeature: true,
        });
      }
    }

    result.push({
      name: entry.name,
      shortName,
      source: entry.source,
      features,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Feature description extraction
// ---------------------------------------------------------------------------

/**
 * Sources that are considered "primary" rulebook sources (PHB 2014 and XPHB 2024).
 * All other sources (XGE, TCE, SCAG, etc.) are supplemental.
 */
const PRIMARY_SOURCES = new Set(["PHB", "XPHB"]);

/**
 * Returns true if a feature's source matches the requested class source.
 * - If the feature source matches the class source exactly, include it.
 * - If the feature source is supplemental (not PHB/XPHB), include it for both.
 * - Otherwise exclude it (e.g. PHB feature for XPHB class version).
 */
function featureMatchesSource(
  featureSource: string | undefined,
  classSource: string,
): boolean {
  if (!featureSource) return classSource === "PHB"; // No source = PHB-era
  if (featureSource === classSource) return true;
  // Supplemental sources (TCE, XGE, SCAG, etc.) go with both versions
  if (!PRIMARY_SOURCES.has(featureSource)) return true;
  return false;
}

function extractFeatureDescriptions(
  classFile: RawClassFile,
  classSource?: string,
): FeatureDescription[] {
  const descriptions: FeatureDescription[] = [];
  const seen = new Set<string>();

  // Base class features
  for (const feat of classFile.classFeature ?? []) {
    if (feat.level == null) continue;
    // If filtering by source, only include features that match
    if (classSource && !featureMatchesSource(feat.source, classSource))
      continue;
    const key = `${feat.name}|${feat.level}|base`;
    if (seen.has(key)) continue;
    seen.add(key);

    const entries = parseEntries(feat.entries ?? []);
    if (entries.length > 0) {
      descriptions.push({
        name: feat.name,
        level: feat.level,
        entries,
        isSubclassFeature: false,
      });
    }
  }

  // Subclass features — merge entries from duplicate sources (e.g. TCE + XPHB)
  // so tables/statblocks from either version are included
  const subclassMap = new Map<string, FeatureDescription>();
  for (const feat of classFile.subclassFeature ?? []) {
    if (feat.level == null) continue;
    // If filtering by source, only include subclass features that match
    if (classSource && !featureMatchesSource(feat.source, classSource))
      continue;
    const subclassName = feat.subclassShortName ?? "";
    const key = `${feat.name}|${feat.level}|${subclassName}`;

    const entries = parseEntries(feat.entries ?? []);
    if (entries.length === 0) continue;

    const existing = subclassMap.get(key);
    if (existing) {
      // Merge: add entry types not already present (tables, insets, statblocks)
      for (const newEntry of entries) {
        const isDuplicate = existing.entries.some((e) => {
          if (e.type !== newEntry.type) return false;
          if (e.type === "text" && newEntry.type === "text")
            return e.text === newEntry.text;
          if (e.type === "table" && newEntry.type === "table")
            return e.caption === newEntry.caption;
          if (e.type === "inset" && newEntry.type === "inset")
            return e.name === newEntry.name;
          return false;
        });
        if (!isDuplicate) {
          existing.entries.push(newEntry);
        }
      }
    } else if (!seen.has(key)) {
      seen.add(key);
      const desc: FeatureDescription = {
        name: feat.name,
        level: feat.level,
        entries,
        isSubclassFeature: true,
        subclassName,
      };
      subclassMap.set(key, desc);
      descriptions.push(desc);
    }
  }

  return descriptions;
}

// ---------------------------------------------------------------------------
// Build ClassInfo
// ---------------------------------------------------------------------------

function buildClassInfo(
  classFile: RawClassFile,
  fluffFile: RawFluffFile,
  classIndex = 0,
): ClassInfo {
  const cls = classFile.class[classIndex];
  const classSource = cls.source;
  const hitDie = cls.hd ? `d${cls.hd.faces}` : "d8";
  const savingThrows = (cls.proficiency ?? []).map(
    (p) => ABILITY_NAMES[p] ?? capitalize(p),
  );
  const sp = cls.startingProficiencies;
  const armorProficiencies = extractArmorProficiencies(sp?.armor);
  const weaponProficiencies = extractWeaponProficiencies(sp?.weapons);
  const skillChoices = extractSkillChoices(sp?.skills);
  const description = extractDescription(fluffFile as RawFluffFile);
  const levelFeatures = extractLevelFeatures(cls.classFeatures);
  const subclassTitle = cls.subclassTitle ?? "Subclass";
  const subclasses = extractSubclasses(
    classFile.subclass,
    classFile.subclassFeature,
    classSource,
  );
  const featureDescriptions = extractFeatureDescriptions(
    classFile,
    classSource,
  );

  return {
    name: cls.name,
    source: classSource,
    hitDie,
    savingThrows,
    armorProficiencies,
    weaponProficiencies,
    skillChoices,
    description,
    levelFeatures,
    subclassTitle,
    subclasses,
    featureDescriptions,
  };
}

// ---------------------------------------------------------------------------
// Dual-source and single-source class definitions
// ---------------------------------------------------------------------------

/** Classes that have entries in both PHB (2014) and XPHB (2024). */
type DualSourceClassFile = { classFile: RawClassFile; fluffFile: RawFluffFile };

const DUAL_SOURCE_CLASS_FILES: DualSourceClassFile[] = [
  {
    classFile: barbarianClass as RawClassFile,
    fluffFile: barbarianFluff as RawFluffFile,
  },
  {
    classFile: bardClass as RawClassFile,
    fluffFile: bardFluff as RawFluffFile,
  },
  {
    classFile: clericClass as RawClassFile,
    fluffFile: clericFluff as RawFluffFile,
  },
  {
    classFile: druidClass as RawClassFile,
    fluffFile: druidFluff as RawFluffFile,
  },
  {
    classFile: fighterClass as RawClassFile,
    fluffFile: fighterFluff as RawFluffFile,
  },
  {
    classFile: monkClass as RawClassFile,
    fluffFile: monkFluff as RawFluffFile,
  },
  {
    classFile: paladinClass as RawClassFile,
    fluffFile: paladinFluff as RawFluffFile,
  },
  {
    classFile: rangerClass as RawClassFile,
    fluffFile: rangerFluff as RawFluffFile,
  },
  {
    classFile: rogueClass as RawClassFile,
    fluffFile: rogueFluff as RawFluffFile,
  },
  {
    classFile: sorcererClass as RawClassFile,
    fluffFile: sorcererFluff as RawFluffFile,
  },
  {
    classFile: warlockClass as RawClassFile,
    fluffFile: warlockFluff as RawFluffFile,
  },
  {
    classFile: wizardClass as RawClassFile,
    fluffFile: wizardFluff as RawFluffFile,
  },
];

/** Single-source classes (only one class entry in their JSON). */
const SINGLE_SOURCE_CLASS_FILES: DualSourceClassFile[] = [
  {
    classFile: artificerClass as RawClassFile,
    fluffFile: artificerFluff as RawFluffFile,
  },
  {
    classFile: mysticClass as RawClassFile,
    fluffFile: mysticFluff as RawFluffFile,
  },
  {
    classFile: sidekickClass as RawClassFile,
    fluffFile: sidekickFluff as RawFluffFile,
  },
];

function buildAllClassInfos(): ClassInfo[] {
  const all: ClassInfo[] = [];

  // Dual-source classes: build one ClassInfo per source entry (index 0 = PHB, index 1 = XPHB)
  for (const { classFile, fluffFile } of DUAL_SOURCE_CLASS_FILES) {
    for (let i = 0; i < classFile.class.length; i++) {
      all.push(buildClassInfo(classFile, fluffFile, i));
    }
  }

  // Single-source classes: only one entry
  for (const { classFile, fluffFile } of SINGLE_SOURCE_CLASS_FILES) {
    all.push(buildClassInfo(classFile, fluffFile, 0));
  }

  return all.sort((a, b) => a.name.localeCompare(b.name));
}

/** All class versions (PHB + XPHB + unique-source). */
export const CLASS_LIST: ClassInfo[] = buildAllClassInfos();

/** Names of classes that have both a PHB and XPHB version. */
export const DUAL_SOURCE_CLASS_NAMES: string[] = DUAL_SOURCE_CLASS_FILES.map(
  ({ classFile }) => classFile.class[0].name,
).sort();

/** Unique-source class names (Artificer, Mystic, Sidekick) — included in both PHB/XPHB views. */
const UNIQUE_SOURCE_CLASS_NAMES = new Set(
  SINGLE_SOURCE_CLASS_FILES.map(({ classFile }) => classFile.class[0].name),
);

/**
 * Returns classes for a given primary rulebook source.
 * Dual-source classes are filtered to the matching version.
 * Unique-source classes (Artificer, Mystic, Sidekick) are included in both.
 */
export function getClassesBySource(source: "PHB" | "XPHB"): ClassInfo[] {
  return CLASS_LIST.filter(
    (c) => c.source === source || UNIQUE_SOURCE_CLASS_NAMES.has(c.name),
  );
}

/**
 * Returns a specific class by name and source.
 */
export function getClassByNameAndSource(
  name: string,
  source: string,
): ClassInfo | undefined {
  return CLASS_LIST.find(
    (c) => c.name.toLowerCase() === name.toLowerCase() && c.source === source,
  );
}

/**
 * Returns the first matching class by name (backward compatible).
 */
export function getClassByName(name: string): ClassInfo | undefined {
  return CLASS_LIST.find((c) => c.name.toLowerCase() === name.toLowerCase());
}
