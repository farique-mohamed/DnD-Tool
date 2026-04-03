// ---------------------------------------------------------------------------
// Auto-known cantrips by class / subclass
// ---------------------------------------------------------------------------
// Some classes and subclasses automatically know certain cantrips that don't
// count against the character's cantrip limit.
// ---------------------------------------------------------------------------

interface AutoCantripEntry {
  className: string;
  subclass?: string;
  source?: string;
  cantrips: string[];
}

const AUTO_CANTRIPS: AutoCantripEntry[] = [
  { className: "Artificer", cantrips: ["Mending"] },
  { className: "Cleric", subclass: "Light", cantrips: ["Light"] },
];

/**
 * Returns cantrip names that a character automatically knows (free, does not
 * count against cantrip limit) based on their class, subclass, and rules
 * source.
 */
export function getAutoKnownCantrips(
  className: string,
  subclass: string | null,
  _rulesSource?: string,
): string[] {
  const result: string[] = [];

  for (const entry of AUTO_CANTRIPS) {
    // Class must match
    if (entry.className.toLowerCase() !== className.toLowerCase()) continue;

    // If the entry requires a specific subclass, check it
    if (entry.subclass) {
      if (
        !subclass ||
        !subclass.toLowerCase().includes(entry.subclass.toLowerCase())
      ) {
        continue;
      }
    }

    // If the entry requires a specific source, check it
    if (entry.source && _rulesSource && entry.source !== _rulesSource) {
      continue;
    }

    for (const c of entry.cantrips) {
      if (!result.includes(c)) result.push(c);
    }
  }

  return result;
}
