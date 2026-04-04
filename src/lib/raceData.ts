// ---------------------------------------------------------------------------
// Race / Species data — parsed from data/races.json (5etools format)
// ---------------------------------------------------------------------------
import racesData from "../../data/races.json";

// ---------------------------------------------------------------------------
// Interfaces (kept identical for backward compatibility)
// ---------------------------------------------------------------------------

export interface RacialTrait {
  name: string;
  description: string;
}

export interface AbilityScoreBonus {
  ability: string;
  amount: number;
  choiceCount?: number;
  excludeAbilities?: string[];
}

export interface RaceInfo {
  name: string;
  source: string;
  speed: number;
  size: string;
  languages: string[];
  traits: RacialTrait[];
  abilityScoreIncrease?: string;
  abilityBonuses?: AbilityScoreBonus[];
  skillProficiencies?: string[];
}

// ---------------------------------------------------------------------------
// Raw JSON types
// ---------------------------------------------------------------------------

interface RawAbility {
  [key: string]: number | undefined;
  choose?: never;
}

interface RawEntry {
  name?: string;
  type?: string;
  entries?: (string | RawEntry)[];
  entry?: string;
  items?: RawEntry[];
  [key: string]: unknown;
}

interface RawCopy {
  name: string;
  source: string;
  raceName?: string;
  raceSource?: string;
  _mod?: unknown;
}

interface RawRace {
  name: string;
  source: string;
  size?: string[];
  speed?: number | { walk?: number; fly?: number; climb?: number; swim?: number; [key: string]: unknown };
  ability?: RawAbility[];
  languageProficiencies?: Array<Record<string, unknown>>;
  entries?: (string | RawEntry)[];
  traitTags?: string[];
  _copy?: RawCopy;
  lineage?: string | boolean | null;
  skillProficiencies?: Array<Record<string, unknown>>;
  darkvision?: number;
  raceName?: string;
  raceSource?: string;
  [key: string]: unknown;
}

interface RawRacesFile {
  _meta: { internalCopies: string[] };
  race: RawRace[];
  subrace?: RawRace[];
}

// ---------------------------------------------------------------------------
// Size code → display name
// ---------------------------------------------------------------------------

const SIZE_MAP: Record<string, string> = {
  T: "Tiny",
  S: "Small",
  M: "Medium",
  L: "Large",
  H: "Huge",
  G: "Gargantuan",
};

function parseSize(sizeArr?: string[]): string {
  if (!sizeArr || sizeArr.length === 0) return "Medium";
  if (sizeArr.length === 1) return SIZE_MAP[sizeArr[0]!] ?? "Medium";
  return sizeArr.map((s) => SIZE_MAP[s] ?? s).join(" or ");
}

// ---------------------------------------------------------------------------
// Speed parsing
// ---------------------------------------------------------------------------

function parseSpeed(speed?: number | { walk?: number; [key: string]: unknown }): number {
  if (speed === undefined || speed === null) return 30;
  if (typeof speed === "number") return speed;
  if (typeof speed === "object" && speed.walk !== undefined) return speed.walk as number;
  return 30;
}

// ---------------------------------------------------------------------------
// Ability score parsing
// ---------------------------------------------------------------------------

const ABILITY_ABBR: Record<string, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

function parseAbilityString(abilityArr?: RawAbility[]): string {
  if (!abilityArr || abilityArr.length === 0) return "";
  const parts: string[] = [];
  for (const entry of abilityArr) {
    for (const [key, value] of Object.entries(entry)) {
      if (key === "choose") continue;
      const abbr = ABILITY_ABBR[key];
      if (abbr && typeof value === "number") {
        parts.push(`${abbr} ${value > 0 ? "+" : ""}${value}`);
      }
    }
    // Handle "choose" objects
    const choose = (entry as Record<string, unknown>).choose as
      | { from?: string[]; count?: number; amount?: number }
      | undefined;
    if (choose) {
      const count = choose.count ?? 1;
      const amount = choose.amount ?? 1;
      if (choose.from && choose.from.length > 0) {
        const fromStr = choose.from.map((a: string) => ABILITY_ABBR[a] ?? a.toUpperCase()).join("/");
        parts.push(`Choose ${count} from ${fromStr} +${amount}`);
      } else {
        parts.push(`Choose ${count} ability +${amount}`);
      }
    }
  }
  return parts.join(", ");
}

