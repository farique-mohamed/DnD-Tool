# Dungeon Logic — UI Patterns

## Theme: Medieval D&D

All UI is inline-styled (no CSS framework). The aesthetic is dark, medieval, and golden — inspired by ancient scrolls, dungeon torchlight, and fantasy tavern menus.

---

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Gold primary | `#c9a84c` | Headings, borders, accents, button text background |
| Gold glow | `rgba(201,168,76,0.5)` | Text shadows, box shadows |
| Gold muted | `#a89060` | Secondary text, labels |
| Gold dark | `#8b6914` | Button gradient start, input borders |
| Gold bright | `#e8d5a3` | Body text on dark backgrounds |
| Gold faded | `#d4b896` | Subtitles |
| Dark navy 1 | `#0d0d1a` | Page background gradient start |
| Dark navy 2 | `#1a1a2e` | Page background gradient mid |
| Dark navy 3 | `#16213e` | Page background gradient end |
| Card background | `rgba(15,8,3,0.88)` | Login card |
| Input background | `rgba(30,15,5,0.9)` | Form inputs |
| Danger red | `#e74c3c` | Countdown ≤ 3s, error states |
| Success green border | `#4a7c2a` | Success message border |
| Error red border | `#8b2a1e` | Error message border |

---

## Typography

- **Font:** `'Georgia', 'Times New Roman', serif` — used everywhere
- **Headings:** uppercase, letter-spacing `1px`–`2px`, color `#c9a84c`
- **Body:** `#e8d5a3` on dark backgrounds
- **Labels:** uppercase, `0.08em` letter-spacing, `#b8934a`

---

## Background Pattern

The login page uses `public/dnd-background.svg` as a full-viewport background image with `backgroundAttachment: "fixed"` and a dark overlay gradient:
```
linear-gradient(135deg, rgba(10,5,2,0.82), rgba(30,12,5,0.75), rgba(10,5,2,0.82))
```

All other pages use a CSS gradient directly:
```css
background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%)
```

---

## Standard Card / Panel

```tsx
<div style={{
  background: "rgba(0,0,0,0.6)",
  border: "2px solid #c9a84c",
  borderRadius: "12px",
  boxShadow: "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
  padding: "48px 40px",
}}>
```

Lighter variant (dashboard panels):
```tsx
<div style={{
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(201,168,76,0.2)",
  borderRadius: "12px",
}}>
```

---

## Standard Button

Primary action button:
```tsx
<button style={{
  background: "linear-gradient(135deg, #8b6914, #c9a84c)",
  color: "#1a1a2e",
  border: "none",
  borderRadius: "6px",
  padding: "12px 28px",
  fontSize: "14px",
  fontFamily: "'Georgia', serif",
  fontWeight: "bold",
  cursor: "pointer",
  letterSpacing: "0.5px",
}}>
```

Ghost/outline button (used in header):
```tsx
<button style={{
  background: "transparent",
  border: "1px solid rgba(201,168,76,0.5)",
  color: "#c9a84c",
  borderRadius: "4px",
  padding: "6px 16px",
  fontFamily: "'Georgia', serif",
  cursor: "pointer",
}}>
```

---

## Standard Header (for authenticated pages)

```tsx
<header style={{
  borderBottom: "1px solid rgba(201,168,76,0.3)",
  padding: "16px 32px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}}>
  <h1 style={{ color: "#c9a84c", fontSize: "20px", letterSpacing: "1px" }}>
    ⚔️ DnD Tool
  </h1>
  {/* right side: username + logout */}
</header>
```

---

## Divider Line

```tsx
<div style={{
  width: "80px",
  height: "2px",
  background: "#c9a84c",
  margin: "16px auto",
  opacity: 0.6,
}} />
```

Or as a gradient:
```tsx
background: "linear-gradient(90deg, transparent, #c9a84c, transparent)"
```

---

## Pages Reference

