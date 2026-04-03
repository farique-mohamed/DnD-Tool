export type ActionCost = "Action" | "Bonus Action" | "Reaction" | "No Action" | "Special";

export interface ActionEntry {
  name: string;
  cost: ActionCost;
  description: string;
  feature?: string;  // source feature name (e.g. "Cunning Action")
}

// Actions available to ALL characters regardless of class
export const UNIVERSAL_ACTIONS: ActionEntry[] = [
  { name: "Attack", cost: "Action", description: "Make one weapon attack or unarmed strike." },
  { name: "Dash", cost: "Action", description: "Gain extra movement equal to your speed for this turn." },
  { name: "Disengage", cost: "Action", description: "Your movement doesn't provoke opportunity attacks for the rest of the turn." },
  { name: "Dodge", cost: "Action", description: "Attack rolls against you have disadvantage, and you make Dex saves with advantage." },
  { name: "Help", cost: "Action", description: "Aid another creature's ability check, or help it attack a target." },
  { name: "Hide", cost: "Action", description: "Attempt to hide from enemies using a Dexterity (Stealth) check." },
  { name: "Ready", cost: "Action", description: "Prepare an action to trigger on a specific condition." },
  { name: "Use Object", cost: "Action", description: "Interact with a second object, or use a magic item not requiring a different action." },
  { name: "Opportunity Attack", cost: "Reaction", description: "Make one melee attack when a hostile creature moves out of reach." },
  { name: "Two-Weapon Fighting (Offhand Attack)", cost: "Bonus Action", description: "When you take the Attack action with a light melee weapon, attack with a different light melee weapon in your off-hand. Add no ability modifier to the damage." },
];

// Class-specific entries: { class → entries available at given level or higher }
export interface ClassActionEntry extends ActionEntry {
  levelRequired: number;
}

