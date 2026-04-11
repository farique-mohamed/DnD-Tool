# Compendium Search

## Overview

The Compendium Search page (`/search`) provides a unified, client-side search across all six compendium data sources: Spells, Monsters, Items, Classes, Races, and Feats. Selecting a search result shows the full detail panel inline (right column on desktop, full-screen on mobile) instead of navigating to another page.

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

## Layout

**Two-column layout** (same pattern as Items/Spells/Races/Feats pages):

- **Left column (flex: 3)**: Search input, category filter buttons, results count, and scrollable grouped results list.
- **Right column (flex: 2)**: Detail panel for the currently selected entity. When nothing is selected, an empty placeholder reads "Select a result to view details."

The selected result card is highlighted with a left gold border and subtle background tint (`isActive` prop), matching the Items page pattern.

### Inline Detail Panels

Clicking a result renders the appropriate detail panel in the right column (no page navigation):

| Category | Component | Source |
|----------|-----------|--------|
| Spells | `SpellDetailPanel` | `@/components/spells/SpellDetailPanel` |
| Monsters | `MonsterDetailPanel` | `@/components/monster-manual/MonsterDetailPanel` |
| Items | `ItemDetailPanel` | `@/components/items/ItemDetailPanel` |
| Classes | `ClassInfoCard` (summary only) | `@/components/classes/ClassInfoCard` |
| Races | `RaceDetailPanel` | `@/components/races/RaceDetailPanel` |
| Feats | `FeatDetailPanel` | `@/components/feats/FeatDetailPanel` |

The detail panel switching logic is in `@/components/search/SearchDetailPanel`, which receives a `SelectedSearchResult` (containing the category and the actual entity data object) and renders the matching panel.

Each `SearchResult` stores the original entity data object in a `data` field so the detail panel can render without re-fetching.

### Mobile Behaviour

Same list/detail toggle pattern as the Items and Spells pages:

- When no result is selected, the search input, filters, and results list are shown full-width.
- When a result is selected, the left column is hidden (`display: "none"`) and only the detail panel is shown with a "Back to list" button.
- The empty detail placeholder is hidden on mobile.
- Height uses `calc(100vh - 48px)` on mobile, `calc(100vh - 80px)` on desktop.

## UI Components Used

`PageHeader`, `Input`, `Badge`, `Card` (variant `light`) from `@/components/ui`. Detail panels imported from shared component files.
