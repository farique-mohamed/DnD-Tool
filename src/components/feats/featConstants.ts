// ---------------------------------------------------------------------------
// Shared constants and helpers for Feats components
// ---------------------------------------------------------------------------

import type { FeatAbilityBonus, FeatSpellGrant } from "@/lib/featData";

// ---------------------------------------------------------------------------
// Theme constants
// ---------------------------------------------------------------------------

export const GOLD = "#c9a84c";
export const GOLD_MUTED = "#a89060";
export const GOLD_BRIGHT = "#e8d5a3";
export const GOLD_DIM = "rgba(201,168,76,0.15)";
export const GOLD_BORDER = "rgba(201,168,76,0.25)";
export const TEXT_DIM = "rgba(232,213,163,0.6)";
export const SERIF = "'EB Garamond', 'Georgia', serif";

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

const CATEGORY_DISPLAY: Record<string, string> = {
  O: "Origin",
  G: "General",
  EB: "Epic Boon",
};

const CATEGORY_COLORS: Record<string, string> = {
  O: "#27ae60",
  G: "#4a90d9",
  EB: "#9b59b6",
};

const ABILITY_NAMES: Record<string, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function categoryDisplayName(category: string): string {
  return CATEGORY_DISPLAY[category] ?? category;
}

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? GOLD_MUTED;
}

export function formatAbilityBonus(bonus: FeatAbilityBonus): string {
  const parts: string[] = [];

  if (bonus.fixed) {
    for (const [abbr, amount] of Object.entries(bonus.fixed)) {
      const name = ABILITY_NAMES[abbr] ?? abbr;
      parts.push(`${name} +${amount}`);
    }
  }

  if (bonus.choose) {
    const abilities = bonus.choose.from.map((a) => ABILITY_NAMES[a] ?? a);
    const count = bonus.choose.count;
    const amount = bonus.choose.amount;
    if (abilities.length === 6) {
      parts.push(`Choose ${count} ability score${count > 1 ? "s" : ""} +${amount}`);
    } else {
      parts.push(
        `Choose ${count} from ${abilities.join(", ")} +${amount}`,
      );
    }
  }

  return parts.join("; ");
}

export function formatSpellGrant(grant: FeatSpellGrant): string {
  const levelText = grant.level === 0 ? "cantrip" : `level ${grant.level} spell`;
  const countText = grant.count > 1 ? `${grant.count} ${levelText}s` : `1 ${levelText}`;
  const freqText =
    grant.frequency === "at-will"
      ? "at will"
      : grant.frequency === "daily"
        ? "1/long rest"
        : "1/short rest";
  const slotsText = grant.canUseSlots ? " (or spell slots)" : "";
  return `${countText}, ${freqText}${slotsText}`;
}
