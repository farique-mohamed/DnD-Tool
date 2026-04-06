// ---------------------------------------------------------------------------
// Level-Up Feature Choices — defines what choices each class/subclass gets
// at each level during level-up (languages, skills, fighting styles, etc.)
// ---------------------------------------------------------------------------

import { ALL_LANGUAGES } from "./languageData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChoiceType =
  | "language"
  | "skill"
  | "tool"
  | "fighting_style"
  | "cantrip";

export interface LevelUpChoice {
  /** Feature name displayed to the user */
  featureName: string;
  /** Type of choice */
  type: ChoiceType;
  /** Number of selections required */
  count: number;
  /** Available options to choose from. null = use ALL for that type */
  options: string[] | null;
  /** Description shown to the user */
  description: string;
}

export interface LevelUpChoiceKey {
  className: string;
  subclass?: string; // if undefined, applies to all subclasses (base class feature)
  level: number;
  rulesSource?: "PHB" | "XPHB"; // if undefined, applies to both
}

export interface LevelUpChoiceEntry extends LevelUpChoiceKey {
  choices: LevelUpChoice[];
}

// ---------------------------------------------------------------------------
// Fighting Style options & descriptions
// ---------------------------------------------------------------------------

export const FIGHTING_STYLE_DESCRIPTIONS: Record<string, string> = {
  "Archery": "You gain a +2 bonus to attack rolls you make with ranged weapons.",
  "Blind Fighting": "You have Blindsight with a range of 10 feet. Within that range, you can effectively see anything that isn't behind total cover, even if you're Blinded or in darkness. Moreover, you can see an invisible creature within that range, unless the creature successfully hides from you.",
  "Blessed Warrior": "You learn two cantrips of your choice from the Cleric spell list. They count as Paladin spells for you, and Charisma is your spellcasting ability for them. Whenever you gain a level in this class, you can replace one of these cantrips with another cantrip from the Cleric spell list.",
  "Defense": "While you are wearing armor, you gain a +1 bonus to AC.",
  "Druidic Warrior": "You learn two cantrips of your choice from the Druid spell list. They count as Ranger spells for you, and Wisdom is your spellcasting ability for them. Whenever you gain a level in this class, you can replace one of these cantrips with another cantrip from the Druid spell list.",
  "Dueling": "When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.",
  "Great Weapon Fighting": "When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll, even if the new roll is a 1 or a 2. The weapon must have the Two-Handed or Versatile property for you to gain this benefit.",
  "Interception": "When a creature you can see hits a target, other than you, within 5 feet of you with an attack, you can use your reaction to reduce the damage the target takes by 1d10 + your proficiency bonus (to a minimum of 0 damage). You must be wielding a shield or a simple or martial weapon to use this reaction.",
  "Protection": "When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield.",
  "Superior Technique": "You learn one maneuver of your choice from among those available to the Battle Master archetype. You gain one superiority die, which is a d6 (this die is added to any superiority dice you have from another source). This die is used to fuel your maneuvers. It is expended when you use it, and is regained when you finish a short or long rest.",
  "Thrown Weapon Fighting": "You can draw a weapon that has the Thrown property as part of the attack you make with the weapon. In addition, when you hit with a ranged attack using a thrown weapon, you gain a +2 bonus to the damage roll.",
  "Two-Weapon Fighting": "When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.",
  "Unarmed Fighting": "Your unarmed strikes can deal bludgeoning damage equal to 1d6 + your Strength modifier on a hit. If you aren't wielding any weapons or a shield when you make the attack roll, the d6 becomes a d8. At the start of each of your turns, you can deal 1d4 bludgeoning damage to one creature grappled by you.",
};

export const FIGHTING_STYLES_PHB: string[] = [
  "Archery",
  "Blind Fighting",
  "Defense",
  "Dueling",
  "Great Weapon Fighting",
  "Interception",
  "Protection",
  "Superior Technique",
  "Thrown Weapon Fighting",
  "Two-Weapon Fighting",
  "Unarmed Fighting",
];

export const FIGHTING_STYLES_RANGER: string[] = [
  "Archery",
  "Blind Fighting",
  "Defense",
  "Druidic Warrior",
  "Dueling",
  "Thrown Weapon Fighting",
  "Two-Weapon Fighting",
];

