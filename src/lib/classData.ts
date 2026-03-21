import artificerClass from "../../data/class/class-artificer.json";
import barbarianClass from "../../data/class/class-barbarian.json";
import bardClass from "../../data/class/class-bard.json";
import clericClass from "../../data/class/class-cleric.json";
import druidClass from "../../data/class/class-druid.json";
import fighterClass from "../../data/class/class-fighter.json";
import monkClass from "../../data/class/class-monk.json";
import mysticClass from "../../data/class/class-mystic.json";
import paladinClass from "../../data/class/class-paladin.json";
import rangerClass from "../../data/class/class-ranger.json";
import rogueClass from "../../data/class/class-rogue.json";
import sidekickClass from "../../data/class/class-sidekick.json";
import sorcererClass from "../../data/class/class-sorcerer.json";
import warlockClass from "../../data/class/class-warlock.json";
import wizardClass from "../../data/class/class-wizard.json";

import artificerFluff from "../../data/class/fluff-class-artificer.json";
import barbarianFluff from "../../data/class/fluff-class-barbarian.json";
import bardFluff from "../../data/class/fluff-class-bard.json";
import clericFluff from "../../data/class/fluff-class-cleric.json";
import druidFluff from "../../data/class/fluff-class-druid.json";
import fighterFluff from "../../data/class/fluff-class-fighter.json";
import monkFluff from "../../data/class/fluff-class-monk.json";
import mysticFluff from "../../data/class/fluff-class-mystic.json";
import paladinFluff from "../../data/class/fluff-class-paladin.json";
import rangerFluff from "../../data/class/fluff-class-ranger.json";
import rogueFluff from "../../data/class/fluff-class-rogue.json";
import sidekickFluff from "../../data/class/fluff-class-sidekick.json";
import sorcererFluff from "../../data/class/fluff-class-sorcerer.json";
import warlockFluff from "../../data/class/fluff-class-warlock.json";
import wizardFluff from "../../data/class/fluff-class-wizard.json";

export interface SkillChoices {
  count: number;
  from: string[];
}

export interface ClassInfo {
  name: string;
  hitDie: string;
  savingThrows: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  skillChoices: SkillChoices;
  description: string;
}

const ABILITY_NAMES: Record<string, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type RawClassEntry = {
  name: string;
  hd?: { number: number; faces: number };
  proficiency?: string[];
  startingProficiencies?: {
    armor?: unknown[];
    weapons?: unknown[];
    skills?: unknown[];
  };
};

type RawFluffEntry = {
  name: string;
  entries?: Array<{
    type: string;
    name: string;
    entries?: unknown[];
  }>;
};

type RawClassFile = { class: RawClassEntry[] };
type RawFluffFile = { classFluff: RawFluffEntry[] };

function extractArmorProficiencies(armor: unknown[] | undefined): string[] {
  if (!armor) return [];
  return armor
    .map((a) => {
      if (typeof a === "string") {
        // Handle special strings like "{@item shield}"
        if (a.toLowerCase().includes("shield")) return "shields";
        return capitalize(a);
      }
      if (typeof a === "object" && a !== null) {
        const obj = a as Record<string, unknown>;
        if (typeof obj.proficiency === "string") {
          return capitalize(obj.proficiency);
        }
        if (typeof obj.full === "string") {
          // e.g. druid's shield entry with note
          return "Shields";
        }
      }
      return null;
    })
    .filter((a): a is string => a !== null);
}

function extractWeaponProficiencies(weapons: unknown[] | undefined): string[] {
  if (!weapons) return [];
  return weapons
    .map((w) => {
      if (typeof w === "string") {
        // Plain strings: "simple", "martial", or {@item ...} reference
        if (w === "simple" || w === "martial") return capitalize(w) + " weapons";
        // Strip {@item name|source|display} tags — take the display name or item name
        const tagMatch = /\{@item [^|]+\|[^|]*\|([^}]+)\}/.exec(w);
        if (tagMatch) return capitalize(tagMatch[1]);
        const nameMatch = /\{@item ([^|]+)/.exec(w);
        if (nameMatch) return capitalize(nameMatch[1]);
        return capitalize(w);
      }
      if (typeof w === "object" && w !== null) {
        const obj = w as Record<string, unknown>;
        if (typeof obj.proficiency === "string" && obj.optional === true) {
          return capitalize(obj.proficiency) + " (optional)";
        }
        if (typeof obj.proficiency === "string") {
          return capitalize(obj.proficiency);
        }
      }
      return null;
    })
    .filter((w): w is string => w !== null);
}

