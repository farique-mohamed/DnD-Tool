// ---------------------------------------------------------------------------
// Race / Species static data — PHB, XPHB, VGM, MPMM, ERLW, EGW, VRGR, GGR, MOT, AI, AAG, SCC
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
  source: string;
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

const GOLIATH_XPHB: RaceInfo = {
  name: "Goliath",
  source: "XPHB",
  speed: 35,
  size: "Medium",
  languages: ["Common", "Giant"],
  traits: [
    { name: "Giant Ancestry", description: "You are descended from Giants. Choose one of the following benefits — a supernatural boon from your ancestry; you can use the chosen benefit a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a Long Rest: Cloud's Jaunt (as a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see), Fire's Burn (when you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to that target), Frost's Chill (when you hit a target with an attack roll and deal damage to it, you can also deal 1d6 Cold damage to that target and reduce its Speed by 10 feet until the start of your next turn), Hill's Tumble (when you hit a Large or smaller creature with an attack roll and deal damage to it, you can give that target the Prone condition), Stone's Endurance (when you take damage, you can take a Reaction to roll 1d12 + Constitution modifier and reduce the damage by that total), Storm's Thunder (when you take damage from a creature within 60 feet, you can take a Reaction to deal 1d8 Thunder damage to that creature)." },
    { name: "Large Form", description: "Starting at 5th level, you can change your size to Large as a Bonus Action (space becomes 10 feet; weapons deal extra 1d6 damage). This lasts for 10 minutes or until ended as a Bonus Action. Usable once per Long Rest." },
    { name: "Powerful Build", description: "You have advantage on any saving throw you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity." },
  ],
};

const ORC_XPHB: RaceInfo = {
  name: "Orc",
  source: "XPHB",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Orc"],
  traits: [
    { name: "Adrenaline Rush", description: "You can take the Dash action as a Bonus Action. When you do so, you gain a number of Temporary Hit Points equal to your proficiency bonus. You can use this a number of times equal to your proficiency bonus, regaining all uses on a Long Rest." },
    { name: "Darkvision", description: "You have Darkvision with a range of 120 feet." },
    { name: "Relentless Endurance", description: "When you are reduced to 0 Hit Points but not killed outright, you can drop to 1 Hit Point instead. Once you use this trait, you can't do so again until you finish a Long Rest." },
  ],
};

const AASIMAR_XPHB: RaceInfo = {
  name: "Aasimar",
  source: "XPHB",
  speed: 30,
  size: "Medium or Small (choose when you select this species)",
  languages: ["Common", "Celestial"],
  traits: [
    { name: "Celestial Resistance", description: "You have resistance to Necrotic damage and Radiant damage." },
    { name: "Darkvision", description: "You have Darkvision with a range of 60 feet." },
    { name: "Healing Hands", description: "As a Magic action, you touch a creature and roll a number of d4s equal to your proficiency bonus. The creature regains a number of Hit Points equal to the total rolled. Once you use this trait, you can't use it again until you finish a Long Rest." },
    { name: "Light Bearer", description: "You know the Light cantrip. Charisma is your spellcasting ability for it." },
    { name: "Celestial Revelation", description: "When you reach 3rd level, choose one revelation below. Thereafter, you can use a Bonus Action to unleash the celestial energy within yourself, gaining the benefits of that revelation. Your transformation lasts for 1 minute or until you end it (no action required). Once you transform, you can't do so again until you finish a Long Rest. Heavenly Wings (spectral wings, Fly Speed equal to Speed), Inner Radiance (searing light in 10-foot radius, 1d6 Radiant per turn), Necrotic Shroud (frightening flare, creatures in 10 feet must make Charisma save or become Frightened for 1 minute). While transformed, once per turn you deal extra Radiant or Necrotic damage equal to your proficiency bonus." },
  ],
};

// ---------------------------------------------------------------------------
// VGM — Volo's Guide to Monsters
// ---------------------------------------------------------------------------

const AARAKOCRA_VGM: RaceInfo = {
  name: "Aarakocra",
  source: "VGM",
  speed: 25,
  size: "Medium",
  languages: ["Common", "Aarakocra", "Auran"],
  abilityScoreIncrease: "+2 Dexterity, +1 Wisdom",
  abilityBonuses: [
    { ability: "dexterity", amount: 2 },
    { ability: "wisdom", amount: 1 },
  ],
  traits: [
    { name: "Flight", description: "You have a flying speed of 50 feet. To use this speed, you can't be wearing medium or heavy armor." },
    { name: "Talons", description: "Your talons are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to 1d4 + your Strength modifier, instead of the bludgeoning damage normal for an unarmed strike." },
  ],
};

const AASIMAR_VGM: RaceInfo = {
  name: "Aasimar",
  source: "VGM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Celestial"],
  abilityScoreIncrease: "+2 Charisma",
  abilityBonuses: [{ ability: "charisma", amount: 2 }],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Celestial Resistance", description: "You have resistance to necrotic damage and radiant damage." },
    { name: "Healing Hands", description: "As an action, you can touch a creature and cause it to regain a number of hit points equal to your level. Once you use this trait, you can't use it again until you finish a long rest." },
    { name: "Light Bearer", description: "You know the Light cantrip. Charisma is your spellcasting ability for it." },
    { name: "Celestial Revelation", description: "At 3rd level, choose one of three transformations: Necrotic Shroud (frightening presence + necrotic damage), Radiant Consumption (radiant aura damaging you and nearby enemies), or Radiant Soul (luminous wings for flight + radiant damage). Once per turn during the transformation, you deal extra damage equal to your level. Transformation lasts 1 minute, usable once per long rest." },
  ],
};

const FIRBOLG_VGM: RaceInfo = {
  name: "Firbolg",
  source: "VGM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Elvish", "Giant"],
  abilityScoreIncrease: "+2 Wisdom, +1 Strength",
  abilityBonuses: [
    { ability: "wisdom", amount: 2 },
    { ability: "strength", amount: 1 },
  ],
  traits: [
    { name: "Firbolg Magic", description: "You can cast Detect Magic and Disguise Self with this trait, using Wisdom as your spellcasting ability. Once you cast either spell, you can't cast it again with this trait until you finish a short or long rest. When you use Disguise Self, you can make yourself appear up to 3 feet shorter than normal, allowing you to more easily blend in with humans and elves." },
    { name: "Hidden Step", description: "As a bonus action, you can magically turn invisible until the start of your next turn or until you attack, make a damage roll, or force someone to make a saving throw. Once you use this trait, you can't use it again until you finish a short or long rest." },
    { name: "Powerful Build", description: "You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
    { name: "Speech of Beast and Leaf", description: "You have the ability to communicate in a limited manner with beasts and plants. They can understand the meaning of your words, though you have no special ability to understand them in return." },
  ],
};

const GOLIATH_VGM: RaceInfo = {
  name: "Goliath",
  source: "VGM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Giant"],
  abilityScoreIncrease: "+2 Strength, +1 Constitution",
  abilityBonuses: [
    { ability: "strength", amount: 2 },
    { ability: "constitution", amount: 1 },
  ],
  traits: [
    { name: "Natural Athlete", description: "You have proficiency in the Athletics skill." },
    { name: "Stone's Endurance", description: "You can focus yourself to occasionally shrug off injury. When you take damage, you can use your reaction to roll a d12. Add your Constitution modifier to the number rolled, and reduce the damage by that total. After you use this trait, you can't use it again until you finish a short or long rest." },
    { name: "Powerful Build", description: "You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
    { name: "Mountain Born", description: "You have resistance to cold damage. You're also acclimated to high altitude, including elevations above 20,000 feet." },
  ],
};

const KENKU_VGM: RaceInfo = {
  name: "Kenku",
  source: "VGM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Auran"],
  abilityScoreIncrease: "+2 Dexterity, +1 Wisdom",
  abilityBonuses: [
    { ability: "dexterity", amount: 2 },
    { ability: "wisdom", amount: 1 },
  ],
  traits: [
    { name: "Expert Forgery", description: "You can duplicate other creatures' handwriting and craftwork. You have advantage on all checks made to produce forgeries or duplicates of existing objects." },
    { name: "Kenku Training", description: "You are proficient in your choice of two of the following skills: Acrobatics, Deception, Stealth, and Sleight of Hand." },
    { name: "Mimicry", description: "You can mimic sounds you have heard, including voices. A creature that hears the sounds you make can tell they are imitations with a successful Wisdom (Insight) check opposed by your Charisma (Deception) check." },
  ],
};

