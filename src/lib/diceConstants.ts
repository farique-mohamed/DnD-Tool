export const DICE_TYPES = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"] as const;
export type DiceType = (typeof DICE_TYPES)[number];

export const DICE_SIDES: Record<DiceType, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
};

export const ROLL_LABELS = [
  "General",
  "Attack Roll",
  "Damage Roll",
  "Saving Throw",
  "Skill Check",
  "Initiative",
  "Death Save",
  "Ability Check",
] as const;
export type RollLabel = (typeof ROLL_LABELS)[number];

export const ROLL_MODES = ["NORMAL", "ADVANTAGE", "DISADVANTAGE"] as const;
export type RollMode = (typeof ROLL_MODES)[number];
