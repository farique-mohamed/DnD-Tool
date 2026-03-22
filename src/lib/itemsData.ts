import { parseTaggedText } from "@/lib/dndTagParser";

// ---------------------------------------------------------------------------
// Raw JSON imports
// ---------------------------------------------------------------------------
import baseItemsData from "../../data/items-base.json";
import itemsData from "../../data/items.json";

// ---------------------------------------------------------------------------
// Item interface
// ---------------------------------------------------------------------------

export interface Item {
  name: string;
  source: string;
  type: string;
  rarity: string;
  weight?: number;
  value?: number;
  description: string;
  reqAttune?: string;
  weaponCategory?: string;
  dmg1?: string;
  dmgType?: string;
  range?: string;
  ac?: number;
  bonusAc?: string;
  bonusWeapon?: string;
  bonusSpellAttack?: string;
}

// ---------------------------------------------------------------------------
// Item type abbreviation → display name
// ---------------------------------------------------------------------------

const ITEM_TYPE_MAP: Record<string, string> = {
  $: "Treasure",
  $A: "Treasure (Art Object)",
  $C: "Treasure (Coinage)",
  $G: "Treasure (Gemstone)",
  A: "Ammunition",
  AF: "Ammunition",
  AIR: "Vehicle (Air)",
  AT: "Artisan's Tools",
  EXP: "Explosive",
  FD: "Food and Drink",
  G: "Adventuring Gear",
  GS: "Gaming Set",
  GV: "Generic Variant",
  HA: "Heavy Armor",
  IDG: "Illegal Drug",
  INS: "Instrument",
  LA: "Light Armor",
  M: "Melee Weapon",
  MA: "Medium Armor",
  MNT: "Mount",
  OTH: "Other",
  P: "Potion",
  R: "Ranged Weapon",
  RD: "Rod",
  RG: "Ring",
  S: "Shield",
  SC: "Scroll",
  SCF: "Spellcasting Focus",
  SHP: "Vehicle (Water)",
  SPC: "Vehicle (Space)",
  T: "Tool",
  TAH: "Tack and Harness",
  TB: "Trade Bar",
  TG: "Trade Good",
  VEH: "Vehicle (Land)",
  WD: "Wand",
};

// ---------------------------------------------------------------------------
// Damage type abbreviation → display name
// ---------------------------------------------------------------------------

const DMG_TYPE_MAP: Record<string, string> = {
  B: "Bludgeoning",
  P: "Piercing",
  S: "Slashing",
  N: "Necrotic",
  R: "Radiant",
  F: "Fire",
  C: "Cold",
  L: "Lightning",
  T: "Thunder",
  O: "Force",
  A: "Acid",
  Y: "Psychic",
};

function mapType(typeCode: string | undefined): string {
  if (!typeCode) return "Other";
  // Strip source suffix (e.g. "M|XPHB" → "M")
  const code = typeCode.split("|")[0]!;
  return ITEM_TYPE_MAP[code] ?? "Other";
}

function mapDmgType(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return DMG_TYPE_MAP[code] ?? code;
}

// ---------------------------------------------------------------------------
// Entries parsing — recursive plain-text extractor (same as spellsData)
// ---------------------------------------------------------------------------

type RawEntry =
  | string
  | { type: string; entries?: RawEntry[]; items?: RawEntry[]; name?: string };

function extractEntryText(entry: RawEntry): string {
  if (typeof entry === "string") return parseTaggedText(entry);
  if (typeof entry !== "object" || entry === null) return "";

  if (entry.type === "list" && Array.isArray(entry.items)) {
    return entry.items.map((item) => `• ${extractEntryText(item)}`).join("\n");
  }
  if (
    (entry.type === "entries" || entry.type === "section") &&
    Array.isArray(entry.entries)
  ) {
    const header = entry.name ? `${entry.name}: ` : "";
    return header + entry.entries.map(extractEntryText).join("\n\n");
  }
  if (entry.type === "table") return "";
  if (Array.isArray((entry as { entries?: RawEntry[] }).entries)) {
    return ((entry as { entries: RawEntry[] }).entries)
      .map(extractEntryText)
      .join("\n\n");
  }
  return "";
}

