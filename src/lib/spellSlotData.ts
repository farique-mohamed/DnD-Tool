// Spell slot totals per class level.
// Each entry is a 9-element array: [1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th] slot counts.

type SlotTable = number[][];  // index 0 = level 1, index 19 = level 20

// Full casters (Bard, Cleric, Druid, Sorcerer, Wizard)
const FULL_CASTER_SLOTS: SlotTable = [
  [2,0,0,0,0,0,0,0,0], // 1
  [3,0,0,0,0,0,0,0,0], // 2
  [4,2,0,0,0,0,0,0,0], // 3
  [4,3,0,0,0,0,0,0,0], // 4
  [4,3,2,0,0,0,0,0,0], // 5
  [4,3,3,0,0,0,0,0,0], // 6
  [4,3,3,1,0,0,0,0,0], // 7
  [4,3,3,2,0,0,0,0,0], // 8
  [4,3,3,3,1,0,0,0,0], // 9
  [4,3,3,3,2,0,0,0,0], // 10
  [4,3,3,3,2,1,0,0,0], // 11
  [4,3,3,3,2,1,0,0,0], // 12
  [4,3,3,3,2,1,1,0,0], // 13
  [4,3,3,3,2,1,1,0,0], // 14
  [4,3,3,3,2,1,1,1,0], // 15
  [4,3,3,3,2,1,1,1,0], // 16
  [4,3,3,3,2,1,1,1,1], // 17
  [4,3,3,3,3,1,1,1,1], // 18
  [4,3,3,3,3,2,1,1,1], // 19
  [4,3,3,3,3,2,2,1,1], // 20
];

// Half casters (Paladin, Ranger — no slots at level 1)
const HALF_CASTER_SLOTS: SlotTable = [
  [0,0,0,0,0,0,0,0,0], // 1
  [2,0,0,0,0,0,0,0,0], // 2
  [3,0,0,0,0,0,0,0,0], // 3
  [3,0,0,0,0,0,0,0,0], // 4
  [4,2,0,0,0,0,0,0,0], // 5
  [4,2,0,0,0,0,0,0,0], // 6
  [4,3,0,0,0,0,0,0,0], // 7
  [4,3,0,0,0,0,0,0,0], // 8
  [4,3,2,0,0,0,0,0,0], // 9
  [4,3,2,0,0,0,0,0,0], // 10
  [4,3,3,0,0,0,0,0,0], // 11
  [4,3,3,0,0,0,0,0,0], // 12
  [4,3,3,1,0,0,0,0,0], // 13
  [4,3,3,1,0,0,0,0,0], // 14
  [4,3,3,2,0,0,0,0,0], // 15
  [4,3,3,2,0,0,0,0,0], // 16
  [4,3,3,3,1,0,0,0,0], // 17
  [4,3,3,3,1,0,0,0,0], // 18
  [4,3,3,3,2,0,0,0,0], // 19
  [4,3,3,3,2,0,0,0,0], // 20
];

// Artificer (half-caster, but starts at level 1)
const ARTIFICER_SLOTS: SlotTable = [
  [2,0,0,0,0,0,0,0,0], // 1
  [2,0,0,0,0,0,0,0,0], // 2
  [3,0,0,0,0,0,0,0,0], // 3
  [3,0,0,0,0,0,0,0,0], // 4
  [4,2,0,0,0,0,0,0,0], // 5
  [4,2,0,0,0,0,0,0,0], // 6
  [4,3,0,0,0,0,0,0,0], // 7
  [4,3,0,0,0,0,0,0,0], // 8
  [4,3,2,0,0,0,0,0,0], // 9
  [4,3,2,0,0,0,0,0,0], // 10
  [4,3,3,0,0,0,0,0,0], // 11
  [4,3,3,0,0,0,0,0,0], // 12
  [4,3,3,1,0,0,0,0,0], // 13
  [4,3,3,1,0,0,0,0,0], // 14
  [4,3,3,2,0,0,0,0,0], // 15
  [4,3,3,2,0,0,0,0,0], // 16
  [4,3,3,3,1,0,0,0,0], // 17
  [4,3,3,3,1,0,0,0,0], // 18
  [4,3,3,3,2,0,0,0,0], // 19
  [4,3,3,3,2,0,0,0,0], // 20
];

// Warlock (Pact Magic — all slots are the same level; short rest recharge)
// Represented as [pactSlots, pactSlotLevel, 0,0,0,0,0,0,0] — non-standard
// We store the slot count in index 0 and spell level in index 1
const WARLOCK_SLOTS: SlotTable = [
  [1,1,0,0,0,0,0,0,0], // 1: 1 slot, level 1
  [2,1,0,0,0,0,0,0,0], // 2: 2 slots, level 1
  [2,2,0,0,0,0,0,0,0], // 3
  [2,2,0,0,0,0,0,0,0], // 4
  [2,3,0,0,0,0,0,0,0], // 5
  [2,3,0,0,0,0,0,0,0], // 6
  [2,4,0,0,0,0,0,0,0], // 7
  [2,4,0,0,0,0,0,0,0], // 8
  [2,5,0,0,0,0,0,0,0], // 9
  [2,5,0,0,0,0,0,0,0], // 10
  [3,5,0,0,0,0,0,0,0], // 11
  [3,5,0,0,0,0,0,0,0], // 12
  [3,5,0,0,0,0,0,0,0], // 13
  [3,5,0,0,0,0,0,0,0], // 14
  [3,5,0,0,0,0,0,0,0], // 15
  [3,5,0,0,0,0,0,0,0], // 16
  [4,5,0,0,0,0,0,0,0], // 17
  [4,5,0,0,0,0,0,0,0], // 18
  [4,5,0,0,0,0,0,0,0], // 19
  [4,5,0,0,0,0,0,0,0], // 20
];

export type SpellcastingType = "full" | "half" | "artificer" | "warlock" | "none";

export const SPELLCASTING_TYPE: Record<string, SpellcastingType> = {
  Artificer: "artificer",
  Bard: "full",
  Cleric: "full",
  Druid: "full",
  Paladin: "half",
  Ranger: "half",
  Sorcerer: "full",
  Warlock: "warlock",
  Wizard: "full",
};

export function getSpellSlots(className: string, level: number): number[] {
  const type = SPELLCASTING_TYPE[className];
  if (!type || type === "none") return new Array(9).fill(0) as number[];
  const idx = Math.max(0, Math.min(19, level - 1));
  switch (type) {
    case "full":       return FULL_CASTER_SLOTS[idx]!;
    case "half":       return HALF_CASTER_SLOTS[idx]!;
    case "artificer":  return ARTIFICER_SLOTS[idx]!;
    case "warlock":    return WARLOCK_SLOTS[idx]!;
    default:           return new Array(9).fill(0) as number[];
  }
}

export function isSpellcaster(className: string): boolean {
  const type = SPELLCASTING_TYPE[className];
  return !!type && type !== "none";
}

export function isWarlock(className: string): boolean {
  return SPELLCASTING_TYPE[className] === "warlock";
}

// Re-export spellcasting progression helpers for convenient single-module imports
export {
  getCantripsKnown,
  getSpellsKnownOrPrepared,
  getSpellManagementType,
  getWizardSpellbookSize,
} from "./spellcastingProgressionData";
