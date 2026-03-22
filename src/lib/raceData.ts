// ---------------------------------------------------------------------------
// Race / Species static data — PHB (2014) and XPHB (2024)
// ---------------------------------------------------------------------------

export interface RacialTrait {
  name: string;
  description: string;
}

export interface AbilityScoreBonus {
  ability: string; // "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma" | "all" | "choice"
  amount: number;
  choiceCount?: number; // for "choice" type — how many scores to pick
  excludeAbilities?: string[]; // abilities that can't be chosen (e.g., Half-Elf excludes Charisma)
}

export interface RaceInfo {
  name: string;
  source: "PHB" | "XPHB";
  speed: number;
  size: string;
  languages: string[];
  traits: RacialTrait[];
  abilityScoreIncrease?: string;
  abilityBonuses?: AbilityScoreBonus[];
}

// ---------------------------------------------------------------------------
// PHB 2014 Races
// ---------------------------------------------------------------------------

const HUMAN_PHB: RaceInfo = {
  name: "Human",
  source: "PHB",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+1 to all ability scores",
  abilityBonuses: [{ ability: "all", amount: 1 }],
  traits: [],
};

const ELF_PHB: RaceInfo = {
  name: "Elf",
  source: "PHB",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Elvish"],
  abilityScoreIncrease: "+2 Dexterity",
  abilityBonuses: [{ ability: "dexterity", amount: 2 }],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Keen Senses", description: "You have proficiency in the Perception skill." },
    { name: "Fey Ancestry", description: "You have advantage on saving throws against being charmed, and magic can't put you to sleep." },
    { name: "Trance", description: "Elves don't need to sleep. Instead, they meditate deeply for 4 hours a day. After resting in this way, you gain the same benefit that a human does from 8 hours of sleep." },
  ],
};

const DWARF_PHB: RaceInfo = {
  name: "Dwarf",
  source: "PHB",
  speed: 25,
  size: "Medium",
  languages: ["Common", "Dwarvish"],
  abilityScoreIncrease: "+2 Constitution",
  abilityBonuses: [{ ability: "constitution", amount: 2 }],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Dwarven Resilience", description: "You have advantage on saving throws against poison, and you have resistance against poison damage." },
    { name: "Dwarven Combat Training", description: "You have proficiency with the battleaxe, handaxe, light hammer, and warhammer." },
    { name: "Stonecunning", description: "Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check." },
  ],
};

const HALFLING_PHB: RaceInfo = {
  name: "Halfling",
  source: "PHB",
  speed: 25,
  size: "Small",
  languages: ["Common", "Halfling"],
  abilityScoreIncrease: "+2 Dexterity",
  abilityBonuses: [{ ability: "dexterity", amount: 2 }],
  traits: [
    { name: "Lucky", description: "When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll." },
    { name: "Brave", description: "You have advantage on saving throws against being frightened." },
    { name: "Halfling Nimbleness", description: "You can move through the space of any creature that is of a size larger than yours." },
  ],
};

const GNOME_PHB: RaceInfo = {
  name: "Gnome",
  source: "PHB",
  speed: 25,
  size: "Small",
  languages: ["Common", "Gnomish"],
  abilityScoreIncrease: "+2 Intelligence",
  abilityBonuses: [{ ability: "intelligence", amount: 2 }],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Gnome Cunning", description: "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic." },
  ],
};

const HALF_ELF_PHB: RaceInfo = {
  name: "Half-Elf",
  source: "PHB",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Elvish", "One extra language of your choice"],
  abilityScoreIncrease: "+2 Charisma, +1 to two other ability scores of your choice",
  abilityBonuses: [
    { ability: "charisma", amount: 2 },
    { ability: "choice", amount: 1, choiceCount: 2, excludeAbilities: ["charisma"] },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Fey Ancestry", description: "You have advantage on saving throws against being charmed, and magic can't put you to sleep." },
    { name: "Skill Versatility", description: "You gain proficiency in two skills of your choice." },
  ],
};