const LIZARDFOLK_VGM: RaceInfo = {
  name: "Lizardfolk",
  source: "VGM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Draconic"],
  abilityScoreIncrease: "+2 Constitution, +1 Wisdom",
  abilityBonuses: [
    { ability: "constitution", amount: 2 },
    { ability: "wisdom", amount: 1 },
  ],
  traits: [
    { name: "Bite", description: "Your fanged maw is a natural weapon, which you can use to make unarmed strikes. If you hit with it, you deal piercing damage equal to 1d6 + your Strength modifier, instead of the bludgeoning damage normal for an unarmed strike." },
    { name: "Cunning Artisan", description: "As part of a short rest, you can harvest bone and hide from a slain beast, construct, dragon, monstrosity, or plant creature of size Small or larger to create one of the following items: a shield, a club, a javelin, or 1d4 darts or blowgun needles." },
    { name: "Hold Breath", description: "You can hold your breath for up to 15 minutes at a time." },
    { name: "Hunter's Lore", description: "You gain proficiency with two of the following skills of your choice: Animal Handling, Nature, Perception, Stealth, and Survival." },
    { name: "Natural Armor", description: "You have tough, scaly skin. When you aren't wearing armor, your AC is 13 + your Dexterity modifier. You can use your natural armor to determine your AC if the armor you wear would leave you with a lower AC." },
    { name: "Hungry Jaws", description: "In battle, you can throw yourself into a vicious feeding frenzy. As a bonus action, you can make a special attack with your bite. If the attack hits, it deals its normal damage, and you gain temporary hit points equal to your Constitution modifier (minimum of 1). You can use this trait a number of times equal to your proficiency bonus, regaining all uses on a long rest." },
  ],
};