/** Map JSON abbreviations ("str", "dex", …) → full ability names ("strength", …) */
const ABBR_TO_FULL: Record<string, string> = {
  str: "strength",
  dex: "dexterity",
  con: "constitution",
  int: "intelligence",
  wis: "wisdom",
  cha: "charisma",
};

function parseAbilityBonuses(abilityArr?: RawAbility[]): AbilityScoreBonus[] | undefined {
  if (!abilityArr || abilityArr.length === 0) return undefined;
  const bonuses: AbilityScoreBonus[] = [];
  for (const entry of abilityArr) {
    for (const [key, value] of Object.entries(entry)) {
      if (key === "choose") continue;
      if (typeof value === "number") {
        bonuses.push({ ability: ABBR_TO_FULL[key] ?? key, amount: value });
      }
    }
    // Handle "choose" objects (e.g. Half-Elf: choose 2 from a list)
    const choose = (entry as Record<string, unknown>).choose as
      | { from?: string[]; count?: number; amount?: number }
      | undefined;
    if (choose) {
      const count = choose.count ?? 1;
      const amount = choose.amount ?? 1;
      if (choose.from && choose.from.length > 0) {
        // "from" = abilities you CAN choose. Convert to excludeAbilities
        // (abilities NOT in the from list) for the UI filter.
        const ALL_ABILITIES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
        const allowed = new Set(choose.from.map((a) => ABBR_TO_FULL[a] ?? a));
        const excluded = ALL_ABILITIES.filter((a) => !allowed.has(a));
        bonuses.push({
          ability: "choice",
          amount,
          choiceCount: count,
          excludeAbilities: excluded,
        });
      } else {
        bonuses.push({
          ability: "choice",
          amount,
          choiceCount: count,
        });
      }
    }
  }
  return bonuses.length > 0 ? bonuses : undefined;
}

// ---------------------------------------------------------------------------
// Language parsing
// ---------------------------------------------------------------------------

function capitalizeWord(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parseLanguages(langProfs?: Array<Record<string, unknown>>): string[] {
  if (!langProfs || langProfs.length === 0) return ["Common"];
  const languages: string[] = [];
  for (const entry of langProfs) {
    for (const [key, value] of Object.entries(entry)) {
      if (key === "anyStandard" || key === "any") {
        const count = typeof value === "number" ? value : 1;
        languages.push(
          count === 1
            ? "One extra language of your choice"
            : `${count} extra languages of your choice`,
        );
      } else if (key === "other") {
        // "other: true" means one extra language
        if (value === true && !languages.some((l) => l.includes("extra language"))) {
          languages.push("One extra language of your choice");
        }
      } else if (key === "choose") {
        // Skip choose entries — too complex to display simply
        continue;
      } else if (value === true) {
        languages.push(capitalizeWord(key));
      }
    }
  }
  // Ensure Common is present if explicitly listed
  return languages.length > 0 ? languages : ["Common"];
}

// ---------------------------------------------------------------------------
// Strip 5etools tags from text
// ---------------------------------------------------------------------------

function stripTags(text: string): string {
  // {@tag content} or {@tag content|extra|extra} → appropriate text
  return text.replace(/\{@(\w+)\s+([^}]*)\}/g, (_match, tag: string, content: string) => {
    // Split on | to get the display text
    const parts = content.split("|");
    switch (tag) {
      case "dc":
        return `DC ${parts[0]}`;
      case "damage":
      case "dice":
      case "hit":
        return parts[0]!;
      case "spell":
      case "skill":
      case "condition":
      case "creature":
      case "item":
      case "race":
      case "class":
      case "action":
      case "feat":
      case "background":
      case "language":
      case "table":
      case "book":
      case "adventure":
      case "deity":
      case "disease":
      case "hazard":
      case "object":
      case "optfeature":
      case "psionic":
      case "reward":
      case "trap":
      case "vehicle":
      case "classFeature":
      case "subclassFeature":
        // Use display name (last part if pipe-separated, otherwise first part)
        return parts.length > 2 ? parts[2]! : parts[0]!;
      case "sense":
      case "variantrule":
        // {@sense Darkvision|XPHB} → "Darkvision", {@variantrule Resistance|XPHB} → "Resistance"
        return parts.length > 2 ? parts[2]! : parts[0]!;
      case "filter":
        return parts[0]!;
      case "scaledamage":
      case "scaledice":
        return parts[0]!;
      case "atk":
        return "";
      case "recharge":
        return parts[0] ? `(Recharge ${parts[0]})` : "(Recharge)";
      case "chance":
        return `${parts[0]}%`;
      case "note":
        return parts[0]!;
      case "b":
      case "bold":
        return parts[0]!;
      case "i":
      case "italic":
        return parts[0]!;
      case "status":
        return parts[0]!;
      default:
        return parts[0]!;
    }
  });
}

