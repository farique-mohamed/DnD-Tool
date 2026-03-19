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
| `/dm/monster-manual` | `src/pages/dm/monster-manual/index.tsx` | Yes | DUNGEON_MASTER | Monster list with fuzzy search bar (mock data) |
| `/dm/rules` | `src/pages/dm/rules/index.tsx` | Yes | DUNGEON_MASTER | Rules for DM list skeleton |
| `/rules` | `src/pages/rules/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Rules for players list skeleton |
| `/characters` | `src/pages/characters/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Character list with link to creation |
| `/characters/new` | `src/pages/characters/new/index.tsx` | Yes | DUNGEON_MASTER, PLAYER | Character creation form (name, race, class, backstory) |

---

## Layout & Navigation Components

### `NavBar` (`src/components/NavBar.tsx`)

Vertical sidebar (left side, 220px wide). Reads role from `useAuth()` and renders role-specific nav items. Active route highlighted with gold left-border accent using `useRouter().pathname`. Logout button at the bottom.

Role → nav items mapping:
- **ADMIN**: DM Requests, Global Settings
- **DUNGEON_MASTER**: Adventures, Monster Manual, Rules For DM, Rules For Players, My Characters, Create New Character
- **PLAYER**: Adventures, Rules For Players, My Characters, Create New Character

### `Layout` (`src/components/Layout.tsx`)

Flex wrapper: `NavBar` on the left, `children` in a scrollable `<main>` on the right. Applies the standard dark navy gradient background. Wrap all authenticated pages with both `<ProtectedRoute>` and `<Layout>`:

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
- `🎲` — dice / dashboard placeholder
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
