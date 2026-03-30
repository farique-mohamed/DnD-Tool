# Dungeon Logic — Races

## Overview

The Race Compendium is a static, client-side feature that lets players and dungeon masters browse D&D 5e races and species from multiple sourcebooks. There is no database involvement — all race data is bundled in a TypeScript file. Users can filter by source and race name.

---

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/races` | `src/pages/races/index.tsx` | Browse and filter all races/species. Accessible to both PLAYER and DUNGEON_MASTER roles. |

The page requires authentication and is wrapped in `<ProtectedRoute><Layout>`.

---

## Static Data

**File:** `src/lib/raceData.ts`

### `RaceInfo` interface

```typescript
export interface RaceInfo {
  name: string;
  source: string;        // "PHB", "XPHB", "VGM", "MPMM", "ERLW", "EGW", "VRGR", "GGR", "MOT", "AI", "AAG", "SCC", "TOB"
  speed: number;
  size: string;
  languages: string[];
  traits: RacialTrait[];
  abilityScoreIncrease?: string;  // human-readable ASI text
  abilityBonuses?: AbilityScoreBonus[];  // structured ASI data
}
```

### Source breakdown

| Source | Full Name | Race Count |
|--------|-----------|------------|
| PHB | Player's Handbook (2014) | 9 |
| XPHB | Player's Handbook (2024) | 10 |
| VGM | Volo's Guide to Monsters | 14 |
| MPMM | Mordenkainen Presents: Monsters of the Multiverse | 31 |
| ERLW | Eberron: Rising from the Last War | 4 |
| EGW | Explorer's Guide to Wildemount | 1 |
| VRGR | Van Richten's Guide to Ravenloft | 3 |
| GGR | Guildmasters' Guide to Ravnica | 5 |
| MOT | Mythic Odysseys of Theros | 2 |
| AI | Acquisitions Incorporated | 1 |
| AAG | Astral Adventurer's Guide (Spelljammer) | 6 |
| SCC | Strixhaven: A Curriculum of Chaos | 1 |
| TOB | Tome of Beasts / Midgard (Kobold Press) | 1 |

### Exports

- `RACES: RaceInfo[]` — all races from all sources (88 total entries)
- `RACE_SOURCES: string[]` — sorted unique list of source codes
- `getRaceByNameAndSource(name, source)` — source-aware lookup
- `getRaceByName(name)` — backward-compatible lookup (prefers PHB)

### MPMM ability bonuses

MPMM races use flexible ability score increases: +2/+1 or +1/+1/+1 to any ability scores. This is represented with `ability: "choice"` type bonuses in `abilityBonuses`.

---

## Filtering Logic

All filtering is performed client-side with `useMemo`. Two independent filter dimensions:

| Filter | State variable | Behavior |
|--------|----------------|---------|
| Source | `selectedSource: string \| null` | `null` = all sources; selecting a source shows only races from that sourcebook. Uses a `<select>` dropdown. |
| Name search | `searchQuery: string` | Case-insensitive substring match on `race.name` |

Both filters are applied together (AND logic).

---

## UI Notes

- **Source colors**: each source has a distinct badge color (PHB = blue, XPHB = green, VGM = purple, MPMM = red, ERLW = orange, EGW = teal, VRGR = rose, GGR = amber, MOT = sky, AI = lime, AAG = indigo, SCC = fuchsia, TOB = dark gold). Defined in the `SOURCE_COLORS` record in the page component.
- **Source filter**: `<select>` dropdown styled to match the D&D theme (dark background, gold border, serif font).
- **Race list rows**: show name, source badge, size, speed, and ability score increase text.
- **Race detail panel**: shows name, size, speed, source badge, languages, ability score increase, and all racial traits with name and description.
- **Result count** shown above the list.
- **Empty state** shown when no races match the current filters.

---

## Character Creation Integration

The character creation form (`src/components/character-creation/shared.ts`) derives its `CHARACTER_RACES` array dynamically from the `RACES` export, so new races added to `raceData.ts` are automatically available in the race dropdown when creating a character. The array contains unique race names sorted alphabetically.

The `IdentitySection` component renders the race dropdown and the `AbilityScoreSection` uses `getRaceByNameAndSource()` to look up structured ability bonus data for the selected race.

---

## NavBar

`/races` is added to both `DUNGEON_MASTER` and `PLAYER` nav item lists in `src/components/NavBar.tsx`, positioned after the "Classes" link.
