# Dungeon Logic — Characters

## Overview

Players and Dungeon Masters can create and view D&D 5e characters. Each character stores identity info, all six ability scores, and key combat stats. Characters are scoped to the authenticated user — you can only see your own.

---

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/characters` | `src/pages/characters/index.tsx` | Lists all characters belonging to the logged-in user. Shows an empty state with a prompt to create when none exist. Each card is clickable and navigates to `/characters/[id]`. |
| `/characters/new` | `src/pages/characters/new/index.tsx` | Full character creation form covering identity, ability scores, combat stats, and backstory. On success, redirects to `/characters`. |
| `/characters/[id]` | `src/pages/characters/[id].tsx` | Full character sheet for a single character. Shows header stats (AC, Speed, Initiative, Proficiency Bonus, Passive Perception), HP bar, ability scores, saving throws, skills, and backstory. |

All pages require authentication and are wrapped in `<ProtectedRoute><Layout>`.

---

## tRPC Router

**File:** `src/server/routers/character.ts`
**Registered as:** `character` in `_app.ts`

### `character.create` — `protectedProcedure` mutation

Creates a new character owned by the authenticated user. `currentHp` is automatically set to `maxHp` on creation.

**Input:**

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `name` | `string` | 1–100 chars | required |
| `race` | `string` | min 1 char | required |
| `characterClass` | `string` | min 1 char | required |
| `level` | `int` | 1–20 | `1` |
| `alignment` | enum (9 alignments) | see below | `"True Neutral"` |
| `backstory` | `string` | optional | — |
| `strength` | `int` | 1–20 | `10` |
| `dexterity` | `int` | 1–20 | `10` |
| `constitution` | `int` | 1–20 | `10` |
| `intelligence` | `int` | 1–20 | `10` |
| `wisdom` | `int` | 1–20 | `10` |
| `charisma` | `int` | 1–20 | `10` |
| `maxHp` | `int` | min 1 | `10` |
| `armorClass` | `int` | min 1 | `10` |
| `speed` | `int` | min 0 | `30` |

**Returns:** The created `Character` record.

### `character.list` — `protectedProcedure` query

Returns all characters belonging to `ctx.user.userId`, ordered by `createdAt` descending (newest first).

**Returns:** `Character[]`

### `character.getById` — `protectedProcedure` query

Fetches a single character by ID, scoped to the authenticated user. Throws `NOT_FOUND` if the character doesn't exist or belongs to another user.

**Input:**

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `string` | required |

**Returns:** `Character`

**Throws:** `TRPCError` with code `NOT_FOUND` if no matching character is found for the given `id` and `userId`.

---

## Valid Alignments

```
Lawful Good    Neutral Good    Chaotic Good
Lawful Neutral True Neutral    Chaotic Neutral
Lawful Evil    Neutral Evil    Chaotic Evil
```

---

## Database Model

**Table:** `characters`
**File:** `prisma/schema.prisma`

```prisma
model Character {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  name           String
  race           String
  characterClass String
  level          Int      @default(1)
  alignment      String   @default("True Neutral")
  backstory      String?
  strength       Int      @default(10)
  dexterity      Int      @default(10)
  constitution   Int      @default(10)
  intelligence   Int      @default(10)
  wisdom         Int      @default(10)
  charisma       Int      @default(10)
  maxHp          Int      @default(10)
  currentHp      Int      @default(10)
  armorClass     Int      @default(10)
  speed          Int      @default(30)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("characters")
}
```

---

## Derived Stats (Character Detail Page)

The `/characters/[id]` page computes the following stats client-side from stored ability scores and level:

| Stat | Formula |
|------|---------|
| Proficiency Bonus | `Math.ceil(level / 4) + 1` |
| Ability Modifier | `Math.floor((score - 10) / 2)` |
| Initiative | DEX modifier |
| Passive Perception | `10 + WIS modifier` |
| Saving Throw (proficient) | ability modifier + proficiency bonus |
| Saving Throw (not proficient) | ability modifier only |
| Skill modifier | base ability modifier (no per-skill proficiency tracking yet) |

**Saving throw proficiencies per class** (static lookup in `SAVING_THROW_PROFICIENCIES`):

| Class | Proficient Saves |
|-------|-----------------|
| Barbarian | STR, CON |
| Bard | DEX, CHA |
| Cleric | WIS, CHA |
| Druid | INT, WIS |
| Fighter | STR, CON |
| Monk | STR, DEX |
| Paladin | WIS, CHA |
| Ranger | STR, DEX |
| Rogue | DEX, INT |
| Sorcerer | CON, CHA |
| Warlock | WIS, CHA |
| Wizard | INT, WIS |

---

## UI Notes

- Ability score inputs show the D&D modifier (`(score - 10) / 2`, floored) below each field in real time.
- The `ThisIsYourLifeGenerator` component is rendered below the creation form to provide AI-generated backstory suggestions. Clicking "Use This Backstory" appends the generated text to the backstory textarea and scrolls it into view.
- All form fields are disabled during submission. The submit button shows "Forging your legend..." while pending.
- The character list card uses `onMouseEnter`/`onMouseLeave` for a gold border hover effect, and is clickable — navigates to `/characters/[id]`.
- The character detail page shows saving throws with ● (proficient) or ○ (not proficient) indicators, and an HP bar that changes color: green above 50%, gold 25–50%, red below 25%.
