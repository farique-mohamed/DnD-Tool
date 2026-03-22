export interface ExpertiseGrant {
  level: number;
  count: number; // number of NEW expertise picks at this level
}

export interface ClassExpertiseConfig {
  className: string;
  source: "PHB" | "XPHB";
  grants: ExpertiseGrant[];
}

export const EXPERTISE_CONFIG: ClassExpertiseConfig[] = [
  { className: "Rogue", source: "PHB", grants: [{ level: 1, count: 2 }, { level: 6, count: 2 }] },
  { className: "Rogue", source: "XPHB", grants: [{ level: 1, count: 2 }, { level: 6, count: 2 }] },
  { className: "Bard", source: "PHB", grants: [{ level: 3, count: 2 }, { level: 10, count: 2 }] },
  { className: "Bard", source: "XPHB", grants: [{ level: 2, count: 2 }, { level: 9, count: 2 }] },
  { className: "Ranger", source: "XPHB", grants: [{ level: 1, count: 2 }] },
];

/** Get the expertise config for a class+source combination */
export function getExpertiseConfig(className: string, source: string): ClassExpertiseConfig | undefined {
  return EXPERTISE_CONFIG.find(
    (c) => c.className === className && c.source === source,
  );
}

/** Get the total number of expertise picks available at or below a given level */
export function getExpertiseCountAtLevel(className: string, source: string, level: number): number {
  const config = getExpertiseConfig(className, source);
  if (!config) return 0;
  return config.grants
    .filter((g) => g.level <= level)
    .reduce((sum, g) => sum + g.count, 0);
}

/** Get the number of NEW expertise picks granted at exactly this level */
export function getNewExpertiseAtLevel(className: string, source: string, level: number): number {
  const config = getExpertiseConfig(className, source);
  if (!config) return 0;
  const grant = config.grants.find((g) => g.level === level);
  return grant?.count ?? 0;
}

/** Check if a class gets any expertise at all */
export function classHasExpertise(className: string, source: string): boolean {
  return getExpertiseConfig(className, source) !== undefined;
}