// ---------------------------------------------------------------------------
// Entry → text extraction (recursive)
// ---------------------------------------------------------------------------

function entryToString(entry: string | RawEntry): string {
  if (typeof entry === "string") return stripTags(entry);

  if (entry.type === "entries" && entry.entries) {
    return entry.entries.map(entryToString).join("\n");
  }

  if (entry.type === "list" && entry.items) {
    return entry.items
      .map((item) => {
        if (typeof item === "string") return `- ${stripTags(item)}`;
        if (item.name && item.entry) return `- ${item.name}: ${stripTags(item.entry)}`;
        if (item.name && item.entries) return `- ${item.name}: ${item.entries.map(entryToString).join(" ")}`;
        if (item.entries) return `- ${item.entries.map(entryToString).join(" ")}`;
        if (item.entry) return `- ${stripTags(item.entry)}`;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  if (entry.type === "table") {
    // Skip tables — not useful as plain text traits
    return "";
  }

  if (entry.type === "inset" || entry.type === "insetReadaloud") {
    if (entry.entries) return entry.entries.map(entryToString).join("\n");
    return "";
  }

  // Fallback: if it has entries, recurse
  if (entry.entries) {
    return entry.entries.map(entryToString).join("\n");
  }

  if (typeof entry.entry === "string") return stripTags(entry.entry);

  return "";
}

// ---------------------------------------------------------------------------
// Parse entries → RacialTrait[]
// ---------------------------------------------------------------------------

function parseTraits(entries?: (string | RawEntry)[]): RacialTrait[] {
  if (!entries || entries.length === 0) return [];
  const traits: RacialTrait[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      // Top-level string entry — skip (usually flavor text or age/size/alignment blocks)
      continue;
    }

    if (entry.type === "entries" && entry.name) {
      // Named entry block → this is a trait
      const description = entry.entries
        ? entry.entries.map(entryToString).join("\n")
        : "";
      if (description.trim()) {
        traits.push({
          name: entry.name,
          description: description.trim(),
        });
      }
    }
  }

  return traits;
}

// ---------------------------------------------------------------------------
// Parse skill proficiencies
// ---------------------------------------------------------------------------

function parseSkillProficiencies(skillProfs?: Array<Record<string, unknown>>): string[] | undefined {
  if (!skillProfs || skillProfs.length === 0) return undefined;
  const skills: string[] = [];
  for (const entry of skillProfs) {
    for (const [key, value] of Object.entries(entry)) {
      if (key === "choose" || key === "any") continue;
      if (value === true) {
        skills.push(
          key
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        );
      }
    }
  }
  return skills.length > 0 ? skills : undefined;
}

// ---------------------------------------------------------------------------
// Resolve _copy references
// ---------------------------------------------------------------------------

function resolveCopy(races: RawRace[]): void {
  const lookup = new Map<string, RawRace>();
  for (const race of races) {
    lookup.set(`${race.name}|${race.source}`, race);
  }

  const resolving = new Set<string>();

  function resolve(race: RawRace): void {
    if (!race._copy) return;

    const key = `${race.name}|${race.source}`;
    if (resolving.has(key)) return;
    resolving.add(key);

    const parent = lookup.get(`${race._copy.name}|${race._copy.source}`);
    if (parent) {
      // Resolve parent first if it also has _copy
      if (parent._copy) resolve(parent);

      // Inherit fields from parent if not already set on child
      if (!race.size && parent.size) race.size = parent.size;
      if (race.speed === undefined && parent.speed !== undefined) race.speed = parent.speed;
      if (!race.ability && parent.ability) race.ability = parent.ability;
      if (!race.languageProficiencies && parent.languageProficiencies)
        race.languageProficiencies = parent.languageProficiencies;
      if (!race.entries && parent.entries) race.entries = [...(parent.entries as (string | RawEntry)[])];
      if (!race.traitTags && parent.traitTags) race.traitTags = parent.traitTags;
      if (!race.skillProficiencies && parent.skillProficiencies)
        race.skillProficiencies = parent.skillProficiencies;
      if (race.darkvision === undefined && parent.darkvision !== undefined)
        race.darkvision = parent.darkvision;
    }

    resolving.delete(key);
  }

  for (const race of races) {
    if (race._copy) resolve(race);
  }
}

// ---------------------------------------------------------------------------
// Parse a single raw race into RaceInfo
// ---------------------------------------------------------------------------

function parseRace(raw: RawRace): RaceInfo {
  const abilityStr = parseAbilityString(raw.ability);
  return {
    name: raw.name,
    source: raw.source,
    speed: parseSpeed(raw.speed as number | { walk?: number }),
    size: parseSize(raw.size),
    languages: parseLanguages(raw.languageProficiencies),
    traits: parseTraits(raw.entries as (string | RawEntry)[] | undefined),
    abilityScoreIncrease: abilityStr || undefined,
    abilityBonuses: parseAbilityBonuses(raw.ability),
    skillProficiencies: parseSkillProficiencies(raw.skillProficiencies),
  };
}

// ---------------------------------------------------------------------------
// Build the final RACES array
// ---------------------------------------------------------------------------

const PREFERRED_SOURCES = new Set(["PHB", "XPHB"]);

function buildRaces(): RaceInfo[] {
  const file = racesData as unknown as RawRacesFile;

  // Combine races and subraces
  const allRaw: RawRace[] = [...file.race];
  if (file.subrace) {
    for (const sub of file.subrace) {
      // Build a composite name for subraces: "Racename (Subracename)"
      const parentName = sub.raceName ?? "";
      const compositeName = parentName ? `${parentName} (${sub.name})` : sub.name;

      // Inherit missing fields from the parent (base) race
      if (parentName) {
        const parentSource = sub.raceSource ?? sub.source;
        const parent = file.race.find(
          (r) => r.name === parentName && r.source === parentSource,
        );
        if (parent) {
          if (!sub.languageProficiencies && parent.languageProficiencies)
            sub.languageProficiencies = parent.languageProficiencies;
          if (!sub.size && parent.size) sub.size = parent.size;
          if (sub.speed === undefined && parent.speed !== undefined)
            sub.speed = parent.speed;
          if (sub.darkvision === undefined && parent.darkvision !== undefined)
            sub.darkvision = parent.darkvision;
        }
      }

      allRaw.push({ ...sub, name: compositeName });
    }
  }

  // Resolve _copy references
  resolveCopy(allRaw);

  // Filter out NPC-only races
  const filtered = allRaw.filter(
    (r) => !r.traitTags || !r.traitTags.includes("NPC Race"),
  );

  // Parse all races
  const parsed = filtered.map(parseRace);

  // Deduplicate: prefer PHB/XPHB sources for same-named races
  const byName = new Map<string, RaceInfo>();
  for (const race of parsed) {
    const existing = byName.get(race.name);
    if (!existing) {
      byName.set(race.name, race);
    } else if (
      PREFERRED_SOURCES.has(race.source) &&
      !PREFERRED_SOURCES.has(existing.source)
    ) {
      byName.set(race.name, race);
    }
    // Otherwise keep existing (first PHB/XPHB entry wins)
  }

  // We actually want ALL versions (including duplicates across sources) for
  // source filtering to work properly. The dedup above only keeps one per name.
  // Instead, keep all but skip races that are purely duplicates from non-preferred
  // sources when a preferred source exists.
  //
  // Re-approach: keep all parsed races (no dedup) so the user can filter by source.
  // Sort alphabetically by name, then by source.
  parsed.sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;
    return a.source.localeCompare(b.source);
  });

  return parsed;
}

export const RACES: RaceInfo[] = buildRaces();

/** Sorted unique list of all source codes across all races. */
export const RACE_SOURCES: string[] = Array.from(
  new Set(RACES.map((r) => r.source)),
).sort();

/**
 * Look up a race by name and rulebook source.
 * Returns undefined if no match is found.
 */
export function getRaceByNameAndSource(name: string, source: string): RaceInfo | undefined {
  const normalizedName = name.trim().toLowerCase();
  const normalizedSource = source.trim().toUpperCase();
  return RACES.find(
    (r) => r.name.toLowerCase() === normalizedName && r.source === normalizedSource,
  );
}

/**
 * Look up a race by name only — returns the PHB (2014) version for backward compatibility.
 * If no PHB version exists, returns the first match.
 */
export function getRaceByName(name: string): RaceInfo | undefined {
  const normalizedName = name.trim().toLowerCase();
  const phbMatch = RACES.find(
    (r) => r.name.toLowerCase() === normalizedName && r.source === "PHB",
  );
  if (phbMatch) return phbMatch;
  return RACES.find((r) => r.name.toLowerCase() === normalizedName);
}
