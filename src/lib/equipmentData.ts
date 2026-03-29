import type { Item } from "./itemsData";
import type { ActionEntry } from "./actionEconomy";

// ---------------------------------------------------------------------------
// Equipment slot types
// ---------------------------------------------------------------------------

export type EquipmentSlot = "mainHand" | "offHand" | "armor" | "shield";

export interface EquippedItems {
  mainHand: string | null; // item name
  offHand: string | null;
  armor: string | null;
  shield: string | null;
}

export const EMPTY_EQUIPMENT: EquippedItems = {
  mainHand: null,
  offHand: null,
  armor: null,
  shield: null,
};

// ---------------------------------------------------------------------------
// Armor proficiency by class
// ---------------------------------------------------------------------------

export const CLASS_ARMOR_PROFICIENCY: Record<string, string[]> = {
  Fighter: ["Light Armor", "Medium Armor", "Heavy Armor", "Shield"],
  Paladin: ["Light Armor", "Medium Armor", "Heavy Armor", "Shield"],
  Cleric: ["Light Armor", "Medium Armor", "Shield"],
  Druid: ["Light Armor", "Medium Armor", "Shield"],
  Ranger: ["Light Armor", "Medium Armor", "Shield"],
  Artificer: ["Light Armor", "Medium Armor", "Shield"],
  Barbarian: ["Light Armor", "Medium Armor", "Shield"],
  Bard: ["Light Armor"],
  Rogue: ["Light Armor"],
  Warlock: ["Light Armor"],
  Monk: [],
  Sorcerer: [],
  Wizard: [],
};

// ---------------------------------------------------------------------------
// Weapon proficiency by class
// ---------------------------------------------------------------------------

export const CLASS_WEAPON_PROFICIENCY: Record<
  string,
  { simple: boolean; martial: boolean; specific?: string[] }
> = {
  Fighter: { simple: true, martial: true },
  Paladin: { simple: true, martial: true },
  Barbarian: { simple: true, martial: true },
  Ranger: { simple: true, martial: true },
  Bard: {
    simple: true,
    martial: false,
    specific: ["Hand Crossbow", "Longsword", "Rapier", "Shortsword"],
  },
  Cleric: { simple: true, martial: false },
  Druid: {
    simple: false,
    martial: false,
    specific: [
      "Club",
      "Dagger",
      "Dart",
      "Javelin",
      "Mace",
      "Quarterstaff",
      "Scimitar",
      "Sickle",
      "Sling",
      "Spear",
    ],
  },
  Monk: { simple: true, martial: false, specific: ["Shortsword"] },
  Rogue: {
    simple: true,
    martial: false,
    specific: ["Hand Crossbow", "Longsword", "Rapier", "Shortsword"],
  },
  Sorcerer: {
    simple: false,
    martial: false,
    specific: [
      "Dagger",
      "Dart",
      "Sling",
      "Quarterstaff",
      "Light Crossbow",
    ],
  },
  Warlock: { simple: true, martial: false },
  Wizard: {
    simple: false,
    martial: false,
    specific: [
      "Dagger",
      "Dart",
      "Sling",
      "Quarterstaff",
      "Light Crossbow",
    ],
  },
  Artificer: { simple: true, martial: false },
};

// ---------------------------------------------------------------------------
// Weapon mastery descriptions (2024 rules)
// ---------------------------------------------------------------------------

export const WEAPON_MASTERY_DESCRIPTIONS: Record<string, string> = {
  Nick: "If you make the extra attack of the Light property, you can make it as part of the Attack action instead of as a Bonus Action. You can make this extra attack only once per turn.",
  Vex: "If you hit a creature with this weapon, you have Advantage on your next attack roll against that creature before the end of your next turn.",
  Cleave:
    "If you hit a creature with a melee attack roll using this weapon, you can make a melee attack roll with the weapon against a second creature within 5 feet of the first that is also within your reach. On a hit, the second creature takes the weapon's damage, but don't add your ability modifier to that damage unless that modifier is negative.",
  Graze:
    "If your attack roll with this weapon misses a creature, you can deal damage to that creature equal to the ability modifier you used to make the attack roll. This damage can't be increased in any way, other than by increasing the ability modifier.",
  Push: "If you hit a creature with this weapon, you can push the creature up to 10 feet straight away from you if it is Large or smaller.",
  Sap: "If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.",
  Slow: "If you hit a creature with this weapon and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn. If the creature is hit more than once by weapons that have this property, the Speed reduction doesn't exceed 10 feet.",
  Topple:
    "If you hit a creature with this weapon, you can force the creature to make a Constitution saving throw (DC 8 + the ability modifier used for the attack roll + your Proficiency Bonus). On a failed save, the creature has the Prone condition.",
};

