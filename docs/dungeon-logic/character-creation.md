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

A comprehensive backstory generator based on *Xanathar's Guide to Everything* tables. Generates parents (with names, alignment, occupation, relationship, status), birthplace, siblings (with full detail cards), family and upbringing, personal decisions (background and class reasons), and life events (age-based count with detailed subtables).

The generator requires `race`, `background`, `characterClass`, and optionally `charismaScore` props from the character creation form. All tables and generation logic live in `src/lib/thisIsYourLifeData.ts`; the component is `src/components/ThisIsYourLifeGenerator.tsx`.

See **[docs/dungeon-logic/this-is-your-life.md](this-is-your-life.md)** for full documentation including component props, all data tables, exported types, and extension guide.