const TABAXI_VGM: RaceInfo = {
  name: "Tabaxi",
  source: "VGM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2 Dexterity, +1 Charisma",
  abilityBonuses: [
    { ability: "dexterity", amount: 2 },
    { ability: "charisma", amount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Feline Agility", description: "Your reflexes and agility allow you to move with a burst of speed. When you move on your turn in combat, you can double your speed until the end of the turn. Once you use this trait, you can't use it again until you move 0 feet on one of your turns." },
    { name: "Cat's Claws", description: "Because of your claws, you have a climbing speed of 20 feet. In addition, your claws are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to 1d4 + your Strength modifier, instead of the bludgeoning damage normal for an unarmed strike." },
    { name: "Cat's Talent", description: "You have proficiency in the Perception and Stealth skills." },
  ],
};

const TRITON_VGM: RaceInfo = {
  name: "Triton",
  source: "VGM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Primordial"],
  abilityScoreIncrease: "+1 Strength, +1 Constitution, +1 Charisma",
  abilityBonuses: [
    { ability: "strength", amount: 1 },
    { ability: "constitution", amount: 1 },
    { ability: "charisma", amount: 1 },
  ],
  traits: [
    { name: "Amphibious", description: "You can breathe air and water." },
    { name: "Control Air and Water", description: "You can cast Fog Cloud with this trait. Starting at 3rd level, you can cast Gust of Wind. Starting at 5th level, you can also cast Wall of Water. Once you cast a spell with this trait, you can't cast that spell again until you finish a long rest. Charisma is your spellcasting ability for these spells." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Emissary of the Sea", description: "Aquatic beasts have an extraordinary affinity with your people. You can communicate simple ideas with beasts that can breathe water." },
    { name: "Guardians of the Depths", description: "Adapted to even the most extreme ocean depths, you have resistance to cold damage." },
    { name: "Swim Speed", description: "You have a swimming speed of 30 feet." },
  ],
};

const BUGBEAR_VGM: RaceInfo = {
  name: "Bugbear",
  source: "VGM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Goblin"],
  abilityScoreIncrease: "+2 Strength, +1 Dexterity",
  abilityBonuses: [
    { ability: "strength", amount: 2 },
    { ability: "dexterity", amount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Long-Limbed", description: "When you make a melee attack on your turn, your reach for it is 5 feet greater than normal." },
    { name: "Powerful Build", description: "You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
    { name: "Sneaky", description: "You are proficient in the Stealth skill." },
    { name: "Surprise Attack", description: "If you surprise a creature and hit it with an attack on your first turn in combat, the attack deals an extra 2d6 damage to it. You can use this trait only once per combat." },
  ],
};

const GOBLIN_VGM: RaceInfo = {
  name: "Goblin",
  source: "VGM",
  speed: 30,
  size: "Small",
  languages: ["Common", "Goblin"],
  abilityScoreIncrease: "+2 Dexterity, +1 Constitution",
  abilityBonuses: [
    { ability: "dexterity", amount: 2 },
    { ability: "constitution", amount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Fury of the Small", description: "When you damage a creature with an attack or a spell and the creature's size is larger than yours, you can cause the attack or spell to deal extra damage to the creature. The extra damage equals your level. Once you use this trait, you can't use it again until you finish a short or long rest." },
    { name: "Nimble Escape", description: "You can take the Disengage or Hide action as a bonus action on each of your turns." },
  ],
};

const HOBGOBLIN_VGM: RaceInfo = {
  name: "Hobgoblin",
  source: "VGM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Goblin"],
  abilityScoreIncrease: "+2 Constitution, +1 Intelligence",
  abilityBonuses: [
    { ability: "constitution", amount: 2 },
    { ability: "intelligence", amount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Martial Training", description: "You are proficient with two martial weapons of your choice and with light armor." },
    { name: "Saving Face", description: "Hobgoblins are careful not to show weakness in front of their allies, for fear of losing status. If you miss with an attack roll or fail an ability check or a saving throw, you can gain a bonus to the roll equal to the number of allies you can see within 30 feet of you (maximum bonus of +5). Once you use this trait, you can't use it again until you finish a short or long rest." },
  ],
};

const KOBOLD_VGM: RaceInfo = {
  name: "Kobold",
  source: "VGM",
  speed: 30,
  size: "Small",
  languages: ["Common", "Draconic"],
  abilityScoreIncrease: "+2 Dexterity, -2 Strength",
  abilityBonuses: [
    { ability: "dexterity", amount: 2 },
    { ability: "strength", amount: -2 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Grovel, Cower, and Beg", description: "As an action on your turn, you can cower pathetically to distract nearby foes. Until the end of your next turn, your allies gain advantage on attack rolls against enemies within 10 feet of you that can see you. Once you use this trait, you can't use it again until you finish a short or long rest." },
    { name: "Pack Tactics", description: "You have advantage on an attack roll against a creature if at least one of your allies is within 5 feet of the creature and the ally isn't incapacitated." },
    { name: "Sunlight Sensitivity", description: "You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight." },
  ],
};

const ORC_VGM: RaceInfo = {
  name: "Orc",
  source: "VGM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Orc"],
  abilityScoreIncrease: "+2 Strength, +1 Constitution, -2 Intelligence",
  abilityBonuses: [
    { ability: "strength", amount: 2 },
    { ability: "constitution", amount: 1 },
    { ability: "intelligence", amount: -2 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Aggressive", description: "As a bonus action, you can move up to your speed toward an enemy of your choice that you can see or hear. You must end this move closer to the enemy than you started." },
    { name: "Menacing", description: "You are proficient in the Intimidation skill." },
    { name: "Powerful Build", description: "You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
  ],
};

const YUAN_TI_PUREBLOOD_VGM: RaceInfo = {
  name: "Yuan-Ti Pureblood",
  source: "VGM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Abyssal", "Draconic"],
  abilityScoreIncrease: "+2 Charisma, +1 Intelligence",
  abilityBonuses: [
    { ability: "charisma", amount: 2 },
    { ability: "intelligence", amount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Innate Spellcasting", description: "You know the Poison Spray cantrip. You can cast Animal Friendship an unlimited number of times with this trait, but you can target only snakes with it. Starting at 3rd level, you can also cast Suggestion with this trait. Once you cast it, you can't do so again until you finish a long rest. Charisma is your spellcasting ability for these spells." },
    { name: "Magic Resistance", description: "You have advantage on saving throws against spells and other magical effects." },
    { name: "Poison Immunity", description: "You are immune to poison damage and the poisoned condition." },
  ],
};

// ---------------------------------------------------------------------------
// ERLW — Eberron: Rising from the Last War
// ---------------------------------------------------------------------------

const CHANGELING_ERLW: RaceInfo = {
  name: "Changeling",
  source: "ERLW",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Two other languages of your choice"],
  abilityScoreIncrease: "+2 Charisma, +1 to one other ability score of your choice",
  abilityBonuses: [
    { ability: "charisma", amount: 2 },
    { ability: "choice", amount: 1, choiceCount: 1, excludeAbilities: ["charisma"] },
  ],
  traits: [
    { name: "Shapechanger", description: "As an action, you can change your appearance and your voice. You determine the specifics of the changes, including your coloration, hair length, and sex. You can also adjust your height and weight, but not so much that your size changes. You can make yourself appear as a member of another race, though none of your game statistics change. You can't duplicate the appearance of a creature you've never seen, and you must adopt a form that has the same basic arrangement of limbs that you have. Your clothing and equipment aren't changed by this trait. You stay in the new form until you use an action to revert to your true form or until you die." },
    { name: "Changeling Instincts", description: "You gain proficiency with two of the following skills of your choice: Deception, Insight, Intimidation, and Persuasion." },
  ],
};

const KALASHTAR_ERLW: RaceInfo = {
  name: "Kalashtar",
  source: "ERLW",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Quori", "One extra language of your choice"],
  abilityScoreIncrease: "+2 Wisdom, +1 Charisma",
  abilityBonuses: [
    { ability: "wisdom", amount: 2 },
    { ability: "charisma", amount: 1 },
  ],
  traits: [
    { name: "Dual Mind", description: "You have advantage on all Wisdom saving throws." },
    { name: "Mental Discipline", description: "You have resistance to psychic damage." },
    { name: "Mind Link", description: "You can speak telepathically to any creature you can see, provided the creature is within a number of feet of you equal to 10 times your level. You don't need to share a language with the creature for it to understand your telepathic utterances, but the creature must be able to understand at least one language. When you're using this trait to speak telepathically to a creature, you can use your action to give that creature the ability to speak telepathically with you for 1 hour or until you end this effect as an action." },
    { name: "Severed from Dreams", description: "Kalashtar sleep, but they don't connect to the plane of dreams as other creatures do. Instead, their minds draw from the memories of their otherworldly spirit while they sleep. As such, you are immune to spells and other magical effects that require you to dream, like the Dream spell, but not to spells and effects that put you to sleep, like the Sleep spell." },
  ],
};

const SHIFTER_ERLW: RaceInfo = {
  name: "Shifter",
  source: "ERLW",
  speed: 30,
  size: "Medium",
  languages: ["Common"],
  abilityScoreIncrease: "+1 Dexterity (plus subrace bonus)",
  abilityBonuses: [
    { ability: "dexterity", amount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Shifting", description: "As a bonus action, you can assume a more bestial appearance. This transformation lasts for 1 minute, until you die, or until you revert to your normal appearance as a bonus action. When you shift, you gain temporary hit points equal to your level + your Constitution modifier (minimum of 1). You also gain additional benefits that depend on your subrace. Once you shift, you can't do so again until you finish a short or long rest." },
    { name: "Subraces", description: "Choose one: Beasthide (+2 CON, +1 AC while shifted), Longtooth (+2 STR, bonus action bite 1d6+STR while shifted), Swiftstride (+2 DEX, +10 speed while shifted, reaction to move 10 ft when enemy ends turn nearby), or Wildhunt (+2 WIS, advantage on Wisdom checks, no advantage on attacks against you while shifted)." },
  ],
};

const WARFORGED_ERLW: RaceInfo = {
  name: "Warforged",
  source: "ERLW",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2 Constitution, +1 to one other ability score of your choice",
  abilityBonuses: [
    { ability: "constitution", amount: 2 },
    { ability: "choice", amount: 1, choiceCount: 1, excludeAbilities: ["constitution"] },
  ],
  traits: [
    { name: "Constructed Resilience", description: "You were created to have remarkable fortitude. You have advantage on saving throws against being poisoned, and you have resistance to poison damage. You don't need to eat, drink, or breathe. You are immune to disease. You don't need to sleep, and magic can't put you to sleep." },
    { name: "Sentry's Rest", description: "When you take a long rest, you must spend at least six hours in an inactive, motionless state, rather than sleeping. In this state, you appear inert, but it doesn't render you unconscious, and you can see and hear as normal." },
    { name: "Integrated Protection", description: "Your body has built-in defensive layers, which can be enhanced with armor. You gain a +1 bonus to Armor Class. You can don only armor with which you have proficiency. To don armor, you must incorporate it into your body over the course of 1 hour. To doff armor, you must spend 1 hour removing it. You can rest while donning or doffing armor in this way." },
    { name: "Specialized Design", description: "You gain one skill proficiency and one tool proficiency of your choice." },
  ],
};

// ---------------------------------------------------------------------------
// MPMM — Mordenkainen Presents: Monsters of the Multiverse
// ---------------------------------------------------------------------------

const AARAKOCRA_MPMM: RaceInfo = {
  name: "Aarakocra",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Flight", description: "Because of your wings, you have a flying speed equal to your walking speed. You can't use this flying speed if you're wearing medium or heavy armor." },
    { name: "Talons", description: "You have talons that you can use to make unarmed strikes. When you hit with them, the strike deals 1d6 + your Strength modifier slashing damage, instead of the bludgeoning damage normal for an unarmed strike." },
    { name: "Wind Caller", description: "Starting at 3rd level, you can cast the Gust of Wind spell with this trait, without requiring a material component. Once you cast the spell with this trait, you can't do so again until you finish a long rest. You can also cast the spell using any spell slots you have of 2nd level or higher. Intelligence, Wisdom, or Charisma is your spellcasting ability for it (choose when you select this race)." },
  ],
};

const AASIMAR_MPMM: RaceInfo = {
  name: "Aasimar",
  source: "MPMM",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Celestial Resistance", description: "You have resistance to necrotic damage and radiant damage." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Healing Hands", description: "As an action, you can touch a creature and roll a number of d4s equal to your proficiency bonus. The creature regains a number of hit points equal to the total rolled. Once you use this trait, you can't use it again until you finish a long rest." },
    { name: "Light Bearer", description: "You know the Light cantrip. Charisma is your spellcasting ability for it." },
    { name: "Celestial Revelation", description: "When you reach 3rd level, choose one: Necrotic Shroud (frightening flare + necrotic damage), Radiant Consumption (damaging radiant aura), or Radiant Soul (spectral wings for flight + radiant damage). While transformed, once per turn you deal extra damage equal to your proficiency bonus. Transformation lasts 1 minute, usable once per long rest." },
  ],
};

const BUGBEAR_MPMM: RaceInfo = {
  name: "Bugbear",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Fey Ancestry", description: "You have advantage on saving throws you make to avoid or end the charmed condition on yourself." },
    { name: "Long-Limbed", description: "When you make a melee attack on your turn, your reach for it is 5 feet greater than normal." },
    { name: "Powerful Build", description: "You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
    { name: "Sneaky", description: "You are proficient in the Stealth skill." },
    { name: "Surprise Attack", description: "If you hit a creature with an attack roll, the creature takes an extra 2d6 damage if it hasn't taken a turn yet in the current combat." },
  ],
};

const FIRBOLG_MPMM: RaceInfo = {
  name: "Firbolg",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Firbolg Magic", description: "You can cast Detect Magic and Disguise Self with this trait. When you use this version of Disguise Self, you can make yourself appear up to 3 feet shorter or taller. Once you cast either spell with this trait, you can't cast that spell with it again until you finish a long rest. You can also cast these spells using any spell slots you have. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
    { name: "Hidden Step", description: "As a bonus action, you can magically turn invisible until the start of your next turn or until you attack, make a damage roll, or force someone to make a saving throw. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
    { name: "Powerful Build", description: "You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
    { name: "Speech of Beast and Leaf", description: "You have the ability to communicate in a limited manner with Beasts, Plants, and vegetation. They can understand the meaning of your words, though you have no special ability to understand them in return. You have advantage on all Charisma checks you make to influence them." },
  ],
};

const GOBLIN_MPMM: RaceInfo = {
  name: "Goblin",
  source: "MPMM",
  speed: 30,
  size: "Small",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Fey Ancestry", description: "You have advantage on saving throws you make to avoid or end the charmed condition on yourself." },
    { name: "Fury of the Small", description: "When you damage a creature with an attack or a spell and the creature's size is larger than yours, you can cause the attack or spell to deal extra damage to the creature. The extra damage equals your proficiency bonus. You can use this trait a number of times equal to your proficiency bonus, regaining all expended uses when you finish a long rest." },
    { name: "Nimble Escape", description: "You can take the Disengage or Hide action as a bonus action on each of your turns." },
  ],
};

const GOLIATH_MPMM: RaceInfo = {
  name: "Goliath",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Little Giant", description: "You have proficiency in the Athletics skill, and you count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
    { name: "Mountain Born", description: "You have resistance to cold damage. You also naturally acclimate to high altitudes." },
    { name: "Stone's Endurance", description: "When you take damage, you can use your reaction to roll a d12. Add your Constitution modifier to the number rolled and reduce the damage by that total. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
  ],
};

const HOBGOBLIN_MPMM: RaceInfo = {
  name: "Hobgoblin",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Fey Ancestry", description: "You have advantage on saving throws you make to avoid or end the charmed condition on yourself." },
    { name: "Fey Gift", description: "You can use this trait to take the Help action as a bonus action, and you can do so a number of times equal to your proficiency bonus. You regain all expended uses when you finish a long rest. Starting at 3rd level, choose one option each time: Hospitality (you and the helped creature each gain temporary hit points equal to 1d6 + your proficiency bonus), Passage (you and the helped creature each increase walking speed by 10 feet until the start of your next turn), or Spite (target of your Help must make a Wisdom save or have disadvantage on its next attack roll)." },
    { name: "Fortune from the Many", description: "If you miss with an attack roll or fail an ability check or a saving throw, you can draw on your bonds of reciprocity to gain a bonus to the roll equal to the number of allies you can see within 30 feet of you (maximum bonus of +3). You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
  ],
};

const KENKU_MPMM: RaceInfo = {
  name: "Kenku",
  source: "MPMM",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Expert Duplication", description: "When you copy writing or craftwork produced by yourself or someone else, you have advantage on any ability checks you make to produce an exact duplicate." },
    { name: "Kenku Recall", description: "Thanks to your supernatural recall, you have proficiency in two skills of your choice. Moreover, when you make an ability check with any skill in which you have proficiency, you can give yourself advantage on the check before rolling the d20. You can give yourself advantage in this way a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
    { name: "Mimicry", description: "You can accurately mimic sounds you have heard, including voices. A creature that hears the sounds you make can tell they are imitations only with a successful Wisdom (Insight) check against a DC of 8 + your proficiency bonus + your Charisma modifier." },
  ],
};

const KOBOLD_MPMM: RaceInfo = {
  name: "Kobold",
  source: "MPMM",
  speed: 30,
  size: "Small",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Draconic Cry", description: "As a bonus action, you let out a cry at your enemies within 10 feet of you. Until the start of your next turn, you and your allies have advantage on attack rolls against any of those enemies who could hear you. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
    { name: "Kobold Legacy", description: "Choose one: Craftiness (proficiency in one skill: Arcana, Investigation, Medicine, Sleight of Hand, or Survival), Defiance (advantage on saves to avoid or end the frightened condition), or Draconic Sorcery (you know one cantrip from the sorcerer spell list; Intelligence, Wisdom, or Charisma is your spellcasting ability)." },
  ],
};

const LIZARDFOLK_MPMM: RaceInfo = {
  name: "Lizardfolk",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Bite", description: "You have a fanged maw that you can use to make unarmed strikes. When you hit with it, the strike deals 1d6 + your Strength modifier slashing damage, instead of the bludgeoning damage normal for an unarmed strike." },
    { name: "Hold Breath", description: "You can hold your breath for up to 15 minutes at a time." },
    { name: "Hungry Jaws", description: "You can throw yourself into a feeding frenzy. As a bonus action, you can make a special attack with your Bite. If the attack hits, it deals its normal damage, and you gain temporary hit points equal to your proficiency bonus. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
    { name: "Natural Armor", description: "You have tough, scaly skin. When you aren't wearing armor, your base AC is 13 + Dexterity modifier." },
    { name: "Nature's Intuition", description: "Thanks to your mystical connection to nature, you gain proficiency with two of the following skills of your choice: Animal Handling, Medicine, Nature, Perception, Stealth, or Survival." },
    { name: "Swim Speed", description: "You have a swimming speed equal to your walking speed." },
  ],
};

const ORC_MPMM: RaceInfo = {
  name: "Orc",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Adrenaline Rush", description: "You can take the Dash action as a bonus action. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest. Whenever you use this trait, you gain a number of temporary hit points equal to your proficiency bonus." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Powerful Build", description: "You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
    { name: "Relentless Endurance", description: "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. Once you use this trait, you can't do so again until you finish a long rest." },
  ],
};

const TABAXI_MPMM: RaceInfo = {
  name: "Tabaxi",
  source: "MPMM",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Cat's Claws", description: "You can use your claws to make unarmed strikes. When you hit with them, the strike deals 1d6 + your Strength modifier slashing damage, instead of the bludgeoning damage normal for an unarmed strike. You also have a climbing speed equal to your walking speed." },
    { name: "Cat's Talent", description: "You have proficiency in the Perception and Stealth skills." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Feline Agility", description: "Your reflexes and agility allow you to move with a burst of speed. When you move on your turn in combat, you can double your speed until the end of the turn. Once you use this trait, you can't use it again until you move 0 feet on one of your turns." },
  ],
};

const TRITON_MPMM: RaceInfo = {
  name: "Triton",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Amphibious", description: "You can breathe air and water." },
    { name: "Control Air and Water", description: "You can cast Fog Cloud with this trait. Starting at 3rd level, you can also cast Gust of Wind with it. Starting at 5th level, you can also cast Wall of Water with it. Once you cast any of these spells with this trait, you can't cast that spell with it again until you finish a long rest. You can also cast these spells using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Emissary of the Sea", description: "You can communicate simple ideas to any Beast, Elemental, or Monstrosity that has a swimming speed. It can understand your words, though you have no special ability to understand it in return." },
    { name: "Guardians of the Depths", description: "Adapted to the depths, you have resistance to cold damage." },
    { name: "Swim Speed", description: "You have a swimming speed equal to your walking speed." },
  ],
};

