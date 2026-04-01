# Dungeon Logic — This Is Your Life Generator

## Overview

The "This Is Your Life" generator is a comprehensive backstory generation feature based on the tables in *Xanathar's Guide to Everything* (XGE). It is integrated into the character creation page (`/characters/new`) and produces a fully detailed backstory covering parents, birthplace, siblings, family upbringing, personal decisions, and life events.

The generator is **client-side only** — all dice rolls and table lookups happen in the browser. No tRPC procedures or database models are involved. The feature is split across two files: a data/logic module (`thisIsYourLifeData.ts`) containing every XGE table and all roll functions, and a React component (`ThisIsYourLifeGenerator.tsx`) that orchestrates generation and renders the UI.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/thisIsYourLifeData.ts` | All XGE tables (d100 range tables, arrays, roll functions), dice helpers, race-specific name generation, life event resolution, and exported types |
| `src/components/ThisIsYourLifeGenerator.tsx` | React component — prerequisites gate, section cards, reroll buttons, Copy Text / Add to Backstory actions |
| `src/lib/lifeData.ts` | Imports `data/life.json`; exports `LIFE_CLASSES` (class-specific reasons) and `LIFE_BACKGROUNDS` (background-specific reasons) |
| `src/pages/characters/new/index.tsx` | Character creation page — renders `ThisIsYourLifeGenerator` with `race`, `background`, `characterClass`, and `charismaScore` props |

---

## Component Props

```ts
interface ThisIsYourLifeGeneratorProps {
  onUseBackstory: (text: string) => void;
  race: string;
  background: string;
  characterClass: string;
  charismaScore?: number;
}
```

| Prop | Required | Description |
|------|----------|-------------|
| `onUseBackstory` | Yes | Callback invoked when the user clicks "Add to Backstory"; receives the full formatted backstory text |
| `race` | Yes | Character's race — drives parent species tables, sibling modifiers, name generation, and age-based life event counts |
| `background` | Yes | Character's background — used to look up background-specific reasons from `LIFE_BACKGROUNDS` |
| `characterClass` | Yes | Character's class — used to look up class-specific reasons from `LIFE_CLASSES` |
| `charismaScore` | No | Character's Charisma score — used to compute the CHA modifier for childhood memories roll; a manual modifier selector is shown if not provided |

The generator displays a prerequisites gate requiring `race`, `background`, and `characterClass` to be set before generation is available.

---

## Generated Sections

The generator produces six sections, each rendered as a card:

### 1. Parents

- **Parent knowledge** — d100 roll determining whether the character knows their parents (95% chance yes).
- **Race-specific species** — Half-Elf, Half-Orc, and Tiefling characters roll on supplemental tables to determine parent species.
- **Per-parent details** (Mother and Father): name (race-appropriate), alignment (3d6), occupation (d100), relationship (3d4), and status (3d6 with cause-of-death subtable if dead).

### 2. Birthplace

A single d100 roll on the birthplace table (22 entries ranging from "Home" to "On an Outer Plane of your choice").

### 3. Siblings

- **Count** — d10 modified by race (Elf/Dwarf: -2, Halfling: +2).
- **Per-sibling detail cards**: name (race-appropriate), gender, species, birth order (2d6), alignment, occupation, relationship, and status.

### 4. Family & Upbringing

- **Raised by** — d100 roll (e.g. "Both parents", "Orphanage", "Nobody").
- **Absent parent reason** — d4 roll if raised by someone other than both parents.
- **Family lifestyle** — 3d6 roll producing a lifestyle level and a modifier value (Wretched -40 through Aristocratic +40).
- **Childhood home** — d100 + lifestyle modifier.
- **Childhood memories** — d6 + CHA modifier (from `charismaScore` prop or manual selector).

### 5. Personal Decisions

- **Background reason** — looked up from `LIFE_BACKGROUNDS` by background name; falls back to `DEFAULT_BACKGROUND_REASONS` if not found in the data file.
- **Class reason** — looked up from `LIFE_CLASSES` by class name.

### 6. Life Events

- **Count** — determined by character age and race. Long-lived races (Elf, Dwarf, Gnome) use wider age brackets. Standard races map age brackets to 1d4 through 1d12 events.
- **Per-event resolution** — each event rolls on the life events master table (d100) to determine a category (Tragedy, Boon, Love, Enemy, Friend, Work, Important Person, Adventure, Supernatural, War, Crime, Arcane, Odd), then resolves the category through its subtable.
- **Dice expressions** in event text (e.g. `{1d6}`, `{2d6x10}`) are resolved to concrete numbers via `resolveDiceExpressions()`.

---

## Data Tables Implemented

All tables are defined in `src/lib/thisIsYourLifeData.ts`.

### d100 Range Tables

| Table Constant | Dice | Entries | Description |
|----------------|------|---------|-------------|
| `BIRTHPLACE_TABLE` | d100 | 22 | Where the character was born |
| `PARENT_KNOWLEDGE_TABLE` | d100 | 2 | Whether the character knows their parents |
| `OCCUPATION_TABLE` | d100 | 16 | Parent/sibling occupation |
| `RAISED_BY_TABLE` | d100 | 12 | Who raised the character |
| `LIFE_EVENT_TABLE` | d100 | 13 | Master life event category |
| `ADVENTURE_TABLE` | d100 | 11 | Adventure outcome subtable |

### Roll Functions

| Function | Dice | Description |
|----------|------|-------------|
| `rollAlignment()` | 3d6 | Returns alignment string (Chaotic Evil through Chaotic Good) |
| `rollRelationship()` | 3d4 | Hostile / Friendly / Indifferent |
| `rollStatus()` | 3d6 | Dead (with cause) / Missing / Alive variants |
| `rollNumberOfSiblings(race)` | d10 ± race modifier | Number of siblings |
| `rollBirthOrder()` | 2d6 | Twin / Older / Younger |
| `rollFamilyLifestyle()` | 3d6 | Lifestyle level + modifier (-40 to +40) |
| `rollChildhoodHome(modifier)` | d100 + modifier | Childhood home description |
| `rollChildhoodMemories(chaModifier)` | d6 + CHA mod | Childhood memory description |
| `rollLifeEventCount(age, race)` | 1d4–1d12 | Number of life events based on age and race |
| `generateLifeEvent(loveCount)` | d100 + subtable | Full life event with category and description |

### Subtable Arrays

| Constant | Dice | Entries | Used by |
|----------|------|---------|---------|
| `TRAGEDIES` | d12 | 12 | Life event: Tragedy |
| `BOONS` | d10 | 10 | Life event: Boon |
| `WAR_OUTCOMES` | d12 | 12 | Life event: War |
| `CRIMES` | d8 | 8 | Life event: Crime |
| `PUNISHMENTS` | d12 | 12 | Life event: Crime (sentencing) |
| `ARCANE_MATTERS` | d10 | 10 | Life event: Arcane |
| `ODD_EVENTS` | d12 | 12 | Life event: Odd |
| `SUPERNATURAL_EXPERIENCES` | d12 | 12 | Life event: Supernatural |
| `IMPORTANT_PEOPLE` | d10 | 10 | Life event: Important Person |
| `ADVENTURE_TABLE` | d100 | 11 | Life event: Adventure |

### Race-Specific Parent Tables

| Constant | Dice | Description |
|----------|------|-------------|
| `HALF_ELF_PARENTS` | d8 | Parent species for Half-Elf characters |
| `HALF_ORC_PARENTS` | d8 | Parent species for Half-Orc characters |
| `TIEFLING_PARENTS` | d8 | Parent species for Tiefling characters |

### Name Generation

Race-specific name sets covering male names, female names, and surnames for: Human, Dwarf, Elf, Halfling, Gnome, Half-Orc, Tiefling, and Dragonborn. The `generateName(race, gender)` function selects a random first name and surname from the appropriate set, falling back to Human names for unrecognized races.

---

## Integration with Character Creation

The `ThisIsYourLifeGenerator` component is rendered on the `/characters/new` page below the character form fields. The page passes the current `race`, `background`, `characterClass`, and `charismaScore` values as props. When any of these values change (e.g. the user picks a different race), the generator updates its prerequisites gate accordingly.

### Prerequisites Gate

The generator requires all three of `race`, `background`, and `characterClass` to be set before the "Roll the Fates" button becomes active. Until then, a message indicates which fields still need to be filled in.

### User Flow

1. The user fills in race, class, and background on the character form.
2. The generator prerequisites are satisfied; the user enters their character's age and optionally adjusts the CHA modifier.
3. Clicking **"Roll the Fates"** generates all six sections simultaneously.
4. Each section has an individual **reroll** button to regenerate just that section without affecting the others.
5. **Copy Text** copies the full formatted backstory to the clipboard.
6. **Add to Backstory** calls `onUseBackstory` with the formatted text, which appends it to the backstory textarea and scrolls to it.

---

## Exported Types

```ts
// From ThisIsYourLifeGenerator.tsx
export interface BackstoryResult {
  parents: ParentsSection;
  birthplace: string;
  siblings: SiblingInfo[];
  family: FamilySection;
  personalDecisions: PersonalDecisionsSection;
  lifeEvents: LifeEventResult[];
}

