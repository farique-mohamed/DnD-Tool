import { ADVENTURE_DATA_MAP } from "./adventureData";

interface ExtractedMonster {
  name: string;
  source: string;
}

interface ExtractedItem {
  name: string;
  source: string;
}

export interface AdventureReferences {
  monsters: ExtractedMonster[];
  items: ExtractedItem[];
}

export function extractAdventureReferences(
  adventureSource: string,
): AdventureReferences {
  const sections = ADVENTURE_DATA_MAP[adventureSource];
  if (!sections) return { monsters: [], items: [] };

  const text = JSON.stringify(sections);

  // Extract creature references: {@creature name|source} or {@creature name}
  const creatureRegex =
    /\{@creature ([^|}]+)(?:\|([^|}]*))?(?:\|[^}]*)?\}/g;
  const monsterMap = new Map<string, ExtractedMonster>();
  let match;
  while ((match = creatureRegex.exec(text)) !== null) {
    const name = match[1].trim();
    const source = (match[2] || "").trim();
    const key = `${name.toLowerCase()}|${source.toLowerCase()}`;
    if (!monsterMap.has(key)) {
      monsterMap.set(key, { name, source });
    }
  }

  // Extract item references: {@item name|source|displayName} or {@item name}
  const itemRegex = /\{@item ([^|}]+)(?:\|([^|}]*))?(?:\|[^}]*)?\}/g;
  const itemMap = new Map<string, ExtractedItem>();
  while ((match = itemRegex.exec(text)) !== null) {
    const name = match[1].trim();
    const source = (match[2] || "").trim();
    const key = `${name.toLowerCase()}|${source.toLowerCase()}`;
    if (!itemMap.has(key)) {
      itemMap.set(key, { name, source });
    }
  }

  return {
    monsters: Array.from(monsterMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    items: Array.from(itemMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  };
}