export const FIGHTING_STYLES_PALADIN: string[] = [
  "Blessed Warrior",
  "Blind Fighting",
  "Defense",
  "Dueling",
  "Great Weapon Fighting",
  "Interception",
  "Protection",
];

// ---------------------------------------------------------------------------
// Skill lists for subclass grants
// ---------------------------------------------------------------------------

const BARBARIAN_SKILLS = [
  "Animal Handling",
  "Athletics",
  "Intimidation",
  "Nature",
  "Perception",
  "Survival",
];

// ---------------------------------------------------------------------------
// All level-up choice definitions
// ---------------------------------------------------------------------------

const LEVEL_UP_CHOICES: LevelUpChoiceEntry[] = [
  // =========================================================================
  // FIGHTING STYLES
  // =========================================================================
  {
    className: "Fighter",
    level: 1,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Fighting Style",
        type: "fighting_style",
        count: 1,
        options: FIGHTING_STYLES_PHB,
        description: "Choose a fighting style specialty.",
      },
    ],
  },
  {
    className: "Fighter",
    level: 10,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Additional Fighting Style",
        type: "fighting_style",
        count: 1,
        options: FIGHTING_STYLES_PHB,
        description: "Choose a second fighting style.",
      },
    ],
  },
  {
    className: "Ranger",
    level: 2,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Fighting Style",
        type: "fighting_style",
        count: 1,
        options: FIGHTING_STYLES_RANGER,
        description: "Choose a fighting style specialty.",
      },
    ],
  },
  {
    className: "Paladin",
    level: 2,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Fighting Style",
        type: "fighting_style",
        count: 1,
        options: FIGHTING_STYLES_PALADIN,
        description: "Choose a fighting style specialty.",
      },
    ],
  },

  // =========================================================================
  // RANGER — Favored Enemy languages (PHB)
  // =========================================================================
  {
    className: "Ranger",
    level: 1,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Favored Enemy",
        type: "language",
        count: 1,
        options: null, // any language
        description:
          "You learn one language spoken by your favored enemies.",
      },
    ],
  },
  {
    className: "Ranger",
    level: 6,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Favored Enemy",
        type: "language",
        count: 1,
        options: null,
        description:
          "You learn one additional language spoken by your new favored enemy.",
      },
    ],
  },
  {
    className: "Ranger",
    level: 14,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Favored Enemy",
        type: "language",
        count: 1,
        options: null,
        description:
          "You learn one additional language spoken by your new favored enemy.",
      },
    ],
  },

  // =========================================================================
  // RANGER — Drakewarden (language + cantrip)
  // =========================================================================
  {
    className: "Ranger",
    subclass: "Drakewarden",
    level: 3,
    choices: [
      {
        featureName: "Draconic Gift",
        type: "language",
        count: 1,
        options: null, // Draconic or any other
        description:
          "You learn to speak, read, and write Draconic or one other language of your choice.",
      },
    ],
  },

  // =========================================================================
  // FIGHTER — Champion (skill OR language)
  // =========================================================================
  {
    className: "Fighter",
    subclass: "Champion",
    level: 3,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Remarkable Athlete",
        type: "skill",
        count: 1,
        options: [
          "Animal Handling",
          "History",
          "Insight",
          "Performance",
          "Persuasion",
        ],
        description:
          "Choose one skill proficiency, or learn one language of your choice.",
      },
    ],
  },

  // =========================================================================
  // FIGHTER — Eldritch Knight (skill OR language)
  // =========================================================================
  {
    className: "Fighter",
    subclass: "Eldritch Knight",
    level: 3,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Eldritch Knight Training",
        type: "skill",
        count: 1,
        options: ["History", "Insight", "Performance", "Persuasion"],
        description:
          "Choose one skill proficiency, or learn one language of your choice.",
      },
    ],
  },

  // =========================================================================
  // FIGHTER — Rune Knight (language)
  // =========================================================================
  {
    className: "Fighter",
    subclass: "Rune Knight",
    level: 3,
    choices: [
      {
        featureName: "Rune Carver",
        type: "language",
        count: 1,
        options: null,
        description: "You learn one language of your choice.",
      },
    ],
  },

  // =========================================================================
  // BARBARIAN — skill proficiency (some sources)
  // =========================================================================
  {
    className: "Barbarian",
    level: 3,
    rulesSource: "XPHB",
    choices: [
      {
        featureName: "Primal Knowledge",
        type: "skill",
        count: 1,
        options: BARBARIAN_SKILLS,
        description:
          "Choose one skill proficiency from the barbarian skill list.",
      },
    ],
  },
  {
    className: "Barbarian",
    level: 10,
    rulesSource: "XPHB",
    choices: [
      {
        featureName: "Primal Knowledge",
        type: "skill",
        count: 1,
        options: BARBARIAN_SKILLS,
        description:
          "Choose one additional skill proficiency from the barbarian skill list.",
      },
    ],
  },

  // =========================================================================
  // BARBARIAN — Totem Warrior (totem animal choices handled as fighting_style)
  // =========================================================================
  {
    className: "Barbarian",
    subclass: "Totem Warrior",
    level: 3,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Totem Spirit",
        type: "fighting_style",
        count: 1,
        options: ["Bear", "Eagle", "Elk", "Tiger", "Wolf"],
        description: "Choose a totem animal spirit.",
      },
    ],
  },
  {
    className: "Barbarian",
    subclass: "Totem Warrior",
    level: 6,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Aspect of the Beast",
        type: "fighting_style",
        count: 1,
        options: ["Bear", "Eagle", "Elk", "Tiger", "Wolf"],
        description:
          "Choose a totem animal for your Aspect of the Beast (can differ from level 3).",
      },
    ],
  },
  {
    className: "Barbarian",
    subclass: "Totem Warrior",
    level: 14,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Totemic Attunement",
        type: "fighting_style",
        count: 1,
        options: ["Bear", "Eagle", "Elk", "Tiger", "Wolf"],
        description:
          "Choose a totem animal for your Totemic Attunement (can differ from previous choices).",
      },
    ],
  },

  // =========================================================================
  // BARD — College of Lore (3 skill proficiencies)
  // =========================================================================
  {
    className: "Bard",
    subclass: "College of Lore",
    level: 3,
    choices: [
      {
        featureName: "Bonus Proficiencies",
        type: "skill",
        count: 3,
        options: [
          "Acrobatics",
          "Animal Handling",
          "Arcana",
          "Athletics",
          "Deception",
          "History",
          "Insight",
          "Intimidation",
          "Investigation",
          "Medicine",
          "Nature",
          "Perception",
          "Performance",
          "Persuasion",
          "Religion",
          "Sleight of Hand",
          "Stealth",
          "Survival",
        ],
        description: "Choose three skill proficiencies of your choice.",
      },
    ],
  },

  // =========================================================================
  // CLERIC — Knowledge Domain (2 languages + 2 skills)
  // =========================================================================
  {
    className: "Cleric",
    subclass: "Knowledge",
    level: 1,
    choices: [
      {
        featureName: "Blessings of Knowledge",
        type: "language",
        count: 2,
        options: null,
        description: "You learn two languages of your choice.",
      },
      {
        featureName: "Blessings of Knowledge",
        type: "skill",
        count: 2,
        options: ["Arcana", "History", "Nature", "Religion"],
        description:
          "Choose two skills from Arcana, History, Nature, or Religion. Your proficiency bonus is doubled for checks using those skills.",
      },
    ],
  },

  // =========================================================================
  // ROGUE — Arcane Trickster (2 languages + 1 gaming set)
  // =========================================================================
  {
    className: "Rogue",
    subclass: "Arcane Trickster",
    level: 3,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Arcane Trickster Training",
        type: "language",
        count: 2,
        options: null,
        description: "You learn two languages of your choice.",
      },
      {
        featureName: "Arcane Trickster Training",
        type: "tool",
        count: 1,
        options: [
          "Dice Set",
          "Dragonchess Set",
          "Playing Card Set",
          "Three-Dragon Ante Set",
        ],
        description: "Choose one gaming set proficiency.",
      },
    ],
  },

  // =========================================================================
  // MONK — Way of the Cobalt Soul (language + skill at level 6)
  // =========================================================================
  {
    className: "Monk",
    subclass: "Cobalt Soul",
    level: 6,
    choices: [
      {
        featureName: "Mystical Erudition",
        type: "language",
        count: 1,
        options: null,
        description: "You learn one language of your choice.",
      },
      {
        featureName: "Mystical Erudition",
        type: "skill",
        count: 1,
        options: ["Arcana", "History", "Investigation", "Nature", "Religion"],
        description:
          "Choose one skill proficiency. If already proficient, you gain expertise instead.",
      },
    ],
  },

  // =========================================================================
  // SORCERER — Metamagic
  // =========================================================================
  {
    className: "Sorcerer",
    level: 3,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Metamagic",
        type: "fighting_style", // reusing type for named-option choices
        count: 2,
        options: [
          "Careful Spell",
          "Distant Spell",
          "Empowered Spell",
          "Extended Spell",
          "Heightened Spell",
          "Quickened Spell",
          "Seeking Spell",
          "Subtle Spell",
          "Transmuted Spell",
          "Twinned Spell",
        ],
        description: "Choose two Metamagic options.",
      },
    ],
  },
  {
    className: "Sorcerer",
    level: 10,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Metamagic",
        type: "fighting_style",
        count: 1,
        options: [
          "Careful Spell",
          "Distant Spell",
          "Empowered Spell",
          "Extended Spell",
          "Heightened Spell",
          "Quickened Spell",
          "Seeking Spell",
          "Subtle Spell",
          "Transmuted Spell",
          "Twinned Spell",
        ],
        description: "Choose one additional Metamagic option.",
      },
    ],
  },
  {
    className: "Sorcerer",
    level: 17,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Metamagic",
        type: "fighting_style",
        count: 1,
        options: [
          "Careful Spell",
          "Distant Spell",
          "Empowered Spell",
          "Extended Spell",
          "Heightened Spell",
          "Quickened Spell",
          "Seeking Spell",
          "Subtle Spell",
          "Transmuted Spell",
          "Twinned Spell",
        ],
        description: "Choose one additional Metamagic option.",
      },
    ],
  },

  // =========================================================================
  // WARLOCK — Pact Boon
  // =========================================================================
  {
    className: "Warlock",
    level: 3,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Pact Boon",
        type: "fighting_style",
        count: 1,
        options: [
          "Pact of the Blade",
          "Pact of the Chain",
          "Pact of the Talisman",
          "Pact of the Tome",
        ],
        description: "Choose a pact boon from your patron.",
      },
    ],
  },

  // =========================================================================
  // WARLOCK — Eldritch Invocations
  // =========================================================================
  ...[2, 5, 7, 9, 12, 15, 18].map((level): LevelUpChoiceEntry => ({
    className: "Warlock",
    level,
    rulesSource: "PHB",
    choices: [
      {
        featureName: "Eldritch Invocations",
        type: "fighting_style",
        count: level === 2 ? 2 : 1,
        options: [
          "Agonizing Blast",
          "Armor of Shadows",
          "Ascendant Step",
          "Beast Speech",
          "Beguiling Influence",
          "Bewitching Whispers",
          "Bond of the Talisman",
          "Book of Ancient Secrets",
          "Chains of Carceri",
          "Cloak of Flies",
          "Devil's Sight",
          "Dreadful Word",
          "Eldritch Mind",
          "Eldritch Sight",
          "Eldritch Smite",
          "Eyes of the Rune Keeper",
          "Far Scribe",
          "Fiendish Vigor",
          "Gaze of Two Minds",
          "Ghostly Gaze",
          "Gift of the Depths",
          "Gift of the Ever-Living Ones",
          "Gift of the Protectors",
          "Grasp of Hadar",
          "Improved Pact Weapon",
          "Investment of the Chain Master",
          "Lance of Lethargy",
          "Lifedrinker",
          "Maddening Hex",
          "Mask of Many Faces",
          "Master of Myriad Forms",
          "Minions of Chaos",
          "Mire the Mind",
          "Misty Visions",
          "One with Shadows",
          "Otherworldly Leap",
          "Rebuke of the Talisman",
          "Relentless Hex",
          "Repelling Blast",
          "Sculptor of Flesh",
          "Shadow of Moil",
          "Shroud of Shadow",
          "Sign of Ill Omen",
          "Thief of Five Fates",
          "Thirsting Blade",
          "Tomb of Levistus",
          "Trickster's Escape",
          "Undying Servitude",
          "Visions of Distant Realms",
          "Whispers of the Grave",
          "Witch Sight",
        ],
        description:
          level === 2
            ? "Choose two eldritch invocations."
            : "Choose one additional eldritch invocation.",
      },
    ],
  })),

  // =========================================================================
  // ARTIFICER — Tool proficiency choices
  // =========================================================================
  {
    className: "Artificer",
    subclass: "Alchemist",
    level: 3,
    choices: [
      {
        featureName: "Tool Proficiency",
        type: "tool",
        count: 1,
        options: [
          "Alchemist's Supplies",
          "Brewer's Supplies",
          "Calligrapher's Supplies",
          "Carpenter's Tools",
          "Cartographer's Tools",
          "Cobbler's Tools",
          "Cook's Utensils",
          "Glassblower's Tools",
          "Jeweler's Tools",
          "Leatherworker's Tools",
          "Mason's Tools",
          "Painter's Supplies",
          "Potter's Tools",
          "Smith's Tools",
          "Tinker's Tools",
          "Weaver's Tools",
          "Woodcarver's Tools",
        ],
        description:
          "You gain proficiency with alchemist's supplies. If you already have this, choose another artisan's tools.",
      },
    ],
  },
  {
    className: "Artificer",
    subclass: "Artillerist",
    level: 3,
    choices: [
      {
        featureName: "Tool Proficiency",
        type: "tool",
        count: 1,
        options: [
          "Woodcarver's Tools",
          "Brewer's Supplies",
          "Calligrapher's Supplies",
          "Carpenter's Tools",
          "Cartographer's Tools",
          "Cobbler's Tools",
          "Cook's Utensils",
          "Glassblower's Tools",
          "Jeweler's Tools",
          "Leatherworker's Tools",
          "Mason's Tools",
          "Painter's Supplies",
          "Potter's Tools",
          "Smith's Tools",
          "Tinker's Tools",
          "Weaver's Tools",
          "Alchemist's Supplies",
        ],
        description:
          "You gain proficiency with woodcarver's tools. If you already have this, choose another artisan's tools.",
      },
    ],
  },
  {
    className: "Artificer",
    subclass: "Battle Smith",
    level: 3,
    choices: [
      {
        featureName: "Tool Proficiency",
        type: "tool",
        count: 1,
        options: [
          "Smith's Tools",
          "Brewer's Supplies",
          "Calligrapher's Supplies",
          "Carpenter's Tools",
          "Cartographer's Tools",
          "Cobbler's Tools",
          "Cook's Utensils",
          "Glassblower's Tools",
          "Jeweler's Tools",
          "Leatherworker's Tools",
          "Mason's Tools",
          "Painter's Supplies",
          "Potter's Tools",
          "Tinker's Tools",
          "Weaver's Tools",
          "Woodcarver's Tools",
          "Alchemist's Supplies",
        ],
        description:
          "You gain proficiency with smith's tools. If you already have this, choose another artisan's tools.",
      },
    ],
  },

  // =========================================================================
  // MONK — Way of the Kensei (tool proficiency)
  // =========================================================================
  {
    className: "Monk",
    subclass: "Kensei",
    level: 3,
    choices: [
      {
        featureName: "Path of the Kensei",
        type: "tool",
        count: 1,
        options: ["Calligrapher's Supplies", "Painter's Supplies"],
        description: "Choose one: calligrapher's supplies or painter's supplies.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Lookup function
// ---------------------------------------------------------------------------

/**
 * Get all level-up choices for a character reaching a specific level.
 * Filters by class, subclass (if set), level, and rules source.
 */
export function getLevelUpChoices(
  className: string,
  level: number,
  rulesSource: string,
  subclass?: string | null,
): LevelUpChoice[] {
  const choices: LevelUpChoice[] = [];

  for (const entry of LEVEL_UP_CHOICES) {
    // Must match class name
    if (entry.className !== className) continue;

    // Must match level
    if (entry.level !== level) continue;

    // Rules source: if entry specifies one, must match; otherwise applies to both
    if (entry.rulesSource && entry.rulesSource !== rulesSource) continue;

    // Subclass matching:
    // - If entry has no subclass requirement, it's a base class feature (always applies)
    // - If entry has a subclass requirement, character must have that subclass
    if (entry.subclass) {
      if (!subclass) continue;
      // Match by subclass name (case-insensitive partial match for flexibility)
      const entryLower = entry.subclass.toLowerCase();
      const charLower = subclass.toLowerCase();
      if (!charLower.includes(entryLower) && !entryLower.includes(charLower)) {
        continue;
      }
    }

    choices.push(...entry.choices);
  }

  // For language choices with null options, fill in ALL_LANGUAGES
  return choices.map((c) => {
    if (c.type === "language" && c.options === null) {
      return { ...c, options: ALL_LANGUAGES };
    }
    return c;
  });
}
