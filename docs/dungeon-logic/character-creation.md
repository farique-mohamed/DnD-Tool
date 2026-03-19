# Character Creation

## Route & File

| Item | Value |
|---|---|
| URL | `/characters/new` |
| Page file | `src/pages/characters/new/index.tsx` |
| Access | `DUNGEON_MASTER`, `PLAYER` roles (enforced by `ProtectedRoute`) |

---

## Form Fields

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Required |
| `race` | `string` | Enum from `CHARACTER_RACES` array in the page file |
| `characterClass` | `string` | Enum from `CHARACTER_CLASSES` array in the page file |
| `backstory` | `string` | Optional free-text textarea |

Form submission is wired to a `TODO` — it currently redirects to `/characters` once the tRPC character mutation is ready.

---

## "This Is Your Life" Generator

### Overview

The **This Is Your Life** generator is a feature from *Xanathar's Guide to Everything* (D&D 5e). It lets players randomly generate an interconnected backstory through a series of tables covering origins, upbringing, and significant life events.

The generator lives at:

```
src/components/ThisIsYourLifeGenerator.tsx
```

It is rendered below the character form on the `/characters/new` page.

### How It Works

1. The adventurer selects how many **Life Events** to roll (1, 2, or 3).
   - 1 = young adventurer
   - 2 = seasoned adventurer (default)
   - 3 = veteran adventurer
2. They click **"Roll the Fates"** — all six sections are rolled simultaneously.
3. Each section displays its result with a **🎲 reroll** button to re-roll that section independently without disturbing the others.
4. Two action buttons are available once results exist:
   - **Copy Text** — copies the full formatted backstory to the clipboard.
   - **Add to Backstory** — appends (or sets) the generated text into the `backstory` textarea in the character form above, then smoothly scrolls to it.

### Tables

All tables are defined as plain string arrays at the top of `ThisIsYourLifeGenerator.tsx`. Each `pickFrom()` call selects a uniform random entry.

| Section | Array constant | Sides equivalent |
|---|---|---|
| Birthplace | `BIRTHPLACES` | d10 (10 entries) |
| Siblings | `SIBLINGS_RESULTS` | d10 with weighted groupings |
| Who Raised You | `WHO_RAISED_YOU` | d8 (8 entries) |
| Childhood Home | `CHILDHOOD_HOMES` | d6 (6 entries) |
| Childhood Memory | `CHILDHOOD_MEMORIES` | d6 (6 entries) |
| Life Events | `LIFE_EVENTS` | d10 (10 entries), rolled 1–3 times |

#### Birthplace (10 entries)
Home · Hovel · Inn or tavern · Hospital or healer's care · Carriage or cart · Ruins · Wilderness · Battlefield · Temple or shrine · Ship

#### Siblings (10 entries, weighted)
Results 1–2 → None · Results 3–4 → One sibling · Results 5–6 → Two siblings · Results 7–8 → Three siblings · Result 9 → Four siblings · Result 10 → Five or more siblings

#### Who Raised You (8 entries)
Both parents · Grandparent(s) · Step-parent(s) · Adoptive family · Single parent · Aunt or uncle · Older sibling · City orphanage or foundling home

#### Childhood Home (6 entries)
On the streets · Rundown shack · No permanent home · Comfortable dwelling · Large house · Mansion or castle

#### Childhood Memory (6 entries)
Always running from something · Little-known or ignored · Fitting in with peers · Popular and well-liked · Exceptionally gifted or talented · The pride of your family

#### Life Events (10 entries)
Went on an adventure · Suffered a tragedy · Received a great boon · Fell in love · Made a powerful enemy · Had a brush with death · Witnessed something strange · Committed a crime · Spent time in another culture · Discovered something hidden about yourself

---

### Props

```ts
interface ThisIsYourLifeGeneratorProps {
  /** Called when the adventurer clicks "Add to Backstory". */
  onUseBackstory: (text: string) => void;
}
```

The page passes `handleUseBackstory` which appends the text to the existing `backstory` field (separated by a blank line) and scrolls to the textarea.

### Exported Types

```ts
export interface BackstoryResult {
  birthplace: string;
  siblings: string;
  raisedBy: string;
  childhoodHome: string;
  childhoodMemory: string;
  lifeEvents: string[];
}
```

---

## Adding New Tables in the Future

1. **Define a new string array** constant near the top of `ThisIsYourLifeGenerator.tsx`, e.g.:

   ```ts
   const ARCANE_MARKS: string[] = [
     "A strange birthmark shaped like a rune",
     "Eyes that change colour under moonlight",
     // ...
   ];
   ```

2. **Add the key to `BackstoryResult`** and its matching field in the roll-all call inside `rollAll()`.

3. **Extend `tableMap`** in `rerollSection()` so that key maps to your new array.

4. **Add a `<ResultRow>`** for the new field inside the results card JSX.

5. **Update `buildBackstoryText()`** to include the new field in the copy/append output.

No other files need to change.