function extractSkillChoices(skills: unknown[] | undefined): SkillChoices {
  if (!skills || skills.length === 0) {
    return { count: 0, from: [] };
  }
  const entry = skills[0];
  if (typeof entry === "object" && entry !== null) {
    const obj = entry as Record<string, unknown>;
    if (obj.choose && typeof obj.choose === "object") {
      const choose = obj.choose as Record<string, unknown>;
      const count = typeof choose.count === "number" ? choose.count : 0;
      const from = Array.isArray(choose.from)
        ? (choose.from as string[]).map(capitalize)
        : [];
      return { count, from };
    }
    // bard uses { "any": N } — pick any N skills
    if (typeof obj.any === "number") {
      return { count: obj.any, from: ["Any skill"] };
    }
  }
  return { count: 0, from: [] };
}

function extractDescription(fluffFile: RawFluffFile): string {
  const fluff = fluffFile.classFluff[0];
  if (!fluff?.entries) return "";
  const section = fluff.entries[0];
  if (!section?.entries) return "";
  const firstString = section.entries.find((e) => typeof e === "string");
  return typeof firstString === "string" ? firstString : "";
}

function buildClassInfo(
  classFile: RawClassFile,
  fluffFile: RawFluffFile,
): ClassInfo {
  const cls = classFile.class[0];
  const hitDie = cls.hd ? `d${cls.hd.faces}` : "d8";
  const savingThrows = (cls.proficiency ?? []).map(
    (p) => ABILITY_NAMES[p] ?? capitalize(p),
  );
  const sp = cls.startingProficiencies;
  const armorProficiencies = extractArmorProficiencies(sp?.armor);
  const weaponProficiencies = extractWeaponProficiencies(sp?.weapons);
  const skillChoices = extractSkillChoices(sp?.skills);
  const description = extractDescription(fluffFile as RawFluffFile);

  return {
    name: cls.name,
    hitDie,
    savingThrows,
    armorProficiencies,
    weaponProficiencies,
    skillChoices,
    description,
  };
}

export const CLASS_LIST: ClassInfo[] = [
  buildClassInfo(artificerClass as RawClassFile, artificerFluff as RawFluffFile),
  buildClassInfo(barbarianClass as RawClassFile, barbarianFluff as RawFluffFile),
  buildClassInfo(bardClass as RawClassFile, bardFluff as RawFluffFile),
  buildClassInfo(clericClass as RawClassFile, clericFluff as RawFluffFile),
  buildClassInfo(druidClass as RawClassFile, druidFluff as RawFluffFile),
  buildClassInfo(fighterClass as RawClassFile, fighterFluff as RawFluffFile),
  buildClassInfo(monkClass as RawClassFile, monkFluff as RawFluffFile),
  buildClassInfo(mysticClass as RawClassFile, mysticFluff as RawFluffFile),
  buildClassInfo(paladinClass as RawClassFile, paladinFluff as RawFluffFile),
  buildClassInfo(rangerClass as RawClassFile, rangerFluff as RawFluffFile),
  buildClassInfo(rogueClass as RawClassFile, rogueFluff as RawFluffFile),
  buildClassInfo(sidekickClass as RawClassFile, sidekickFluff as RawFluffFile),
  buildClassInfo(sorcererClass as RawClassFile, sorcererFluff as RawFluffFile),
  buildClassInfo(warlockClass as RawClassFile, warlockFluff as RawFluffFile),
  buildClassInfo(wizardClass as RawClassFile, wizardFluff as RawFluffFile),
].sort((a, b) => a.name.localeCompare(b.name));

export function getClassByName(name: string): ClassInfo | undefined {
  return CLASS_LIST.find(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  );
}