const CHANGELING_MPMM: RaceInfo = {
  name: "Changeling",
  source: "MPMM",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Shapechanger", description: "As an action, you change your appearance and your voice. You determine the specifics of the changes, including your coloration, hair length, and sex. You can also adjust your height between Medium and Small. You can make yourself appear as a member of another race, though none of your game statistics change. You can't duplicate the appearance of an individual you've never seen, and you revert to your natural form if you die." },
    { name: "Changeling Instincts", description: "Thanks to your connection to the fey realm, you gain proficiency with two of the following skills of your choice: Deception, Insight, Intimidation, Performance, or Persuasion." },
  ],
};

const SHIFTER_MPMM: RaceInfo = {
  name: "Shifter",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Bestial Instincts", description: "Channeling the beast within, you have proficiency in one of the following skills of your choice: Acrobatics, Athletics, Intimidation, or Survival." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Shifting", description: "As a bonus action, you can assume a more bestial appearance. This transformation lasts for 1 minute, until you die, or until you revert (no action required). When you shift, you gain temporary hit points equal to 2 times your proficiency bonus. You can shift a number of times equal to your proficiency bonus, regaining all uses on a long rest. Choose one of the following options each time you shift: Beasthide (+1d6 temp HP on top of shifting temp HP, +1 AC while shifted), Longtooth (fangs natural weapon, 1d6+STR piercing as bonus action attack while shifted), Swiftstride (+10 speed while shifted, reaction to move 10 ft without provoking OA when creature ends turn within 5 ft), Wildhunt (advantage on Wisdom checks, no creature within 30 ft can make attack rolls with advantage against you while shifted)." },
  ],
};

// ---------------------------------------------------------------------------
// EGW — Explorer's Guide to Wildemount
// ---------------------------------------------------------------------------

const TORTLE_EGW: RaceInfo = {
  name: "Tortle",
  source: "EGW",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Aquan"],
  abilityScoreIncrease: "+2 Strength, +1 Wisdom",
  abilityBonuses: [
    { ability: "strength", amount: 2 },
    { ability: "wisdom", amount: 1 },
  ],
  traits: [
    { name: "Claws", description: "Your claws are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to 1d4 + your Strength modifier, instead of the bludgeoning damage normal for an unarmed strike." },
    { name: "Hold Breath", description: "You can hold your breath for up to 1 hour at a time." },
    { name: "Natural Armor", description: "Due to your shell and the shape of your body, you are ill-suited to wearing armor. Your shell provides ample protection; it gives you a base AC of 17 (your Dexterity modifier doesn't affect this number). You gain no benefit from wearing armor, but if you are using a shield, you can apply the shield's bonus as normal." },
    { name: "Shell Defense", description: "You can withdraw into your shell as an action. Until you emerge, you gain a +4 bonus to AC, and you have advantage on Strength and Constitution saving throws. While in your shell, you are prone, your speed is 0 and can't increase, you have disadvantage on Dexterity saving throws, you can't take reactions, and the only action you can take is a bonus action to emerge from your shell." },
    { name: "Survival Instinct", description: "You gain proficiency in the Survival skill." },
  ],
};

// ---------------------------------------------------------------------------
// VRGR — Van Richten's Guide to Ravenloft
// ---------------------------------------------------------------------------

