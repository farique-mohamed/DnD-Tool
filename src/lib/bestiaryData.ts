// Core monster books
import mmData from "../../data/bestiary/bestiary-mm.json";
import xmmData from "../../data/bestiary/bestiary-xmm.json";
import vgmData from "../../data/bestiary/bestiary-vgm.json";
import mtfData from "../../data/bestiary/bestiary-mtf.json";
import mpmmData from "../../data/bestiary/bestiary-mpmm.json";
import tceData from "../../data/bestiary/bestiary-tce.json";
import bggData from "../../data/bestiary/bestiary-bgg.json";
import ftdData from "../../data/bestiary/bestiary-ftd.json";
import motData from "../../data/bestiary/bestiary-mot.json";
import vrgrData from "../../data/bestiary/bestiary-vrgr.json";
// Adventure books
import toaData from "../../data/bestiary/bestiary-toa.json";
import bgdiaData from "../../data/bestiary/bestiary-bgdia.json";
import potaData from "../../data/bestiary/bestiary-pota.json";
import ootaData from "../../data/bestiary/bestiary-oota.json";
import sktData from "../../data/bestiary/bestiary-skt.json";
import cosData from "../../data/bestiary/bestiary-cos.json";
import egwData from "../../data/bestiary/bestiary-egw.json";
import sccData from "../../data/bestiary/bestiary-scc.json";
import wbtwData from "../../data/bestiary/bestiary-wbtw.json";
import ggrData from "../../data/bestiary/bestiary-ggr.json";
import erlwData from "../../data/bestiary/bestiary-erlw.json";
import dsotdqData from "../../data/bestiary/bestiary-dsotdq.json";
import pabtsoData from "../../data/bestiary/bestiary-pabtso.json";
import veorData from "../../data/bestiary/bestiary-veor.json";
import crcotnData from "../../data/bestiary/bestiary-crcotn.json";
import qftisData from "../../data/bestiary/bestiary-qftis.json";
import jttrcData from "../../data/bestiary/bestiary-jttrc.json";

import { stripTags } from "./classData";
import { parseTaggedText } from "./dndTagParser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MonsterSize = "T" | "S" | "M" | "L" | "H" | "G";

export interface MonsterAction {
  name: string;
  text: string;
}

/** A single spellcasting block (a monster may have more than one). */
export interface SpellcastingBlock {
  /** Display name, e.g. "Spellcasting" or "Innate Spellcasting" */
  name: string;
  /** Intro paragraph(s) describing the ability, save DC, etc. */
  headerEntries: string[];
  /** Spells prepared, keyed by spell level ("0" = cantrips). Each level has
   *  optional slot count and a list of spell names. */
  spells: Array<{
    level: number;
    slots: number | null;
    spellNames: string[];
  }>;
  /** Spells that can be cast at will (innate / will-block). */
  willSpells: string[];
  /** Spells usable N times per day, keyed by count (e.g. 1, 2, 3). */
  dailySpells: Array<{ perDay: number; spellNames: string[] }>;
}

export interface MonsterInfo {
  name: string;
  source: string;
  size: string;
  type: string;
  alignment: string;
  cr: string;
  /** Numeric CR for sorting (e.g. 0.125 for 1/8, 0.25 for 1/4, etc.) */
  crNum: number;
  hp: number | null;
  hpFormula: string;
  ac: number | null;
  acNote: string;
  speed: string;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  savingThrows: string;
  skills: string;
  senses: string;
  languages: string;
  damageImmunities: string;
  damageResistances: string;
  conditionImmunities: string;
  traits: MonsterAction[];
  actions: MonsterAction[];
  legendaryActions: MonsterAction[];
  reactions: MonsterAction[];
  bonusActions: MonsterAction[];
  spellcasting: SpellcastingBlock[];
}

// ---------------------------------------------------------------------------
// Raw JSON shape helpers
// ---------------------------------------------------------------------------

type RawMonster = Record<string, unknown>;
type RawBestiaryFile = { monster?: RawMonster[] };

// ---------------------------------------------------------------------------
// Alignment decoding
// ---------------------------------------------------------------------------

const ALIGNMENT_MAP: Record<string, string> = {
  L: "Lawful",
  N: "Neutral",
  C: "Chaotic",
  G: "Good",
  E: "Evil",
  U: "Unaligned",
  A: "Any alignment",
};