// From thisIsYourLifeData.ts
export interface RangeEntry<T = string> {
  min: number;
  max: number;
  value: T;
}

export interface StatusResult {
  label: string;
  detail?: string;
}

export interface LifeEventResult {
  category: string;
  description: string;
}

export interface RaceNameSet {
  male: string[];
  female: string[];
  surnames: string[];
}

// From lifeData.ts
export interface LifeBackground {
  name: string;
  source: string;
  reasons: string[];
}
```

---

## Extending the Generator

### Adding a new XGE table

1. Define the table constant in `src/lib/thisIsYourLifeData.ts` — use a `RangeEntry[]` for d100 tables or a plain `string[]` for simple arrays.
2. If the table needs a roll function, export it from the same file.
3. In `ThisIsYourLifeGenerator.tsx`, add a field to the `BackstoryResult` interface for the new data.
4. Wire the roll into the `rollAll()` function and add a reroll case in the section reroll handler.
5. Add a new card in the JSX to display the result.
6. Update `buildBackstoryText()` to include the new section in the copy/append output.

### Adding race-specific name tables

Add a new `RaceNameSet` constant in `thisIsYourLifeData.ts` and register it in the `RACE_NAME_MAP` object. The `generateName()` function will pick it up automatically for matching race names.

### Adding background/class reasons

Background reasons come from `data/life.json` via `src/lib/lifeData.ts`. To add reasons for a new background, add an entry to the `lifeBackground` array in the JSON file. For backgrounds not in the JSON, `DEFAULT_BACKGROUND_REASONS` in `thisIsYourLifeData.ts` provides a hardcoded fallback for common backgrounds (Acolyte, Criminal, Folk Hero, Noble, Sage, Soldier, etc.).

Class reasons follow the same pattern via the `lifeClass` array in `data/life.json`.

---

## Reusability Notes

- The `thisIsYourLifeData.ts` module is a static data module following the same pattern as `classData.ts` and `equipmentData.ts` — pure functions and constants with no filesystem or API access.
- The dice helpers (`d()`, `roll()`, `pickRandom()`, `rollOnTable()`) are generic and can be imported by other client-side features that need random generation.
- The `generateName()` function can be reused anywhere race-appropriate NPC or character names are needed.
- The component is self-contained — it manages its own state and makes no tRPC calls.