const DHAMPIR_VRGR: RaceInfo = {
  name: "Dhampir",
  source: "VRGR",
  speed: 35,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Ancestral Legacy", description: "If you replace a race with this lineage, you can keep the following elements of that race: any skill proficiencies you gained from it and any climbing, flying, or swimming speed you gained from it." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Deathless Nature", description: "You don't need to breathe." },
    { name: "Spider Climb", description: "You have a climbing speed equal to your walking speed. In addition, at 3rd level, you can move up, down, and across vertical surfaces and upside down along ceilings, while leaving your hands free." },
    { name: "Vampiric Bite", description: "Your fanged bite is a natural weapon, which counts as a simple melee weapon with which you are proficient. You add your Constitution modifier, instead of your Strength modifier, to the attack and damage rolls when you attack with this bite. It deals 1d4 piercing damage on a hit. While you are missing half or more of your hit points, you have advantage on attack rolls you make with this bite. When you attack with this bite and hit a creature that isn't a Construct or an Undead, you can empower yourself in one of the following ways of your choice: you regain hit points equal to the piercing damage dealt by the bite, or you gain a bonus to the next ability check or attack roll you make equal to the piercing damage dealt. You can empower yourself with this bite a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
  ],
};

const HEXBLOOD_VRGR: RaceInfo = {
  name: "Hexblood",
  source: "VRGR",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Ancestral Legacy", description: "If you replace a race with this lineage, you can keep the following elements of that race: any skill proficiencies you gained from it and any climbing, flying, or swimming speed you gained from it." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Eerie Token", description: "As a bonus action, you can harmlessly remove a lock of your hair, one of your nails, or one of your teeth. This token is imbued with magic until you finish a long rest. While the token is imbued, you can use an action to send a telepathic message to the creature holding or carrying the token, as long as you are within 10 miles of it. The message can contain up to twenty-five words. Additionally, while you are within 10 miles of the token, you can use an action to enter a trance for 1 minute, during which you can see and hear from the token as if you were located where it is. While you are using this trance, you are blinded and deafened with regard to your own surroundings. When the trance ends, the token is harmlessly destroyed. You can create a number of these tokens equal to your proficiency bonus, regaining all uses on a long rest." },
    { name: "Hex Magic", description: "You can cast the Disguise Self and Hex spells with this trait. Once you cast either of these spells with this trait, you can't cast that spell with it again until you finish a long rest. You can also cast these spells using any spell slots you have. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you gain this lineage)." },
  ],
};

const REBORN_VRGR: RaceInfo = {
  name: "Reborn",
  source: "VRGR",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Ancestral Legacy", description: "If you replace a race with this lineage, you can keep the following elements of that race: any skill proficiencies you gained from it and any climbing, flying, or swimming speed you gained from it." },
    { name: "Deathless Nature", description: "You have escaped death, which grants you the following benefits: you have advantage on saving throws against disease and being poisoned, and you have resistance to poison damage. You have advantage on death saving throws. You don't need to eat, drink, or breathe. You don't need to sleep, and magic can't put you to sleep. You can finish a long rest in 4 hours if you spend those hours in an inactive, motionless state, during which you retain consciousness." },
    { name: "Knowledge from a Past Life", description: "You temporarily remember sporadic bits of the past. When you make an ability check that uses a skill, you can roll a d6 immediately after seeing the number on the d20 and add the number on the d6 to the check. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
  ],
};

// ---------------------------------------------------------------------------
// GGR — Guildmasters' Guide to Ravnica
// ---------------------------------------------------------------------------

const CENTAUR_GGR: RaceInfo = {
  name: "Centaur",
  source: "GGR",
  speed: 40,
  size: "Medium",
  languages: ["Common", "Sylvan"],
  abilityScoreIncrease: "+2 Strength, +1 Wisdom",
  abilityBonuses: [
    { ability: "strength", amount: 2 },
    { ability: "wisdom", amount: 1 },
  ],
  traits: [
    { name: "Fey", description: "Your creature type is fey, rather than humanoid." },
    { name: "Charge", description: "If you move at least 30 feet straight toward a target and then hit it with a melee weapon attack on the same turn, you can immediately follow that attack with a bonus action, making one attack against the target with your hooves." },
    { name: "Hooves", description: "Your hooves are natural melee weapons, which you can use to make unarmed strikes. If you hit with them, you deal bludgeoning damage equal to 1d4 + your Strength modifier, instead of the bludgeoning damage normal for an unarmed strike." },
    { name: "Equine Build", description: "You count as one size larger when determining your carrying capacity and the weight you can push or drag. In addition, any climb that requires hands and feet is especially difficult for you; when you make such a climb, each foot of movement costs you 4 extra feet instead of the normal 1 extra foot." },
  ],
};

