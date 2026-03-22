// ---------------------------------------------------------------------------
// Feat static data — parsed from 5etools feats.json
// ---------------------------------------------------------------------------

import featsJson from "../../data/feats.json";
import { parseTaggedText } from "@/lib/dndTagParser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeatAbilityBonus {
  fixed?: Record<string, number>; // e.g., { "cha": 1 }
  choose?: {
    from: string[];  // abilities to pick from
    count: number;   // how many to pick (usually 1)
    amount: number;  // bonus per pick (usually 1)
  };
}

export interface Feat {
  name: string;
  source: string;
  category?: string;         // XPHB: "O", "G", "FS", "EB"
  prerequisiteText?: string; // human-readable prerequisite summary
  levelRequired?: number;    // min level if specified in prerequisites
  abilityBonus?: FeatAbilityBonus;
  entries: string[];         // flattened, tag-stripped description
}

// ---------------------------------------------------------------------------
// Raw JSON types
// ---------------------------------------------------------------------------

interface RawEntryObject {
  type?: string;
  name?: string;
  items?: (string | RawEntryObject)[];
  entries?: (string | RawEntryObject)[];
  colLabels?: string[];
  rows?: string[][];
}

type RawEntry = string | RawEntryObject;

interface RawAbilityChoose {
  from: string[];
  count?: number;
  amount?: number;
}

interface RawAbility {
  choose?: RawAbilityChoose;
  hidden?: boolean;
  max?: number;
  [key: string]: unknown; // fixed ability keys like "cha": 1
}

interface RawPrerequisiteAbility {
  [key: string]: number; // e.g., { "cha": 13 }
}

interface RawPrerequisite {
  level?: number;
  ability?: RawPrerequisiteAbility[];
  feat?: string[];
  feature?: string[];
  race?: Array<{ name: string }>;
  spellcasting?: boolean;
  spellcasting2020?: boolean;
  spellcastingFeature?: boolean;
  spellcastingPrepared?: boolean;
  proficiency?: Array<Record<string, string>>;
  other?: string;
  otherSummary?: { entry: string };
  campaign?: string[];
  background?: Array<{ name: string }>;
}

interface RawFeat {
  name: string;
  source: string;
  page?: number;
  category?: string;
  prerequisite?: RawPrerequisite[];
  ability?: RawAbility[];
  entries: RawEntry[];
  reprintedAs?: string[];
}

// ---------------------------------------------------------------------------
// Ability name mapping
// ---------------------------------------------------------------------------

const ABILITY_NAMES: Record<string, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

// ---------------------------------------------------------------------------
// Entry flattening — handles strings, list objects, entries objects, tables,
// items, sections, and insets
// ---------------------------------------------------------------------------