// ---------------------------------------------------------------------------
// Weapon property descriptions
// ---------------------------------------------------------------------------

export const WEAPON_PROPERTY_DESCRIPTIONS: Record<string, string> = {
  finesse:
    "When making an attack with a finesse weapon, you use your choice of your Strength or Dexterity modifier for the attack and damage rolls.",
  light:
    "When you take the Attack action and attack with a light melee weapon that you're holding in one hand, you can use a Bonus Action to attack with a different light melee weapon that you're holding in the other hand.",
  heavy: "Small creatures have Disadvantage on attack rolls with heavy weapons.",
  "two-handed":
    "This weapon requires two hands when you attack with it.",
  versatile:
    "This weapon can be used with one or two hands. A damage value in parentheses appears with the property -- the damage when the weapon is used with two hands.",
  thrown:
    "You can throw the weapon to make a ranged attack, using the same ability modifier for the attack and damage rolls.",
  reach:
    "This weapon adds 5 feet to your reach when you attack with it, as well as when determining your reach for opportunity attacks.",
  loading:
    "You can fire only one piece of ammunition from this weapon when you use an action, bonus action, or reaction to fire it, regardless of the number of attacks you can normally make.",
  ammunition:
    "You can use a weapon that has the ammunition property to make a ranged attack only if you have ammunition to fire from the weapon.",
  special: "This weapon has a special rule described in its entry.",
  "burst-fire":
    "This weapon can spray a 10-foot-cube area within normal range with shots. Each creature in the area must succeed on a DC 15 Dexterity saving throw or take the weapon's normal damage.",
};

// ---------------------------------------------------------------------------
// Armor type category helpers
// ---------------------------------------------------------------------------

const ARMOR_TYPE_CATEGORIES: Record<string, string> = {
  "Light Armor": "Light Armor",
  "Medium Armor": "Medium Armor",
  "Heavy Armor": "Heavy Armor",
  Shield: "Shield",
};

function getArmorCategory(item: Item): string | null {
  return ARMOR_TYPE_CATEGORIES[item.type] ?? null;
}

function isWeapon(item: Item): boolean {
  return item.type === "Melee Weapon" || item.type === "Ranged Weapon";
}

function isShield(item: Item): boolean {
  return item.type === "Shield";
}

function isArmor(item: Item): boolean {
  return (
    item.type === "Light Armor" ||
    item.type === "Medium Armor" ||
    item.type === "Heavy Armor"
  );
}

// ---------------------------------------------------------------------------
// Find item by name (case-insensitive, first match)
// ---------------------------------------------------------------------------

export function findItemByName(
  itemName: string,
  items: Item[],
): Item | undefined {
  const lower = itemName.toLowerCase();
  const matches = items.filter((i) => i.name.toLowerCase() === lower);
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];
  // Prefer the version with mastery data (XPHB), then property data
  return matches.find((i) => i.mastery && i.mastery.length > 0)
    ?? matches.find((i) => i.property && i.property.length > 0)
    ?? matches[0];
}

// ---------------------------------------------------------------------------
// AC Calculation
// ---------------------------------------------------------------------------

