# Dungeon Logic — Dice Roller

## Overview

The dice roller is a persistent, floating widget available on every authenticated page. It lets any logged-in user roll standard D&D dice, select a label and roll mode (Normal / Advantage / Disadvantage), and view a live global feed of rolls made by all users in the session.

Roll results are persisted in the database so that history survives page navigation and refreshes. The feature is self-contained: one component, one router, one Prisma model, and one shared constants file.

---

## Shared Constants

File: `src/lib/diceConstants.ts`

Single source of truth for all dice-related constants and types. Both `src/server/routers/dice.ts` and `src/components/DiceRoller.tsx` import from this file — no magic strings are duplicated across the stack.

| Export | Kind | Value |
|--------|------|-------|
| `DICE_TYPES` | `tuple` | `["d4","d6","d8","d10","d12","d20","d100"]` |
| `DICE_SIDES` | `Record<DiceType, number>` | Maps each die to its face count (e.g. `d20 → 20`) |
| `ROLL_LABELS` | `tuple` | `["General","Attack Roll","Damage Roll","Saving Throw","Skill Check","Initiative","Death Save","Ability Check"]` |
| `ROLL_MODES` | `tuple` | `["NORMAL","ADVANTAGE","DISADVANTAGE"]` |
| `DiceType` | type alias | Union of `DICE_TYPES` members |
| `RollLabel` | type alias | Union of `ROLL_LABELS` members |
| `RollMode` | type alias | `"NORMAL" \| "ADVANTAGE" \| "DISADVANTAGE"` |

---

## Database Schema

Model: `DiceRoll` — table `"dice_rolls"` in `prisma/schema.prisma`.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `userId` | `String` | FK → `User.id` |
| `username` | `String` | Denormalized from `User` at roll time (avoids join on history reads) |
| `diceType` | `String` | For single-die rolls: one of the values in `DICE_TYPES`. For compound rolls: expression string (e.g. `"2d6+d4"`) |
| `result` | `Int` | Server-generated roll result |
| `label` | `String` | Roll label; default `"General"` — non-nullable since migration `update_dice_roll_label_and_mode` |
| `rollMode` | `String` | `"NORMAL"`, `"ADVANTAGE"`, or `"DISADVANTAGE"`; default `"NORMAL"` |
| `adventureId` | `String?` | Reserved for future adventure linking (nullable, not yet enforced by FK) |
| `rolledAt` | `DateTime` | Default: `now()` |

Relation on `User`:
```prisma
diceRolls DiceRoll[]
```

---

## tRPC Router

File: `src/server/routers/dice.ts` — registered as `dice` in `src/server/routers/_app.ts`.

All procedures are **protected** (require a valid JWT). Access via `api.dice.*` on the client.

### `dice.roll` — mutation

Validates the dice selection and roll mode, generates server-side random results, persists the record, and returns the full `DiceRoll` object.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `label` | `RollLabel` | Yes | Must be one of `ROLL_LABELS`; validated with Zod enum |
| `rollMode` | `RollMode` | No | `"NORMAL"` \| `"ADVANTAGE"` \| `"DISADVANTAGE"`; defaults to `"NORMAL"` |
| `dice` | `Array<{ count: number, diceType: DiceType }>` | Yes | 1–10 entries; each `count` is 1–20 |
| `adventureId` | `string` | No | Optional adventure context |

**Business rules**

- The roll result is always generated server-side (`Math.floor(Math.random() * faces) + 1`). The client never supplies the result.
- `username` is read from `ctx.user` and denormalized into the record at write time.
- Invalid `diceType` or `label` values are rejected by Zod before hitting the resolver.
- **NORMAL mode:** each die group is rolled and results are summed. Compound expressions (e.g. `2d6+d4`) are stored in the `diceType` field.
- **ADVANTAGE mode:** input must be exactly `[{ count: 1, diceType: "d20" }]`. The die is rolled twice; the higher value is stored. A `BAD_REQUEST` error is thrown if any other dice configuration is provided.
- **DISADVANTAGE mode:** same constraint as Advantage — rolls twice, stores the lower value.

**Returns:** the created `DiceRoll` record (all fields).

**Client usage**
```tsx
const roll = api.dice.roll.useMutation({
  onSuccess: () => utils.dice.globalHistory.invalidate(),
});

// Normal compound roll
roll.mutate({ label: "Damage Roll", dice: [{ count: 2, diceType: "d6" }, { count: 1, diceType: "d4" }] });

// Advantage roll
roll.mutate({ label: "Attack Roll", rollMode: "ADVANTAGE", dice: [{ count: 1, diceType: "d20" }] });
```

---

### `dice.history` — query

Returns the last N rolls for the **authenticated user only**.

**Input**

| Field | Type | Default | Max |
|-------|------|---------|-----|
| `limit` | `number` | 50 | 100 |

**Returns:** `DiceRoll[]` ordered by `rolledAt` descending. Includes `rollMode`.

---

### `dice.globalHistory` — query

Returns the last N rolls across **all users**, used to power the global history feed in the `DiceRoller` component.

**Input**

| Field | Type | Default | Max |
|-------|------|---------|-----|
| `limit` | `number` | 50 | 100 |

**Returns:** `DiceRoll[]` ordered by `rolledAt` descending. Includes `rollMode`.

---

## Frontend Component

File: `src/components/DiceRoller.tsx`