function parseEntries(entries: unknown): string {
  if (!Array.isArray(entries)) return "";
  return entries
    .map((e) => extractEntryText(e as RawEntry))
    .filter(Boolean)
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Raw shapes (minimal — only fields we read)
// ---------------------------------------------------------------------------

interface RawBaseItem {
  name: string;
  source: string;
  type?: string;
  rarity?: string;
  weight?: number;
  value?: number;
  weaponCategory?: string;
  property?: string[];
  range?: string;
  dmg1?: string;
  dmgType?: string;
  ac?: number;
  entries?: unknown;
}

interface RawItem {
  name: string;
  source: string;
  type?: string;
  rarity?: string;
  weight?: number;
  value?: number;
  reqAttune?: string | boolean;
  wondrous?: boolean;
  entries?: unknown;
  bonusAc?: string;
  bonusWeapon?: string;
  bonusSpellAttack?: string;
  weaponCategory?: string;
  dmg1?: string;
  dmgType?: string;
  range?: string;
  ac?: number;
}

interface RawBaseItemFile {
  baseitem: RawBaseItem[];
}

interface RawItemFile {
  item: RawItem[];
}

// ---------------------------------------------------------------------------
// Rarity normalisation
// ---------------------------------------------------------------------------

function normalizeRarity(rarity: string | undefined): string {
  if (!rarity) return "none";
  return rarity.toLowerCase();
}

// ---------------------------------------------------------------------------
// Convert raw entries to our Item type
// ---------------------------------------------------------------------------

function convertBaseItem(raw: RawBaseItem): Item {
  return {
    name: raw.name,
    source: raw.source,
    type: mapType(raw.type),
    rarity: normalizeRarity(raw.rarity),
    weight: raw.weight,
    value: raw.value,
    description: parseEntries(raw.entries),
    weaponCategory: raw.weaponCategory,
    dmg1: raw.dmg1,
    dmgType: mapDmgType(raw.dmgType),
    range: raw.range,
    ac: raw.ac,
  };
}

function convertItem(raw: RawItem): Item {
  const attune =
    raw.reqAttune === true
      ? "Yes"
      : typeof raw.reqAttune === "string"
        ? raw.reqAttune
        : undefined;

  return {
    name: raw.name,
    source: raw.source,
    type: mapType(raw.type),
    rarity: normalizeRarity(raw.rarity),
    weight: raw.weight,
    value: raw.value,
    description: parseEntries(raw.entries),
    reqAttune: attune,
    weaponCategory: raw.weaponCategory,
    dmg1: raw.dmg1,
    dmgType: mapDmgType(raw.dmgType),
    range: raw.range,
    ac: raw.ac,
    bonusAc: raw.bonusAc,
    bonusWeapon: raw.bonusWeapon,
    bonusSpellAttack: raw.bonusSpellAttack,
  };
}

// ---------------------------------------------------------------------------
// Aggregate all items
// ---------------------------------------------------------------------------

function buildItems(): Item[] {
  const seen = new Set<string>();
  const result: Item[] = [];

  // Base items first
  const baseFile = baseItemsData as RawBaseItemFile;
  for (const raw of baseFile.baseitem) {
    const key = `${raw.name}|${raw.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(convertBaseItem(raw));
  }

  // Magic / special items
  const itemFile = itemsData as RawItemFile;
  for (const raw of itemFile.item) {
    const key = `${raw.name}|${raw.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(convertItem(raw));
  }

  // Sort alphabetically by name, then source
  result.sort((a, b) => {
    const n = a.name.localeCompare(b.name);
    return n !== 0 ? n : a.source.localeCompare(b.source);
  });

  return result;
}

export const ITEMS: Item[] = buildItems();

export const ITEM_SOURCES: string[] = Array.from(
  new Set(ITEMS.map((i) => i.source))
).sort();

export const ITEM_TYPES: string[] = Array.from(
  new Set(ITEMS.map((i) => i.type))
).sort();

export const ITEM_RARITIES: string[] = Array.from(
  new Set(ITEMS.map((i) => i.rarity))
).sort();
