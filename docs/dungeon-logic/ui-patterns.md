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
| `/dm/adventure-books` | `src/pages/dm/adventure-books/index.tsx` | Yes | DUNGEON_MASTER | DM-only Adventure Books listing page — grid of all adventure source books from `src/lib/adventureData.ts` `ADVENTURE_LIST`, each card shows the adventure name and source badge and navigates to `/dm/adventure-books/[source]`; role-guards redirect non-DM/non-admin users to `/unauthorized` |
| `/dm/adventure-books/[source]` | `src/pages/dm/adventure-books/[source].tsx` | Yes | DUNGEON_MASTER | Individual adventure book detail page — breadcrumb nav, two-column layout (sticky TOC left, recursive entry renderer right); loads data via `ADVENTURE_DATA_MAP` from `src/lib/adventureData.ts`; same recursive renderer as rule-books (handles strings, entries, sections, lists, insets, tables, quotes, skips images); role-guards redirect non-DM/non-admin users to `/unauthorized` |
| `/adventures` | `src/pages/adventures/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | My Adventures — placeholder for DM-created campaigns; empty state with thematic message |
| `/dm/monster-manual` | `src/pages/dm/monster-manual/index.tsx` | Yes | DUNGEON_MASTER | Two-column layout: left panel has text search, CR dropdown filter, and a paginated monster list (80 per page) with CR badge + type subtitle per row; right panel shows full stat block — name, size/type/alignment, CR badge, source badge, AC/HP/speed, 6-ability grid with modifiers, saving throws, skills, damage/condition immunities, senses, languages, and collapsible action/legendary/reaction/bonus-action sections. Data sourced from `src/lib/bestiaryData.ts` (core MM + XMM + supplementals, ~3000 monsters). |
| `/dm/rule-books` | `src/pages/dm/rule-books/index.tsx` | Yes | DUNGEON_MASTER | DM-only Rule Books listing page — grid of all books from `src/lib/bookData.ts` `BOOK_LIST`, each card navigates to `/dm/rule-books/[source]`; role-guards redirect non-DM/non-admin users to `/unauthorized` |
| `/dm/rule-books/[source]` | `src/pages/dm/rule-books/[source].tsx` | Yes | DUNGEON_MASTER | Individual book detail page — breadcrumb nav, two-column layout (sticky TOC left, recursive entry renderer right); loads data for all 53 books via `BOOK_DATA_MAP` from `src/lib/bookData.ts`; recursive renderer handles strings, entries, sections, lists, insets, tables, and quotes via `parseTaggedText` |
| `/dm/rules` | `src/pages/dm/rules/index.tsx` | Yes | DUNGEON_MASTER | Dungeon Master's Guide — two edition tabs ("2014" / "2024") with two-column layout: sticky TOC (section names) on left, recursive content renderer on right; data from `DMG_2014_DATA` and `DMG_2024_DATA` in `src/lib/bookData.ts` |
| `/rules` | `src/pages/rules/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Player's Handbook — two edition tabs ("2014" / "2024") with two-column layout: sticky TOC on left, recursive content renderer on right; data from `PHB_2014_DATA` and `PHB_2024_DATA` in `src/lib/bookData.ts` |
| `/characters` | `src/pages/characters/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Character list — fetches from `character.list`, shows `CharacterCard` per character with ability scores and combat stats; empty state with CTA; each card navigates to `/characters/[id]` |
| `/characters/new` | `src/pages/characters/new/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Full character creation form (name, race, class, alignment, background, skill proficiencies, STR/DEX/CON/INT/WIS/CHA, HP, AC, speed, backstory); level is locked to 1 (no level input — all characters start at level 1); pill-style rulebook toggle at top selects between "Player's Handbook (2014)" (PHB) and "Player's Handbook (2024)" (XPHB) — class dropdown filters by selected rulebook, switching rulebook resets class selection; background selector dropdown populated from `src/lib/backgroundData.ts` `BACKGROUND_NAMES`; **Racial ASI display**: PHB races show gold "+N" badges next to the relevant ability scores based on `abilityBonuses` from `raceData.ts`, Half-Elf shows choice chips allowing the player to assign +1 to two abilities (excluding Charisma), Human shows +1 to all; **XPHB universal ASI chooser**: pill toggle selects between "+2/+1" and "+1/+1/+1" distribution modes with ability selector dropdowns — chosen bonuses are baked into the ability scores sent to the API; skill proficiency picker appears after selecting background and/or class — shows locked background fixed skills, toggleable background choice skills (enforces count), and toggleable class skill choices (enforces count, excludes skills already taken from background); all selected skills are sent as `skillProficiencies` JSON string to `character.create` mutation; after skill proficiency selection, a source-aware expertise selection section appears for classes that grant expertise at the character's starting level (Rogue PHB/XPHB at level 1, Bard XPHB at level 2, Bard PHB at level 3, Ranger XPHB at level 1) — driven by `expertiseData.ts` config; the player picks exactly the number of expertise skills available at their level (dynamic count from `getExpertiseCountAtLevel`); expertise selections reset when class, background, rulebook, or proficiencies change; `skillExpertise` is sent alongside `skillProficiencies` to `character.create` mutation; wired to `character.create` mutation (sends `rulesSource`); includes `ThisIsYourLifeGenerator` |
| `/characters/[id]` | `src/pages/characters/[id].tsx` | Yes | DUNGEON_MASTER, PLAYER | Character sheet — fetches from `character.getById`; header card shows character name with a rulebook badge (PHB 2014 / XPHB 2024), a "Level Up" button (hidden at level 20), combat quick-stats, and the HP manager. Uses the character's `rulesSource` field for source-aware class feature lookup. Below the header, five tabs navigate between: **Overview** (ability scores grid, race features section showing speed/size/language badges and racial trait cards sourced from `raceData.ts` with source-aware lookup, a "Feats" section showing taken feats as expandable cards — each card displays the feat name, a source badge, an ability bonus pill if applicable, and the full feat description (resolved from `featData.ts`), saving throws with proficiency markers, skills list (read-only, no toggle — proficiencies are set during creation/level up) with three-tier indicators: `★` (gold) for expertise (double proficiency bonus), `●` (gold) for proficient, `○` (muted) for none; skills card has a fixed max-height (500px) with overflow scroll, backstory), **Class Features** (level-by-level features from `classData.ts`, grouped by level, each card expandable; when a subclass is selected, actual subclass features from `classInfo.subclasses` are injected into the level groups alongside base class features, with descriptions resolved via `featureDescriptions` matching on `subclassName`; features with limited uses render a pip tracker or pool input with recharge badge — Short Rest in blue, Long Rest in green — persisted via `updateFeatureUses`; config defined in `FEATURE_USAGE_CONFIG` covering Rage, Second Wind, Action Surge, Channel Divinity, Wild Shape, Bardic Inspiration, etc.), **Actions** (action economy for the character's class and level from `actionEconomy.ts`, grouped by cost type — Action / Bonus Action / Reaction / No Action), and **Spells** (spell slot tracker per level; Long Rest button resets all slots; Warlock shows Pact Magic slots with short/long rest restore; below slots a Prepared/Known Spells section with a two-column layout — left column is the clickable spell list, right column shows the full description of the currently selected spell including casting time, range, duration, components, description, and higher-level text; "Manage Spells" toggle opens a searchable/filterable spell browser showing only level-eligible spells based on `getSpellSlots` (cantrips always shown, plus spells up to the highest slot level the character has; for Warlocks uses pact slot level), de-duplicated by spell name with a blue source badge on each entry; persisted via `updatePreparedSpells`; prepared casters show a count cap; Spells tab hidden for non-spellcasting classes), and **Notes** (an "Adventurer's Journal" textarea where the player can write free-form session notes; includes a save button that calls `updateNotes` mutation and an unsaved-changes indicator when edits have not yet been persisted). **HP Manager** has Short Rest and Long Rest buttons: Long Rest calls `longRest` mutation (full HP restore, clears temp HP, resets spell slots); Short Rest opens an inline panel to spend hit dice with a healing preview, calls `shortRest` mutation. **Level Up modal** now includes subclass selection at the appropriate unlock level (e.g. level 1 for Cleric/Sorcerer/Warlock, level 2 for Druid/Wizard, level 3 for most others) if the character has no subclass yet; subclass options come from `classData.ts`; selecting a subclass calls `updateSubclass` before the `levelUp` mutation; the modal also includes **Ability Score Improvement (ASI) or Feat selection** at ASI levels (4, 8, 12, 16, 19 for most classes; Fighter also at 6 and 14; Rogue also at 10) — a toggle lets the player choose between "Improve Scores" (existing ASI: mode toggle between "+2 to one score" and "+1 to two scores", dropdown selectors with score preview, scores capped at 20, calls `updateAbilityScores` before the `levelUp` mutation) or "Choose a Feat" (searchable, scrollable feat browser showing feat descriptions, prerequisite text, and ability bonus summaries from `featData.ts`; feats with ability bonuses auto-apply fixed bonuses and show dropdowns for chooseable bonuses; selecting a feat calls `updateFeats` and `updateAbilityScores` (if the feat grants bonuses) before the `levelUp` mutation); the modal also includes source-aware expertise selection when the new level grants expertise picks (driven by `getNewExpertiseAtLevel` from `expertiseData.ts`) — shows only proficient skills not already expertise, uses star-chip toggle buttons, calls `updateSkillExpertise` (merging existing + new picks) before the `levelUp` mutation. **Condition tags** section appears next to the REST buttons — toggleable condition chips (Blinded, Charmed, Deafened, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious); active conditions shown in red, inactive in muted gold; hover tooltip shows condition description from `conditionData.ts`; persisted via `updateActiveConditions` mutation. |
| `/spells` | `src/pages/spells/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Spell compendium — full 5etools spell data from `src/lib/spellsData.ts` (imports all 17 non-fluff JSON files from `data/spells/`, ~937 spells across PHB, XPHB, XGE, TCE, EGW, GGR, FTD, AAG, AI, AitFR-AVT, BMT, FRHoF, IDRotF, LLK, SatO, SCC, TDCSR); two-column layout where the left panel (flex:3) is wider and the right detail panel (flex:2) is narrower; left panel has a text search bar at the top, then below the search bar a 2-column grid: the left column (300px fixed) stacks source chip-filter (R1), class chip-filter (R2), and level chip-filter (R3) vertically, while the right column spans all 3 rows and contains a results count and the scrollable spell list; each spell row shows a school colour dot, name, source badge (blue, e.g. "PHB"), level badge (gold), school, casting time, range, duration, and components; class-to-spell associations are resolved via a static `SPELL_CLASS_MAP` (lowercase spell name → `SpellClass[]`) and attached to each `Spell` object as `classes: string[]` during parsing in `spellsData.ts`; clicking a row populates the right detail panel with the full spell — name heading, school/level/source badges, casting time/range/duration/components/source meta-stat rows, a "Classes" section showing gold-tinted chips for each class that can use the spell (or italic "Unknown / Non-class spell" if none), full description (with `{@tag}` markup stripped via `parseTaggedText`), and an optional "At Higher Levels" section. |
| `/items` | `src/pages/items/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Item Vault — full 5etools item data from `src/lib/itemsData.ts` (imports `data/items-base.json` with 196 base items and `data/items.json` with 2526 magic/special items, ~2722 total items); two-column layout where the left panel (flex:3) is wider and the right detail panel (flex:2) is narrower; left panel has a text search bar at the top, then below the search bar a 2-column grid: the left column (300px fixed) stacks source chip-filter (R1), type chip-filter (R2), and rarity chip-filter (R3) vertically, while the right column spans all 3 rows and contains a results count and the scrollable item list; each item row shows a rarity colour dot, name, source badge (blue), rarity badge (colour-coded); clicking a row populates the right detail panel with the full item — name heading, type/rarity/source badges, meta-stat rows (type, rarity, weight, value, attunement, weapon category, damage, range, AC, bonuses, source), full description (with `{@tag}` markup stripped via `parseTaggedText`). |
| `/classes` | `src/pages/classes/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Class compendium — static 5e class data from `src/lib/classData.ts`; pill-style version toggle at top of page filters between PHB (2014) and XPHB (2024) classes; sidebar list of classes (filtered by selected version) with two-tab detail panel (Overview: hit die, saving throws, armor/weapon proficiencies, skill choices, lore description; Progression: subclass selector at top (pill-style toggle buttons, hidden when class has no subclasses), then levels 1–20 table with proficiency bonus and expandable feature descriptions per level — base class features in `#e8d5a3`, subclass features in `#a89060`, each feature shows a snippet by default with a toggle to expand full text); subclass selection resets on class change |

---

## Layout & Navigation Components

### `NavBar` (`src/components/NavBar.tsx`)

Vertical sidebar (left side, 220px wide). Reads role from `useAuth()` and renders role-specific nav items. Active route highlighted with gold left-border accent using `useRouter().pathname`. Logout button at the bottom.

Role → nav items mapping:
- **ADMIN**: DM Requests, Global Settings
- **DUNGEON_MASTER**: Adventure Books, My Adventures, Spells, Classes, Monster Manual, Item Vault, Rule Books, Rules For DM, Rules For Players, My Characters, Create New Character
- **PLAYER**: My Adventures, Spells, Classes, Item Vault, Rules For Players, My Characters, Create New Character

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