Mounted once in `Layout.tsx` as a sibling to `<main>` — it is not imported by individual page components.

### Structure

```
Layout
├── NavBar
├── <main>          ← page content
└── DiceRoller      ← floating overlay, always rendered on auth pages
    ├── trigger button (🎲, fixed bottom-right)
    └── popup panel (visible when open)
        ├── header
        ├── global history feed    ← scrollable, flex: 1
        └── input area             ← flexShrink: 0, pinned to bottom
            ├── label dropdown
            ├── roll mode toggle
            ├── dice count selector (per-die +/− rows)
            ├── expression preview (e.g. "2d6+1d4")
            └── Roll button (dynamic label)
```

### Label dropdown

The free-text label input has been replaced with a `<select>` element populated from `ROLL_LABELS`. The default selection is `"General"`. Users pick from the fixed set of labels defined in `diceConstants.ts`.

### Roll mode toggle

Three-button toggle below the label dropdown:

| Button | `rollMode` value | Behavior |
|--------|-----------------|----------|
| Normal | `"NORMAL"` | Standard roll; all dice types and counts allowed |
| Advantage | `"ADVANTAGE"` | Locks the dice grid to exactly 1d20; rolls twice, keeps max |
| Disadvantage | `"DISADVANTAGE"` | Locks the dice grid to exactly 1d20; rolls twice, keeps min |

Selecting Advantage or Disadvantage resets all other die counts to zero and forces d20 count to 1.

### Dice count selector

Replaces the single die-type picker with a per-die `−/count/+` row for each of the seven dice types from `DICE_TYPES`. Multiple dice types can be incremented simultaneously to build compound rolls.

- The selector uses a 2-column CSS grid (`gridTemplateColumns: "1fr 1fr"`). The d100 row spans both columns (`gridColumn: "1 / -1"`); all other dice occupy one column each.
- Each row shows the die label, a `−` button, the current count, and a `+` button.
- Counts range from 0 to 20 per die type.
- An expression preview above the Roll button reflects the current selection (e.g. `"2d6+1d4"`). No preview is shown when no dice are selected.
- In Advantage or Disadvantage mode the entire grid is locked — only the d20 row is active at count 1.

### Roll button

The Roll button label updates dynamically based on the current state:

| State | Button label |
|-------|-------------|
| No dice selected | "Select a Die" (disabled) |
| Single die, normal | "Roll 1d20" (example) |
| Advantage | "Roll d20 (Advantage)" |
| Disadvantage | "Roll d20 (Disadvantage)" |

### Dice type reference

All standard D&D die sizes are supported:

| Die | Faces | NAT highlight |
|-----|-------|---------------|
| d4 | 4 | — |
| d6 | 6 | — |
| d8 | 8 | — |
| d10 | 10 | — |
| d12 | 12 | — |
| d20 | 20 | NAT 20 (gold), NAT 1 (red) |
| d100 | 100 | — |

NAT 20 / NAT 1 highlighting only applies when `diceType === "d20"` — a result of `20` renders with the gold accent color (`#c9a84c`) and a result of `1` renders with danger red (`#e74c3c`). Compound rolls do not trigger NAT highlights.

### Global history feed

Populated by `api.dice.globalHistory.useQuery()`. Each entry displays:
- Username
- Die type / expression and result (e.g. `d20 → 17`, `2d6+d4 → 11`)
- Label
- Roll mode badge: `(Adv)` in green for Advantage, `(Dis)` in orange for Disadvantage; no badge for Normal
- Timestamp (`rolledAt`)

The query is invalidated after every successful `dice.roll` mutation so the feed updates immediately.

### Styling

Follows the standard D&D theme (see `ui-patterns.md`):
- Popup panel uses the standard card style: `rgba(0,0,0,0.6)` background, `2px solid #c9a84c` border, `12px` border-radius.
- Trigger button is circular, fixed position: `bottom: 24px; right: 24px`.
- Typography: `Georgia`, serif throughout.

---

## Extending the Dice Roller

### Linking rolls to an adventure

The `adventureId` field on `DiceRoll` is nullable and not yet enforced with a foreign key. To link rolls to a specific adventure:

1. Add the FK constraint to `prisma/schema.prisma` once the `Adventure` model exists:
   ```prisma
   adventureId String?
   adventure   Adventure? @relation(fields: [adventureId], references: [id])
   ```
2. `adventureId` is already accepted by the `dice.roll` input schema as an optional string.
3. The `DiceRoller` component can accept an optional `adventureId` prop from the page context and pass it through to the mutation.

### Adding per-adventure history

Add a `dice.adventureHistory` query that filters by `adventureId` — same pattern as `dice.history` with an additional `where: { adventureId }` clause.

### Adding roll statistics

A `dice.stats` query could aggregate results with `ctx.db.diceRoll.aggregate(...)` or `groupBy(...)` to expose average rolls, nat 20 counts, advantage win rates, etc.

---

## Reusability Notes

- The `DiceRoller` component is fully self-contained and makes its own tRPC calls — it does not need props from parent pages.
- Adding it to a new layout (e.g. a future mobile layout) requires only importing and rendering `<DiceRoller />`.
- The `diceRouter` procedures are independent of all other routers — they only depend on `ctx.db` and `ctx.user`.
- All dice constants and types are centralized in `src/lib/diceConstants.ts`. Adding a new die size or roll label requires a change in only that file; the router and component pick it up automatically through the shared imports.
