// ---------------------------------------------------------------------------
// Spellcasting Progression Data
// ---------------------------------------------------------------------------
// Extracts cantrip counts, spells known, and prepared spell limits from
// the class JSON files.  Covers both PHB (2014) and XPHB (2024) variants.
// ---------------------------------------------------------------------------

import artificerClass from "../../data/class/class-artificer.json";
import bardClass from "../../data/class/class-bard.json";
import clericClass from "../../data/class/class-cleric.json";
import druidClass from "../../data/class/class-druid.json";
import paladinClass from "../../data/class/class-paladin.json";
import rangerClass from "../../data/class/class-ranger.json";
import sorcererClass from "../../data/class/class-sorcerer.json";
import warlockClass from "../../data/class/class-warlock.json";
import wizardClass from "../../data/class/class-wizard.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a class entry within a class JSON file (only the fields we need). */
interface RawClassSpellcastingEntry {
  name: string;
  source: string;
  cantripProgression?: number[];
  spellsKnownProgression?: number[];
  spellsKnownProgressionFixed?: number[];
  spellsKnownProgressionFixedByLevel?: Record<string, Record<string, number>>;
  preparedSpells?: string;
  preparedSpellsProgression?: number[];
}

interface RawClassFile {
  class: RawClassSpellcastingEntry[];
}

// ---------------------------------------------------------------------------
// Class file registry
// ---------------------------------------------------------------------------

const CLASS_FILES: Record<string, RawClassFile> = {
  artificer: artificerClass as unknown as RawClassFile,
  bard: bardClass as unknown as RawClassFile,
  cleric: clericClass as unknown as RawClassFile,
  druid: druidClass as unknown as RawClassFile,
  paladin: paladinClass as unknown as RawClassFile,
  ranger: rangerClass as unknown as RawClassFile,
  sorcerer: sorcererClass as unknown as RawClassFile,
  warlock: warlockClass as unknown as RawClassFile,
  wizard: wizardClass as unknown as RawClassFile,
};

/**
 * Spell management type per class.
 * "known" = the class learns a fixed number of spells (Bard, Sorcerer, Ranger, Warlock).
 * "prepared" = the class prepares spells from a larger list (Cleric, Druid, Paladin, Wizard, Artificer).
 */
const SPELL_MANAGEMENT_TYPE: Record<string, "known" | "prepared"> = {
  bard: "known",
  sorcerer: "known",
  ranger: "known",
  warlock: "known",
  cleric: "prepared",
  druid: "prepared",
  paladin: "prepared",
  wizard: "prepared",
  artificer: "prepared",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Finds the class entry matching the requested rules source.
 * If rulesSource is "XPHB", returns the XPHB variant (if present).
 * Otherwise returns the first entry (PHB / TCE for Artificer).
 */
function findClassEntry(
  className: string,
  rulesSource?: string,
): RawClassSpellcastingEntry | undefined {
  const key = className.toLowerCase();
  const file = CLASS_FILES[key];
  if (!file) return undefined;

  if (rulesSource === "XPHB") {
    const xphb = file.class.find((c) => c.source === "XPHB");
    if (xphb) return xphb;
  }

  // Default: first entry (PHB or sole entry like Artificer/TCE)
  return file.class[0];
}

/**
 * Clamps a level to [1, 20] and converts to a 0-based index.
 */
function levelIndex(level: number): number {
  return Math.max(0, Math.min(19, level - 1));
}

/**
 * Parses a PHB-style preparedSpells formula and evaluates it.
 * Supported patterns:
 *   "<$level$> + <$wis_mod$>"   -> level + abilityMod
 *   "<$level$> + <$int_mod$>"   -> level + abilityMod
 *   "<$level$> / 2 + <$cha_mod$>" -> floor(level/2) + abilityMod
 *   "<$level$> / 2 + <$int_mod$>" -> floor(level/2) + abilityMod
 * The caller is responsible for passing the correct ability modifier.
 * Result is always at least 1.
 */
function evaluatePreparedFormula(
  formula: string,
  level: number,
  abilityMod: number,
): number {
  // Determine whether there's a divisor on the level component
  const hasDivisor = formula.includes("/ 2");
  const levelComponent = hasDivisor ? Math.floor(level / 2) : level;
  const result = levelComponent + abilityMod;
  return Math.max(1, result);
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Get cantrips known for a class at a given level.
 * Returns 0 for non-casters or classes without cantrips (e.g. Ranger PHB, Paladin).
 */
export function getCantripsKnown(
  className: string,
  level: number,
  rulesSource?: string,
): number {
  const entry = findClassEntry(className, rulesSource);
  if (!entry?.cantripProgression) return 0;
  return entry.cantripProgression[levelIndex(level)] ?? 0;
}

/**
 * Get spells known or max prepared spells for a class at a given level.
 *
 * For "known" casters (Bard, Sorcerer, Ranger, Warlock PHB): returns max spells known.
 * For "prepared" casters (Cleric, Druid, Paladin, Wizard, Artificer PHB): returns
 * max prepared spells using the formula from the JSON (caller must pass the correct
 * ability modifier).
 * For XPHB classes: uses `preparedSpellsProgression` directly (abilityMod is ignored).
 *
 * Returns null if the class is not a spellcaster or if no data is available.
 */
export function getSpellsKnownOrPrepared(
  className: string,
  level: number,
  abilityMod: number,
  rulesSource?: string,
): number | null {
  const entry = findClassEntry(className, rulesSource);
  if (!entry) return null;

  const idx = levelIndex(level);

  // XPHB classes (and some PHB classes) may have preparedSpellsProgression
  if (entry.preparedSpellsProgression) {
    return entry.preparedSpellsProgression[idx] ?? null;
  }

  // PHB known casters: spellsKnownProgression
  if (entry.spellsKnownProgression) {
    return entry.spellsKnownProgression[idx] ?? null;
  }

  // PHB prepared casters: preparedSpells formula
  if (entry.preparedSpells) {
    return evaluatePreparedFormula(entry.preparedSpells, level, abilityMod);
  }

  return null;
}

/**
 * Get spellcasting management type info for a class.
 * Returns "known" (Bard, Sorcerer, Ranger, Warlock),
 * "prepared" (Cleric, Druid, Paladin, Wizard, Artificer),
 * or null for non-casters.
 */
export function getSpellManagementType(
  className: string,
): "known" | "prepared" | null {
  return SPELL_MANAGEMENT_TYPE[className.toLowerCase()] ?? null;
}

/**
 * For Wizard specifically: get total spellbook capacity at a given level.
 *
 * The spellsKnownProgressionFixed array represents cumulative additions:
 * index 0 = spells gained at level 1 (6), index 1 = spells gained at level 2 (+2), etc.
 * This function returns the running total (e.g. level 1 = 6, level 2 = 8, level 3 = 10).
 *
 * Works for both PHB and XPHB Wizard variants (both have the same fixed progression).
 * Returns null for non-wizards.
 */
export function getWizardSpellbookSize(
  level: number,
  rulesSource?: string,
): number | null {
  const entry = findClassEntry("Wizard", rulesSource);
  if (!entry?.spellsKnownProgressionFixed) return null;

  const idx = levelIndex(level);
  let total = 0;
  for (let i = 0; i <= idx; i++) {
    total += entry.spellsKnownProgressionFixed[i] ?? 0;
  }
  return total;
}
