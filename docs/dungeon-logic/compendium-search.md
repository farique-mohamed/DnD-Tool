# Compendium Search

## Overview

The Compendium Search page (`/search`) provides a unified, client-side search across all six compendium data sources: Spells, Monsters, Items, Classes, Races, and Feats.

## Route

`/search` — accessible to all authenticated roles (ADMIN, DUNGEON_MASTER, PLAYER). Added to the NavBar as "Search" at the top of every role's navigation list.

## Data Sources

All data is statically imported at module level (no API calls):

| Source | Import | Approx Count |
|--------|--------|--------------|
| Spells | `SPELLS` from `@/lib/spellsData` | ~937 |
| Monsters | `MONSTER_LIST` from `@/lib/bestiaryData` | ~3000 |
| Items | `ITEMS` from `@/lib/itemsData` | ~2722 |
| Classes | `CLASS_LIST` from `@/lib/classData` | ~24 |
| Races | `RACES` from `@/lib/raceData` | ~53 |
| Feats | `FEATS` from `@/lib/featData` | ~75 |

## Search Behaviour

- Query must be at least 2 characters to trigger a search.
- Matching is case-insensitive substring match on the `name` field.
- Results are computed via `useMemo` for performance with large data arrays.
- Results are grouped by category, each group capped at 20 displayed results.
- If a category has more than 20 matches, a truncation notice shows "and X more...".
- A total result count is displayed above the grouped results.

## Category Filters

Seven filter buttons are shown below the search input: All, Spells, Monsters, Items, Classes, Races, Feats. Selecting a category limits the search to that compendium only. "All" searches across everything. Each category has a distinct colour for its badge and filter button.

## Result Details

Each result card shows:

| Category | Detail line |
|----------|-------------|
| Spells | Level, school, casting time |
| Monsters | CR, type, HP |
| Items | Type, rarity |
| Classes | Source |
| Races | Source, speed |
| Feats | Category, prerequisite (or source) |

## Navigation

Clicking a result navigates to the relevant compendium page:

| Category | Target route |
|----------|-------------|
| Spells | `/spells` |
| Monsters | `/dm/monster-manual` |
| Items | `/items` |
| Classes | `/classes` |
| Races | `/races` |
| Feats | `/classes` (no dedicated feats page) |

## UI Components Used

`PageHeader`, `Input`, `Badge`, `Card` (variant `light`) from `@/components/ui`.
