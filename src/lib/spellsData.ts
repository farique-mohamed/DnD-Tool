import { parseTaggedText } from "@/lib/dndTagParser";
import { getSpellClasses } from "@/lib/spellClassMap";

// ---------------------------------------------------------------------------
// Raw JSON imports — non-fluff spell files only
// ---------------------------------------------------------------------------
import phbData from "../../data/spells/spells-phb.json";
import xphbData from "../../data/spells/spells-xphb.json";
import xgeData from "../../data/spells/spells-xge.json";
import tceData from "../../data/spells/spells-tce.json";
import egwData from "../../data/spells/spells-egw.json";
import ggrData from "../../data/spells/spells-ggr.json";
import ftdData from "../../data/spells/spells-ftd.json";
import aagData from "../../data/spells/spells-aag.json";
import aiData from "../../data/spells/spells-ai.json";
import aitfrAvtData from "../../data/spells/spells-aitfr-avt.json";
import bmtData from "../../data/spells/spells-bmt.json";
import frhofData from "../../data/spells/spells-frhof.json";
import idrotfData from "../../data/spells/spells-idrotf.json";
import llkData from "../../data/spells/spells-llk.json";
import satoData from "../../data/spells/spells-sato.json";
import sccData from "../../data/spells/spells-scc.json";
import tdcsrData from "../../data/spells/spells-tdcsr.json";

// ---------------------------------------------------------------------------
// Spell interface
// ---------------------------------------------------------------------------

export interface Spell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  components: string;
  description: string;
  source: string;
  higherLevel?: string;
  classes: string[];
}

// ---------------------------------------------------------------------------
// School code → display name
// ---------------------------------------------------------------------------

const SCHOOL_MAP: Record<string, string> = {
  A: "Abjuration",
  C: "Conjuration",
  D: "Divination",
  EN: "Enchantment",
  EV: "Evocation",
  V: "Evocation", // XPHB uses "V" for Evocation
  I: "Illusion",
  N: "Necromancy",
  T: "Transmutation",
};

function mapSchool(code: string): string {
  return SCHOOL_MAP[code] ?? code;
}

// ---------------------------------------------------------------------------
// Casting time parsing
// ---------------------------------------------------------------------------

interface RawTime {
  number?: number;
  unit?: string;
  condition?: string;
}

function parseCastingTime(time: unknown): string {
  if (!Array.isArray(time) || time.length === 0) return "1 action";
  const entry = time[0] as RawTime;
  const num = entry.number ?? 1;
  const unit = entry.unit ?? "action";

  if (unit === "bonus") return `${num} bonus action`;
  if (unit === "reaction") return `${num} reaction`;
  if (unit === "minute") return `${num} minute${num !== 1 ? "s" : ""}`;
  if (unit === "hour") return `${num} hour${num !== 1 ? "s" : ""}`;
  return `${num} ${unit}`;
}

// ---------------------------------------------------------------------------
// Range parsing
// ---------------------------------------------------------------------------

interface RawDistance {
  type?: string;
  amount?: number;
}

interface RawRange {
  type?: string;
  distance?: RawDistance;
}

function parseRange(range: unknown): string {
  if (!range || typeof range !== "object") return "Self";
  const r = range as RawRange;

  if (r.type === "special") return "Special";

  if (r.type === "point") {
    const dist = r.distance;
    if (!dist) return "Self";
    if (dist.type === "self") return "Self";
    if (dist.type === "touch") return "Touch";
    if (dist.type === "unlimited") return "Unlimited";
    if (dist.type === "sight") return "Sight";
    if (dist.type === "feet") return `${dist.amount ?? 0} feet`;
    if (dist.type === "miles") {
      const amt = dist.amount ?? 1;
      return `${amt} mile${amt !== 1 ? "s" : ""}`;
    }
    return dist.type ?? "Self";
  }

  // Area types: cone, line, cube, sphere, radius, emanation, hemisphere
  const areaLabel: Record<string, string> = {
    cone: "Self (cone)",
    line: "Self (line)",
    cube: "Self (cube)",
    sphere: "Self (sphere)",
    radius: "Self (radius)",
    emanation: "Self (emanation)",
    hemisphere: "Self (hemisphere)",
  };

  if (r.type && areaLabel[r.type]) return areaLabel[r.type];

  return "Self";
}

// ---------------------------------------------------------------------------
// Duration parsing
// ---------------------------------------------------------------------------

interface RawDurationEntry {
  type?: string;
  concentration?: boolean;
  duration?: {
    type?: string;
    amount?: number;
  };
}

