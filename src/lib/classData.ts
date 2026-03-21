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
  type: "text" | "list" | "section" | "inset";
  text?: string;           // for "text" type
  items?: string[];        // for "list" type
  name?: string;           // for "section" / "inset"
  children?: FeatureEntry[]; // for "section" / "inset"
}

export interface FeatureDescription {
  name: string;
  level: number;
  entries: FeatureEntry[];
  isSubclassFeature: boolean;
  subclassName?: string;  // only set for subclass features
}

export interface ClassInfo {
  name: string;
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
  }>;
  subclassFeature?: Array<{
    name: string;
    level: number;
    subclassShortName?: string;
    entries?: unknown[];
    source?: string;
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
    result = result.replace(/\{@(\w+)\s([^}]*)\}/g, (_match, tag: string, body: string) => {
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
          return (parts[parts.length - 1] !== parts[0] ? parts[parts.length - 1] : parts[0] ?? body).trim();
        case "filter":
          // {@filter display|...} — first part is display label
          return (parts[0] ?? body).trim();
        default:
          // Many tags follow name|source|display convention — prefer display (index 2), else name (index 0)
          return (parts[2] ?? parts[0] ?? body).trim();
      }
    });
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
              const entryPart = typeof itemObj.entries === "object" && Array.isArray(itemObj.entries)
                ? parseEntries(itemObj.entries as unknown[]).map(e => e.text ?? "").join(" ")
                : "";
              items.push(entryPart ? `${namePart}: ${entryPart}` : namePart);
            }
          }
        }
        if (items.length > 0) {
          result.push({ type: "list", items });
        }
      } else if (type === "entries") {
        const name = typeof obj.name === "string" ? stripTags(obj.name) : undefined;
        const children = Array.isArray(obj.entries)
          ? parseEntries(obj.entries as unknown[])
          : [];
        if (children.length > 0) {
          result.push({ type: "section", name, children });
        }
      } else if (type === "inset" || type === "insetReadaloud") {
        const name = typeof obj.name === "string" ? stripTags(obj.name) : undefined;
        const children = Array.isArray(obj.entries)
          ? parseEntries(obj.entries as unknown[])
          : [];
        if (children.length > 0) {
          result.push({ type: "inset", name, children });
        }
      } else if (
        type === "refClassFeature" ||
        type === "refSubclassFeature" ||
        type === "options" ||
        type === "table" ||
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
        const name = typeof obj.name === "string" ? stripTags(obj.name) : undefined;
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
        if (w === "simple" || w === "martial") return capitalize(w) + " weapons";
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

function parseClassFeatureString(raw: string): { featureName: string; level: number } | null {
  const parts = raw.split("|");
  const featureName = parts[0] ?? "";
  const levelStr = parts[3] ?? "";
  const level = parseInt(levelStr, 10);
  if (!featureName || isNaN(level)) return null;
  return { featureName, level };
}

function parseSubclassFeatureString(raw: string): { featureName: string; level: number } | null {
  const parts = raw.split("|");
  const featureName = parts[0] ?? "";
  const levelStr = parts[5] ?? "";
  const level = parseInt(levelStr, 10);
  if (!featureName || isNaN(level)) return null;
  return { featureName, level };
}

function extractLevelFeatures(classFeatures: RawClassFeatureEntry[] | undefined): LevelFeature[] {
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

function extractSubclasses(subclassEntries: RawSubclassEntry[] | undefined): SubclassInfo[] {
  if (!subclassEntries) return [];

  const seen = new Set<string>();
  const result: SubclassInfo[] = [];

  for (const entry of subclassEntries) {
    if (!entry.subclassFeatures) continue;
    if (seen.has(entry.name)) continue;
    seen.add(entry.name);

    const features: LevelFeature[] = [];
    for (const featureStr of entry.subclassFeatures) {
      const parsed = parseSubclassFeatureString(featureStr);
      if (parsed) {
        features.push({
          level: parsed.level,
          featureName: parsed.featureName,
          isSubclassFeature: true,
        });
      }
    }

    result.push({
      name: entry.name,
      shortName: entry.shortName ?? entry.name,
      source: entry.source,
      features,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Feature description extraction
// ---------------------------------------------------------------------------

function extractFeatureDescriptions(classFile: RawClassFile): FeatureDescription[] {
  const descriptions: FeatureDescription[] = [];
  const seen = new Set<string>();

  // Base class features
  for (const feat of classFile.classFeature ?? []) {
    if (feat.level == null) continue;
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

  // Subclass features
  for (const feat of classFile.subclassFeature ?? []) {
    if (feat.level == null) continue;
    const subclassName = feat.subclassShortName ?? "";
    const key = `${feat.name}|${feat.level}|${subclassName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const entries = parseEntries(feat.entries ?? []);
    if (entries.length > 0) {
      descriptions.push({
        name: feat.name,
        level: feat.level,
        entries,
        isSubclassFeature: true,
        subclassName,
      });
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
): ClassInfo {
  const cls = classFile.class[0];
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
  const subclasses = extractSubclasses(classFile.subclass);
  const featureDescriptions = extractFeatureDescriptions(classFile);

  return {
    name: cls.name,
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

export const CLASS_LIST: ClassInfo[] = [
  buildClassInfo(artificerClass as RawClassFile, artificerFluff as RawFluffFile),
  buildClassInfo(barbarianClass as RawClassFile, barbarianFluff as RawFluffFile),
  buildClassInfo(bardClass as RawClassFile, bardFluff as RawFluffFile),
  buildClassInfo(clericClass as RawClassFile, clericFluff as RawFluffFile),
  buildClassInfo(druidClass as RawClassFile, druidFluff as RawFluffFile),
  buildClassInfo(fighterClass as RawClassFile, fighterFluff as RawFluffFile),
  buildClassInfo(monkClass as RawClassFile, monkFluff as RawFluffFile),
  buildClassInfo(mysticClass as RawClassFile, mysticFluff as RawFluffFile),
  buildClassInfo(paladinClass as RawClassFile, paladinFluff as RawFluffFile),
  buildClassInfo(rangerClass as RawClassFile, rangerFluff as RawFluffFile),
  buildClassInfo(rogueClass as RawClassFile, rogueFluff as RawFluffFile),
  buildClassInfo(sidekickClass as RawClassFile, sidekickFluff as RawFluffFile),
  buildClassInfo(sorcererClass as RawClassFile, sorcererFluff as RawFluffFile),
  buildClassInfo(warlockClass as RawClassFile, warlockFluff as RawFluffFile),
  buildClassInfo(wizardClass as RawClassFile, wizardFluff as RawFluffFile),
].sort((a, b) => a.name.localeCompare(b.name));

export function getClassByName(name: string): ClassInfo | undefined {
  return CLASS_LIST.find(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  );
}
