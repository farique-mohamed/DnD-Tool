import rawData from "../../data/life.json";

export interface LifeCategory {
  name: string;
  options: string[];
}

export interface LifeClass {
  name: string;
  source: string;
  reasons: string[];
  categories: LifeCategory[];
}

const raw = (
  rawData as unknown as {
    lifeClass: {
      name: string;
      source: string;
      reasons?: string[];
      other?: Record<string, string[]>;
    }[];
  }
).lifeClass;

export const LIFE_CLASSES: LifeClass[] = raw
  .map((c) => ({
    name: c.name,
    source: c.source,
    reasons: c.reasons ?? [],
    categories: Object.entries(c.other ?? {}).map(([name, options]) => ({
      name,
      options,
    })),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
