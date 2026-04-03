// ---------------------------------------------------------------------------
// Monster Feature static data — parsed from monsterfeatures.json
// ---------------------------------------------------------------------------

import rawData from "../../data/monsterfeatures.json";
import { parseTaggedText } from "@/lib/dndTagParser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MonsterFeature {
  name: string;
  example: string;
  effect: string;
}

// ---------------------------------------------------------------------------
// Parse & sort
// ---------------------------------------------------------------------------

const raw = (
  rawData as {
    monsterfeatures: { name: string; example: string; effect: string }[];
  }
).monsterfeatures;

export const MONSTER_FEATURES: MonsterFeature[] = raw
  .map((f) => ({
    name: f.name,
    example: f.example,
    effect: parseTaggedText(f.effect),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Look up a monster feature by exact name (case-insensitive). */
export function getMonsterFeature(
  name: string,
): MonsterFeature | undefined {
  return MONSTER_FEATURES.find(
    (f) => f.name.toLowerCase() === name.toLowerCase(),
  );
}