function flattenEntries(entries: RawEntry[]): string[] {
  const result: string[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      result.push(entry);
    } else if (entry && typeof entry === "object") {
      if (entry.type === "list" && Array.isArray(entry.items)) {
        for (const item of entry.items) {
          if (typeof item === "string") {
            result.push(item);
          } else {
            result.push(...flattenEntries([item]));
          }
        }
      } else if (entry.type === "table" && Array.isArray(entry.rows)) {
        const labels = entry.colLabels ?? [];
        for (const row of entry.rows) {
          const parts = row.map((cell, i) =>
            labels[i] ? `${labels[i]}: ${cell}` : cell,
          );
          result.push(parts.join(", "));
        }
      } else if (
        (entry.type === "entries" ||
          entry.type === "section" ||
          entry.type === "inset") &&
        Array.isArray(entry.entries)
      ) {
        if (entry.name) {
          result.push(`${entry.name}.`);
        }
        result.push(...flattenEntries(entry.entries));
      } else if (entry.type === "item") {
        if (entry.name) {
          result.push(`${entry.name}.`);
        }
        if (Array.isArray(entry.entries)) {
          result.push(...flattenEntries(entry.entries));
        }
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Prerequisite parsing — build human-readable text and extract level
// ---------------------------------------------------------------------------

function parsePrerequisites(prereqs: RawPrerequisite[]): {
  text: string | undefined;
  level: number | undefined;
} {
  if (!prereqs || prereqs.length === 0) return { text: undefined, level: undefined };

  // Prerequisites are OR-groups (each element in the array is an alternative).
  // We take the union of conditions described across all alternatives for the
  // human-readable string, but pick the minimum level across alternatives.

  let minLevel: number | undefined;
  const parts: string[] = [];

  for (const prereq of prereqs) {
    const groupParts: string[] = [];

    if (prereq.level !== undefined) {
      if (minLevel === undefined || prereq.level < minLevel) {
        minLevel = prereq.level;
      }
      groupParts.push(`Level ${prereq.level}`);
    }

    if (prereq.ability) {
      for (const abilityReq of prereq.ability) {
        const entries = Object.entries(abilityReq);
        for (const [abbr, score] of entries) {
          const name = ABILITY_NAMES[abbr] ?? abbr;
          groupParts.push(`${name} ${score}+`);
        }
      }
    }

    if (prereq.feat) {
      for (const featRef of prereq.feat) {
        // Format: "feat name|source|display name" — use display name if present, else feat name
        const segments = featRef.split("|");
        const displayName = segments[2] ?? segments[0] ?? featRef;
        // Title-case the display name
        const titled = displayName
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        groupParts.push(`${titled} feat`);
      }
    }

    if (prereq.feature) {
      for (const featureName of prereq.feature) {
        groupParts.push(`${featureName} feature`);
      }
    }

    if (prereq.race) {
      const raceNames = prereq.race.map((r) =>
        r.name.charAt(0).toUpperCase() + r.name.slice(1),
      );
      groupParts.push(raceNames.join(" or "));
    }

    if (prereq.spellcasting || prereq.spellcasting2020 || prereq.spellcastingFeature) {
      groupParts.push("Spellcasting");
    }

    if (prereq.spellcastingPrepared) {
      groupParts.push("Spellcasting (prepared)");
    }

    if (prereq.proficiency) {
      for (const prof of prereq.proficiency) {
        const profNames = Object.entries(prof).map(
          ([type, name]) => `${name} ${type} proficiency`,
        );
        groupParts.push(...profNames);
      }
    }

    if (prereq.other) {
      groupParts.push(prereq.other);
    }

    if (prereq.otherSummary) {
      groupParts.push(parseTaggedText(prereq.otherSummary.entry));
    }

    if (prereq.background) {
      const bgNames = prereq.background.map((b) => b.name);
      groupParts.push(bgNames.join(" or ") + " background");
    }

    if (groupParts.length > 0) {
      parts.push(groupParts.join(", "));
    }
  }

  // If multiple OR-groups have different parts, join with " or "
  const uniqueParts = [...new Set(parts)];
  const text = uniqueParts.length > 0 ? uniqueParts.join(" or ") : undefined;

  return { text, level: minLevel };
}

// ---------------------------------------------------------------------------
// Ability bonus parsing
// ---------------------------------------------------------------------------

function parseAbilityBonus(abilities: RawAbility[]): FeatAbilityBonus | undefined {
  if (!abilities || abilities.length === 0) return undefined;

  const result: FeatAbilityBonus = {};

  for (const ability of abilities) {
    if (ability.choose) {
      result.choose = {
        from: ability.choose.from,
        count: ability.choose.count ?? 1,
        amount: ability.choose.amount ?? 1,
      };
    } else {
      // Fixed ability bonuses — collect all non-metadata keys
      const fixed: Record<string, number> = {};
      for (const [key, value] of Object.entries(ability)) {
        if (key === "hidden" || key === "max") continue;
        if (typeof value === "number") {
          fixed[key] = value;
        }
      }
      if (Object.keys(fixed).length > 0) {
        result.fixed = { ...(result.fixed ?? {}), ...fixed };
      }
    }
  }

  if (!result.fixed && !result.choose) return undefined;
  return result;
}

// ---------------------------------------------------------------------------
// Fighting style category filter
// ---------------------------------------------------------------------------

const FIGHTING_STYLE_CATEGORIES = new Set(["FS", "FS:P", "FS:R"]);

function isFightingStyle(feat: RawFeat): boolean {
  return feat.category !== undefined && FIGHTING_STYLE_CATEGORIES.has(feat.category);
}

// ---------------------------------------------------------------------------
// Parse all feats
// ---------------------------------------------------------------------------

function parseFeat(raw: RawFeat): Feat {
  const { text: prerequisiteText, level: levelRequired } = parsePrerequisites(
    raw.prerequisite ?? [],
  );

  return {
    name: raw.name,
    source: raw.source,
    category: raw.category,
    prerequisiteText,
    levelRequired,
    abilityBonus: parseAbilityBonus(raw.ability ?? []),
    entries: flattenEntries(raw.entries).map((text) => parseTaggedText(text)),
  };
}

const rawFeats = featsJson.feat as unknown as RawFeat[];

/** All parsed feats (excluding fighting styles). */
export const FEATS: Feat[] = rawFeats
  .filter((f) => !isFightingStyle(f))
  .map(parseFeat);

// ---------------------------------------------------------------------------
// Source-based access — PHB group vs XPHB group
// ---------------------------------------------------------------------------

// Build a set of feat names that exist in XPHB (used to de-duplicate supplementals)
const xphbNames = new Set(
  rawFeats
    .filter((f) => f.source === "XPHB")
    .map((f) => f.name.toLowerCase()),
);

// Build a set of supplemental feat names reprinted into XPHB
const reprintedToXphb = new Set<string>();
for (const raw of rawFeats) {
  if (raw.reprintedAs) {
    for (const target of raw.reprintedAs) {
      if (target.includes("XPHB")) {
        reprintedToXphb.add(raw.name.toLowerCase());
      }
    }
  }
}

const PHB_SOURCES = new Set(["PHB"]);
const XPHB_SOURCES = new Set(["XPHB"]);

/**
 * Get feats for a specific rules source.
 *
 * - "PHB" returns PHB feats + supplemental feats (TCE, XGE, etc.)
 * - "XPHB" returns XPHB feats + supplemental feats NOT already reprinted into XPHB
 *
 * Fighting style feats are excluded from both groups.
 * De-duplicates by name within each group, preferring the primary source (PHB/XPHB)
 * over supplementals.
 */
export function getFeatsBySource(source: "PHB" | "XPHB"): Feat[] {
  const isPrimary = source === "PHB" ? PHB_SOURCES : XPHB_SOURCES;
  const byName = new Map<string, Feat>();

  for (const feat of FEATS) {
    if (isFightingStyleCategory(feat)) continue;

    if (source === "PHB") {
      // Include PHB feats and all supplementals (not XPHB-only feats)
      if (feat.source === "XPHB") continue;
    } else {
      // Include XPHB feats and supplementals NOT reprinted to XPHB
      if (feat.source === "PHB") continue;
      if (
        !XPHB_SOURCES.has(feat.source) &&
        reprintedToXphb.has(feat.name.toLowerCase())
      ) {
        continue;
      }
    }

    const key = feat.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, feat);
    } else if (isPrimary.has(feat.source) && !isPrimary.has(existing.source)) {
      // Prefer primary source over supplemental
      byName.set(key, feat);
    }
  }

  return Array.from(byName.values());
}

function isFightingStyleCategory(feat: Feat): boolean {
  return feat.category !== undefined && FIGHTING_STYLE_CATEGORIES.has(feat.category);
}

/**
 * Look up a single feat by name and source.
 * Falls back to a name-only match if exact source match fails
 * (e.g., feat from TCE when rulesSource is "PHB").
 */
export function getFeatByNameAndSource(
  name: string,
  source: string,
): Feat | undefined {
  const lowerName = name.toLowerCase();
  const lowerSource = source.toLowerCase();
  return (
    FEATS.find(
      (f) => f.name.toLowerCase() === lowerName && f.source.toLowerCase() === lowerSource,
    ) ??
    FEATS.find((f) => f.name.toLowerCase() === lowerName)
  );
}

/**
 * Look up a feat by name only (returns the first match).
 */
export function getFeatByName(name: string): Feat | undefined {
  return FEATS.find((f) => f.name.toLowerCase() === name.toLowerCase());
}
