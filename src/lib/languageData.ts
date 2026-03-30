// ---------------------------------------------------------------------------
// D&D 5e Language data
// ---------------------------------------------------------------------------

export const STANDARD_LANGUAGES = [
  "Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc"
] as const;

export const EXOTIC_LANGUAGES = [
  "Abyssal", "Celestial", "Deep Speech", "Draconic", "Infernal", "Primordial", "Sylvan", "Undercommon"
] as const;

export const RARE_LANGUAGES = [
  "Aarakocra", "Druidic", "Gith", "Thieves' Cant"
] as const;

export const ALL_LANGUAGES = [...STANDARD_LANGUAGES, ...EXOTIC_LANGUAGES, ...RARE_LANGUAGES];