| Route | File | Auth Required | Role | Notes |
|-------|------|--------------|------|-------|
| `/` | `src/pages/index.tsx` | No | All | Login + Register dual-mode form |
| `/dashboard` | `src/pages/dashboard/index.tsx` | Yes | All | Role-aware greeting, wrapped in Layout |
| `/unauthorized` | `src/pages/unauthorized.tsx` | No | All | 10s countdown, D&D humour |
| `/admin/dm-requests` | `src/pages/admin/dm-requests/index.tsx` | Yes | ADMIN | DM request list with approve button + confirmation dialog; uses `admin.getDmRequests` + `admin.approveDmRequest` |
| `/admin/settings` | `src/pages/admin/settings/index.tsx` | Yes | ADMIN | Blank global settings placeholder |
| `/adventures` | `src/pages/adventures/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Adventure list placeholder |
| `/dm/monster-manual` | `src/pages/dm/monster-manual/index.tsx` | Yes | DUNGEON_MASTER | Two-column layout: left panel has text search, CR dropdown filter, and a paginated monster list (80 per page) with CR badge + type subtitle per row; right panel shows full stat block — name, size/type/alignment, CR badge, source badge, AC/HP/speed, 6-ability grid with modifiers, saving throws, skills, damage/condition immunities, senses, languages, and collapsible action/legendary/reaction/bonus-action sections. Data sourced from `src/lib/bestiaryData.ts` (core MM + XMM + supplementals, ~3000 monsters). |
| `/dm/rule-books` | `src/pages/dm/rule-books/index.tsx` | Yes | DUNGEON_MASTER | DM-only Rule Books listing page — grid of all books from `src/lib/bookData.ts` `BOOK_LIST`, each card navigates to `/dm/rule-books/[source]`; role-guards redirect non-DM/non-admin users to `/unauthorized` |
| `/dm/rule-books/[source]` | `src/pages/dm/rule-books/[source].tsx` | Yes | DUNGEON_MASTER | Individual book detail page — breadcrumb nav, two-column layout (sticky TOC left, recursive entry renderer right); loads data for all 53 books via `BOOK_DATA_MAP` from `src/lib/bookData.ts`; recursive renderer handles strings, entries, sections, lists, insets, tables, and quotes via `parseTaggedText` |
| `/dm/rules` | `src/pages/dm/rules/index.tsx` | Yes | DUNGEON_MASTER | Dungeon Master's Guide — two edition tabs ("2014" / "2024") with two-column layout: sticky TOC (section names) on left, recursive content renderer on right; data from `DMG_2014_DATA` and `DMG_2024_DATA` in `src/lib/bookData.ts` |
| `/rules` | `src/pages/rules/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Player's Handbook — two edition tabs ("2014" / "2024") with two-column layout: sticky TOC on left, recursive content renderer on right; data from `PHB_2014_DATA` and `PHB_2024_DATA` in `src/lib/bookData.ts` |
| `/characters` | `src/pages/characters/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Character list — fetches from `character.list`, shows `CharacterCard` per character with ability scores and combat stats; empty state with CTA; each card navigates to `/characters/[id]` |
| `/characters/new` | `src/pages/characters/new/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Full character creation form (name, race, class, level, alignment, STR/DEX/CON/INT/WIS/CHA, HP, AC, speed, backstory); wired to `character.create` mutation; includes `ThisIsYourLifeGenerator` |
| `/characters/[id]` | `src/pages/characters/[id].tsx` | Yes | DUNGEON_MASTER, PLAYER | Character sheet — fetches from `character.getById`; shows header card with combat stats and HP bar, ability scores grid, saving throws with proficiency markers, skills list, and backstory |
| `/spells` | `src/pages/spells/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Spell compendium — full 5etools spell data from `src/lib/spellsData.ts` (imports all 17 non-fluff JSON files from `data/spells/`, ~937 spells across PHB, XPHB, XGE, TCE, EGW, GGR, FTD, AAG, AI, AitFR-AVT, BMT, FRHoF, IDRotF, LLK, SatO, SCC, TDCSR); two-column layout where the left panel (flex:3) is wider and the right detail panel (flex:2) is narrower; left panel has a text search bar at the top, then below the search bar a 2-column grid: the left column (300px fixed) stacks source chip-filter (R1), class chip-filter (R2), and level chip-filter (R3) vertically, while the right column spans all 3 rows and contains a results count and the scrollable spell list; each spell row shows a school colour dot, name, source badge (blue, e.g. "PHB"), level badge (gold), school, casting time, range, duration, and components; class-to-spell associations are resolved via a static `SPELL_CLASS_MAP` (lowercase spell name → `SpellClass[]`) and attached to each `Spell` object as `classes: string[]` during parsing in `spellsData.ts`; clicking a row populates the right detail panel with the full spell — name heading, school/level/source badges, casting time/range/duration/components/source meta-stat rows, a "Classes" section showing gold-tinted chips for each class that can use the spell (or italic "Unknown / Non-class spell" if none), full description (with `{@tag}` markup stripped via `parseTaggedText`), and an optional "At Higher Levels" section. |
| `/classes` | `src/pages/classes/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Class compendium — static 5e class data from `src/lib/classData.ts`; sidebar list of all 15 classes with two-tab detail panel (Overview: hit die, saving throws, armor/weapon proficiencies, skill choices, lore description; Progression: subclass selector at top (pill-style toggle buttons, hidden when class has no subclasses), then levels 1–20 table with proficiency bonus and expandable feature descriptions per level — base class features in `#e8d5a3`, subclass features in `#a89060`, each feature shows a snippet by default with a toggle to expand full text); subclass selection resets on class change |