const LOXODON_GGR: RaceInfo = {
  name: "Loxodon",
  source: "GGR",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Loxodon"],
  abilityScoreIncrease: "+2 Constitution, +1 Wisdom",
  abilityBonuses: [
    { ability: "constitution", amount: 2 },
    { ability: "wisdom", amount: 1 },
  ],
  traits: [
    { name: "Powerful Build", description: "You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
    { name: "Loxodon Serenity", description: "You have advantage on saving throws against being charmed or frightened." },
    { name: "Natural Armor", description: "You have thick, leathery skin. When you aren't wearing armor, your AC is 12 + your Constitution modifier. You can use your natural armor to determine your AC if the armor you wear would leave you with a lower AC. A shield's benefits apply as normal while you use your natural armor." },
    { name: "Trunk", description: "You can grasp things with your trunk, and you can use it as a snorkel. It has a reach of 5 feet, and it can lift a number of pounds equal to five times your Strength score. You can use it to do the following simple tasks: lift, drop, hold, push, or pull an object or a creature; open or close a door or a container; grapple someone; or make an unarmed strike. Your DM might allow other simple tasks. It can't wield weapons or shields or do anything that requires manual precision." },
    { name: "Keen Smell", description: "Thanks to your sensitive trunk, you have advantage on Wisdom (Perception), Wisdom (Survival), and Intelligence (Investigation) checks that involve smell." },
  ],
};

const MINOTAUR_GGR: RaceInfo = {
  name: "Minotaur",
  source: "GGR",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Minotaur"],
  abilityScoreIncrease: "+2 Strength, +1 Constitution",
  abilityBonuses: [
    { ability: "strength", amount: 2 },
    { ability: "constitution", amount: 1 },
  ],
  traits: [
    { name: "Horns", description: "Your horns are natural melee weapons, which you can use to make unarmed strikes. If you hit with them, you deal piercing damage equal to 1d6 + your Strength modifier, instead of the bludgeoning damage normal for an unarmed strike." },
    { name: "Goring Rush", description: "Immediately after you use the Dash action on your turn and move at least 20 feet, you can make one melee attack with your horns as a bonus action." },
    { name: "Hammering Horns", description: "Immediately after you hit a creature with a melee attack as part of the Attack action on your turn, you can use a bonus action to attempt to shove that target with your horns. The target must be within 5 feet of you and no more than one size larger than you. Unless it succeeds on a Strength saving throw against a DC equal to 8 + your proficiency bonus + your Strength modifier, you push it up to 10 feet away from you." },
    { name: "Labyrinthine Recall", description: "You can perfectly recall any path you have traveled." },
    { name: "Imposing Presence", description: "You have proficiency in one of the following skills of your choice: Intimidation or Persuasion." },
  ],
};

const SIMIC_HYBRID_GGR: RaceInfo = {
  name: "Simic Hybrid",
  source: "GGR",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Elvish"],
  abilityScoreIncrease: "+2 Constitution, +1 to one other ability score of your choice",
  abilityBonuses: [
    { ability: "constitution", amount: 2 },
    { ability: "choice", amount: 1, choiceCount: 1, excludeAbilities: ["constitution"] },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Animal Enhancement (1st Level)", description: "Choose one of the following: Manta Glide (you have ray-like fins that you can use as wings to slow your fall, falling at 60 feet per round and moving 2 feet horizontally for every 1 foot you descend), Nimble Climber (you have a climbing speed equal to your walking speed), or Underwater Adaptation (you can breathe air and water, and you have a swimming speed equal to your walking speed)." },
    { name: "Animal Enhancement (5th Level)", description: "At 5th level, your body evolves further. Choose one of the following (or one from the 1st-level list): Grappling Appendages (you have two special appendages; each can make a grapple attack, 1d6+STR bludgeoning on hit, and grapple on hit), Carapace (+1 AC when not wearing heavy armor), or Acid Spit (ranged attack, 30 ft, 2d10 acid damage, Con save for half; recharges on short or long rest)." },
  ],
};

const VEDALKEN_GGR: RaceInfo = {
  name: "Vedalken",
  source: "GGR",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Vedalken", "One extra language of your choice"],
  abilityScoreIncrease: "+2 Intelligence, +1 Wisdom",
  abilityBonuses: [
    { ability: "intelligence", amount: 2 },
    { ability: "wisdom", amount: 1 },
  ],
  traits: [
    { name: "Vedalken Dispassion", description: "You have advantage on all Intelligence, Wisdom, and Charisma saving throws." },
    { name: "Tireless Precision", description: "You are proficient with one tool of your choice. Whenever you make an ability check with the chosen tool, you can add 1d4 to the check. You are also proficient in one skill of your choice from the following list: Arcana, History, Investigation, Medicine, Performance, or Sleight of Hand." },
    { name: "Partially Amphibious", description: "By absorbing oxygen through your skin, you can breathe underwater for up to 1 hour. Once you've reached that limit, you can't use this trait again until you finish a long rest." },
  ],
};

// ---------------------------------------------------------------------------
// MOT — Mythic Odysseys of Theros
// ---------------------------------------------------------------------------

const LEONIN_MOT: RaceInfo = {
  name: "Leonin",
  source: "MOT",
  speed: 35,
  size: "Medium",
  languages: ["Common", "Leonin"],
  abilityScoreIncrease: "+2 Constitution, +1 Strength",
  abilityBonuses: [
    { ability: "constitution", amount: 2 },
    { ability: "strength", amount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Claws", description: "Your claws are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to 1d4 + your Strength modifier, instead of the bludgeoning damage normal for an unarmed strike." },
    { name: "Hunter's Instincts", description: "You have proficiency in one of the following skills of your choice: Athletics, Intimidation, Perception, or Survival." },
    { name: "Daunting Roar", description: "As a bonus action, you can let out an especially menacing roar. Creatures of your choice within 10 feet of you that can hear you must succeed on a Wisdom saving throw (DC 8 + your proficiency bonus + your Constitution modifier) or become frightened of you until the end of your next turn. Once you use this trait, you can't use it again until you finish a short or long rest." },
  ],
};

const SATYR_MOT: RaceInfo = {
  name: "Satyr",
  source: "MOT",
  speed: 35,
  size: "Medium",
  languages: ["Common", "Sylvan"],
  abilityScoreIncrease: "+2 Charisma, +1 Dexterity",
  abilityBonuses: [
    { ability: "charisma", amount: 2 },
    { ability: "dexterity", amount: 1 },
  ],
  traits: [
    { name: "Fey", description: "Your creature type is fey, rather than humanoid." },
    { name: "Ram", description: "You can use your head and horns to make unarmed strikes. If you hit with them, you deal bludgeoning damage equal to 1d4 + your Strength modifier." },
    { name: "Magic Resistance", description: "You have advantage on saving throws against spells and other magical effects." },
    { name: "Mirthful Leaps", description: "Whenever you make a long or high jump, you can roll a d8 and add the number rolled to the number of feet you cover, even when making a standing jump. This extra distance costs movement as normal." },
    { name: "Reveler", description: "You have proficiency in the Performance and Persuasion skills, and you have proficiency with one musical instrument of your choice." },
  ],
};

// ---------------------------------------------------------------------------
// AI — Acquisitions Incorporated
// ---------------------------------------------------------------------------

const VERDAN_AI: RaceInfo = {
  name: "Verdan",
  source: "AI",
  speed: 30,
  size: "Small (becomes Medium at 5th level)",
  languages: ["Common", "Goblin", "One extra language of your choice"],
  abilityScoreIncrease: "+2 Charisma, +1 Constitution",
  abilityBonuses: [
    { ability: "charisma", amount: 2 },
    { ability: "constitution", amount: 1 },
  ],
  traits: [
    { name: "Black Blood Healing", description: "When you roll a 1 or 2 on any Hit Die you spend at the end of a short rest, you can reroll the die and must use the new roll." },
    { name: "Limited Telepathy", description: "You can speak telepathically to any creature you can see within 30 feet of you. You don't need to share a language with the creature for it to understand your telepathic messages, but the creature must be able to understand at least one language or be telepathic itself." },
    { name: "Persuasive", description: "You have proficiency in the Persuasion skill." },
    { name: "Telepathic Insight", description: "You have advantage on all Wisdom and Charisma saving throws." },
  ],
};

// ---------------------------------------------------------------------------
// AAG — Astral Adventurer's Guide (Spelljammer)
// ---------------------------------------------------------------------------

const ASTRAL_ELF_AAG: RaceInfo = {
  name: "Astral Elf",
  source: "AAG",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Fey Ancestry", description: "You have advantage on saving throws you make to avoid or end the charmed condition on yourself." },
    { name: "Keen Senses", description: "You have proficiency in the Perception skill." },
    { name: "Starlight Step", description: "As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
    { name: "Astral Trance", description: "You don't need to sleep, and magic can't put you to sleep. You can finish a long rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness. Whenever you finish this trance, you gain proficiency in one skill of your choice and with one weapon or tool of your choice, selected from the Player's Handbook. These proficiencies last until you start your next long rest." },
  ],
};

const AUTOGNOME_AAG: RaceInfo = {
  name: "Autognome",
  source: "AAG",
  speed: 30,
  size: "Small",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Armored Casing", description: "You are encased in thin metal or some other durable material. While you aren't wearing armor, your base Armor Class is 13 + your Dexterity modifier." },
    { name: "Built for Success", description: "You can add a d4 to one attack roll, ability check, or saving throw you make, and you can do so after seeing the d20 roll but before the effects of the roll are resolved. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
    { name: "Mechanical Nature", description: "You have resistance to poison damage and immunity to disease, and you have advantage on saving throws against being paralyzed or poisoned. You don't need to eat, drink, or breathe." },
    { name: "Sentry's Rest", description: "When you take a long rest, you spend at least 6 hours in an inactive, motionless state, rather than sleeping. In this state, you appear inert, but you aren't unconscious." },
    { name: "Specialized Design", description: "You gain two tool proficiencies of your choice, selected from the Player's Handbook." },
  ],
};

const GIFF_AAG: RaceInfo = {
  name: "Giff",
  source: "AAG",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Astral Spark", description: "Your psychic connection to the Astral Plane gives you an edge in battle. When you hit a target with a simple or martial weapon, you can cause the target to take extra force damage equal to your proficiency bonus." },
    { name: "Firearms Mastery", description: "You have proficiency with all firearms and ignore the loading property of any firearm." },
    { name: "Hippo Build", description: "You have advantage on Strength-based ability checks and Strength saving throws. In addition, you count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
  ],
};

const HADOZEE_AAG: RaceInfo = {
  name: "Hadozee",
  source: "AAG",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Dexterous Feet", description: "As a bonus action, you can use your feet to manipulate an object, open or close a door or container, or pick up or set down a Tiny object." },
    { name: "Glide", description: "If you are not incapacitated or wearing heavy armor, you can extend your skin membranes and glide. When you do so, you can perform the following aerial maneuvers: you can move up to 5 feet horizontally for every 1 foot you descend in the air, at no movement cost to you. When you would take damage from a fall, you can use your reaction to reduce the fall's damage to 0." },
    { name: "Hadozee Resilience", description: "The magic that runs in your veins heightens your natural defenses. When you take damage, you can use your reaction to roll a d6. Add your proficiency bonus to the number rolled, and reduce the damage you take by an amount equal to that total (minimum of 0 damage)." },
    { name: "Climb Speed", description: "You have a climbing speed equal to your walking speed." },
  ],
};

const PLASMOID_AAG: RaceInfo = {
  name: "Plasmoid",
  source: "AAG",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Amorphous", description: "You can squeeze through a space as narrow as 1 inch wide, provided you are wearing and carrying nothing. You have advantage on ability checks you make to initiate or escape a grapple." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Hold Breath", description: "You can hold your breath for 1 hour." },
    { name: "Natural Resistance", description: "You have resistance to acid and poison damage." },
    { name: "Shape Self", description: "As an action, you can reshape your body to give yourself a head, one or two arms, one or two legs, and makeshift hands and feet, or you can revert to a limbless blob. While you have a humanlike form, you can wear clothing and armor made for a Humanoid of your size. As a bonus action, you can extrude a pseudopod that is up to 6 inches wide and 10 feet long or reabsorb it. As an action, you can use a pseudopod to manipulate an object, open or close a door or container, or pick up or set down a Tiny object." },
  ],
};

const THRI_KREEN_AAG: RaceInfo = {
  name: "Thri-kreen",
  source: "AAG",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "Thri-kreen"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Chameleon Carapace", description: "While you aren't wearing armor, your carapace gives you a base AC of 13 + your Dexterity modifier. As an action, you can change the color of your carapace to match the color and texture of your surroundings, giving you advantage on Dexterity (Stealth) checks made to hide in those surroundings." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You discern colors in that darkness only as shades of gray." },
    { name: "Secondary Arms", description: "You have two slightly smaller secondary arms below your primary pair of arms. The secondary arms can manipulate an object, open or close a door or container, pick up or set down a Tiny object, or wield a weapon that has the light property. They can't do anything that requires manual precision or that requires you to use both hands." },
    { name: "Sleepless", description: "You do not require sleep and can choose to remain conscious during a long rest, though you must still refrain from strenuous activity to gain the benefit of the rest." },
  ],
};

