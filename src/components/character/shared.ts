// ---------------------------------------------------------------------------
// Shared constants, types, and utilities for character components
// ---------------------------------------------------------------------------

export type CharacterData = {
  id: string;
  name: string;
  race: string;
  characterClass: string;
  level: number;
  alignment: string;
  backstory: string | null;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  armorClass: number;
  speed: number;
  subclass: string | null;
  rulesSource?: string;
  spellSlotsUsed: string;
  skillProficiencies: string; // JSON string[]
  skillExpertise?: string; // JSON string[]
  preparedSpells: string; // JSON string[]
  featureUses: string; // JSON Record<string,number>
  activeConditions?: string; // JSON string[]
  feats?: string; // JSON string[]
  notes?: string;
  background?: string | null;
  languages?: string; // JSON string[]
  equippedItems?: string; // JSON EquippedItems
  adventurePlayers?: Array<{
    id: string;
    status: string;
    adventure: { id: string; name: string; source: string };
  }>;
};

// Proficiency bonus from level
export function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

// Ability score modifier
export function mod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function modStr(score: number): string {
  const m = mod(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

export const HIT_DIE_AVERAGE: Record<string, number> = {
  Barbarian: 7,
  Bard: 5,
  Cleric: 5,
  Druid: 5,
  Fighter: 6,
  Monk: 5,
  Paladin: 6,
  Ranger: 6,
  Rogue: 5,
  Sorcerer: 4,
  Warlock: 5,
  Wizard: 4,
  Artificer: 5,
  Mystic: 5,
  Sidekick: 5,
};

export const HIT_DIE_SIZE: Record<string, number> = {
  Barbarian: 12,
  Bard: 8,
  Cleric: 8,
  Druid: 8,
  Fighter: 10,
  Monk: 8,
  Paladin: 10,
  Ranger: 10,
  Rogue: 8,
  Sorcerer: 6,
  Warlock: 8,
  Wizard: 6,
  Artificer: 8,
  Mystic: 8,
  Sidekick: 8,
};

export const SAVING_THROW_PROFICIENCIES: Record<string, string[]> = {
  Barbarian: ["strength", "constitution"],
  Bard: ["dexterity", "charisma"],
  Cleric: ["wisdom", "charisma"],
  Druid: ["intelligence", "wisdom"],
  Fighter: ["strength", "constitution"],
  Monk: ["strength", "dexterity"],
  Paladin: ["wisdom", "charisma"],
  Ranger: ["strength", "dexterity"],
  Rogue: ["dexterity", "intelligence"],
  Sorcerer: ["constitution", "charisma"],
  Warlock: ["wisdom", "charisma"],
  Wizard: ["intelligence", "wisdom"],
};

export const SKILLS: { name: string; ability: string }[] = [
  { name: "Acrobatics", ability: "dexterity" },
  { name: "Animal Handling", ability: "wisdom" },
  { name: "Arcana", ability: "intelligence" },
  { name: "Athletics", ability: "strength" },
  { name: "Deception", ability: "charisma" },
  { name: "History", ability: "intelligence" },
  { name: "Insight", ability: "wisdom" },
  { name: "Intimidation", ability: "charisma" },
  { name: "Investigation", ability: "intelligence" },
  { name: "Medicine", ability: "wisdom" },
  { name: "Nature", ability: "intelligence" },
  { name: "Perception", ability: "wisdom" },
  { name: "Performance", ability: "charisma" },
  { name: "Persuasion", ability: "charisma" },
  { name: "Religion", ability: "intelligence" },
  { name: "Sleight of Hand", ability: "dexterity" },
  { name: "Stealth", ability: "dexterity" },
  { name: "Survival", ability: "wisdom" },
];

export const ABILITY_NAMES: { key: string; label: string }[] = [
  { key: "strength", label: "STR" },
  { key: "dexterity", label: "DEX" },
  { key: "constitution", label: "CON" },
  { key: "intelligence", label: "INT" },
  { key: "wisdom", label: "WIS" },
  { key: "charisma", label: "CHA" },
];

export type TabId = "overview" | "features" | "actions" | "spells" | "notes" | "inventory";

// ---------------------------------------------------------------------------
// Feature usage config
// ---------------------------------------------------------------------------

export interface FeatureUsageConfig {
  maxUses: (level: number, abilityScores: Record<string, number>) => number;
  recharge: "short" | "long";
}

export const FEATURE_USAGE_CONFIG: Record<string, FeatureUsageConfig> = {
  Rage: {
    maxUses: (level) =>
      level < 3
        ? 2
        : level < 6
          ? 3
          : level < 12
            ? 4
            : level < 17
              ? 5
              : level < 20
                ? 6
                : Infinity,
    recharge: "long",
  },
  "Second Wind": { maxUses: () => 1, recharge: "short" },
  "Action Surge": {
    maxUses: (level) => (level < 17 ? 1 : 2),
    recharge: "short",
  },
  Indomitable: {
    maxUses: (level) => (level < 13 ? 1 : level < 17 ? 2 : 3),
    recharge: "long",
  },
  "Channel Divinity": {
    maxUses: (level) => (level < 6 ? 1 : level < 18 ? 2 : 3),
    recharge: "short",
  },
  "Wild Shape": { maxUses: () => 2, recharge: "short" },
  "Lay on Hands": { maxUses: (level) => level * 5, recharge: "long" },
  "Divine Sense": {
    maxUses: (_level, abs) =>
      1 + Math.max(0, Math.floor(((abs.charisma ?? 10) - 10) / 2)),
    recharge: "long",
  },
  "Bardic Inspiration": {
    maxUses: (_level, abs) =>
      Math.max(1, Math.floor(((abs.charisma ?? 10) - 10) / 2)),
    recharge: "long",
  },
  "Arcane Recovery": { maxUses: () => 1, recharge: "long" },
  "Psionic Power": {
    maxUses: (level) => 2 * (Math.ceil(level / 4) + 1),
    recharge: "long",
  },
};

// ---------------------------------------------------------------------------
// ASI / Level Up constants
// ---------------------------------------------------------------------------

export const ASI_LEVELS: Record<string, number[]> = {
  Fighter: [4, 6, 8, 12, 14, 16, 19],
  Rogue: [4, 8, 10, 12, 16, 19],
};
export const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19];

export function isAsiLevel(className: string, level: number): boolean {
  return (ASI_LEVELS[className] ?? DEFAULT_ASI_LEVELS).includes(level);
}

export const SUBCLASS_UNLOCK_LEVELS: Record<string, number> = {
  Artificer: 3,
  Barbarian: 3,
  Bard: 3,
  Cleric: 1,
  Druid: 2,
  Fighter: 3,
  Monk: 3,
  Paladin: 3,
  Ranger: 3,
  Rogue: 3,
  Sorcerer: 1,
  Warlock: 1,
  Wizard: 2,
};