export const CLASS_ACTIONS: Record<string, ClassActionEntry[]> = {
  Barbarian: [
    { name: "Rage", cost: "Bonus Action", description: "Enter a rage for 1 minute. Advantage on STR checks/saves, bonus damage, resistance to B/P/S damage. End early if you don't attack or take damage.", feature: "Rage", levelRequired: 1 },
    { name: "Reckless Attack", cost: "No Action", description: "When you make your first attack on your turn, choose to attack recklessly. Advantage on all STR-based attacks this turn, but attack rolls against you have advantage until your next turn.", feature: "Reckless Attack", levelRequired: 2 },
    { name: "Frenzy (Frenzied Berserker)", cost: "Bonus Action", description: "While raging with Frenzy subclass, make one extra weapon attack as a bonus action each turn of rage.", feature: "Frenzy", levelRequired: 3 },
  ],
  Bard: [
    { name: "Bardic Inspiration (Give)", cost: "Bonus Action", description: "Grant a creature within 60 ft a Bardic Inspiration die (d6, scaling). They can add it to one ability check, attack roll, or saving throw within 10 min.", feature: "Bardic Inspiration", levelRequired: 1 },
    { name: "Song of Rest", cost: "No Action", description: "At the end of a short rest, creatures who heard you perform regain extra HP from spending Hit Dice.", feature: "Song of Rest", levelRequired: 2 },
    { name: "Countercharm", cost: "Action", description: "Start a performance that bolsters allies against fear and charm. Lasts until end of your next turn.", feature: "Countercharm", levelRequired: 6 },
  ],
  Cleric: [
    { name: "Channel Divinity", cost: "Action", description: "Channel divine energy for a class feature effect (Turn Undead, Preserve Life, or subclass option).", feature: "Channel Divinity", levelRequired: 2 },
    { name: "Turn Undead", cost: "Action", description: "Each undead that can see/hear you within 30 ft must make a WIS save or be turned for 1 min.", feature: "Channel Divinity: Turn Undead", levelRequired: 2 },
    { name: "Destroy Undead", cost: "No Action", description: "Undead of CR 1/2 or lower that fail Turn Undead are instantly destroyed (CR threshold scales with level).", feature: "Destroy Undead", levelRequired: 5 },
  ],
  Druid: [
    { name: "Wild Shape", cost: "Action", description: "Magically assume the shape of a beast you have seen. Can use as a Bonus Action at level 2 when Circle of the Moon.", feature: "Wild Shape", levelRequired: 2 },
    { name: "Timeless Body", cost: "No Action", description: "You age 1 year for every 10 that pass and can't be aged magically.", feature: "Timeless Body", levelRequired: 18 },
  ],
  Fighter: [
    { name: "Second Wind", cost: "Bonus Action", description: "Regain 1d10 + fighter level HP. Recharges on short or long rest.", feature: "Second Wind", levelRequired: 1 },
    { name: "Action Surge", cost: "No Action", description: "Take one additional action on this turn. Usable once per short/long rest (twice at level 17).", feature: "Action Surge", levelRequired: 2 },
    { name: "Extra Attack", cost: "No Action", description: "Attack twice (three times at 11, four times at 20) when you take the Attack action.", feature: "Extra Attack", levelRequired: 5 },
    { name: "Indomitable", cost: "No Action", description: "Reroll a failed saving throw once per long rest (twice at 13, three times at 17).", feature: "Indomitable", levelRequired: 9 },
  ],
  Monk: [
    { name: "Flurry of Blows", cost: "Bonus Action", description: "Immediately after taking the Attack action, spend 1 ki point to make two unarmed strikes.", feature: "Flurry of Blows", levelRequired: 2 },
    { name: "Patient Defense", cost: "Bonus Action", description: "Spend 1 ki point to take the Dodge action as a bonus action.", feature: "Patient Defense", levelRequired: 2 },
    { name: "Step of the Wind (Dash)", cost: "Bonus Action", description: "Spend 1 ki point to take the Dash action as a bonus action.", feature: "Step of the Wind", levelRequired: 2 },
    { name: "Step of the Wind (Disengage)", cost: "Bonus Action", description: "Spend 1 ki point to take the Disengage action as a bonus action. Jump distance is doubled.", feature: "Step of the Wind", levelRequired: 2 },
    { name: "Stunning Strike", cost: "No Action", description: "Spend 1 ki point when you hit a creature. It must make a CON save or be stunned until end of your next turn.", feature: "Stunning Strike", levelRequired: 5 },
    { name: "Martial Arts (Bonus Unarmed Strike)", cost: "Bonus Action", description: "When you take the Attack action with an unarmed strike or monk weapon, make one unarmed strike as a bonus action.", feature: "Martial Arts", levelRequired: 1 },
  ],
  Paladin: [
    { name: "Divine Smite", cost: "No Action", description: "On a hit with a melee weapon, expend a spell slot to deal 2d8 radiant damage + 1d8 per slot level above 1st (max 5d8). +1d8 vs undead/fiends.", feature: "Divine Smite", levelRequired: 1 },
    { name: "Lay on Hands", cost: "Action", description: "Restore HP from your pool (5 × level HP). Spend 5 HP to cure disease/poison instead.", feature: "Lay on Hands", levelRequired: 1 },
    { name: "Divine Sense", cost: "Action", description: "Detect celestials, fiends, and undead within 60 ft until end of next turn. Usable 1 + CHA mod times/long rest.", feature: "Divine Sense", levelRequired: 1 },
    { name: "Channel Divinity", cost: "Action", description: "Use a Channel Divinity option (Sacred Weapon, Turn the Unholy, or subclass option).", feature: "Channel Divinity", levelRequired: 3 },
    { name: "Aura of Protection", cost: "No Action", description: "Allies within 10 ft (30 ft at 18) add your CHA modifier (min +1) to saving throws while you're conscious.", feature: "Aura of Protection", levelRequired: 6 },
  ],
  Ranger: [
    { name: "Hunter's Mark", cost: "Bonus Action", description: "Mark a target; deal +1d6 damage to it on attacks. Move the mark with a bonus action when target drops.", feature: "Hunter's Mark", levelRequired: 1 },
    { name: "Extra Attack", cost: "No Action", description: "Attack twice when you take the Attack action.", feature: "Extra Attack", levelRequired: 5 },
    { name: "Vanish", cost: "No Action", description: "You can take the Hide action as a bonus action.", feature: "Vanish", levelRequired: 14 },
  ],
  Rogue: [
    { name: "Cunning Action (Dash)", cost: "Bonus Action", description: "Use the Dash action as a bonus action (from Cunning Action).", feature: "Cunning Action", levelRequired: 2 },
    { name: "Cunning Action (Disengage)", cost: "Bonus Action", description: "Use the Disengage action as a bonus action (from Cunning Action).", feature: "Cunning Action", levelRequired: 2 },
    { name: "Cunning Action (Hide)", cost: "Bonus Action", description: "Use the Hide action as a bonus action (from Cunning Action).", feature: "Cunning Action", levelRequired: 2 },
    { name: "Sneak Attack", cost: "No Action", description: "Once per turn, deal +1d6 damage per two rogue levels (rounds up) when you have advantage or an ally adjacent to target.", feature: "Sneak Attack", levelRequired: 1 },
    { name: "Uncanny Dodge", cost: "Reaction", description: "Halve the damage of an attack from an attacker you can see.", feature: "Uncanny Dodge", levelRequired: 5 },
    { name: "Evasion", cost: "No Action", description: "On a successful DEX save for half damage, take no damage instead. On a fail, take half.", feature: "Evasion", levelRequired: 7 },
  ],
  Sorcerer: [
    { name: "Metamagic (Quickened Spell)", cost: "Bonus Action", description: "Spend 2 sorcery points to cast a spell with a 1-action casting time as a bonus action.", feature: "Metamagic", levelRequired: 3 },
    { name: "Metamagic (Twinned Spell)", cost: "No Action", description: "Spend sorcery points equal to spell level to target a second creature with a single-target spell.", feature: "Metamagic", levelRequired: 3 },
    { name: "Sorcery Points / Flexible Casting", cost: "Bonus Action", description: "Convert spell slots to sorcery points, or sorcery points to spell slots.", feature: "Flexible Casting", levelRequired: 2 },
  ],
  Warlock: [
    { name: "Eldritch Blast", cost: "Action", description: "Cantrip — blast a creature with 1d10 force damage per beam (1 beam at 1, +1 at 5/11/17).", feature: "Eldritch Blast", levelRequired: 1 },
    { name: "Hex", cost: "Bonus Action", description: "Curse a target to deal +1d6 necrotic on each hit, and impose disadvantage on chosen ability checks.", feature: "Hex", levelRequired: 1 },
    { name: "Dark One's Blessing", cost: "No Action", description: "When you reduce a hostile creature to 0 HP, gain CHA mod + warlock level temporary HP.", feature: "Dark One's Blessing", levelRequired: 1 },
    { name: "Misty Escape (The Archfey)", cost: "Reaction", description: "Teleport up to 60 ft to a spot you can see when you take damage.", feature: "Misty Escape", levelRequired: 6 },
  ],
  Wizard: [
    { name: "Arcane Recovery", cost: "No Action", description: "Once per day during a short rest, recover spell slots totalling up to half wizard level (rounded up, max 5th level).", feature: "Arcane Recovery", levelRequired: 1 },
    { name: "Spell Mastery", cost: "No Action", description: "At level 18, cast chosen 1st and 2nd level spells without expending a slot.", feature: "Spell Mastery", levelRequired: 18 },
    { name: "Signature Spells", cost: "No Action", description: "At level 20, two 3rd-level spells are always prepared; you can cast each once without a slot.", feature: "Signature Spells", levelRequired: 20 },
  ],
  Artificer: [
    { name: "Magical Tinkering", cost: "Action", description: "Touch a Tiny object to imbue it with one of several minor magical properties.", feature: "Magical Tinkering", levelRequired: 1 },
    { name: "Infuse Item", cost: "No Action", description: "During a long rest, infuse magical properties into nonmagical objects. Max infused items: 2 (L2), 3 (L6), 4 (L10), 5 (L14), 6 (L18).", feature: "Infuse Item", levelRequired: 2 },
    { name: "The Right Tool for the Job", cost: "Action", description: "Spend 1 hour to magically create a set of artisan's tools.", feature: "The Right Tool for the Job", levelRequired: 3 },
    { name: "Flash of Genius", cost: "Reaction", description: "Add your INT modifier to an ability check or saving throw made by you or a visible creature within 30 ft.", feature: "Flash of Genius", levelRequired: 7 },
  ],
};

export function getCharacterActions(className: string, level: number): ActionEntry[] {
  const universal: ActionEntry[] = [...UNIVERSAL_ACTIONS];
  const classSpecific = CLASS_ACTIONS[className] ?? [];
  const available = classSpecific.filter(e => e.levelRequired <= level);
  return [...universal, ...available];
}

/**
 * Returns the full list of character actions including equipment-derived actions.
 * Import EquippedItems and Item from their respective modules to use this function.
 */
export function getCharacterActionsWithEquipment(
  className: string,
  level: number,
  equipmentActions?: ActionEntry[],
): ActionEntry[] {
  const baseActions = getCharacterActions(className, level);

  if (!equipmentActions || equipmentActions.length === 0) {
    return baseActions;
  }

  // If equipment provides an Offhand Attack action (from dual-wielding or Nick mastery),
  // replace the generic "Two-Weapon Fighting (Offhand Attack)" universal action
  const hasEquipmentOffhand = equipmentActions.some(
    (a) => a.name.includes("Offhand Attack"),
  );

  const filtered = hasEquipmentOffhand
    ? baseActions.filter(
        (a) => a.name !== "Two-Weapon Fighting (Offhand Attack)",
      )
    : baseActions;

  return [...filtered, ...equipmentActions];
}