// ---------------------------------------------------------------------------
// MPMM — Additional Monsters of the Multiverse races
// ---------------------------------------------------------------------------

const GENASI_AIR_MPMM: RaceInfo = {
  name: "Genasi (Air)",
  source: "MPMM",
  speed: 35,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "Primordial"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Unending Breath", description: "You can hold your breath indefinitely while you're not incapacitated." },
    { name: "Lightning Resistance", description: "You have resistance to lightning damage." },
    { name: "Mingle with the Wind", description: "You know the Shocking Grasp cantrip. Starting at 3rd level, you can cast the Feather Fall spell with this trait, without requiring a material component. Starting at 5th level, you can also cast the Levitate spell with this trait, without requiring a material component. Once you cast Feather Fall or Levitate with this trait, you can't cast that spell with it again until you finish a long rest. You can also cast either of those spells using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
  ],
};

const GENASI_EARTH_MPMM: RaceInfo = {
  name: "Genasi (Earth)",
  source: "MPMM",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "Primordial"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Earth Walk", description: "You can move across difficult terrain made of earth or stone without expending extra movement." },
    { name: "Merge with Stone", description: "You know the Blade Ward cantrip. You can cast it as normal, and you can also cast it as a bonus action a number of times equal to your proficiency bonus, regaining all expended uses when you finish a long rest. Starting at 5th level, you can cast the Pass Without Trace spell with this trait, without requiring a material component. Once you cast that spell with this trait, you can't do so again until you finish a long rest. You can also cast it using any spell slots you have of 2nd level or higher. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
  ],
};

const GENASI_FIRE_MPMM: RaceInfo = {
  name: "Genasi (Fire)",
  source: "MPMM",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "Primordial"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Fire Resistance", description: "You have resistance to fire damage." },
    { name: "Reach to the Blaze", description: "You know the Produce Flame cantrip. Starting at 3rd level, you can cast the Burning Hands spell with this trait. Starting at 5th level, you can also cast the Flame Blade spell with this trait, without requiring a material component. Once you cast Burning Hands or Flame Blade with this trait, you can't cast that spell with it again until you finish a long rest. You can also cast either of those spells using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
  ],
};

const GENASI_WATER_MPMM: RaceInfo = {
  name: "Genasi (Water)",
  source: "MPMM",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "Primordial"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Acid Resistance", description: "You have resistance to acid damage." },
    { name: "Amphibious", description: "You can breathe air and water." },
    { name: "Swim Speed", description: "You have a swimming speed equal to your walking speed." },
    { name: "Call to the Wave", description: "You know the Acid Splash cantrip. Starting at 3rd level, you can cast the Create or Destroy Water spell with this trait. Starting at 5th level, you can also cast the Water Walk spell with this trait, without requiring a material component. Once you cast Create or Destroy Water or Water Walk with this trait, you can't cast that spell with it again until you finish a long rest. You can also cast either of those spells using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
  ],
};

const DEEP_GNOME_MPMM: RaceInfo = {
  name: "Deep Gnome",
  source: "MPMM",
  speed: 30,
  size: "Small",
  languages: ["Common", "Gnomish", "Undercommon"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 120 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Gift of the Svirfneblin", description: "Starting at 3rd level, you can cast the Disguise Self spell with this trait. Starting at 5th level, you can also cast the Nondetection spell with this trait, without requiring a material component. Once you cast either of these spells with this trait, you can't cast that spell with it again until you finish a long rest. You can also cast these spells using spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
    { name: "Gnomish Magic Resistance", description: "You have advantage on Intelligence, Wisdom, and Charisma saving throws against spells." },
    { name: "Svirfneblin Camouflage", description: "When you make a Dexterity (Stealth) check, you can make the check with advantage. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
  ],
};

const DUERGAR_MPMM: RaceInfo = {
  name: "Duergar",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Dwarvish", "Undercommon"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 120 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Duergar Magic", description: "Starting at 3rd level, you can cast the Enlarge/Reduce spell on yourself with this trait, without requiring a material component. Starting at 5th level, you can also cast the Invisibility spell on yourself with this trait, without requiring a material component. Once you cast either of these spells with this trait, you can't cast that spell with it again until you finish a long rest. You can also cast these spells using spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
    { name: "Dwarven Resilience", description: "You have advantage on saving throws against being poisoned, and you have resistance to poison damage." },
    { name: "Psionic Fortitude", description: "You have advantage on saving throws you make to avoid or end the charmed or stunned condition on yourself." },
  ],
};

const ELADRIN_MPMM: RaceInfo = {
  name: "Eladrin",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Fey Ancestry", description: "You have advantage on saving throws you make to avoid or end the charmed condition on yourself." },
    { name: "Fey Step", description: "As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see. You can use this trait a number of times equal to your proficiency bonus, regaining all uses on a long rest. When you reach 3rd level, your Fey Step gains an additional effect based on your season; you can change your season whenever you finish a long rest: Autumn (creatures of your choice within 10 ft must succeed on a Wisdom save or be charmed by you for 1 minute), Winter (one creature within 5 ft must succeed on a Wisdom save or be frightened of you until the end of your next turn), Spring (you can touch one willing creature within 5 ft, they teleport instead of you to the spot), Summer (each creature of your choice within 5 ft takes fire damage equal to your proficiency bonus)." },
    { name: "Trance", description: "You don't need to sleep, and magic can't put you to sleep. You can finish a long rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness." },
  ],
};

const FAIRY_MPMM: RaceInfo = {
  name: "Fairy",
  source: "MPMM",
  speed: 30,
  size: "Small",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Fairy Magic", description: "You know the Druidcraft cantrip. Starting at 3rd level, you can cast the Faerie Fire spell with this trait. Starting at 5th level, you can also cast the Enlarge/Reduce spell with this trait. Once you cast Faerie Fire or Enlarge/Reduce with this trait, you can't cast that spell with it again until you finish a long rest. You can also cast either of those spells using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
    { name: "Flight", description: "Because of your wings, you have a flying speed equal to your walking speed. You can't use this flying speed if you're wearing medium or heavy armor." },
  ],
};

const GITHYANKI_MPMM: RaceInfo = {
  name: "Githyanki",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Gith"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Astral Knowledge", description: "You can mystically access a reservoir of experiences of entities connected to the Astral Plane. When you finish a long rest, you gain proficiency in one skill of your choice and with one weapon or tool of your choice, selected from the Player's Handbook. These proficiencies last until the end of your next long rest." },
    { name: "Githyanki Psionics", description: "You know the Mage Hand cantrip, and the hand is invisible when you cast the cantrip with this trait. Starting at 3rd level, you can cast the Jump spell with this trait. Starting at 5th level, you can also cast the Misty Step spell with this trait. Once you cast Jump or Misty Step with this trait, you can't cast that spell with it again until you finish a long rest. You can also cast either of those spells using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
    { name: "Psychic Resilience", description: "You have resistance to psychic damage." },
  ],
};

const GITHZERAI_MPMM: RaceInfo = {
  name: "Githzerai",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Gith"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Githzerai Psionics", description: "You know the Mage Hand cantrip, and the hand is invisible when you cast the cantrip with this trait. Starting at 3rd level, you can cast the Shield spell with this trait. Starting at 5th level, you can also cast the Detect Thoughts spell with this trait. Once you cast Shield or Detect Thoughts with this trait, you can't cast that spell with it again until you finish a long rest. You can also cast either of those spells using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
    { name: "Mental Discipline", description: "Your innate psychic defenses grant you advantage on saving throws you make to avoid or end the charmed and frightened conditions on yourself." },
    { name: "Psychic Resilience", description: "You have resistance to psychic damage." },
  ],
};

const HARENGON_MPMM: RaceInfo = {
  name: "Harengon",
  source: "MPMM",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Hare-Trigger", description: "You can add your proficiency bonus to your initiative rolls." },
    { name: "Leporine Senses", description: "You have proficiency in the Perception skill." },
    { name: "Lucky Footwork", description: "When you fail a Dexterity saving throw, you can use your reaction to roll a d4 and add it to the save, potentially turning the failure into a success. You can't use this reaction if you're prone or your speed is 0." },
    { name: "Rabbit Hop", description: "As a bonus action, you can jump a number of feet equal to five times your proficiency bonus, without provoking opportunity attacks. You can use this trait only if your speed is greater than 0. You can use it a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest." },
  ],
};

