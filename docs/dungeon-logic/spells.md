# Dungeon Logic — Spells

## Overview

The Spell Compendium is a static, client-side feature that lets players and dungeon masters browse D&D 5e SRD spells. There is no database involvement — all spell data is bundled in a TypeScript file. Users can filter by class, level, and spell name.

---

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/spells` | `src/pages/spells/index.tsx` | Browse and filter all SRD spells. Accessible to both PLAYER and DUNGEON_MASTER roles. |

The page requires authentication and is wrapped in `<ProtectedRoute><Layout>`.

---

## Static Data

**File:** `src/lib/spellsData.ts`

### `Spell` interface

```typescript
export interface Spell {
  name: string;
  level: number;       // 0 = cantrip, 1–9 = spell level
  school: string;      // Abjuration | Conjuration | Divination | Enchantment | Evocation | Illusion | Necromancy | Transmutation
  castingTime: string;
  range: string;
  duration: string;
  components: string;
  description: string;
  classes: string[];   // D&D classes that have access to this spell
}
```

### `SPELLS` array

Exported constant array of ~55 SRD spells. Spell levels covered:

| Level | Count | Examples |
|-------|-------|---------|
| 0 (Cantrip) | 15 | Fire Bolt, Eldritch Blast, Guidance, Vicious Mockery, Minor Illusion |
| 1 | 16 | Magic Missile, Cure Wounds, Detect Magic, Hex, Bless |
| 2 | 12 | Misty Step, Invisibility, Scorching Ray, Mirror Image, Hold Person |
| 3 | 10 | Fireball, Lightning Bolt, Counterspell, Spirit Guardians, Haste |
| 4 | 6 | Polymorph, Banishment, Greater Invisibility, Blight |
| 5 | 6 | Cone of Cold, Mass Cure Wounds, Hold Monster, Flame Strike |
| 6–9 | 5 | Chain Lightning, Disintegrate, Heal, Plane Shift, Power Word Kill |

Multi-class spells are fully represented (e.g., `Detect Magic` lists 7 classes, `Cure Wounds` lists 5).

---

## Filtering Logic

All filtering is performed client-side with `useMemo`. Three independent filter dimensions:

| Filter | State variable | Behavior |
|--------|----------------|---------|
| Class | `selectedClass: string \| null` | `null` = all classes; selecting a class shows only spells where `spell.classes.includes(selectedClass)` |
| Level | `selectedLevel: number \| null` | `null` = all levels; selecting a level shows only spells of that level |
| Name search | `searchQuery: string` | Case-insensitive substring match on `spell.name` |

All three filters are applied together (AND logic).

---

## UI Notes

- **School colors**: each school has a distinct dot color (e.g., Evocation = red, Conjuration = purple, Divination = green). Defined in the `SCHOOL_COLORS` record in the page component.
- **Level labels**: `levelLabel(0)` returns `"Cantrip"`, `levelLabel(1)` returns `"1st Level"`, etc.
- **Filter dropdowns**: Source, Class, and Level filters use `<select>` dropdowns styled to match the D&D theme (dark background `rgba(30,15,5,0.9)`, gold border, serif font). Each dropdown has an "All" default option that resets the filter to null.
- **Spell card description** is clamped to 3 lines using `-webkit-line-clamp`.
- **Result count** shown above the grid: "Showing X spells".
- **Empty state** shown when no spells match the current filters.
- Spell grid uses `auto-fill` with `minmax(320px, 1fr)` for a responsive layout.

---

## Spellcasting Stats Display

**File:** `src/components/character/SpellsTab.tsx`

The Spells tab on the character sheet displays a **Spellcasting Stats** bar at the top for all spellcasting classes. It shows three values in a horizontal row of styled stat boxes:

| Stat | Formula | Example |
|------|---------|---------|
| Spellcasting Ability | Class-dependent (see `SPELLCASTING_ABILITY` map) | WIS, CHA, INT |
| Spell Save DC | 8 + proficiency bonus + spellcasting ability modifier | 8 + 2 + 3 = 13 |
| Spell Attack Bonus | proficiency bonus + spellcasting ability modifier | +5 |

### Class-to-Ability Mapping

| Class | Spellcasting Ability |
|-------|---------------------|
| Artificer | Intelligence |
| Bard | Charisma |
| Cleric | Wisdom |
| Druid | Wisdom |
| Paladin | Charisma |
| Ranger | Wisdom |
| Sorcerer | Charisma |
| Warlock | Charisma |
| Wizard | Intelligence |

### Implementation Notes

- The stats bar is rendered by the internal `SpellcastingStatsBar` component (not exported).
- It appears in both the Warlock (Pact Magic) and standard caster return paths.
- `proficiencyBonus(level)` is imported from `./shared` and follows the standard 5e proficiency progression.
- Non-caster classes (Fighter, Barbarian, etc.) never see this bar because the parent component only renders `SpellsTab` when `isSpellcaster()` returns true.

---

## NavBar

`/spells` is added to both `DUNGEON_MASTER` and `PLAYER` nav item lists in `src/components/NavBar.tsx`, positioned after Adventures.