---

## Layout & Navigation Components

### `NavBar` (`src/components/NavBar.tsx`)

Vertical sidebar (left side, 220px wide). Reads role from `useAuth()` and renders role-specific nav items. Active route highlighted with gold left-border accent using `useRouter().pathname`. Logout button at the bottom.

Role → nav items mapping:
- **ADMIN**: DM Requests, Global Settings
- **DUNGEON_MASTER**: Adventures, Spells, Classes, Monster Manual, Item Vault, Rule Books, Rules For DM, Rules For Players, My Characters, Create New Character
- **PLAYER**: Adventures, Spells, Classes, Rules For Players, My Characters, Create New Character

### `Layout` (`src/components/Layout.tsx`)

Flex wrapper: `NavBar` on the left, `children` in a scrollable `<main>` on the right, and `<DiceRoller>` as a sibling to `<main>` (renders the floating popup on every authenticated page). Applies the standard dark navy gradient background. Wrap all authenticated pages with both `<ProtectedRoute>` and `<Layout>`:

```tsx
export default function MyPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <MyPageContent />
      </Layout>
    </ProtectedRoute>
  );
}
```

### `DiceRoller` (`src/components/DiceRoller.tsx`)

Floating chat-like popup fixed to the **bottom-right** of every authenticated page. A circular `🎲` trigger button toggles the panel open/closed.

Features:
- Dice type selector: `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`
- Optional roll label (free-text)
- Roll button triggers `dice.roll` mutation (server-side RNG, result persisted)
- Global history feed showing username, result, label, and timestamp for the last 50 rolls across all users
- **NAT 20** result highlighted in gold; **NAT 1** highlighted in danger red

The component is added once in `Layout.tsx` and is not imported by individual pages.

---

## Tone & Copy Conventions

- Address the user as an adventurer: "Adventurer Name", "Enter the Realm", "Begin Your Quest"
- D&D theming on functional states: "Rolling the dice..." (loading), "Create Your Character" (register)
- Unauthorized messages reference D&D mechanics: nat 1 rolls, arcane wards, scrolls, banishment
- Footer credits use "Powered by" format
- Error/success messages use `Georgia` serif font to match the rest of the UI

---

## Emoji Usage

Emojis are used sparingly as decorative icons, not inline with text:
- `⚔️` — app logo / headings
- `🎲` — dice / dashboard placeholder; also used as the `DiceRoller` floating trigger button
- `🛡️` — unauthorized page
- `🏃` — flee/exit button

---

## Loading States

Mutations show loading state via `isPending`:
```tsx
const isLoading = login.isPending || register.isPending;
// Button text becomes: "Rolling the dice..."
// Inputs and button disabled
```