function decodeAlignment(raw: unknown): string {
  if (!Array.isArray(raw)) return "Unknown";
  if (raw.length === 0) return "Unaligned";

  // Handle special object entries like {alignment: [...], chance: 50}
  const filtered = raw.filter((a) => typeof a === "string") as string[];

  if (filtered.includes("U")) return "Unaligned";
  if (filtered.includes("A")) return "Any alignment";

  const parts = filtered.map((a) => ALIGNMENT_MAP[a] ?? a);
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Size decoding
// ---------------------------------------------------------------------------

const SIZE_MAP: Record<string, string> = {
  T: "Tiny",
  S: "Small",
  M: "Medium",
  L: "Large",
  H: "Huge",
  G: "Gargantuan",
};

function decodeSize(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return "Medium";
  const first = raw[0];
  if (typeof first === "string") return SIZE_MAP[first] ?? first;
  return "Medium";
}

// ---------------------------------------------------------------------------
// Type decoding (can be string or {type, tags})
// ---------------------------------------------------------------------------

function decodeType(raw: unknown): string {
  if (typeof raw === "string") {
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const baseType = typeof obj.type === "string" ? obj.type : "Unknown";
    const tags = Array.isArray(obj.tags)
      ? (obj.tags as string[]).join(", ")
      : null;
    const base = baseType.charAt(0).toUpperCase() + baseType.slice(1);
    return tags ? `${base} (${tags})` : base;
  }
  return "Unknown";
}

// ---------------------------------------------------------------------------
// AC decoding
// ---------------------------------------------------------------------------

function decodeAc(raw: unknown): { value: number | null; note: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { value: null, note: "" };
  }
  const first = raw[0];
  if (typeof first === "number") return { value: first, note: "" };
  if (typeof first === "object" && first !== null) {
    const obj = first as Record<string, unknown>;
    const value = typeof obj.ac === "number" ? obj.ac : null;
    const from = Array.isArray(obj.from)
      ? (obj.from as string[]).join(", ")
      : "";
    return { value, note: from };
  }
  return { value: null, note: "" };
}

// ---------------------------------------------------------------------------
// HP decoding
// ---------------------------------------------------------------------------

function decodeHp(raw: unknown): { average: number | null; formula: string } {
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const average =
      typeof obj.average === "number"
        ? obj.average
        : typeof obj.special === "string"
          ? parseInt(obj.special, 10) || null
          : null;
    const formula = typeof obj.formula === "string" ? obj.formula : "";
    return { average, formula };
  }
  return { average: null, formula: "" };
}

// ---------------------------------------------------------------------------
// Speed decoding
// ---------------------------------------------------------------------------

function decodeSpeed(raw: unknown): string {
  if (typeof raw !== "object" || raw === null) return "";
  const obj = raw as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof obj.walk === "number") parts.push(`${obj.walk} ft.`);
  if (typeof obj.fly === "number") {
    const hover =
      typeof obj.canHover === "boolean" && obj.canHover ? " (hover)" : "";
    parts.push(`fly ${obj.fly} ft.${hover}`);
  }
  if (typeof obj.swim === "number") parts.push(`swim ${obj.swim} ft.`);
  if (typeof obj.burrow === "number") parts.push(`burrow ${obj.burrow} ft.`);
  if (typeof obj.climb === "number") parts.push(`climb ${obj.climb} ft.`);
  return parts.join(", ");
}

// ---------------------------------------------------------------------------
// CR decoding
// ---------------------------------------------------------------------------

const CR_FRACTIONS: Record<string, number> = {
  "1/8": 0.125,
  "1/4": 0.25,
  "1/2": 0.5,
};

function decodeCr(raw: unknown): { label: string; num: number } {
  if (typeof raw === "string") {
    const num = CR_FRACTIONS[raw] ?? parseFloat(raw);
    return { label: raw, num: isNaN(num) ? 0 : num };
  }
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.cr === "string") {
      const num = CR_FRACTIONS[obj.cr] ?? parseFloat(obj.cr);
      return { label: obj.cr, num: isNaN(num) ? 0 : num };
    }
  }
  return { label: "Unknown", num: -1 };
}

// ---------------------------------------------------------------------------
// Skills / saving throws
// ---------------------------------------------------------------------------

