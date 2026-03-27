// ---------------------------------------------------------------------------
// Starting Equipment Data Parser
// ---------------------------------------------------------------------------
// Parses starting equipment from class JSONs and backgrounds JSON into
// structured presets suitable for character inventory initialization.
// ---------------------------------------------------------------------------

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

import backgroundsData from "../../data/backgrounds.json";

// ---------------------------------------------------------------------------
// Exported interfaces
// ---------------------------------------------------------------------------

export interface StartingItem {
  name: string;
  source: string;       // e.g., "PHB", "XPHB"
  quantity: number;
  displayName?: string;  // Override display name
}

export interface StartingEquipmentPreset {
  label: string;         // e.g., "Option A", "Option B", "Gold Alternative"
  items: StartingItem[];
}

export interface ClassStartingEquipment {
  className: string;
  classSource: string;
  presets: StartingEquipmentPreset[];
  goldAlternative?: string; // e.g., "5d4 × 10 gp"
}

export interface BackgroundStartingEquipment {
  backgroundName: string;
  backgroundSource: string;
  items: StartingItem[];     // Fixed items from background
}

// ---------------------------------------------------------------------------
// Raw type definitions (minimal — only fields we read)
// ---------------------------------------------------------------------------

interface RawItemObj {
  item?: string;
  special?: string;
  displayName?: string;
  quantity?: number;
  containsValue?: number;
  value?: number;
  equipmentType?: string;
}

type RawDefaultDataItem = string | RawItemObj;

interface RawDefaultDataEntry {
  [key: string]: RawDefaultDataItem[] | undefined;
}

interface RawStartingEquipment {
  additionalFromBackground?: boolean;
  default?: string[];
  defaultData?: RawDefaultDataEntry[];
  goldAlternative?: string;
}

interface RawClassEntry {
  name: string;
  source: string;
  startingEquipment?: RawStartingEquipment;
}

interface RawClassFile {
  class: RawClassEntry[];
}

interface RawBgEquipmentEntry {
  [key: string]: unknown;
}

interface RawBackground {
  name: string;
  source: string;
  startingEquipment?: RawBgEquipmentEntry[];
}

interface RawBackgroundFile {
  background: RawBackground[];
}

// ---------------------------------------------------------------------------
// Equipment type → generic placeholder name mapping
// ---------------------------------------------------------------------------

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  weaponSimple: "Simple Weapon",
  weaponMartial: "Martial Weapon",
  weaponMartialMelee: "Martial Melee Weapon",
  weaponSimpleMelee: "Simple Melee Weapon",
  focusSpellcastingArcane: "Arcane Focus",
  focusSpellcastingDruidic: "Druidic Focus",
  focusSpellcastingHoly: "Holy Symbol",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse "name|source" into {name, source}, uppercasing the source. */
function parseItemString(raw: string): { name: string; source: string } {
  const pipeIdx = raw.indexOf("|");
  if (pipeIdx === -1) {
    return { name: raw.trim(), source: "" };
  }
  return {
    name: raw.substring(0, pipeIdx).trim(),
    source: raw.substring(pipeIdx + 1).trim().toUpperCase(),
  };
}

/** Convert a letter key (a-z or A-Z) to a display label like "Option A". */
function letterToLabel(letter: string): string {
  return `Option ${letter.toUpperCase()}`;
}

/** Parse the {@dice ...} wrapper from goldAlternative strings. */
function parseGoldAlternative(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // Strip {@dice expr|display|label} → use display (index 1) or expr (index 0)
  const match = /\{@dice\s+([^}]+)\}/.exec(raw);
  if (!match) return raw;
  const parts = match[1].split("|");
  // Use the display text (second part) if available, else the expression
  const diceText = (parts[1] ?? parts[0] ?? raw).trim();
  // Append " gp" if the goldAlternative includes "gp" but the extracted text doesn't
  if (raw.toLowerCase().includes("gp") && !diceText.toLowerCase().includes("gp")) {
    return `${diceText} gp`;
  }
  return diceText;
}

/**
 * Parse a single item from defaultData.
 * Handles: plain "name|source" strings, item objects, equipmentType objects, special objects, value objects.
 */