const HALF_ORC_PHB: RaceInfo = {
  name: "Half-Orc",
  source: "PHB",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Orc"],
  abilityScoreIncrease: "+2 Strength, +1 Constitution",
  abilityBonuses: [
    { ability: "strength", amount: 2 },
    { ability: "constitution", amount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Menacing", description: "You gain proficiency in the Intimidation skill." },
    { name: "Relentless Endurance", description: "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can't use this feature again until you finish a long rest." },
    { name: "Savage Attacks", description: "When you score a critical hit with a melee weapon attack, you can roll one of the weapon's damage dice one additional time and add it to the extra damage of the critical hit." },
  ],
};

const TIEFLING_PHB: RaceInfo = {
  name: "Tiefling",
  source: "PHB",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Infernal"],
  abilityScoreIncrease: "+2 Charisma, +1 Intelligence",
  abilityBonuses: [
    { ability: "charisma", amount: 2 },
    { ability: "intelligence", amount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Hellish Resistance", description: "You have resistance to fire damage." },
    { name: "Infernal Legacy", description: "You know the Thaumaturgy cantrip. When you reach 3rd level, you can cast the Hellish Rebuke spell as a 2nd-level spell once with this trait and regain the ability to do so when you finish a long rest. When you reach 5th level, you can cast the Darkness spell once with this trait and regain the ability to do so when you finish a long rest. Charisma is your spellcasting ability for these spells." },
  ],
};

const DRAGONBORN_PHB: RaceInfo = {
  name: "Dragonborn",
  source: "PHB",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Draconic"],
  abilityScoreIncrease: "+2 Strength, +1 Charisma",
  abilityBonuses: [
    { ability: "strength", amount: 2 },
    { ability: "charisma", amount: 1 },
  ],
  traits: [
    { name: "Draconic Ancestry", description: "You have draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type." },
    { name: "Breath Weapon", description: "You can use your action to exhale destructive energy. Your draconic ancestry determines the size, shape, and damage type of the exhalation. Each creature in the area must make a saving throw (DC = 8 + your Constitution modifier + your proficiency bonus). A creature takes 2d6 damage on a failed save, and half as much on a successful one. The damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. You can use this once per short or long rest." },
    { name: "Damage Resistance", description: "You have resistance to the damage type associated with your draconic ancestry." },
  ],
};

// ---------------------------------------------------------------------------
// XPHB 2024 Species
// ---------------------------------------------------------------------------

const HUMAN_XPHB: RaceInfo = {
  name: "Human",
  source: "XPHB",
  speed: 30,
  size: "Medium or Small (choose when you select this species)",
  languages: ["Common", "One extra language of your choice"],
  traits: [
    { name: "Resourceful", description: "You gain Heroic Inspiration whenever you finish a long rest." },
    { name: "Skillful", description: "You gain proficiency in one skill of your choice." },
    { name: "Versatile", description: "You gain an Origin feat of your choice." },
  ],
};

const ELF_XPHB: RaceInfo = {
  name: "Elf",
  source: "XPHB",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Elvish"],
  traits: [
    { name: "Darkvision", description: "You have Darkvision with a range of 60 feet." },
    { name: "Fey Ancestry", description: "You have advantage on saving throws you make to avoid or end the Charmed condition." },
    { name: "Keen Senses", description: "You have proficiency in the Insight, Perception, or Survival skill." },
    { name: "Trance", description: "You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness." },
  ],
};

const DWARF_XPHB: RaceInfo = {
  name: "Dwarf",
  source: "XPHB",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Dwarvish"],
  traits: [
    { name: "Darkvision", description: "You have Darkvision with a range of 120 feet." },
    { name: "Dwarven Resilience", description: "You have resistance to Poison damage. You also have advantage on saving throws you make to avoid or end the Poisoned condition." },
    { name: "Dwarven Toughness", description: "Your hit point maximum increases by 1, and it increases by 1 again whenever you gain a level." },
    { name: "Stonecunning", description: "As a Bonus Action, you gain Tremorsense with a range of 60 feet for 10 minutes. You must be on a stone surface or touching a stone surface to use this ability. You can use this a number of times equal to your proficiency bonus, regaining all uses on a long rest." },
  ],
};

const HALFLING_XPHB: RaceInfo = {
  name: "Halfling",
  source: "XPHB",
  speed: 30,
  size: "Small",
  languages: ["Common", "Halfling"],
  traits: [
    { name: "Brave", description: "You have advantage on saving throws you make to avoid or end the Frightened condition." },
    { name: "Halfling Nimbleness", description: "You can move through the space of any creature that is a size larger than you, but you can't stop in the same space." },
    { name: "Lucky", description: "When you roll a 1 on the d20 for a D20 Test, you can reroll the die, and you must use the new roll." },
    { name: "Naturally Stealthy", description: "You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you." },
  ],
};

const GNOME_XPHB: RaceInfo = {
  name: "Gnome",
  source: "XPHB",
  speed: 30,
  size: "Small",
  languages: ["Common", "Gnomish"],
  traits: [
    { name: "Darkvision", description: "You have Darkvision with a range of 60 feet." },
    { name: "Gnome Cunning", description: "You have advantage on Intelligence, Wisdom, and Charisma saving throws." },
  ],
};

const TIEFLING_XPHB: RaceInfo = {
  name: "Tiefling",
  source: "XPHB",
  speed: 30,
  size: "Medium or Small (choose when you select this species)",
  languages: ["Common", "One extra language of your choice"],
  traits: [
    { name: "Darkvision", description: "You have Darkvision with a range of 60 feet." },
    { name: "Fiendish Legacy", description: "Choose a legacy from the Fiendish Legacy table: Abyssal (Poison — you know the Poison Spray cantrip), Chthonic (Necrotic — you know the Chill Touch cantrip), or Infernal (Fire — you know the Fire Bolt cantrip). At 3rd level you gain a 2nd-level spell you can cast once per long rest (Abyssal: Ray of Sickness, Chthonic: False Life, Infernal: Hellish Rebuke). At 5th level you gain a 3rd-level spell you can cast once per long rest (Abyssal: Hold Person, Chthonic: Ray of Enfeeblement, Infernal: Darkness). The spellcasting ability is Charisma." },
    { name: "Otherworldly Presence", description: "You know the Thaumaturgy cantrip. When you cast it with this trait, the spell uses the same spellcasting ability you use for your Fiendish Legacy trait." },
  ],
};

const DRAGONBORN_XPHB: RaceInfo = {
  name: "Dragonborn",
  source: "XPHB",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Draconic"],
  traits: [
    { name: "Draconic Ancestry", description: "You are descended from a dragon. Choose the kind of dragon from the Draconic Ancestor table to determine your Breath Weapon and damage resistance." },
    { name: "Breath Weapon", description: "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone or a 30-foot line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC = 8 + Constitution modifier + proficiency bonus). On a failed save, a creature takes 1d10 damage of the type determined by your ancestry. On a successful save, a creature takes half damage. The damage increases to 2d10 at 5th level, 3d10 at 11th level, and 4d10 at 17th level. You can use this a number of times equal to your proficiency bonus, regaining all uses on a long rest." },
    { name: "Damage Resistance", description: "You have resistance to the damage type determined by your Draconic Ancestry." },
    { name: "Draconic Flight", description: "At 5th level, you can use a Bonus Action to sprout spectral wings for 10 minutes. While the wings exist you have a Fly Speed equal to your Speed. You can use this once per long rest." },
  ],
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const RACES: RaceInfo[] = [
  // PHB 2014
  HUMAN_PHB,
  ELF_PHB,
  DWARF_PHB,
  HALFLING_PHB,
  GNOME_PHB,
  HALF_ELF_PHB,
  HALF_ORC_PHB,
  TIEFLING_PHB,
  DRAGONBORN_PHB,
  // XPHB 2024
  HUMAN_XPHB,
  ELF_XPHB,
  DWARF_XPHB,
  HALFLING_XPHB,
  GNOME_XPHB,
  TIEFLING_XPHB,
  DRAGONBORN_XPHB,
];

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