function decodeKvString(raw: unknown): string {
  if (typeof raw !== "object" || raw === null) return "";
  const obj = raw as Record<string, string>;
  return Object.entries(obj)
    .map(([k, v]) => {
      const name = k.charAt(0).toUpperCase() + k.slice(1);
      return `${name} ${v}`;
    })
    .join(", ");
}

// ---------------------------------------------------------------------------
// String array fields (senses, languages, damage immunities, etc.)
// ---------------------------------------------------------------------------

function decodeStringArray(raw: unknown): string {
  if (!Array.isArray(raw)) return "";
  return (raw as unknown[])
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (typeof entry === "object" && entry !== null) {
        // e.g. {immune: ["fire", "cold"], note: "..."}
        const obj = entry as Record<string, unknown>;
        const inner = Array.isArray(obj.immune)
          ? (obj.immune as string[]).join(", ")
          : Array.isArray(obj.resist)
            ? (obj.resist as string[]).join(", ")
            : "";
        const note = typeof obj.note === "string" ? ` (${obj.note})` : "";
        return inner + note;
      }
      return String(entry);
    })
    .join(", ");
}

// ---------------------------------------------------------------------------
// Spellcasting blocks
// ---------------------------------------------------------------------------

function decodeSpellcasting(raw: unknown): SpellcastingBlock[] {
  if (!Array.isArray(raw)) return [];
  const result: SpellcastingBlock[] = [];

  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;

    const name = typeof obj.name === "string" ? obj.name : "Spellcasting";

    // Header entries
    const headerEntries = Array.isArray(obj.headerEntries)
      ? (obj.headerEntries as unknown[]).map((e) =>
          typeof e === "string" ? parseTaggedText(e) : "",
        )
      : [];

    // Levelled spells: { "0": {spells: [...]}, "1": {slots: 4, spells: [...]}, ... }
    const spells: SpellcastingBlock["spells"] = [];
    if (typeof obj.spells === "object" && obj.spells !== null) {
      const spellsObj = obj.spells as Record<string, unknown>;
      for (const levelKey of Object.keys(spellsObj).sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10),
      )) {
        const entry = spellsObj[levelKey];
        if (typeof entry !== "object" || entry === null) continue;
        const levelEntry = entry as Record<string, unknown>;
        const slots =
          typeof levelEntry.slots === "number" ? levelEntry.slots : null;
        const spellNames = Array.isArray(levelEntry.spells)
          ? (levelEntry.spells as unknown[]).map((s) =>
              typeof s === "string" ? parseTaggedText(s) : "",
            )
          : [];
        spells.push({ level: parseInt(levelKey, 10), slots, spellNames });
      }
    }

    // Will spells (at-will innate)
    const willSpells = Array.isArray(obj.will)
      ? (obj.will as unknown[]).map((s) =>
          typeof s === "string" ? parseTaggedText(s) : "",
        )
      : [];

    // Daily spells: { "1": [...], "2": [...], "3": [...] }
    const dailySpells: SpellcastingBlock["dailySpells"] = [];
    if (typeof obj.daily === "object" && obj.daily !== null) {
      const dailyObj = obj.daily as Record<string, unknown>;
      for (const countKey of Object.keys(dailyObj).sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10),
      )) {
        const entry = dailyObj[countKey];
        if (!Array.isArray(entry)) continue;
        const spellNames = (entry as unknown[]).map((s) =>
          typeof s === "string" ? parseTaggedText(s) : "",
        );
        dailySpells.push({
          perDay: parseInt(countKey, 10),
          spellNames,
        });
      }
    }

    result.push({ name, headerEntries, spells, willSpells, dailySpells });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Actions / traits
// ---------------------------------------------------------------------------