function parseDefaultDataItem(
  raw: RawDefaultDataItem,
  fallbackSource: string,
): StartingItem | null {
  if (typeof raw === "string") {
    const parsed = parseItemString(raw);
    return {
      name: parsed.name,
      source: parsed.source || fallbackSource,
      quantity: 1,
    };
  }

  if (typeof raw === "object" && raw !== null) {
    const obj = raw as RawItemObj;

    // Value-only entries (gold amounts like { value: 400 } where value is in copper)
    if (obj.value !== undefined && !obj.item && !obj.special && !obj.equipmentType) {
      const gpValue = Math.floor(obj.value / 100);
      return {
        name: `${gpValue} GP`,
        source: fallbackSource,
        quantity: 1,
      };
    }

    // Item with "item" field: "name|source"
    if (obj.item) {
      const parsed = parseItemString(obj.item);
      const item: StartingItem = {
        name: parsed.name,
        source: parsed.source || fallbackSource,
        quantity: obj.quantity ?? 1,
      };
      if (obj.displayName) {
        item.displayName = obj.displayName;
      }
      if (obj.containsValue !== undefined) {
        const gpValue = Math.floor(obj.containsValue / 100);
        item.displayName = item.displayName ?? `${item.name} (containing ${gpValue} GP)`;
      }
      return item;
    }

    // Special items (text-based, no item reference)
    if (obj.special) {
      return {
        name: obj.special,
        source: fallbackSource,
        quantity: obj.quantity ?? 1,
      };
    }

    // Equipment type placeholders
    if (obj.equipmentType) {
      const label = EQUIPMENT_TYPE_LABELS[obj.equipmentType] ?? obj.equipmentType;
      return {
        name: label,
        source: fallbackSource,
        quantity: obj.quantity ?? 1,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// PHB (2014) text-based parsing — used as fallback when defaultData is absent
// ---------------------------------------------------------------------------

/** Extract items from {@item name|source} and {@item name|source|displayName} tags. */
function parseItemTags(text: string): StartingItem[] {
  const items: StartingItem[] = [];
  const itemRegex = /\{@item\s+([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(text)) !== null) {
    const parts = match[1].split("|");
    const name = (parts[0] ?? "").trim();
    const source = (parts[1] ?? "").trim().toUpperCase();
    const displayName = parts[2] ? parts[2].trim() : undefined;

    if (name) {
      // Try to extract quantity from displayName patterns like "20 arrows" or "20 bolts"
      let quantity = 1;
      if (displayName) {
        const qtyMatch = /^(\d+)\s/.exec(displayName);
        if (qtyMatch) {
          quantity = parseInt(qtyMatch[1], 10);
        }
      }

      items.push({
        name,
        source,
        quantity,
        displayName: displayName || undefined,
      });
    }
  }

  return items;
}

/** Extract generic names from {@filter display|...} tags. */
function parseFilterTags(text: string): StartingItem[] {
  const items: StartingItem[] = [];
  const filterRegex = /\{@filter\s+([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = filterRegex.exec(text)) !== null) {
    const parts = match[1].split("|");
    const displayName = (parts[0] ?? "").trim();
    if (displayName) {
      items.push({
        name: displayName,
        source: "",
        quantity: 1,
      });
    }
  }

  return items;
}

/** Parse all items from a PHB-style text line. */
function parseTextLineItems(text: string): StartingItem[] {
  const items: StartingItem[] = [];
  items.push(...parseItemTags(text));
  items.push(...parseFilterTags(text));
  return items;
}

// ---------------------------------------------------------------------------
// defaultData-based parsing (works for both PHB and XPHB structured data)
// ---------------------------------------------------------------------------

/**
 * Parse the defaultData array into presets.
 *
 * The defaultData array entries each contain either:
 * - "_" key: fixed items everyone gets (no choice)
 * - letter keys (a/b/c or A/B/C): choice groups
 *
 * For classes with multiple choice groups, we generate one preset per
 * combination letter across all choice groups. For simplicity and usability,
 * we generate presets per individual letter in each group, plus a fixed items
 * preset.
 *
 * To keep it practical, for PHB-style multi-choice groups (e.g., 4 groups
 * each with a/b), we generate per-group options rather than exponential
 * combinations. The presets represent: fixed items + each choice group's options.
 */
function parseDefaultData(
  defaultData: RawDefaultDataEntry[],
  classSource: string,
): { fixedItems: StartingItem[]; choiceGroups: { label: string; options: { label: string; items: StartingItem[] }[] }[] } {
  const fixedItems: StartingItem[] = [];
  const choiceGroups: { label: string; options: { label: string; items: StartingItem[] }[] }[] = [];

  let groupIndex = 0;

  for (const entry of defaultData) {
    const keys = Object.keys(entry);

    // Check if this entry has only fixed items
    if (keys.length === 1 && keys[0] === "_") {
      const rawItems = entry["_"] as RawDefaultDataItem[] | undefined;
      if (rawItems) {
        for (const raw of rawItems) {
          const parsed = parseDefaultDataItem(raw, classSource);
          if (parsed) fixedItems.push(parsed);
        }
      }
      continue;
    }

    // This entry has choice keys (and possibly a "_" key for fixed items in this group)
    groupIndex++;
    const options: { label: string; items: StartingItem[] }[] = [];

    for (const key of keys) {
      if (key === "_") {
        // Fixed items within a choice group — add to fixed items
        const rawItems = entry[key] as RawDefaultDataItem[] | undefined;
        if (rawItems) {
          for (const raw of rawItems) {
            const parsed = parseDefaultDataItem(raw, classSource);
            if (parsed) fixedItems.push(parsed);
          }
        }
        continue;
      }

      const rawItems = entry[key] as RawDefaultDataItem[] | undefined;
      if (!rawItems) continue;

      const items: StartingItem[] = [];
      for (const raw of rawItems) {
        const parsed = parseDefaultDataItem(raw, classSource);
        if (parsed) items.push(parsed);
      }

      if (items.length > 0) {
        options.push({
          label: letterToLabel(key),
          items,
        });
      }
    }

    if (options.length > 0) {
      choiceGroups.push({
        label: `Choice ${groupIndex}`,
        options,
      });
    }
  }

  return { fixedItems, choiceGroups };
}

/**
 * Build presets from parsed defaultData.
 *
 * For XPHB classes (single choice group with A/B/C), each option becomes a preset.
 * For PHB classes (multiple choice groups), we generate combination presets.
 * When there are too many combinations (>16), we fall back to per-group presets.
 */
function buildPresetsFromDefaultData(
  fixedItems: StartingItem[],
  choiceGroups: { label: string; options: { label: string; items: StartingItem[] }[] }[],
): StartingEquipmentPreset[] {
  // No choice groups — just fixed items
  if (choiceGroups.length === 0) {
    if (fixedItems.length === 0) return [];
    return [{ label: "Default", items: fixedItems }];
  }

  // Single choice group — each option is a preset (typical for XPHB)
  if (choiceGroups.length === 1) {
    return choiceGroups[0].options.map((opt) => ({
      label: opt.label,
      items: [...fixedItems, ...opt.items],
    }));
  }

  // Multiple choice groups — generate combinations
  // Calculate total combinations
  const totalCombinations = choiceGroups.reduce(
    (acc, group) => acc * group.options.length,
    1,
  );

  if (totalCombinations <= 16) {
    // Generate all combinations
    const presets: StartingEquipmentPreset[] = [];
    const indices = new Array(choiceGroups.length).fill(0) as number[];

    for (let combo = 0; combo < totalCombinations; combo++) {
      const comboItems = [...fixedItems];
      const labelParts: string[] = [];

      for (let g = 0; g < choiceGroups.length; g++) {
        const option = choiceGroups[g].options[indices[g]];
        comboItems.push(...option.items);
        // Extract just the letter from "Option A" -> "A"
        const letter = option.label.replace("Option ", "");
        labelParts.push(letter);
      }

      presets.push({
        label: `Option ${labelParts.join("/")}`,
        items: comboItems,
      });

      // Increment indices (like counting in mixed radix)
      for (let g = choiceGroups.length - 1; g >= 0; g--) {
        indices[g]++;
        if (indices[g] < choiceGroups[g].options.length) break;
        indices[g] = 0;
      }
    }

    return presets;
  }

  // Too many combinations — fall back to listing each group's options separately
  // Just pick one representative preset per top-level option letter
  const presets: StartingEquipmentPreset[] = [];

  // Create a default preset with first option from each group
  const defaultItems = [...fixedItems];
  for (const group of choiceGroups) {
    if (group.options.length > 0) {
      defaultItems.push(...group.options[0].items);
    }
  }
  presets.push({ label: "Option A (all first choices)", items: defaultItems });

  // Create a second preset with second option from each group (if available)
  const altItems = [...fixedItems];
  let hasAlt = false;
  for (const group of choiceGroups) {
    if (group.options.length > 1) {
      altItems.push(...group.options[1].items);
      hasAlt = true;
    } else if (group.options.length > 0) {
      altItems.push(...group.options[0].items);
    }
  }
  if (hasAlt) {
    presets.push({ label: "Option B (all second choices)", items: altItems });
  }

  return presets;
}

// ---------------------------------------------------------------------------
// PHB text-based fallback parsing
// ---------------------------------------------------------------------------

function buildPresetsFromTextDefault(
  defaultLines: string[],
  classSource: string,
): StartingEquipmentPreset[] {
  // Each line may have "(a)...(b)..." choices or be a fixed item line
  const fixedItems: StartingItem[] = [];
  const choiceGroups: { options: { label: string; items: StartingItem[] }[] }[] = [];

  for (const line of defaultLines) {
    // Check if line has (a)...(b)... pattern
    const choicePattern = /\(([a-z])\)/gi;
    const choiceMatches = [...line.matchAll(choicePattern)];

    if (choiceMatches.length >= 2) {
      // This is a choice line — split by choice markers
      const options: { label: string; items: StartingItem[] }[] = [];

      for (let i = 0; i < choiceMatches.length; i++) {
        const startIdx = choiceMatches[i].index + choiceMatches[i][0].length;
        const endIdx = i + 1 < choiceMatches.length
          ? choiceMatches[i + 1].index
          : line.length;
        const segment = line.substring(startIdx, endIdx).trim();
        const letter = choiceMatches[i][1].toUpperCase();

        const items = parseTextLineItems(segment);
        // Set fallback source for items without source
        for (const item of items) {
          if (!item.source) item.source = classSource;
        }

        if (items.length > 0) {
          options.push({ label: `Option ${letter}`, items });
        }
      }

      if (options.length > 0) {
        choiceGroups.push({ options });
      }
    } else {
      // Fixed items line
      const items = parseTextLineItems(line);
      for (const item of items) {
        if (!item.source) item.source = classSource;
      }
      fixedItems.push(...items);
    }
  }

  return buildPresetsFromDefaultData(
    fixedItems,
    choiceGroups.map((g, i) => ({ label: `Choice ${i + 1}`, ...g })),
  );
}

// ---------------------------------------------------------------------------
// Class starting equipment builder
// ---------------------------------------------------------------------------

function buildClassStartingEquipment(
  classEntry: RawClassEntry,
): ClassStartingEquipment | null {
  const se = classEntry.startingEquipment;
  if (!se) return null;

  const classSource = classEntry.source.toUpperCase();
  let presets: StartingEquipmentPreset[];

  if (se.defaultData && se.defaultData.length > 0) {
    // Use structured defaultData (available for both PHB and XPHB classes)
    const { fixedItems, choiceGroups } = parseDefaultData(se.defaultData, classSource);
    presets = buildPresetsFromDefaultData(fixedItems, choiceGroups);
  } else if (se.default && se.default.length > 0) {
    // Fallback to text-based parsing (only if defaultData is missing)
    presets = buildPresetsFromTextDefault(se.default, classSource);
  } else {
    return null;
  }

  return {
    className: classEntry.name,
    classSource,
    presets,
    goldAlternative: parseGoldAlternative(se.goldAlternative),
  };
}

// ---------------------------------------------------------------------------
// Background starting equipment builder
// ---------------------------------------------------------------------------

function parseBackgroundEquipmentEntry(
  entry: RawBgEquipmentEntry,
  bgSource: string,
): { fixedItems: StartingItem[]; choiceGroups: { label: string; options: { label: string; items: StartingItem[] }[] }[] } {
  const fixedItems: StartingItem[] = [];
  const choiceGroups: { label: string; options: { label: string; items: StartingItem[] }[] }[] = [];

  const keys = Object.keys(entry);

  for (const key of keys) {
    const rawItems = entry[key] as RawDefaultDataItem[] | undefined;
    if (!rawItems || !Array.isArray(rawItems)) continue;

    if (key === "_") {
      // Fixed items
      for (const raw of rawItems) {
        const parsed = parseDefaultDataItem(raw, bgSource);
        if (parsed) fixedItems.push(parsed);
      }
    } else {
      // Choice key
      const items: StartingItem[] = [];
      for (const raw of rawItems) {
        const parsed = parseDefaultDataItem(raw, bgSource);
        if (parsed) items.push(parsed);
      }
      if (items.length > 0) {
        choiceGroups.push({
          label: `Choice`,
          options: [...(choiceGroups.length > 0 ? [] : []), { label: letterToLabel(key), items }],
        });
      }
    }
  }

  return { fixedItems, choiceGroups };
}

function buildBackgroundStartingEquipment(
  bg: RawBackground,
): BackgroundStartingEquipment | null {
  if (!bg.startingEquipment || bg.startingEquipment.length === 0) return null;

  const bgSource = bg.source.toUpperCase();
  const allItems: StartingItem[] = [];

  for (const entry of bg.startingEquipment) {
    const keys = Object.keys(entry);

    for (const key of keys) {
      const rawItems = entry[key] as RawDefaultDataItem[] | undefined;
      if (!rawItems || !Array.isArray(rawItems)) continue;

      for (const raw of rawItems) {
        const parsed = parseDefaultDataItem(raw, bgSource);
        if (parsed) allItems.push(parsed);
      }
    }
  }

  if (allItems.length === 0) return null;

  return {
    backgroundName: bg.name,
    backgroundSource: bgSource,
    items: allItems,
  };
}

// ---------------------------------------------------------------------------
// Class file registry (matches classData.ts import pattern)
// ---------------------------------------------------------------------------

const ALL_CLASS_FILES: RawClassFile[] = [
  artificerClass as unknown as RawClassFile,
  barbarianClass as unknown as RawClassFile,
  bardClass as unknown as RawClassFile,
  clericClass as unknown as RawClassFile,
  druidClass as unknown as RawClassFile,
  fighterClass as unknown as RawClassFile,
  monkClass as unknown as RawClassFile,
  mysticClass as unknown as RawClassFile,
  paladinClass as unknown as RawClassFile,
  rangerClass as unknown as RawClassFile,
  rogueClass as unknown as RawClassFile,
  sidekickClass as unknown as RawClassFile,
  sorcererClass as unknown as RawClassFile,
  warlockClass as unknown as RawClassFile,
  wizardClass as unknown as RawClassFile,
];

// ---------------------------------------------------------------------------
// Build all class starting equipment data
// ---------------------------------------------------------------------------

function buildAllClassStartingEquipment(): ClassStartingEquipment[] {
  const results: ClassStartingEquipment[] = [];

  for (const classFile of ALL_CLASS_FILES) {
    for (const classEntry of classFile.class) {
      const equip = buildClassStartingEquipment(classEntry);
      if (equip) {
        results.push(equip);
      }
    }
  }

  return results.sort((a, b) => a.className.localeCompare(b.className));
}

const ALL_CLASS_STARTING_EQUIPMENT: ClassStartingEquipment[] =
  buildAllClassStartingEquipment();

// ---------------------------------------------------------------------------
// Build all background starting equipment data
// ---------------------------------------------------------------------------

function buildAllBackgroundStartingEquipment(): BackgroundStartingEquipment[] {
  const file = backgroundsData as unknown as RawBackgroundFile;
  const results: BackgroundStartingEquipment[] = [];
  const seen = new Set<string>();

  for (const bg of file.background) {
    // Deduplicate by name — keep first occurrence
    if (seen.has(bg.name)) continue;

    const equip = buildBackgroundStartingEquipment(bg);
    if (equip) {
      seen.add(bg.name);
      results.push(equip);
    }
  }

  return results.sort((a, b) => a.backgroundName.localeCompare(b.backgroundName));
}

const ALL_BACKGROUND_STARTING_EQUIPMENT: BackgroundStartingEquipment[] =
  buildAllBackgroundStartingEquipment();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get starting equipment presets for a class.
 * @param className - The class name (case-insensitive)
 * @param source - The source book (e.g., "PHB", "XPHB", "TCE")
 */
export function getClassStartingEquipment(
  className: string,
  source: string,
): ClassStartingEquipment | undefined {
  const nameLC = className.toLowerCase();
  const sourceUC = source.toUpperCase();

  return ALL_CLASS_STARTING_EQUIPMENT.find(
    (c) =>
      c.className.toLowerCase() === nameLC &&
      c.classSource === sourceUC,
  );
}

/**
 * Get starting equipment for a background.
 * @param backgroundName - The background name (case-insensitive)
 */
export function getBackgroundStartingEquipment(
  backgroundName: string,
): BackgroundStartingEquipment | undefined {
  const nameLC = backgroundName.toLowerCase();

  return ALL_BACKGROUND_STARTING_EQUIPMENT.find(
    (b) => b.backgroundName.toLowerCase() === nameLC,
  );
}

/** All parsed class starting equipment data. */
export { ALL_CLASS_STARTING_EQUIPMENT, ALL_BACKGROUND_STARTING_EQUIPMENT };