const MINOTAUR_MPMM: RaceInfo = {
  name: "Minotaur",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Horns", description: "You have horns that you can use to make unarmed strikes. When you hit with them, the strike deals 1d6 + your Strength modifier piercing damage, instead of the bludgeoning damage normal for an unarmed strike." },
    { name: "Goring Rush", description: "Immediately after you use the Dash action on your turn and move at least 20 feet, you can make one melee attack with your horns as a bonus action." },
    { name: "Hammering Horns", description: "Immediately after you hit a creature with a melee attack as part of the Attack action on your turn, you can use a bonus action to attempt to push that target with your horns. The target must be no more than one size larger than you and within 5 feet of you. Unless it succeeds on a Strength saving throw against a DC equal to 8 + your proficiency bonus + your Strength modifier, you push it up to 10 feet away from you." },
    { name: "Labyrinthine Recall", description: "You always know which direction is north, and you have advantage on any Wisdom (Survival) check you make to navigate or track." },
  ],
};

const SEA_ELF_MPMM: RaceInfo = {
  name: "Sea Elf",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "Elvish"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Child of the Sea", description: "You have a swimming speed equal to your walking speed, and you can breathe air and water." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Fey Ancestry", description: "You have advantage on saving throws you make to avoid or end the charmed condition on yourself." },
    { name: "Friend of the Sea", description: "Aquatic animals have an extraordinary affinity with your people. You can communicate simple ideas with any Beast that has a swimming speed. It can understand your words, though you have no special ability to understand it in return." },
    { name: "Keen Senses", description: "You have proficiency in the Perception skill." },
    { name: "Trance", description: "You don't need to sleep, and magic can't put you to sleep. You can finish a long rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness." },
  ],
};

const SHADAR_KAI_MPMM: RaceInfo = {
  name: "Shadar-kai",
  source: "MPMM",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Blessing of the Raven Queen", description: "As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest. Starting at 3rd level, you also gain resistance to all damage when you teleport using this trait. The resistance lasts until the start of your next turn. During that time, you appear translucent and ghostlike." },
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Fey Ancestry", description: "You have advantage on saving throws you make to avoid or end the charmed condition on yourself." },
    { name: "Necrotic Resistance", description: "You have resistance to necrotic damage." },
    { name: "Trance", description: "You don't need to sleep, and magic can't put you to sleep. You can finish a long rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness." },
  ],
};

const TORTLE_MPMM: RaceInfo = {
  name: "Tortle",
  source: "MPMM",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Claws", description: "You have claws that you can use to make unarmed strikes. When you hit with them, the strike deals 1d6 + your Strength modifier slashing damage, instead of the bludgeoning damage normal for an unarmed strike." },
    { name: "Hold Breath", description: "You can hold your breath for up to 1 hour at a time." },
    { name: "Natural Armor", description: "Your shell provides you with a base AC of 17 (your Dexterity modifier doesn't affect this number). You can't wear light, medium, or heavy armor, but if you are using a shield, you can apply the shield's bonus as normal." },
    { name: "Shell Defense", description: "You can withdraw into your shell as an action. Until you emerge, you gain a +4 bonus to AC, and you have advantage on Strength and Constitution saving throws. While in your shell, you are prone, your speed is 0 and can't increase, you have disadvantage on Dexterity saving throws, you can't take reactions, and the only action you can take is a bonus action to emerge from your shell." },
  ],
};

const YUAN_TI_MPMM: RaceInfo = {
  name: "Yuan-ti",
  source: "MPMM",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Magic Resistance", description: "You have advantage on saving throws against spells." },
    { name: "Poison Resilience", description: "You have advantage on saving throws you make to avoid or end the poisoned condition on yourself. You also have resistance to poison damage." },
    { name: "Serpentine Spellcasting", description: "You know the Poison Spray cantrip. You can cast Animal Friendship an unlimited number of times with this trait, but you can target only snakes with it. Starting at 3rd level, you can also cast Suggestion with this trait. Once you cast it, you can't do so again until you finish a long rest. You can also cast it using any spell slots you have of 2nd level or higher. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this race)." },
  ],
};

// ---------------------------------------------------------------------------
// SCC — Strixhaven: A Curriculum of Chaos
// ---------------------------------------------------------------------------

const OWLIN_SCC: RaceInfo = {
  name: "Owlin",
  source: "SCC",
  speed: 30,
  size: "Medium or Small (choose when you select this race)",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "Choose +2/+1 or +1/+1/+1 to any ability scores",
  abilityBonuses: [
    { ability: "choice", amount: 2, choiceCount: 1 },
    { ability: "choice", amount: 1, choiceCount: 1 },
  ],
  traits: [
    { name: "Darkvision", description: "You can see in dim light within 120 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray." },
    { name: "Flight", description: "Thanks to your wings, you have a flying speed equal to your walking speed. You can't use this flying speed if you're wearing medium or heavy armor." },
    { name: "Silent Feathers", description: "You have proficiency in the Stealth skill." },
  ],
};

// ---------------------------------------------------------------------------
// TOB — Tome of Beasts / Midgard
// ---------------------------------------------------------------------------

const BEARFOLK_TOB: RaceInfo = {
  name: "Bearfolk",
  source: "TOB",
  speed: 30,
  size: "Medium",
  languages: ["Common", "One extra language of your choice"],
  abilityScoreIncrease: "+2 Strength, +1 Constitution",
  abilityBonuses: [
    { ability: "strength", amount: 2 },
    { ability: "constitution", amount: 1 },
  ],
  traits: [
    { name: "Bite", description: "Your powerful jaws are a natural weapon, which you can use to make unarmed strikes. When you hit with it, the strike deals 1d6 + your Strength modifier piercing damage, instead of the bludgeoning damage normal for an unarmed strike." },
    { name: "Bear Hug", description: "When you take the Attack action, you can use a bonus action to attempt to grapple a creature. You have advantage on the Athletics check to grapple." },
    { name: "Powerful Build", description: "You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
    { name: "Natural Athlete", description: "You have proficiency in the Athletics skill." },
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
  GOLIATH_XPHB,
  ORC_XPHB,
  AASIMAR_XPHB,
  // VGM — Volo's Guide to Monsters
  AARAKOCRA_VGM,
  AASIMAR_VGM,
  FIRBOLG_VGM,
  GOLIATH_VGM,
  KENKU_VGM,
  LIZARDFOLK_VGM,
  TABAXI_VGM,
  TRITON_VGM,
  BUGBEAR_VGM,
  GOBLIN_VGM,
  HOBGOBLIN_VGM,
  KOBOLD_VGM,
  ORC_VGM,
  YUAN_TI_PUREBLOOD_VGM,
  // ERLW — Eberron: Rising from the Last War
  CHANGELING_ERLW,
  KALASHTAR_ERLW,
  SHIFTER_ERLW,
  WARFORGED_ERLW,
  // MPMM — Mordenkainen Presents: Monsters of the Multiverse
  AARAKOCRA_MPMM,
  AASIMAR_MPMM,
  BUGBEAR_MPMM,
  FIRBOLG_MPMM,
  GOBLIN_MPMM,
  GOLIATH_MPMM,
  HOBGOBLIN_MPMM,
  KENKU_MPMM,
  KOBOLD_MPMM,
  LIZARDFOLK_MPMM,
  ORC_MPMM,
  TABAXI_MPMM,
  TRITON_MPMM,
  CHANGELING_MPMM,
  SHIFTER_MPMM,
  // MPMM — additional races
  GENASI_AIR_MPMM,
  GENASI_EARTH_MPMM,
  GENASI_FIRE_MPMM,
  GENASI_WATER_MPMM,
  DEEP_GNOME_MPMM,
  DUERGAR_MPMM,
  ELADRIN_MPMM,
  FAIRY_MPMM,
  GITHYANKI_MPMM,
  GITHZERAI_MPMM,
  HARENGON_MPMM,
  MINOTAUR_MPMM,
  SEA_ELF_MPMM,
  SHADAR_KAI_MPMM,
  TORTLE_MPMM,
  YUAN_TI_MPMM,
  // EGW — Explorer's Guide to Wildemount
  TORTLE_EGW,
  // VRGR — Van Richten's Guide to Ravenloft
  DHAMPIR_VRGR,
  HEXBLOOD_VRGR,
  REBORN_VRGR,
  // GGR — Guildmasters' Guide to Ravnica
  CENTAUR_GGR,
  LOXODON_GGR,
  MINOTAUR_GGR,
  SIMIC_HYBRID_GGR,
  VEDALKEN_GGR,
  // MOT — Mythic Odysseys of Theros
  LEONIN_MOT,
  SATYR_MOT,
  // AI — Acquisitions Incorporated
  VERDAN_AI,
  // AAG — Astral Adventurer's Guide (Spelljammer)
  ASTRAL_ELF_AAG,
  AUTOGNOME_AAG,
  GIFF_AAG,
  HADOZEE_AAG,
  PLASMOID_AAG,
  THRI_KREEN_AAG,
  // SCC — Strixhaven: A Curriculum of Chaos
  OWLIN_SCC,
  // TOB — Tome of Beasts / Midgard
  BEARFOLK_TOB,
];

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