function decodeActions(raw: unknown): MonsterAction[] {
  if (!Array.isArray(raw)) return [];
  const result: MonsterAction[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const name =
      typeof obj.name === "string" ? stripTags(obj.name) : "Unknown";
    const entries = Array.isArray(obj.entries)
      ? (obj.entries as unknown[])
          .map((e) => (typeof e === "string" ? parseTaggedText(e) : ""))
          .filter(Boolean)
          .join(" ")
      : "";
    result.push({ name, text: entries });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Build MonsterInfo from raw JSON
// ---------------------------------------------------------------------------

function buildMonsterInfo(raw: RawMonster): MonsterInfo {
  const alignment = decodeAlignment(raw.alignment);
  const size = decodeSize(raw.size);
  const type = decodeType(raw.type);
  const { value: ac, note: acNote } = decodeAc(raw.ac);
  const { average: hp, formula: hpFormula } = decodeHp(raw.hp);
  const speed = decodeSpeed(raw.speed);
  const { label: cr, num: crNum } = decodeCr(raw.cr);
  const savingThrows = decodeKvString(raw.save);
  const skills = decodeKvString(raw.skill);
  const senses = decodeStringArray(raw.senses);
  const languages = Array.isArray(raw.languages)
    ? (raw.languages as string[]).join(", ")
    : "";
  const damageImmunities = decodeStringArray(raw.immune);
  const damageResistances = decodeStringArray(raw.resist);
  const conditionImmunities = decodeStringArray(raw.conditionImmune);

  return {
    name: typeof raw.name === "string" ? raw.name : "Unknown",
    source: typeof raw.source === "string" ? raw.source : "",
    size,
    type,
    alignment,
    cr,
    crNum,
    hp,
    hpFormula,
    ac,
    acNote,
    speed,
    str: typeof raw.str === "number" ? raw.str : 10,
    dex: typeof raw.dex === "number" ? raw.dex : 10,
    con: typeof raw.con === "number" ? raw.con : 10,
    int: typeof raw.int === "number" ? raw.int : 10,
    wis: typeof raw.wis === "number" ? raw.wis : 10,
    cha: typeof raw.cha === "number" ? raw.cha : 10,
    savingThrows,
    skills,
    senses,
    languages,
    damageImmunities,
    damageResistances,
    conditionImmunities,
    traits: decodeActions(raw.trait),
    actions: decodeActions(raw.action),
    legendaryActions: decodeActions(raw.legendary),
    reactions: decodeActions(raw.reaction),
    bonusActions: decodeActions(raw.bonus),
    spellcasting: decodeSpellcasting(raw.spellcasting),
  };
}

// ---------------------------------------------------------------------------
// Merge all bestiary files — deduplicate by name (first occurrence wins)
// ---------------------------------------------------------------------------

const RAW_FILES: RawBestiaryFile[] = [
  // Core monster manuals first (preferred source)
  mmData as RawBestiaryFile,
  xmmData as RawBestiaryFile,
  mpmmData as RawBestiaryFile,
  vgmData as RawBestiaryFile,
  mtfData as RawBestiaryFile,
  tceData as RawBestiaryFile,
  bggData as RawBestiaryFile,
  ftdData as RawBestiaryFile,
  motData as RawBestiaryFile,
  vrgrData as RawBestiaryFile,
  ggrData as RawBestiaryFile,
  erlwData as RawBestiaryFile,
  // Adventure books
  toaData as RawBestiaryFile,
  bgdiaData as RawBestiaryFile,
  potaData as RawBestiaryFile,
  ootaData as RawBestiaryFile,
  sktData as RawBestiaryFile,
  cosData as RawBestiaryFile,
  egwData as RawBestiaryFile,
  sccData as RawBestiaryFile,
  wbtwData as RawBestiaryFile,
  dsotdqData as RawBestiaryFile,
  pabtsoData as RawBestiaryFile,
  veorData as RawBestiaryFile,
  crcotnData as RawBestiaryFile,
  qftisData as RawBestiaryFile,
  jttrcData as RawBestiaryFile,
];

function buildMonsterList(): MonsterInfo[] {
  const result: MonsterInfo[] = [];

  for (const file of RAW_FILES) {
    for (const raw of file.monster ?? []) {
      if (typeof raw.name !== "string") continue;
      result.push(buildMonsterInfo(raw));
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export const MONSTER_LIST: MonsterInfo[] = buildMonsterList();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getMonsterByName(name: string): MonsterInfo | undefined {
  return MONSTER_LIST.find(
    (m) => m.name.toLowerCase() === name.toLowerCase(),
  );
}

/** Returns ability score modifier string, e.g. +3, -1 */
export function abilityMod(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
}

/** CR display label (unchanged from raw string) */
export function crLabel(cr: string): string {
  return cr === "Unknown" ? "—" : `CR ${cr}`;
}
