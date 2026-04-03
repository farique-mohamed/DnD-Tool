// ---------------------------------------------------------------------------
// Vehicle static data — parsed from data/vehicles.json
// ---------------------------------------------------------------------------

import rawData from "../../data/vehicles.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeaponAction {
  name: string;
  entries: string[];
}

export interface VehicleWeapon {
  name: string;
  count: number;
  ac?: number;
  hp?: number;
  crew?: number;
  costs: string[];
  entries: string[];
  actions: WeaponAction[];
}

export interface VehicleInfo {
  name: string;
  source: string;
  vehicleType: string;
  size: string;
  dimensions?: string;
  terrain: string[];
  crew: number;
  passengers: number;
  cargo?: string;
  cost?: string;
  ac: number;
  acFrom?: string;
  hp: number;
  damageThreshold?: number;
  speed: string;
  pace?: string;
  immunities: string[];
  entries: unknown[];
  weapons: VehicleWeapon[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SIZE_MAP: Record<string, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
  H: "Huge",
  G: "Gargantuan",
};

const PREFERRED_SOURCES = ["PHB", "XPHB", "DMG"];

/** Strip 5etools-style tags from a string. */
function stripTags(text: string): string {
  if (typeof text !== "string") return String(text ?? "");
  return text
    .replace(/\{@dc (\d+)\}/g, "DC $1")
    .replace(/\{@atk rw\}/g, "Ranged Weapon Attack:")
    .replace(/\{@atk mw\}/g, "Melee Weapon Attack:")
    .replace(/\{@atk rs\}/g, "Ranged Spell Attack:")
    .replace(/\{@atk ms\}/g, "Melee Spell Attack:")
    .replace(/\{@atk ([^}]+)\}/g, "Attack:")
    .replace(/\{@hit (\d+)\}/g, "+$1")
    .replace(/\{@h\}/g, "Hit: ")
    .replace(/\{@m\}/g, "Miss: ")
    .replace(/\{@damage ([^}|]+)(?:\|[^}]*)?\}/g, "$1")
    .replace(/\{@dice ([^}|]+)(?:\|[^}]*)?\}/g, "$1")
    .replace(/\{@\w+ ([^}|]+)(?:\|[^}]*)?\}/g, "$1");
}

/** Convert a speed object (or number) to a human-readable string. */
function formatSpeed(raw: unknown): string {
  if (raw == null) return "—";
  if (typeof raw === "number") return `${raw} ft.`;

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const parts: string[] = [];
    for (const [mode, val] of Object.entries(obj)) {
      if (mode === "note") continue;
      if (typeof val === "number") {
        const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
        parts.push(`${modeLabel} ${val} ft.`);
      }
    }
    if (parts.length === 0) return "—";
    return parts.join(", ");
  }

  return "—";
}

/** Format pace object or number into readable string. */
function formatPace(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "number") {
    return `${raw} mph (${raw * 24} miles per day)`;
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, number>;
    const parts: string[] = [];
    for (const [mode, val] of Object.entries(obj)) {
      if (typeof val === "number") {
        parts.push(`${val} mph ${mode}`);
      }
    }
    if (parts.length > 0) return parts.join(", ");
  }
  return undefined;
}

/** Format cost in copper to readable gold string. */
function formatCost(copper: number): string {
  if (copper >= 100) return `${(copper / 100).toLocaleString()} gp`;
  if (copper >= 10) return `${(copper / 10).toLocaleString()} sp`;
  return `${copper} cp`;
}

/** Convert the vehicle type code to a readable label. */
function formatVehicleType(type: string): string {
  switch (type) {
    case "OBJECT":
      return "Object";
    case "SHIP":
      return "Ship";
    case "SPELLJAMMER":
      return "Spelljammer";
    case "INFWAR":
      return "Infernal War Machine";
    case "ELEMENTAL_AIRSHIP":
      return "Elemental Airship";
    case "CREATURE":
      return "Creature";
    default:
      return type;
  }
}

// ---------------------------------------------------------------------------
// Parse raw JSON
// ---------------------------------------------------------------------------

interface RawWeaponCost {
  cost?: number;
  note?: string;
}

interface RawWeaponAction {
  name?: string;
  entries?: unknown[];
}

interface RawWeapon {
  name?: string;
  count?: number;
  ac?: number;
  hp?: number;
  crew?: number;
  costs?: RawWeaponCost[];
  entries?: unknown[];
  action?: RawWeaponAction[];
}

interface RawVehicle {
  name: string;
  source: string;
  vehicleType?: string;
  size?: string;
  terrain?: string[];
  capCrew?: number;
  capPassenger?: number;
  capCargo?: number;
  cost?: number;
  ac?: number | { ac: number }[];
  hp?: number | { hp: number };
  speed?: unknown;
  pace?: unknown;
  immune?: (string | { immune: string[] })[];
  entries?: unknown[];
  hull?: { ac?: number; acFrom?: string[]; hp?: number; dt?: number };
  dimensions?: string[];
  weapon?: RawWeapon[];
  [key: string]: unknown;
}

