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

export interface LifeBackground {
  name: string;
  source: string;
  reasons: string[];
}

const raw = (
  rawData as unknown as {
    lifeClass: {
      name: string;
      source: string;
      reasons?: string[];
      other?: Record<string, string[]>;
    }[];
    lifeBackground: {
      name: string;
      source: string;
      reasons?: string[];
    }[];
  }
);

export const LIFE_CLASSES: LifeClass[] = raw.lifeClass
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

export const LIFE_BACKGROUNDS: LifeBackground[] = (raw.lifeBackground ?? [])
  .map((b) => ({
    name: b.name,
    source: b.source,
    reasons: b.reasons ?? [],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