export function calculateEquippedAC(
  equippedItems: EquippedItems,
  dexMod: number,
  conMod: number,
  wisMod: number,
  className: string,
  items: Item[],
): { ac: number; breakdown: string } {
  const armorItem = equippedItems.armor
    ? findItemByName(equippedItems.armor, items)
    : null;
  const shieldItem = equippedItems.shield
    ? findItemByName(equippedItems.shield, items)
    : null;

  let baseAc: number;
  let breakdown: string;

  if (!armorItem) {
    // Unarmored
    if (className === "Barbarian") {
      baseAc = 10 + dexMod + conMod;
      breakdown = `Unarmored Defense: 10 + DEX(${dexMod}) + CON(${conMod})`;
    } else if (className === "Monk") {
      baseAc = 10 + dexMod + wisMod;
      breakdown = `Unarmored Defense: 10 + DEX(${dexMod}) + WIS(${wisMod})`;
    } else {
      baseAc = 10 + dexMod;
      breakdown = `Unarmored: 10 + DEX(${dexMod})`;
    }
  } else {
    const armorAc = armorItem.ac ?? 10;
    const armorCategory = getArmorCategory(armorItem);

    if (armorCategory === "Light Armor") {
      baseAc = armorAc + dexMod;
      breakdown = `${armorItem.name}: ${armorAc} + DEX(${dexMod})`;
    } else if (armorCategory === "Medium Armor") {
      const cappedDex = Math.min(dexMod, 2);
      baseAc = armorAc + cappedDex;
      breakdown = `${armorItem.name}: ${armorAc} + DEX(${cappedDex}, max 2)`;
    } else if (armorCategory === "Heavy Armor") {
      baseAc = armorAc;
      breakdown = `${armorItem.name}: ${armorAc}`;
    } else {
      baseAc = armorAc + dexMod;
      breakdown = `${armorItem.name}: ${armorAc} + DEX(${dexMod})`;
    }
  }

  if (shieldItem) {
    const shieldBonus = shieldItem.ac ?? 2;
    baseAc += shieldBonus;
    breakdown += ` + Shield(${shieldBonus})`;
  }

  return { ac: baseAc, breakdown };
}

// ---------------------------------------------------------------------------
// Armor proficiency penalties
// ---------------------------------------------------------------------------

export function getArmorProficiencyPenalties(
  equippedItems: EquippedItems,
  className: string,
  characterStrength: number,
  items: Item[],
): { hasArmorPenalty: boolean; penalties: string[] } {
  const proficiencies = CLASS_ARMOR_PROFICIENCY[className] ?? [];
  const penalties: string[] = [];

  // Check armor proficiency
  if (equippedItems.armor) {
    const armorItem = findItemByName(equippedItems.armor, items);
    if (armorItem) {
      const armorCategory = getArmorCategory(armorItem);
      if (armorCategory && !proficiencies.includes(armorCategory)) {
        penalties.push(
          `Not proficient with ${armorCategory}: disadvantage on ability checks and saving throws using STR or DEX, and cannot cast spells.`,
        );
      }

      // Heavy armor STR requirement
      if (
        armorCategory === "Heavy Armor" &&
        armorItem.strengthRequirement != null &&
        characterStrength < armorItem.strengthRequirement
      ) {
        penalties.push(
          `STR ${characterStrength} is below ${armorItem.name}'s requirement of ${armorItem.strengthRequirement}: speed reduced by 10 feet.`,
        );
      }

      // Stealth disadvantage (informational, not a penalty per se)
      if (armorItem.stealthDisadvantage) {
        penalties.push(
          `${armorItem.name}: disadvantage on Stealth checks.`,
        );
      }
    }
  }

  // Check shield proficiency
  if (equippedItems.shield) {
    if (!proficiencies.includes("Shield")) {
      penalties.push(
        "Not proficient with shields: disadvantage on ability checks and saving throws using STR or DEX, and cannot cast spells.",
      );
    }
  }

  return {
    hasArmorPenalty: penalties.some(
      (p) => p.includes("Not proficient") || p.includes("speed reduced"),
    ),
    penalties,
  };
}

// ---------------------------------------------------------------------------
// Equipment validation
// ---------------------------------------------------------------------------