function parseDuration(duration: unknown): string {
  if (!Array.isArray(duration) || duration.length === 0) return "Instantaneous";
  const entry = duration[0] as RawDurationEntry;

  if (entry.type === "instant") return "Instantaneous";
  if (entry.type === "permanent") return "Until dispelled";
  if (entry.type === "special") return "Special";

  if (entry.type === "timed" && entry.duration) {
    const amt = entry.duration.amount ?? 1;
    const unit = entry.duration.type ?? "round";
    const unitLabel =
      unit === "round" ? `round${amt !== 1 ? "s" : ""}` :
      unit === "minute" ? `minute${amt !== 1 ? "s" : ""}` :
      unit === "hour" ? `hour${amt !== 1 ? "s" : ""}` :
      unit === "day" ? `day${amt !== 1 ? "s" : ""}` :
      unit;

    if (entry.concentration) return `Concentration, up to ${amt} ${unitLabel}`;
    return `${amt} ${unitLabel}`;
  }

  return "Instantaneous";
}

// ---------------------------------------------------------------------------
// Components parsing
// ---------------------------------------------------------------------------

interface RawComponents {
  v?: boolean;
  s?: boolean;
  m?: string | boolean | object;
  r?: boolean;
}

function parseComponents(components: unknown): string {
  if (!components || typeof components !== "object") return "";
  const c = components as RawComponents;
  const parts: string[] = [];
  if (c.v) parts.push("V");
  if (c.s) parts.push("S");
  if (c.m) parts.push("M");
  if (c.r) parts.push("R");
  return parts.join(", ");
}

// ---------------------------------------------------------------------------
// Entries parsing — recursive plain-text extractor
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

function parseHigherLevel(entriesHigherLevel: unknown): string | undefined {
  if (!Array.isArray(entriesHigherLevel) || entriesHigherLevel.length === 0)
    return undefined;
  return entriesHigherLevel
    .map((e) => extractEntryText(e as RawEntry))
    .filter(Boolean)
    .join("\n\n") || undefined;
}

// ---------------------------------------------------------------------------
// Raw spell shape (minimal — only fields we read)
// ---------------------------------------------------------------------------

interface RawSpell {
  name: string;
  source: string;
  level: number;
  school: string;
  time: unknown;
  range: unknown;
  components: unknown;
  duration: unknown;
  entries: unknown;
  entriesHigherLevel?: unknown;
}

interface RawSpellFile {
  spell: RawSpell[];
}

// ---------------------------------------------------------------------------
// Convert a single raw entry to our Spell type
// ---------------------------------------------------------------------------

function convertSpell(raw: RawSpell): Spell {
  return {
    name: raw.name,
    level: raw.level,
    school: mapSchool(raw.school),
    castingTime: parseCastingTime(raw.time),
    range: parseRange(raw.range),
    duration: parseDuration(raw.duration),
    components: parseComponents(raw.components),
    description: parseEntries(raw.entries),
    source: raw.source,
    higherLevel: parseHigherLevel(raw.entriesHigherLevel),
    classes: getSpellClasses(raw.name),
  };
}

// ---------------------------------------------------------------------------
// Aggregate all spell files
// ---------------------------------------------------------------------------

const ALL_RAW_FILES: RawSpellFile[] = [
  phbData as RawSpellFile,
  xphbData as RawSpellFile,
  xgeData as RawSpellFile,
  tceData as RawSpellFile,
  egwData as RawSpellFile,
  ggrData as RawSpellFile,
  ftdData as RawSpellFile,
  aagData as RawSpellFile,
  aiData as RawSpellFile,
  aitfrAvtData as RawSpellFile,
  bmtData as RawSpellFile,
  frhofData as RawSpellFile,
  idrotfData as RawSpellFile,
  llkData as RawSpellFile,
  satoData as RawSpellFile,
  sccData as RawSpellFile,
  tdcsrData as RawSpellFile,
];

function buildSpells(): Spell[] {
  const seen = new Set<string>();
  const result: Spell[] = [];

  for (const file of ALL_RAW_FILES) {
    for (const raw of file.spell) {
      const key = `${raw.name}|${raw.source}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(convertSpell(raw));
    }
  }

  // Sort alphabetically by name, then source
  result.sort((a, b) => {
    const n = a.name.localeCompare(b.name);
    return n !== 0 ? n : a.source.localeCompare(b.source);
  });

  return result;
}

export const SPELLS: Spell[] = buildSpells();

export const SPELL_SOURCES: string[] = Array.from(
  new Set(SPELLS.map((s) => s.source))
).sort();