function parseWeapon(raw: RawWeapon): VehicleWeapon {
  // Parse costs
  const costs: string[] = [];
  if (Array.isArray(raw.costs)) {
    for (const c of raw.costs) {
      if (c.cost && c.note) {
        costs.push(`${formatCost(c.cost)} (${c.note})`);
      } else if (c.cost) {
        costs.push(formatCost(c.cost));
      } else if (c.note) {
        costs.push(`— (${c.note})`);
      }
    }
  }

  // Parse entries (description text)
  const entries: string[] = [];
  if (Array.isArray(raw.entries)) {
    for (const e of raw.entries) {
      if (typeof e === "string") entries.push(stripTags(e));
    }
  }

  // Parse actions (attack entries)
  const actions: WeaponAction[] = [];
  if (Array.isArray(raw.action)) {
    for (const a of raw.action) {
      const actionEntries: string[] = [];
      if (Array.isArray(a.entries)) {
        for (const e of a.entries) {
          if (typeof e === "string") actionEntries.push(stripTags(e));
        }
      }
      actions.push({
        name: a.name ?? "Attack",
        entries: actionEntries,
      });
    }
  }

  return {
    name: raw.name ?? "Weapon",
    count: raw.count ?? 1,
    ac: raw.ac,
    hp: raw.hp,
    crew: raw.crew,
    costs,
    entries,
    actions,
  };
}

function parseVehicle(raw: RawVehicle): VehicleInfo {
  // AC: can be number, array of objects, or on the hull
  let ac = 0;
  let acFrom: string | undefined;
  if (typeof raw.ac === "number") {
    ac = raw.ac;
  } else if (Array.isArray(raw.ac) && raw.ac.length > 0) {
    const first = raw.ac[0];
    ac = typeof first === "number" ? first : (first as { ac: number }).ac ?? 0;
  } else if (raw.hull && typeof raw.hull.ac === "number") {
    ac = raw.hull.ac;
    if (raw.hull.acFrom && raw.hull.acFrom.length > 0) {
      acFrom = raw.hull.acFrom.join(", ");
    }
  }

  // HP: can be number or on the hull
  let hp = 0;
  if (typeof raw.hp === "number") {
    hp = raw.hp;
  } else if (raw.hp && typeof (raw.hp as { hp: number }).hp === "number") {
    hp = (raw.hp as { hp: number }).hp;
  } else if (raw.hull && typeof raw.hull.hp === "number") {
    hp = raw.hull.hp;
  }

  // Damage threshold from hull
  const damageThreshold = raw.hull?.dt;

  // Immunities
  const immunities: string[] = [];
  if (Array.isArray(raw.immune)) {
    for (const entry of raw.immune) {
      if (typeof entry === "string") {
        immunities.push(entry);
      } else if (entry && typeof entry === "object" && Array.isArray((entry as { immune: string[] }).immune)) {
        immunities.push(...(entry as { immune: string[] }).immune);
      }
    }
  }

  // Weapons
  const weapons: VehicleWeapon[] = [];
  if (Array.isArray(raw.weapon)) {
    for (const w of raw.weapon) {
      weapons.push(parseWeapon(w));
    }
  }

  // Dimensions
  const dimensions = Array.isArray(raw.dimensions)
    ? raw.dimensions.join(" by ")
    : undefined;

  // Speed
  const speed = formatSpeed(raw.speed);

  // Pace
  const pace = formatPace(raw.pace);

  // Cargo
  const cargo = raw.capCargo != null ? `${raw.capCargo} tons` : undefined;

  // Cost
  const cost = typeof raw.cost === "number" ? formatCost(raw.cost) : undefined;

  return {
    name: raw.name,
    source: raw.source,
    vehicleType: formatVehicleType(raw.vehicleType ?? "OBJECT"),
    size: SIZE_MAP[raw.size ?? ""] ?? raw.size ?? "—",
    dimensions,
    terrain: (raw.terrain ?? []).map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
    crew: raw.capCrew ?? 0,
    passengers: raw.capPassenger ?? 0,
    cargo,
    cost,
    ac,
    acFrom,
    hp,
    damageThreshold,
    speed,
    pace,
    immunities,
    entries: raw.entries ?? [],
    weapons,
  };
}

// ---------------------------------------------------------------------------
// Deduplicate & export
// ---------------------------------------------------------------------------

const allVehicles = (rawData as { vehicle: RawVehicle[] }).vehicle.map(parseVehicle);

// Deduplicate by name, preferring PHB/XPHB/DMG sources
const vehicleMap = new Map<string, VehicleInfo>();
for (const v of allVehicles) {
  const existing = vehicleMap.get(v.name);
  if (!existing) {
    vehicleMap.set(v.name, v);
  } else {
    const existingPref = PREFERRED_SOURCES.includes(existing.source);
    const newPref = PREFERRED_SOURCES.includes(v.source);
    if (newPref && !existingPref) {
      vehicleMap.set(v.name, v);
    }
  }
}

export const VEHICLES: VehicleInfo[] = Array.from(vehicleMap.values()).sort(
  (a, b) => a.name.localeCompare(b.name),
);

/** Sorted unique list of all source codes across all vehicles. */
export const VEHICLE_SOURCES: string[] = Array.from(
  new Set(VEHICLES.map((v) => v.source)),
).sort();

/** Strip 5etools tags — exported for use in rendering. */
export { stripTags };