export function validateEquipment(
  slot: EquipmentSlot,
  itemName: string,
  currentEquipment: EquippedItems,
  items: Item[],
): { valid: boolean; reason?: string } {
  const item = findItemByName(itemName, items);
  if (!item) {
    return { valid: false, reason: `Item "${itemName}" not found.` };
  }

  switch (slot) {
    case "mainHand": {
      if (!isWeapon(item)) {
        return {
          valid: false,
          reason: `${item.name} is not a weapon and cannot be equipped in the main hand.`,
        };
      }
      // Two-handed weapons take both hands
      if (
        item.property?.includes("two-handed") &&
        currentEquipment.offHand != null
      ) {
        return {
          valid: false,
          reason: `${item.name} is two-handed and requires an empty off-hand. Unequip your off-hand first.`,
        };
      }
      return { valid: true };
    }

    case "offHand": {
      // Can equip a light weapon or a shield-like item
      if (isShield(item)) {
        return {
          valid: false,
          reason: `Use the shield slot to equip ${item.name}.`,
        };
      }
      if (!isWeapon(item)) {
        return {
          valid: false,
          reason: `${item.name} cannot be equipped in the off-hand.`,
        };
      }
      // Check if main hand is two-handed
      if (currentEquipment.mainHand) {
        const mainItem = findItemByName(currentEquipment.mainHand, items);
        if (mainItem?.property?.includes("two-handed")) {
          return {
            valid: false,
            reason: `Cannot equip off-hand: ${currentEquipment.mainHand} is two-handed.`,
          };
        }
      }
      return { valid: true };
    }

    case "armor": {
      if (!isArmor(item)) {
        return {
          valid: false,
          reason: `${item.name} is not armor and cannot be equipped in the armor slot.`,
        };
      }
      return { valid: true };
    }

    case "shield": {
      if (!isShield(item)) {
        return {
          valid: false,
          reason: `${item.name} is not a shield.`,
        };
      }
      // Check if main hand is two-handed
      if (currentEquipment.mainHand) {
        const mainItem = findItemByName(currentEquipment.mainHand, items);
        if (mainItem?.property?.includes("two-handed")) {
          return {
            valid: false,
            reason: `Cannot equip shield: ${currentEquipment.mainHand} is two-handed.`,
          };
        }
      }
      return { valid: true };
    }

    default:
      return { valid: false, reason: `Unknown equipment slot: ${slot as string}` };
  }
}

// ---------------------------------------------------------------------------
// Equipment-based actions
// ---------------------------------------------------------------------------

export function getEquipmentActions(
  equippedItems: EquippedItems,
  className: string,
  level: number,
  items: Item[],
): ActionEntry[] {
  const actions: ActionEntry[] = [];

  const mainItem = equippedItems.mainHand
    ? findItemByName(equippedItems.mainHand, items)
    : null;
  const offItem = equippedItems.offHand
    ? findItemByName(equippedItems.offHand, items)
    : null;

  // Dual-wielding: two light weapons → Offhand Attack available
  const mainIsLight = mainItem?.property?.includes("light") ?? false;
  const offIsLight = offItem?.property?.includes("light") ?? false;
  const mainHasNick = mainItem?.mastery?.includes("Nick") ?? false;
  const offHasNick = offItem?.mastery?.includes("Nick") ?? false;

  if (mainItem && offItem && mainIsLight && offIsLight) {
    if (mainHasNick || offHasNick) {
      actions.push({
        name: "Offhand Attack (Nick Mastery)",
        cost: "No Action",
        description: `Attack with ${offItem.name} as part of the Attack action (Nick mastery). You can make this extra attack only once per turn. Don't add your ability modifier to damage unless negative.`,
        feature: "Nick Mastery",
      });
    } else {
      actions.push({
        name: "Offhand Attack",
        cost: "Bonus Action",
        description: `Attack with ${offItem.name} (light weapon in off-hand). Don't add your ability modifier to damage unless negative.`,
        feature: "Two-Weapon Fighting",
      });
    }
  }

  // Add weapon mastery actions for equipped weapons
  const weaponSlots: Array<{ item: Item; slot: string }> = [];
  if (mainItem && isWeapon(mainItem))
    weaponSlots.push({ item: mainItem, slot: "main hand" });
  if (offItem && isWeapon(offItem))
    weaponSlots.push({ item: offItem, slot: "off-hand" });

  for (const { item, slot } of weaponSlots) {
    if (!item.mastery) continue;
    for (const mastery of item.mastery) {
      const desc = WEAPON_MASTERY_DESCRIPTIONS[mastery];
      if (desc) {
        actions.push({
          name: `${mastery} (${item.name}, ${slot})`,
          cost: "No Action",
          description: desc,
          feature: `Weapon Mastery: ${mastery}`,
        });
      }
    }
  }

  // Add weapon property notes for equipped weapons
  for (const { item, slot } of weaponSlots) {
    if (!item.property) continue;
    for (const prop of item.property) {
      const desc = WEAPON_PROPERTY_DESCRIPTIONS[prop];
      if (!desc) continue;
      const displayName = prop
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("-");
      actions.push({
        name: `${displayName} (${item.name}, ${slot})`,
        cost: "No Action",
        description: `${item.name} has the ${prop} property: ${desc.charAt(0).toLowerCase()}${desc.slice(1)}`,
        feature: `Weapon Property: ${displayName}`,
      });
    }
  }

  return actions;
}
